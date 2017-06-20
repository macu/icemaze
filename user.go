package main

import (
	"database/sql"
	"errors"
	"regexp"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

// Info: https://www.w3.org/TR/html5/forms.html#valid-e-mail-address
var emailRegexp = regexp.MustCompile("^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$")

func createUser(db *sql.DB, username, password, fullname, email string) error {
	username = strings.TrimSpace(username)
	if username == "" {
		return errors.New("Username must not be empty")
	}
	if len(username) > 15 {
		return errors.New("Username must be 15 characters or less")
	}
	if password == "" {
		return errors.New("Password must not be empty")
	}
	if len(email) > 0 && !emailRegexp.MatchString(email) {
		return errors.New("Invalid email address")
	}
	authHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	_, err = db.Exec("INSERT INTO user (username, fullname, email, auth_hash) VALUES (?, ?, ?, ?)", username, fullname, email, authHash)
	return err
}
