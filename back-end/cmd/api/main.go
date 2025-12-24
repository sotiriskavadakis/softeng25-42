package main

import (
	"softeng25-42/back-end/internal/handlers"
	"softeng25-42/back-end/internal/repository"

	"github.com/gin-gonic/gin"
)

func main() {
	repository.Connect()

	// 1. Setup Router with default middleware (Logger, Recovery)
	r := gin.Default()

	// 2. Route Grouping (Cleaner URL structure)
	admin := r.Group("/api/admin")
	{
		admin.GET("/healthcheck", gin.WrapF(handlers.HealthCheck))
		admin.POST("/resetpoints", gin.WrapF(handlers.ResetPoints))
		admin.POST("/addpoints", gin.WrapF(handlers.AddPoints))
	}
	api := r.Group("/api")
	{
		api.GET("/points", handlers.GetPoints)
		api.GET("/point/:id", handlers.GetPointByID)
		api.POST("/reserve/:id", handlers.ReservePoint)
		api.POST("/reserve/:id/:minutes", handlers.ReservePoint)
	}

	// 3. Start Server
	println("API Server starting on :9876...")
	r.Run(":9876")
}
