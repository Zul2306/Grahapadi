package controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"warehouse/backend/config"
	"warehouse/backend/models"

	"github.com/gin-gonic/gin"
)

type CreateTransactionRequest struct {
	ProductID       uint   `json:"product_id" binding:"required"`
	WarehouseID     uint   `json:"warehouse_id"` // Optional for outgoing (keluar) - will auto-select
	PenanggungJawab uint   `json:"penanggung_jawab" binding:"required"`
	Type            string `json:"type" binding:"required"`
	Jumlah          int    `json:"jumlah" binding:"required"`
}

type UpdateTransactionRequest struct {
	ProductID       *uint   `json:"product_id"`
	WarehouseID     *uint   `json:"warehouse_id"`
	PenanggungJawab *uint   `json:"penanggung_jawab"`
	Type            *string `json:"type"`
	Jumlah          *int    `json:"jumlah"`
	Status          *string `json:"status"`
}

// Helper function to get warehouse inventory for a product-warehouse combo
func getOrCreateWarehouseInventory(warehouseID, productID uint) (*models.WarehouseInventory, error) {
	var inventory models.WarehouseInventory
	result := config.DB.Where("warehouse_id = ? AND product_id = ?", warehouseID, productID).First(&inventory)
	
	if result.RowsAffected == 0 {
		// Create new inventory record
		inventory = models.WarehouseInventory{
			WarehouseID: warehouseID,
			ProductID:   productID,
			Stok:        0,
		}
		if err := config.DB.Create(&inventory).Error; err != nil {
			return nil, err
		}
	} else if result.Error != nil {
		return nil, result.Error
	}
	
	return &inventory, nil
}

// Helper function to find best warehouse for outgoing transaction
// Returns warehouse with highest usage_percent that has sufficient stock
func findBestWarehouseForOutgoing(productID uint, requiredAmount int) (uint, error) {
	type WarehouseStockInfo struct {
		WarehouseID       uint    `json:"warehouse_id"`
		Stok              int     `json:"stok"`
		TotalKapasitasKg  int     `json:"total_kapasitas_kg"`
		TotalBeratKg      float64 `json:"total_berat_kg"`
		UsagePercent      float64 `json:"usage_percent"`
	}

	var warehouses []WarehouseStockInfo
	
	// Get all warehouses that have this product with sufficient stock
	err := config.DB.Table("warehouse_inventory").
		Select(`
			warehouse_inventory.warehouse_id,
			warehouse_inventory.stok,
			warehouses.kapasitas as total_kapasitas_kg,
			(SELECT COALESCE(SUM(wi.stok * p.ukuran_kg), 0) 
				FROM warehouse_inventory wi 
				JOIN products p ON wi.product_id = p.id 
				WHERE wi.warehouse_id = warehouse_inventory.warehouse_id) as total_berat_kg
		`).
		Joins("JOIN warehouses ON warehouse_inventory.warehouse_id = warehouses.id").
		Where("warehouse_inventory.product_id = ? AND warehouse_inventory.stok >= ?", productID, requiredAmount).
		Scan(&warehouses).Error
	
	if err != nil {
		return 0, err
	}

	if len(warehouses) == 0 {
		return 0, fmt.Errorf("tidak ada gudang dengan stok yang cukup")
	}

	// Calculate usage_percent and find warehouse with highest usage
	var bestWarehouse WarehouseStockInfo
	highestUsage := -1.0
	
	for _, wh := range warehouses {
		if wh.TotalKapasitasKg > 0 {
			wh.UsagePercent = (wh.TotalBeratKg / float64(wh.TotalKapasitasKg)) * 100
		}
		
		if wh.UsagePercent > highestUsage {
			highestUsage = wh.UsagePercent
			bestWarehouse = wh
		}
	}

	if bestWarehouse.WarehouseID == 0 {
		return 0, fmt.Errorf("tidak dapat menemukan gudang yang sesuai")
	}

	println("Auto-selected warehouse:", bestWarehouse.WarehouseID, "Usage:", bestWarehouse.UsagePercent, "%")
	return bestWarehouse.WarehouseID, nil
}

