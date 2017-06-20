package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"time"

	"golang.org/x/crypto/bcrypt"
)

const sessionTokenCookieName = "session_token"

const sessionTokenCookieExpiry = time.Hour * 24 * 30
const sessionTokenCookieRenewIfExpiresIn = time.Hour * 24 * 29

// AuthenticatedRoute is a request handler that also accepts *sql.DB and the authenticated userID.
type AuthenticatedRoute func(*sql.DB, uint, http.ResponseWriter, *http.Request)

// Returns a function that wraps a handler in an authentication intercept that loads
// the authenticated user ID and occasionally updates the expiry of the session cookie.
// The wrapped handler is not called and 401 is returned if no user is authenticated.
func makeAuthenticator(db *sql.DB) func(handler AuthenticatedRoute) func(http.ResponseWriter, *http.Request) {
	selectStmt, err := db.Prepare("SELECT user_id, expires FROM session WHERE token=? AND expires>?")
	if err != nil {
		panic(err)
	}
	updateStmt, err := db.Prepare("UPDATE session SET expires=? WHERE token=?")
	if err != nil {
		panic(err)
	}
	return func(handler AuthenticatedRoute) func(http.ResponseWriter, *http.Request) {
		return func(w http.ResponseWriter, r *http.Request) {
			sessionTokenCookie, err := r.Cookie(sessionTokenCookieName)
			if err == http.ErrNoCookie {
				w.WriteHeader(http.StatusUnauthorized)
				return
			}
			// get authenticated user ID
			now := time.Now()
			var userID uint
			var expires time.Time
			err = selectStmt.QueryRow(sessionTokenCookie.Value, now).Scan(&userID, &expires)
			if err == sql.ErrNoRows {
				w.WriteHeader(http.StatusUnauthorized)
				return
			} else if err != nil {
				log.Println(err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			if expires.Before(now.Add(sessionTokenCookieRenewIfExpiresIn)) {
				// update session expires time
				expires := now.Add(sessionTokenCookieExpiry)
				_, err = updateStmt.Exec(expires, sessionTokenCookie.Value)
				if err != nil {
					log.Println(err)
					w.WriteHeader(http.StatusInternalServerError)
					return
				}
				// update cookie expires time
				http.SetCookie(w, &http.Cookie{
					Name:    sessionTokenCookieName,
					Value:   sessionTokenCookie.Value,
					Path:    "/",
					Expires: expires,
				})
			}
			// invoke route with authenticated user info
			handler(db, userID, w, r)
		}
	}
}

func makeLoginHandler(db *sql.DB) func(http.ResponseWriter, *http.Request) {
	selectStmt, err := db.Prepare("SELECT id, auth_hash FROM user WHERE username=? OR email=?")
	if err != nil {
		panic(err)
	}
	insertStmt, err := db.Prepare("INSERT INTO session (token, user_id, expires) VALUES (?, ?, ?)")
	if err != nil {
		panic(err)
	}
	return func(w http.ResponseWriter, r *http.Request) {
		username := r.FormValue("username")
		password := r.FormValue("password")
		var userID uint
		var authHash string
		err := selectStmt.QueryRow(username, username).Scan(&userID, &authHash)
		if err == sql.ErrNoRows {
			w.WriteHeader(http.StatusUnauthorized)
			return
		} else if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		err = bcrypt.CompareHashAndPassword([]byte(authHash), []byte(password))
		if err != nil {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		token := makeSessionID()
		expires := time.Now().Add(sessionTokenCookieExpiry)
		_, err = insertStmt.Exec(token, userID, expires)
		if err != nil {
			log.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		http.SetCookie(w, &http.Cookie{
			Name:    sessionTokenCookieName,
			Value:   token,
			Path:    "/", // Info: https://stackoverflow.com/a/22432999/1597274
			Expires: expires,
		})
		fmt.Fprintf(w, "%d", userID)
	}
}

func logoutHandler(db *sql.DB, userID uint, w http.ResponseWriter, r *http.Request) {
	sessionTokenCookie, _ := r.Cookie(sessionTokenCookieName)
	_, err := db.Exec("DELETE FROM session WHERE token=?", sessionTokenCookie.Value)
	if err != nil {
		log.Println(err)
	}
	http.SetCookie(w, &http.Cookie{
		Name:    sessionTokenCookieName,
		Value:   "",
		Path:    "/",
		Expires: time.Unix(0, 0),
	})
}
