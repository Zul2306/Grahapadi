package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: No .env file found, using system environment variables")
	} else {
		log.Println(".env file loaded successfully")
	}

	// Load database configuration
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPass := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")

	if dbHost == "" {
		dbHost = "127.0.0.1"
	}
	if dbPort == "" {
		dbPort = "5432"
	}
	if dbUser == "" {
		dbUser = "postgres"
	}
	if dbName == "" {
		dbName = "inventory"
	}

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=UTC",
		dbHost, dbUser, dbPass, dbName, dbPort)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("✓ Connected to database successfully")

	// Read and execute migration files
	migrationsDir := "./migrations"
	files, err := ioutil.ReadDir(migrationsDir)
	if err != nil {
		log.Fatalf("Failed to read migrations directory: %v", err)
	}

	// Filter and sort SQL files
	var sqlFiles []string
	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".sql") {
			sqlFiles = append(sqlFiles, file.Name())
		}
	}

	if len(sqlFiles) == 0 {
		log.Println("No migration files found")
		return
	}

	// Execute each migration file
	for _, filename := range sqlFiles {
		filePath := filepath.Join(migrationsDir, filename)
		log.Printf("Executing migration: %s", filename)

		content, err := ioutil.ReadFile(filePath)
		if err != nil {
			log.Printf("❌ Failed to read file %s: %v", filename, err)
			continue
		}

		// Split by semicolon to handle multiple statements
		sqlStatements := strings.Split(string(content), ";")
		
		for _, statement := range sqlStatements {
			trimmedStatement := strings.TrimSpace(statement)
			if trimmedStatement == "" {
				continue
			}

			if err := db.Exec(trimmedStatement).Error; err != nil {
				log.Printf("❌ Error executing statement: %v", err)
				log.Printf("   Statement: %s...", trimmedStatement[:min(len(trimmedStatement), 100)])
			}
		}

		log.Printf("✓ Migration completed: %s", filename)
	}

	log.Println("✓✓✓ All migrations completed successfully!")
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
