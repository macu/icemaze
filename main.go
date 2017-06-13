package main

import (
	"crypto/tls"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"golang.org/x/crypto/acme/autocert"
)

const useHTTPS = false

func main() {
	r := mux.NewRouter()

	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "index.html")
	})
	r.PathPrefix("/css/").Handler(http.StripPrefix("/css/", http.FileServer(http.Dir("css"))))
	r.PathPrefix("/img/").Handler(http.StripPrefix("/img/", http.FileServer(http.Dir("img"))))
	r.PathPrefix("/js/").Handler(http.StripPrefix("/js/", http.FileServer(http.Dir("js"))))

	s := &http.Server{
		Addr:    ":2017",
		Handler: r,
	}

	// development route
	r.HandleFunc("/exit", func(w http.ResponseWriter, r *http.Request) {
		if err := s.Shutdown(nil); err != nil {
			log.Fatal(err) // failure/timeout shutting down the server gracefully
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
