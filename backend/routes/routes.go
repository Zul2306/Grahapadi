package routes

import (
	"net/http"

	"warehouse/backend/config"
	"warehouse/backend/controllers"
	"warehouse/backend/middleware"
	"warehouse/backend/models"

	"github.com/gin-gonic/gin"
)

// SetupRoutes registers all application routes
func SetupRoutes(r *gin.Engine) {
	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Warehouse API is running",
		})
	})

	// Check database connection
	r.GET("/db-check", func(c *gin.Context) {
		var currentDB string
		var currentHost string
		var currentUser string
		var currentPort string
		var tableCount int64

		// Get current database
		if err := config.DB.Raw("SELECT current_database()").Scan(&currentDB).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to get database name",
				"error":   err.Error(),
			})
			return
		}

		// Get database settings from PostgreSQL
		config.DB.Raw("SELECT setting FROM pg_settings WHERE name = 'listen_addresses'").Scan(&currentHost)
		config.DB.Raw("SELECT setting FROM pg_settings WHERE name = 'port'").Scan(&currentPort)
		config.DB.Raw("SELECT current_user").Scan(&currentUser)

		// Count tables
		config.DB.Raw("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'").Scan(&tableCount)

		sqlDB, _ := config.DB.DB()
		stats := sqlDB.Stats()

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"database_info": gin.H{
				"name":             currentDB,
				"current_user":     currentUser,
				"public_tables":    tableCount,
			},
			"connection": gin.H{
				"open_connections": stats.OpenConnections,
				"in_use":           stats.InUse,
				"idle":             stats.Idle,
				"max_open":         stats.MaxOpenConnections,
				"max_idle_closed":  stats.MaxIdleClosed,
				"max_lifetime_closed": stats.MaxLifetimeClosed,
			},
			"message": "Database connection OK ✓",
		})
	})

	// Database test endpoint
	r.GET("/db-test", func(c *gin.Context) {
		var count int64
		config.DB.Model(&models.User{}).Count(&count)
		
		var users []models.User
		config.DB.Find(&users)
		
		// Get database connection info
		sqlDB, _ := config.DB.DB()
		stats := sqlDB.Stats()
		
		// Execute raw SQL to verify
		var rawCount int64
		config.DB.Raw("SELECT COUNT(*) FROM users").Scan(&rawCount)
		
		var currentDB string
		config.DB.Raw("SELECT current_database()").Scan(&currentDB)
		
		var currentSchema string
		config.DB.Raw("SELECT current_schema()").Scan(&currentSchema)
		
		// Get all schemas
		var schemas []string
		config.DB.Raw("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema'").Scan(&schemas)
		
		// Check if users table exists in other schemas
		type TableInfo struct {
			SchemaName string `json:"schema_name"`
			TableName  string `json:"table_name"`
			RowCount   int64  `json:"row_count"`
		}
		var tableLocations []TableInfo
		config.DB.Raw("SELECT schemaname as schema_name, tablename as table_name FROM pg_tables WHERE tablename = 'users'").Scan(&tableLocations)
		
		// Get row count for each users table found
		for i := range tableLocations {
			var cnt int64
			config.DB.Raw("SELECT COUNT(*) FROM " + tableLocations[i].SchemaName + ".users").Scan(&cnt)
			tableLocations[i].RowCount = cnt
		}
		
		// fetch index definitions for users table
		var indexes []map[string]interface{}
		config.DB.Raw("SELECT indexname, indexdef FROM pg_indexes WHERE tablename='users'").Scan(&indexes)

		c.JSON(http.StatusOK, gin.H{
			"success":         true,
			"total_users":     count,
			"users":           users,
			"raw_count":       rawCount,
			"indexes":         indexes,
			"db_info": gin.H{
				"database":       currentDB,
				"schema":         currentSchema,
				"all_schemas":    schemas,
				"users_tables":   tableLocations,
			},
			"db_stats": gin.H{
				"open_connections": stats.OpenConnections,
				"in_use":           stats.InUse,
				"idle":             stats.Idle,
			},
		})
	})

	// Raw query test
	r.GET("/db-raw", func(c *gin.Context) {
		type UserRow struct {
			ID          uint   `json:"id"`
			Email       string `json:"email"`
			NamaLengkap string `json:"nama_lengkap"`
			Role        string `json:"role"`
		}
		
		var users []UserRow
		config.DB.Raw("SELECT id, email, nama_lengkap, role FROM users ORDER BY id").Scan(&users)
		
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    users,
			"count":   len(users),
		})
	})

	// API v1 group
	v1 := r.Group("/api/v1")
	{
		// Auth routes (public)
		auth := v1.Group("/auth")
		{
			auth.POST("/login", controllers.Login)
			auth.POST("/register", controllers.Register)
			auth.POST("/forgot-password", controllers.ForgotPassword)
			auth.POST("/reset-password", controllers.ResetPassword)
			auth.POST("/create-user-invitation", controllers.CreateUserInvitation)
			auth.POST("/setup-password", controllers.SetupPassword)
		}

		// Barang routes (public for now, can add auth later)
		barang := v1.Group("/barang")
		{
			barang.GET("", controllers.GetAllBarang)
			barang.GET("/:id", controllers.GetBarangByID)
			barang.POST("", controllers.CreateBarang)
			barang.PUT("/:id", controllers.UpdateBarang)
			barang.DELETE("/:id", controllers.DeleteBarang)
		}

		// Products routes (public for now, can add auth later)
		products := v1.Group("/products")
		{
			products.GET("", controllers.GetAllProducts)
			products.GET("/:id", controllers.GetProductByID)
			products.GET("/:id/warehouse-inventory", controllers.GetProductWarehouseInventory)
			products.POST("", controllers.CreateProduct)
			products.PUT("/:id", controllers.UpdateProduct)
			products.DELETE("/:id", controllers.DeleteProduct)
		}

		// Transactions routes (public for now, can add auth later)
		transactions := v1.Group("/transactions")
		{
			transactions.GET("", controllers.GetAllTransactions)
			transactions.GET("/:id", controllers.GetTransactionByID)
			transactions.POST("", controllers.CreateTransaction)
			transactions.PUT("/:id", controllers.UpdateTransaction)
			transactions.DELETE("/:id", controllers.DeleteTransaction)
		}

		// Stock Opname routes (public for now, can add auth later)
		stockOpnames := v1.Group("/stock-opnames")
		{
			stockOpnames.GET("", controllers.GetAllStockOpnames)
			stockOpnames.GET("/system-stock", controllers.GetSystemStock)
			stockOpnames.GET("/:id", controllers.GetStockOpnameByID)
			stockOpnames.POST("", controllers.CreateStockOpname)
			stockOpnames.PUT("/:id", controllers.UpdateStockOpname)
			stockOpnames.DELETE("/:id", controllers.DeleteStockOpname)
		}

		// Warehouses routes (public for now, can add auth later)
		warehouses := v1.Group("/warehouses")
		{
			warehouses.GET("/capacity/status", controllers.GetWarehouseCapacityStatus)
			warehouses.POST("/recalculate-inventory", controllers.RecalculateInventory)
			warehouses.GET("", controllers.GetAllWarehouses)
			warehouses.GET("/:id/inventory-status", controllers.GetWarehouseInventoryStatus)
			warehouses.GET("/:id", controllers.GetWarehouseByID)
			warehouses.POST("", controllers.CreateWarehouse)
			warehouses.PUT("/:id", controllers.UpdateWarehouse)
			warehouses.DELETE("/:id", controllers.DeleteWarehouse)
		}

		// Warehouse Inventory routes
		warehouseInventory := v1.Group("/warehouse-inventory")
		{
			warehouseInventory.GET("", controllers.GetAllWarehouseInventory)
		}

		// Users routes (public for listing, can add auth later)
		users := v1.Group("/users")
		{
			users.GET("", controllers.GetAllUsers)
			users.GET("/:id", controllers.GetUserByID)
		}

		// Protected routes (require JWT)
		protected := v1.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{
			// Auth
			protected.GET("/auth/profile", controllers.GetProfile)
			protected.PUT("/auth/change-password", controllers.ChangePassword)

			// Users (admin only - delete operations)
			protected.DELETE("/users/:id", controllers.DeleteUser)
		}
	}
}
