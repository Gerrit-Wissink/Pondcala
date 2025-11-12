package service

import (
	"net/http"
)

func main() {
	// start with this, to show serving up static files:
	/*
		fs := http.FileServer(http.Dir("./static"))
		http.Handle("/", fs)
		http.ListenAndServe("localhost:8080", nil)
	*/

	// Start the chat hub as a background goroutine

	// a mux (multiplexer) routes incoming requests to their respective handlers
	mux := http.NewServeMux()

	// Public endpoint
	mux.HandleFunc("/login", Login)

	// // Protected API endpoints
	// mux.HandleFunc("/turn", func)
	// mux.HandleFunc("/next", func)
	// mux.HandleFunc("/ws/chat", func)

	// // Static file server (root page)
	// fs := http.FileServer(http.Dir("./static"))
	// mux.Handle("/", fs)

	// // Wrap with session middleware
	// protected := func
	// If we hadn't created a custom mux to enable middleware,
	// the second param would be nil, which uses http.DefaultServeMux.
	// http.ListenAndServe("localhost:8080", protected)
}
