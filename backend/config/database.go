package config

import (
	"fmt"
	"log"
	"os"

	"warehouse/backend/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func ConnectDB() {
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPass := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")

	// Debug: print raw env values
	log.Printf("Raw ENV - DB_NAME: '%s'", dbName)

	if dbHost == "" {
		dbHost = "127.0.0.1"
	}
	if dbPort == "" {
		dbPort = "5432"
	}
	if dbUser == "" {
		dbUser = "postgres"
	}
	
	// HARDCODE: Always use inventory database
	dbName = "inventory"
	log.Printf("Forcing database to: %s", dbName)
	// Force pgx/libpq-compatible env variables to avoid defaulting to postgres
	_ = os.Setenv("PGDATABASE", dbName)
	_ = os.Setenv("PGHOST", dbHost)
	_ = os.Setenv("PGPORT", dbPort)
	_ = os.Setenv("PGUSER", dbUser)
	_ = os.Setenv("PGPASSWORD", dbPass)
	log.Printf("PG env: PGDATABASE=%s PGHOST=%s PGPORT=%s PGUSER=%s", os.Getenv("PGDATABASE"), os.Getenv("PGHOST"), os.Getenv("PGPORT"), os.Getenv("PGUSER"))

	// Use a standard PostgreSQL DSN for GORM.
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=UTC",
		dbHost, dbUser, dbPass, dbName, dbPort)

	log.Printf("Connecting using DSN: %s", dsn)
	log.Printf("Connecting to PostgreSQL: host=%s port=%s dbname=%s user=%s", dbHost, dbPort, dbName, dbUser)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Database connected successfully")

	// Get underlying SQL DB to configure connection pool
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("Failed to get database instance: %v", err)
	}

	// Ensure connection is working
	if err := sqlDB.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	// Auto migrate models
	// Note: Barang model excluded - will be handled separately
	if err := db.AutoMigrate(&models.User{}, &models.WarehouseInventory{}, &models.StockOpname{}, &models.PasswordResetToken{}); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	// Verify table exists and check data
	var count int64
	db.Model(&models.User{}).Count(&count)
	log.Printf("Users table ready. Current user count: %d", count)

	DB = db
}
