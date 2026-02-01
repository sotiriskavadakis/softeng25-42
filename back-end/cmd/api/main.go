package main

import (
	"bufio"
	"log"
	"os"
	"softeng25-42/back-end/internal/handlers"
	"softeng25-42/back-end/internal/repository"
	"softeng25-42/back-end/internal/services/entsoe"
	"strings"

	"github.com/gin-gonic/gin"
)

func loadDotEnv(paths ...string) {
	for _, p := range paths {
		f, err := os.Open(p)
		if err != nil {
			continue
		}

		scanner := bufio.NewScanner(f)
		for scanner.Scan() {
			line := strings.TrimSpace(scanner.Text())
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}

			idx := strings.Index(line, "=")
			if idx <= 0 {
				continue
			}

			key := strings.TrimSpace(line[:idx])
			val := strings.TrimSpace(line[idx+1:])
			val = strings.Trim(val, "\"'")
			if key == "" {
				continue
			}

			if os.Getenv(key) == "" {
				_ = os.Setenv(key, val)
			}
		}

		_ = f.Close()
	}
}

// @title EV Charging API
// @version 1.0
// @description API for managing electric vehicle charging points
// @host localhost:8080
// @BasePath /api/v1
func main() {
	// Load environment variables from .env if present (so JWT_SECRET works without manual export)
	loadDotEnv(".env", "back-end/.env")

	repository.Connect()

	// Start Background Service
	entsoe.StartService(repository.DB)

	// 1. Setup Router with default middleware (Logger, Recovery)
	r := gin.Default()

	// CORS middleware - allow frontend on port 8080
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "http://localhost:8080")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
		c.Header("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	r.StaticFile("/success.html", "./public/success.html")
	r.StaticFile("/cancel.html", "./public/cancel.html")

	// 2. Route Grouping (Cleaner URL structure)
	auth := r.Group("/api/auth")
	{
		auth.POST("/register", handlers.Register)
		auth.POST("/login", handlers.Login)
	}

	admin := r.Group("/api/admin")
	{
		admin.GET("/healthcheck", gin.WrapF(handlers.HealthCheck))

		adminProtected := admin.Group("")
		adminProtected.Use(handlers.AuthRequired())
		adminProtected.POST("/resetpoints", gin.WrapF(handlers.ResetPoints))
		adminProtected.POST("/addpoints", gin.WrapF(handlers.AddPoints))
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

		apiProtected.POST("/payment/create-session", handlers.CreatePaymentSession)
		apiProtected.POST("/payment/capture", handlers.CapturePayment)
		apiProtected.POST("/payment/cancel", handlers.CancelPayment)
	}

	// 3. Start Server
	log.Println("API Server starting on :9876...")
	r.Run(":9876")
}