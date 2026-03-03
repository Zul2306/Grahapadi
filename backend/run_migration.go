package main

import (
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Load environment variables
	dbHost := "127.0.0.1"
	dbPort := "5432"
	dbUser := "postgres"
	dbPass := ""
	dbName := "inventory"

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=UTC",
		dbHost, dbUser, dbPass, dbName, dbPort)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Connected to database successfully")

	// Add columns one by one
	migrations := []string{
		"ALTER TABLE users ADD COLUMN IF NOT EXISTS nama VARCHAR(100)",
		"ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'",
		"ALTER TABLE users ADD COLUMN IF NOT EXISTS setup_token VARCHAR(500)",
		"ALTER TABLE users ADD COLUMN IF NOT EXISTS setup_token_exp TIMESTAMP",
		"ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
		"CREATE UNIQUE INDEX IF NOT EXISTS idx_users_nama ON users(nama) WHERE nama IS NOT NULL AND nama != ''",
		"UPDATE users SET status = 'active' WHERE password IS NOT NULL AND password != '' AND (status IS NULL OR status = '')",
		"UPDATE users SET status = 'pending' WHERE (password IS NULL OR password = '') AND (status IS NULL OR status = '')",
		"UPDATE users SET nama = SPLIT_PART(email, '@', 1) WHERE nama IS NULL OR nama = ''",
	}

	for i, sql := range migrations {
		log.Printf("Running migration %d: %s", i+1, sql)
		if err := db.Exec(sql).Error; err != nil {
			log.Printf("Warning on migration %d: %v", i+1, err)
		} else {
			log.Printf("✓ Migration %d completed", i+1)
		}
	}

	log.Println("All migrations completed!")

	// Verify columns exist
	log.Println("\nVerifying table structure...")
	var result []map[string]interface{}
	db.Raw("SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position").Scan(&result)
	
	fmt.Println("\nColumns in users table:")
	for _, col := range result {
		fmt.Printf("  - %s (%s, nullable: %s, default: %v)\n", 
			col["column_name"], col["data_type"], col["is_nullable"], col["column_default"])
	}
}
