package main

import (
	"log"
	"os"

	"warehouse/backend/config"
	"warehouse/backend/middleware"
	"warehouse/backend/routes"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: No .env file found, using system environment variables")
	} else {
		log.Println(".env file loaded successfully")
	}

	// Debug: Print loaded env vars
	log.Printf("Environment: DB_NAME=%s, DB_HOST=%s, DB_PORT=%s, DB_USER=%s",
		os.Getenv("DB_NAME"), os.Getenv("DB_HOST"), os.Getenv("DB_PORT"), os.Getenv("DB_USER"))

	// Connect to database
	config.ConnectDB()

	// Create Gin router
	r := gin.Default()

	// Apply global middleware
	r.Use(middleware.CORSMiddleware())

	// Setup routes
	routes.SetupRoutes(r)

	// Get port from env or default to 8080
	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server running on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
