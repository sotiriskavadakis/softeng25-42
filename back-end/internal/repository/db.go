package repository

import (
	"log"
	// Models package
	"softeng25-42/back-end/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Global DB variable (or you can inject this into your handlers)
var DB *gorm.DB

// DSN stores the connection string (for healthcheck display)
var DSN string

func Connect() {
	// 1. Define your connection string (DSN)
	// Update these values to match your local Postgres setup
	DSN = "host=localhost user=postgres password=123 dbname=ev_charging port=5432 sslmode=disable TimeZone=UTC"

	// 2. Open the connection
	var err error
	DB, err = gorm.Open(postgres.Open(DSN), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("Connected to Database!")

	// 3. Run AutoMigrate
	// This is where the magic happens.
	// Order matters slightly: Create parents before children if possible,
	// but GORM is usually smart enough to handle it.
	log.Println("Running Migrations...")
	err = DB.AutoMigrate(
		// Geography & Infrastructure
		&models.Region{},
		&models.County{},
		&models.Location{},
		&models.Station{},
		&models.ChargerType{},
		&models.Charger{},

		// Users & Finance
		&models.User{},
		&models.PaymentMethod{},
		&models.SavedCard{},

		// Transactions
		&models.Reservation{},
		&models.ChargingSession{},
	)

	if err != nil {
		log.Fatal("Migration failed:", err)
	}

	log.Println("Database Schema created successfully!")
}
