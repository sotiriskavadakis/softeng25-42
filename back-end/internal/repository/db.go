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
	dsn := "host=localhost user=postgres password=123 dbname=ev_charging port=5432 sslmode=disable TimeZone=UTC"

	// ---------------------------------------------------------
	// PASS 1: Create Tables WITHOUT Foreign Keys
	// ---------------------------------------------------------
	// We disable FKs so GORM can create 'stations' and 'chargers' tables
	// without worrying about which one exists first.
	// ---------------------------------------------------------
	log.Println("--- Migration Pass 1: Creating Tables ---")
	dbNoFK, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		DisableForeignKeyConstraintWhenMigrating: true, 
	})
	if err != nil {
		log.Fatal("Failed to connect (Pass 1):", err)
	}

	// Migrate EVERYTHING. GORM will create the tables but skip the FK constraints.
	err = dbNoFK.AutoMigrate(
		&models.Region{},
		&models.County{},
		&models.Location{},
		&models.Station{},
		&models.ChargerType{},
		&models.Charger{},
		&models.User{},
		&models.PaymentMethod{},
		&models.SavedCard{},
		&models.Reservation{},
		&models.ChargingSession{},
		&models.StatusChange{},
		&models.ElectricityPrice{},
	)
	if err != nil {
		log.Fatal("Migration Pass 1 failed:", err)
	}

	// ---------------------------------------------------------
	// PASS 2: Add Constraints (Foreign Keys)
	// ---------------------------------------------------------
	// Now that tables exist, we reconnect with standard settings.
	// GORM will see the tables are there but the Constraints are missing,
	// and it will add them safely.
	// ---------------------------------------------------------
	log.Println("--- Migration Pass 2: Adding Constraints ---")
	
	// Assign to the global 'DB' variable to be used by the rest of the app
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		DisableForeignKeyConstraintWhenMigrating: false, // Default behavior
	})
	if err != nil {
		log.Fatal("Failed to connect (Pass 2):", err)
	}

	err = DB.AutoMigrate(
		&models.Region{},
		&models.County{},
		&models.Location{},
		&models.Station{},
		&models.ChargerType{},
		&models.Charger{},
		&models.User{},
		&models.PaymentMethod{},
		&models.SavedCard{},
		&models.Reservation{},
		&models.ChargingSession{},
		&models.StatusChange{},
		&models.ElectricityPrice{},
	)
	if err != nil {
		log.Fatal("Migration Pass 2 failed:", err)
	}

	log.Println("✅ Database Schema & Relationships created successfully!")
}