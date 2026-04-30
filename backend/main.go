package main

import (
	"log"
	"net/http"
	"os"
	"stock-dashboard/database"
	"stock-dashboard/handlers"
	"stock-dashboard/middleware"
	"stock-dashboard/websocket"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

func main() {
	// Initialize database
	db := database.InitDB()
	defer db.Close()

	// Initialize WebSocket hub
	hub := websocket.NewHub()
	go hub.Run()

	// Create router
	r := mux.NewRouter()

	// Auth routes
	r.HandleFunc("/api/login", handlers.Login(db)).Methods("POST")

	// Protected routes
	api := r.PathPrefix("/api").Subrouter()
	api.Use(middleware.AuthMiddleware)

	// Barang routes
	api.HandleFunc("/barang", handlers.GetBarang(db)).Methods("GET")
	api.HandleFunc("/barang", handlers.CreateBarang(db, hub)).Methods("POST")
	api.HandleFunc("/barang/{id}", handlers.UpdateBarang(db, hub)).Methods("PUT")
	api.HandleFunc("/barang/{id}", handlers.DeleteBarang(db, hub)).Methods("DELETE")

	// User routes (admin only)
	api.HandleFunc("/users", handlers.GetUsers(db)).Methods("GET")
	api.HandleFunc("/users", handlers.CreateUser(db)).Methods("POST")
	api.HandleFunc("/users/{id}", handlers.UpdateUser(db)).Methods("PUT")
	api.HandleFunc("/users/{id}", handlers.DeleteUser(db)).Methods("DELETE")

	// Transaksi routes
	api.HandleFunc("/transaksi", handlers.GetTransaksi(db)).Methods("GET")
	api.HandleFunc("/transaksi", handlers.CreateTransaksi(db, hub)).Methods("POST")

	// WebSocket
	r.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		websocket.ServeWs(hub, w, r)
	})

	// CORS
	corsHandler := handlers.CORS(
		handlers.AllowedOrigins([]string{"http://localhost:5173", "http://localhost:3000"}),
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Content-Type", "Authorization"}),
	)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, corsHandler(r)))
}
