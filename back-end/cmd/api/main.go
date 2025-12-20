package main

import (
	"net/http"
	"softeng25-42/back-end/internal/handlers"
	"softeng25-42/back-end/internal/repository"
    
    // If using a router like chi or mux:
    // "github.com/go-chi/chi/v5"
)

func main() {
    // 1. Connect to DB
    repository.Connect()

    // 2. Setup Router (Using standard net/http for this example)
    mux := http.NewServeMux()

    // 3. Register Endpoint [cite: 34]
    mux.HandleFunc("/api/admin/healthcheck", handlers.HealthCheck)
	mux.HandleFunc("/api/admin/resetpoints", handlers.ResetPoints)

    // 4. Start Server on port 9876 [cite: 11]
    println("Server starting on :9876...")
    err := http.ListenAndServe(":9876", mux) // Note: PDF asks for HTTPS eventually
    if err != nil {
        panic(err)
    }
}