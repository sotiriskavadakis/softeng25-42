package main

import (
	"log"
	"softeng25-42/back-end/internal/handlers"
	"softeng25-42/back-end/internal/repository"
	"softeng25-42/back-end/internal/services/entsoe"

	"github.com/gin-gonic/gin"
)

// @title EV Charging API
// @version 1.0
// @description API for managing electric vehicle charging points
// @host localhost:8080
// @BasePath /api/v1
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

		adminProtected := admin.Group("")
		adminProtected.Use(handlers.AuthRequired())
		adminProtected.POST("/resetpoints", gin.WrapF(handlers.ResetPoints))
		adminProtected.POST("/addpoints", gin.WrapF(handlers.AddPoints))
	}
	auth := r.Group("/api/auth")
	{
		auth.POST("/register", handlers.Register)
		auth.POST("/login", handlers.Login)
	}
	api := r.Group("/api")
	{
		api.GET("/points", handlers.GetPoints)
		api.GET("/point/:id", handlers.GetPointByID)
		api.GET("/pointstatus/:pointid/:from/:to", handlers.GetPointStatus)

		apiProtected := api.Group("")
		apiProtected.Use(handlers.AuthRequired())
		apiProtected.POST("/reserve/:id", handlers.ReservePoint)
		apiProtected.POST("/reserve/:id/:minutes", handlers.ReservePoint)
		apiProtected.POST("/updpoint/:id", handlers.UpdatePoint)
		apiProtected.POST("/newsession", handlers.NewSession)
		apiProtected.GET("/sessions/:id/:from/:to", handlers.GetSessions)
	}

	// 3. Start Server
	log.Println("API Server starting on :9876...")
	r.Run(":9876")
}
