package main

import (
	"log"
	"softeng25-42/back-end/internal/handlers"
	"softeng25-42/back-end/internal/repository"
	"softeng25-42/back-end/internal/services/entsoe"

	"github.com/gin-gonic/gin"
)

func main() {
	repository.Connect()

	// Start Background Service
	entsoe.StartService(repository.DB)

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
		api.POST("/updpoint/:id", handlers.UpdatePoint)
		api.POST("/newsession", handlers.NewSession)
		api.GET("/sessions/:id/:from/:to", handlers.GetSessions)
		api.GET("/pointstatus/:pointid/:from/:to", handlers.GetPointStatus)
	}

	// 3. Start Server
	log.Println("API Server starting on :9876...")
	r.Run(":9876")
}