// CreateTransaction creates a new transaction with capacity validation
func CreateTransaction(c *gin.Context) {
	var req CreateTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request body: " + err.Error(),
		})
		return
	}

	// Log request for debugging
	println("CreateTransaction Request:", "ProductID:", req.ProductID, "WarehouseID:", req.WarehouseID, "PenanggungJawab:", req.PenanggungJawab, "Type:", req.Type, "Jumlah:", req.Jumlah)

	// Validate type (masuk or keluar)
	if req.Type != "masuk" && req.Type != "keluar" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Type harus 'masuk' atau 'keluar'",
		})
		return
	}

	// Validate jumlah is positive
	if req.Jumlah <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Jumlah harus lebih dari 0",
		})
		return
	}

	// Auto-select warehouse for outgoing transactions if not specified
	if req.Type == "keluar" && req.WarehouseID == 0 {
		bestWarehouseID, err := findBestWarehouseForOutgoing(req.ProductID, req.Jumlah)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Auto-select warehouse gagal: " + err.Error(),
			})
			return
		}
		req.WarehouseID = bestWarehouseID
		println("Auto-selected warehouse ID:", bestWarehouseID)
	}

	// Get warehouse data
	var warehouse models.Warehouse
	if result := config.DB.First(&warehouse, req.WarehouseID); result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Warehouse not found",
		})
		return
	}

	// Get product to calculate weight
	var product models.Product
	if result := config.DB.First(&product, req.ProductID); result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Product not found",
		})
		return
	}

	// Calculate weight of this transaction (jumlah × ukuran_kg)
	transactionWeight := float64(req.Jumlah) * product.UkuranKg
	println("Transaction weight calculation:", "Jumlah:", req.Jumlah, "UkuranKg:", product.UkuranKg, "Weight:", transactionWeight)

	// Get current capacity usage (sum of stok × ukuran_kg for all products in this warehouse)
	var currentWeightUsage float64
	config.DB.Model(&models.WarehouseInventory{}).
		Joins("JOIN products ON warehouse_inventory.product_id = products.id").
		Where("warehouse_inventory.warehouse_id = ?", req.WarehouseID).
		Select("COALESCE(SUM(warehouse_inventory.stok * products.ukuran_kg), 0)").
		Row().
		Scan(&currentWeightUsage)

	// Get or create warehouse inventory
	inventory, err := getOrCreateWarehouseInventory(req.WarehouseID, req.ProductID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to get warehouse inventory: " + err.Error(),
		})
		return
	}

	// Validate capacity based on transaction type
	if req.Type == "masuk" {
		// For incoming transactions, check if capacity (in kg) is sufficient
		// warehouse.Kapasitas is in kg, currentWeightUsage is in kg, transactionWeight is in kg
		newWeightUsage := currentWeightUsage + transactionWeight
		if newWeightUsage > float64(warehouse.Kapasitas) {
			availableWeightCapacity := float64(warehouse.Kapasitas) - currentWeightUsage
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": fmt.Sprintf("Kapasitas gudang tidak mencukupi. Kapasitas: %d kg, Penggunaan saat ini: %.2f kg, Requested: %.2f kg, Total: %.2f kg", 
					warehouse.Kapasitas, currentWeightUsage, transactionWeight, newWeightUsage),
				"total_capacity_kg": warehouse.Kapasitas,
				"current_usage_kg": currentWeightUsage,
				"available_capacity_kg": availableWeightCapacity,
				"requested_weight_kg": transactionWeight,
				"requested_units": req.Jumlah,
				"unit_weight_kg": product.UkuranKg,
			})
			return
		}
		
		// Update inventory stock (stok is in units, not kg)
		inventory.Stok = inventory.Stok + req.Jumlah
		if err := config.DB.Save(inventory).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to update inventory: " + err.Error(),
			})
			return
		}
	} else if req.Type == "keluar" {
		// For outgoing transactions, check if stock (in units) is available
		if inventory.Stok < req.Jumlah {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": fmt.Sprintf("Stok tidak mencukupi. Stok saat ini: %d unit, Requested: %d unit", inventory.Stok, req.Jumlah),
				"available_stock_units": inventory.Stok,
				"requested_units": req.Jumlah,
				"unit_weight_kg": product.UkuranKg,
			})
			return
		}
		
		// Update inventory stock (stok is in units, not kg)
		inventory.Stok = inventory.Stok - req.Jumlah
		if err := config.DB.Save(inventory).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to update inventory: " + err.Error(),
			})
			return
		}
	}

	// Create transaction record
	transaction := models.InventoryStock{
		ProductID:       req.ProductID,
		WarehouseID:     req.WarehouseID,
		PenanggungJawab: req.PenanggungJawab,
		Type:            req.Type,
		Jumlah:          req.Jumlah,
		Timestamp:       time.Now(),
	}

	if err := config.DB.Create(&transaction).Error; err != nil {
		println("CreateTransaction Error:", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to create transaction: " + err.Error(),
		})
		return
	}

	responseMessage := "Transaction created successfully"
	if req.Type == "keluar" {
		responseMessage = fmt.Sprintf("Transaction created successfully. Warehouse selected: %s", warehouse.NamaGudang)
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": responseMessage,
		"data":    transaction,
		"warehouse_name": warehouse.NamaGudang,
		"warehouse_id": warehouse.ID,
	})
}

