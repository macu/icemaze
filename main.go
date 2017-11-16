package main

import (
	"crypto/tls"
	"flag"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"golang.org/x/crypto/acme/autocert"

	"database/sql"

	_ "github.com/go-sql-driver/mysql"
)

const useHTTPS = false

func main() {
	createNewUser := flag.Bool("createUser", false, "Whether to create a user on startup")
	createUsername := flag.String("username", "", "Username for new user")
	createPassword := flag.String("password", "", "Password for new user")
	flag.Parse()

	db, err := sql.Open("mysql", "root:mysqlpw@/icemaze?charset=utf8&parseTime=true")
	if err != nil {
		log.Fatalln(err)
	}

	if *createNewUser {
		if err := createUser(db, *createUsername, *createPassword, "", ""); err != nil {
			log.Fatalln(err)
		}
		return
	}

	r := mux.NewRouter()

	// set up static resource routes
	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "index.html")
	})
	r.PathPrefix("/css/").Handler(http.StripPrefix("/css/", http.FileServer(http.Dir("css"))))
	r.PathPrefix("/img/").Handler(http.StripPrefix("/img/", http.FileServer(http.Dir("img"))))
	r.PathPrefix("/js/").Handler(http.StripPrefix("/js/", http.FileServer(http.Dir("js"))))

	// set up authenticated routes
	authenticate := makeAuthenticator(db)

	r.HandleFunc("/ajax/login", makeLoginHandler(db))
	r.HandleFunc("/ajax/logout", authenticate(logoutHandler))

	r.HandleFunc("/test", authenticate(func(db *sql.DB, userID uint, w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "User ID: %d\n", userID)
	}))

	s := &http.Server{
		Addr:    ":2017",
		Handler: r,
	}

	// development route
	r.HandleFunc("/exit", func(w http.ResponseWriter, r *http.Request) {
		if err := s.Shutdown(nil); err != nil {
			log.Fatalln(err) // failure/timeout shutting down the server gracefully
		}
	})

	if useHTTPS {
		m := autocert.Manager{
			Prompt:     autocert.AcceptTOS,
			HostPolicy: autocert.HostWhitelist("icemaze.net"),
			Cache:      autocert.DirCache("certs"),
		}
		s.TLSConfig = &tls.Config{
			GetCertificate: m.GetCertificate,
		}
		if err := s.ListenAndServeTLS("", ""); err != nil {
			log.Fatal(err)
		}
	} else {
		if err := s.ListenAndServe(); err != nil {
			log.Fatal(err)
		}
	}
}