// GetAllTransactions retrieves all transactions
func GetAllTransactions(c *gin.Context) {
	var transactions []models.InventoryStock
	query := config.DB.Order("timestamp DESC")
	
	// Filter by status if provided
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	
	if err := query.Find(&transactions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch transactions: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    transactions,
		"count":   len(transactions),
	})
}

// GetTransactionByID retrieves a transaction by ID
func GetTransactionByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid transaction ID",
		})
		return
	}

	var transaction models.InventoryStock
	if result := config.DB.First(&transaction, id); result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Transaction not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    transaction,
	})
}

// UpdateTransaction updates a transaction with capacity validation
func UpdateTransaction(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid transaction ID",
		})
		return
	}

	var req UpdateTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request body: " + err.Error(),
		})
		return
	}

	// Get existing transaction
	var transaction models.InventoryStock
	if result := config.DB.First(&transaction, id); result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Transaction not found",
		})
		return
	}

	// Status-only update (used by approval workflow)
	if req.Status != nil && req.ProductID == nil && req.WarehouseID == nil && req.PenanggungJawab == nil && req.Type == nil && req.Jumlah == nil {
		status := *req.Status
		if status != "pending" && status != "approved" {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Status harus 'pending' atau 'approved'",
			})
			return
		}

		transaction.Status = status
		if err := config.DB.Save(&transaction).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to update transaction status: " + err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Transaction status updated successfully",
			"data":    transaction,
		})
		return
	}

	if req.ProductID == nil || req.PenanggungJawab == nil || req.Type == nil || req.Jumlah == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "product_id, penanggung_jawab, type, dan jumlah wajib diisi",
		})
		return
	}

	if req.WarehouseID == nil {
		defaultWarehouseID := transaction.WarehouseID
		req.WarehouseID = &defaultWarehouseID
	}

	fullReq := CreateTransactionRequest{
		ProductID:       *req.ProductID,
		WarehouseID:     *req.WarehouseID,
		PenanggungJawab: *req.PenanggungJawab,
		Type:            *req.Type,
		Jumlah:          *req.Jumlah,
	}

	// Validate type (masuk or keluar)
	if fullReq.Type != "masuk" && fullReq.Type != "keluar" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Type harus 'masuk' atau 'keluar'",
		})
		return
	}

	// Validate jumlah
	if fullReq.Jumlah <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Jumlah harus lebih dari 0",
		})
		return
	}

	// Get warehouse data
	var warehouse models.Warehouse
	if result := config.DB.First(&warehouse, fullReq.WarehouseID); result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Warehouse not found",
		})
		return
	}

	// Get old product ukuran_kg
	var oldProduct models.Product
	if result := config.DB.First(&oldProduct, transaction.ProductID); result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Old product not found",
		})
		return
	}

	// Get new product ukuran_kg
	var newProduct models.Product
	if result := config.DB.First(&newProduct, fullReq.ProductID); result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "New product not found",
		})
		return
	}

	// Calculate old and new weights
	oldTransactionWeight := float64(transaction.Jumlah) * oldProduct.UkuranKg
	newTransactionWeight := float64(fullReq.Jumlah) * newProduct.UkuranKg

	// Get warehouse inventory for the product
	inventory, err := getOrCreateWarehouseInventory(fullReq.WarehouseID, fullReq.ProductID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to get warehouse inventory: " + err.Error(),
		})
		return
	}

	// Get current capacity usage (sum of stok × ukuran_kg for all products)
	var currentWeightUsage float64
	config.DB.Model(&models.WarehouseInventory{}).
		Joins("JOIN products ON warehouse_inventory.product_id = products.id").
		Where("warehouse_inventory.warehouse_id = ?", fullReq.WarehouseID).
		Select("COALESCE(SUM(warehouse_inventory.stok * products.ukuran_kg), 0)").
		Row().
		Scan(&currentWeightUsage)

	// Revert the old transaction impact on inventory (in units, not kg)
	if transaction.Type == "masuk" {
		inventory.Stok -= transaction.Jumlah
	} else if transaction.Type == "keluar" {
		inventory.Stok += transaction.Jumlah
	}
	// Revert the old weight from capacity usage
	currentWeightUsage -= oldTransactionWeight

	// Apply new transaction impact
	if fullReq.Type == "masuk" {
		newWeightUsage := currentWeightUsage + newTransactionWeight
		if newWeightUsage > float64(warehouse.Kapasitas) {
			availableWeightCapacity := float64(warehouse.Kapasitas) - currentWeightUsage
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": fmt.Sprintf("Kapasitas gudang tidak mencukupi. Kapasitas: %d kg, Penggunaan saat ini: %.2f kg, Requested: %.2f kg, Total: %.2f kg", 
					warehouse.Kapasitas, currentWeightUsage, newTransactionWeight, newWeightUsage),
				"total_capacity_kg": warehouse.Kapasitas,
				"current_usage_kg": currentWeightUsage,
				"available_capacity_kg": availableWeightCapacity,
				"requested_weight_kg": newTransactionWeight,
				"requested_units": fullReq.Jumlah,
				"unit_weight_kg": newProduct.UkuranKg,
			})
			return
		}
		inventory.Stok = inventory.Stok + fullReq.Jumlah
	} else if fullReq.Type == "keluar" {
		if inventory.Stok < fullReq.Jumlah {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": fmt.Sprintf("Stok tidak mencukupi. Stok saat ini: %d unit, Requested: %d unit", inventory.Stok, fullReq.Jumlah),
				"available_stock_units": inventory.Stok,
				"requested_units": fullReq.Jumlah,
				"unit_weight_kg": newProduct.UkuranKg,
			})
			return
		}
		inventory.Stok = inventory.Stok - fullReq.Jumlah
	}

	// Update inventory
	if err := config.DB.Save(inventory).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update inventory: " + err.Error(),
		})
		return
	}

	// Update transaction
	transaction.ProductID = fullReq.ProductID
	transaction.WarehouseID = fullReq.WarehouseID
	transaction.PenanggungJawab = fullReq.PenanggungJawab
	transaction.Type = fullReq.Type
	transaction.Jumlah = fullReq.Jumlah

	if err := config.DB.Save(&transaction).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update transaction: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Transaction updated successfully",
		"data":    transaction,
	})
}

// DeleteTransaction deletes a transaction and reverts inventory impact
func DeleteTransaction(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid transaction ID",
		})
		return
	}

	var transaction models.InventoryStock
	if result := config.DB.First(&transaction, id); result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Transaction not found",
		})
		return
	}

	// Get warehouse inventory to revert changes
	inventory, err := getOrCreateWarehouseInventory(transaction.WarehouseID, transaction.ProductID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to get warehouse inventory: " + err.Error(),
		})
		return
	}

	// Revert the transaction impact on inventory
	if transaction.Type == "masuk" {
		inventory.Stok -= transaction.Jumlah
	} else if transaction.Type == "keluar" {
		inventory.Stok += transaction.Jumlah
	}

	// Ensure stok doesn't go negative
	if inventory.Stok < 0 {
		inventory.Stok = 0
	}

	// Update inventory
	if err := config.DB.Save(inventory).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update inventory: " + err.Error(),
		})
		return
	}

	// Delete transaction
	if err := config.DB.Delete(&transaction).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to delete transaction: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Transaction deleted successfully",
	})
}
