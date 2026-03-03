package controllers

import (
	"net/http"
	"strconv"
	"strings"

	"warehouse/backend/config"
	"warehouse/backend/models"

	"github.com/gin-gonic/gin"
)

// GetAllWarehouseInventory retrieves all warehouse inventory records
func GetAllWarehouseInventory(c *gin.Context) {
	var inventory []models.WarehouseInventory

	if err := config.DB.Find(&inventory).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch warehouse inventory",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    inventory,
		"count":   len(inventory),
	})
}

// GetAllWarehouses retrieves all warehouses
func GetAllWarehouses(c *gin.Context) {
	var warehouses []models.Warehouse

	if err := config.DB.Find(&warehouses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Gagal mengambil data warehouse",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Data warehouse berhasil diambil",
		"data":    warehouses,
		"count":   len(warehouses),
	})
}

// GetWarehouseByID retrieves a specific warehouse by ID
func GetWarehouseByID(c *gin.Context) {
	id := c.Param("id")

	var warehouse models.Warehouse

	if err := config.DB.Where("id = ?", id).First(&warehouse).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Warehouse tidak ditemukan",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Warehouse berhasil diambil",
		"data":    warehouse,
	})
}

// CreateWarehouse creates a new warehouse
func CreateWarehouse(c *gin.Context) {
	var request struct {
		NamaGudang string `json:"nama_gudang"`
		Kapasitas  int    `json:"kapasitas"`
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Data tidak valid",
			"error":   err.Error(),
		})
		return
	}

	warehouse := models.Warehouse{
		NamaGudang: request.NamaGudang,
		Kapasitas:  request.Kapasitas,
	}

	if err := config.DB.Create(&warehouse).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Gagal membuat warehouse",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Warehouse berhasil dibuat",
		"data":    warehouse,
	})
}

// UpdateWarehouse updates an existing warehouse
func UpdateWarehouse(c *gin.Context) {
	id := c.Param("id")

	var warehouse models.Warehouse

	if err := config.DB.Where("id = ?", id).First(&warehouse).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Warehouse tidak ditemukan",
		})
		return
	}

	var request struct {
		NamaGudang string `json:"nama_gudang"`
		Kapasitas  int    `json:"kapasitas"`
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Data tidak valid",
			"error":   err.Error(),
		})
		return
	}

	if request.NamaGudang != "" {
		warehouse.NamaGudang = request.NamaGudang
	}
	if request.Kapasitas > 0 {
		warehouse.Kapasitas = request.Kapasitas
	}

	if err := config.DB.Save(&warehouse).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Gagal mengupdate warehouse",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Warehouse berhasil diupdate",
		"data":    warehouse,
	})
}

// DeleteWarehouse deletes a warehouse
func DeleteWarehouse(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "ID tidak valid",
		})
		return
	}

	// Check if warehouse exists
	var warehouse models.Warehouse
	if result := config.DB.First(&warehouse, id); result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Warehouse tidak ditemukan",
		})
		return
	}

	if err := config.DB.Delete(&warehouse).Error; err != nil {
		// Check if it's a foreign key constraint error
		if strings.Contains(err.Error(), "violates foreign key constraint") ||
			strings.Contains(err.Error(), "FOREIGN KEY constraint failed") {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "Tidak dapat menghapus warehouse. Warehouse memiliki data terkait (produk, transaksi, stok, dll)",
				"error":   "Warehouse is referenced in other tables",
			})
			return
		}

		// Other database errors
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Gagal menghapus warehouse",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Warehouse berhasil dihapus",
	})
}

// GetWarehouseCapacityStatus retrieves capacity status for all warehouses
func GetWarehouseCapacityStatus(c *gin.Context) {
	var warehouses []models.Warehouse
	
	if err := config.DB.Find(&warehouses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Gagal mengambil data warehouse",
			"error":   err.Error(),
		})
		return
	}

	type CapacityStatus struct {
		WarehouseID       uint    `json:"warehouse_id"`
		NamaGudang        string  `json:"nama_gudang"`
		TotalKapasitasKg  int     `json:"total_kapasitas_kg"`
		TotalBeratKg      float64 `json:"total_berat_kg"`
		AvailableCapacityKg float64 `json:"available_capacity_kg"`
		UsagePercent      float64 `json:"usage_percent"`
		TotalUnitCount    int     `json:"total_unit_count"`
	}

	var capacityStatuses []CapacityStatus

	for _, warehouse := range warehouses {
		// Get total weight (stok × ukuran_kg) for this warehouse
		var totalWeightKg float64
		config.DB.Model(&models.WarehouseInventory{}).
			Joins("JOIN products ON warehouse_inventory.product_id = products.id").
			Where("warehouse_inventory.warehouse_id = ?", warehouse.ID).
			Select("COALESCE(SUM(warehouse_inventory.stok * products.ukuran_kg), 0)").
			Row().
			Scan(&totalWeightKg)

		// Get total unit count
		var totalUnitCount int
		config.DB.Model(&models.WarehouseInventory{}).
			Where("warehouse_id = ?", warehouse.ID).
			Select("COALESCE(SUM(stok), 0)").
			Row().
			Scan(&totalUnitCount)

		availableCapacityKg := float64(warehouse.Kapasitas) - totalWeightKg
		usagePercent := 0.0
		if warehouse.Kapasitas > 0 {
			usagePercent = (totalWeightKg / float64(warehouse.Kapasitas)) * 100
		}

		capacityStatuses = append(capacityStatuses, CapacityStatus{
			WarehouseID:         warehouse.ID,
			NamaGudang:          warehouse.NamaGudang,
			TotalKapasitasKg:    warehouse.Kapasitas,
			TotalBeratKg:        totalWeightKg,
			AvailableCapacityKg: availableCapacityKg,
			UsagePercent:        usagePercent,
			TotalUnitCount:      totalUnitCount,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Capacity status berhasil diambil",
		"data":    capacityStatuses,
	})
}

// GetWarehouseInventoryStatus retrieves detailed inventory status for a specific warehouse
func GetWarehouseInventoryStatus(c *gin.Context) {
	warehouseID := c.Param("id")

	var warehouse models.Warehouse
	if err := config.DB.First(&warehouse, warehouseID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Warehouse tidak ditemukan",
		})
		return
	}

	type InventoryDetail struct {
		WarehouseID uint    `gorm:"column:warehouse_id" json:"warehouse_id"`
		ProductID   uint    `gorm:"column:product_id" json:"product_id"`
		NamaBarang  string  `gorm:"column:nama_barang" json:"nama_barang"`
		Stok        int     `gorm:"column:stok" json:"stok_units"`
		UkuranKg    float64 `gorm:"column:ukuran_kg" json:"ukuran_kg"`
		BeratKg     float64 `json:"berat_kg"`
	}

	var inventoryDetails []InventoryDetail
	if err := config.DB.Table("warehouse_inventory").
		Select("warehouse_inventory.warehouse_id, warehouse_inventory.product_id, products.nama_barang as nama_barang, warehouse_inventory.stok, products.ukuran_kg, (warehouse_inventory.stok * products.ukuran_kg) as berat_kg").
		Joins("LEFT JOIN products ON warehouse_inventory.product_id = products.id").
		Where("warehouse_inventory.warehouse_id = ?", warehouseID).
		Scan(&inventoryDetails).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Gagal mengambil inventory",
			"error":   err.Error(),
		})
		return
	}

	// Calculate totals
	totalStok := 0
	totalWeightKg := 0.0
	for _, inv := range inventoryDetails {
		totalStok += inv.Stok
		totalWeightKg += inv.BeratKg
	}

	availableCapacityKg := float64(warehouse.Kapasitas) - totalWeightKg
	usagePercent := 0.0
	if warehouse.Kapasitas > 0 {
		usagePercent = (totalWeightKg / float64(warehouse.Kapasitas)) * 100
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Inventory status berhasil diambil",
		"data": gin.H{
			"warehouse_id":            warehouse.ID,
			"nama_gudang":             warehouse.NamaGudang,
			"total_kapasitas_kg":      warehouse.Kapasitas,
			"total_berat_kg":          totalWeightKg,
			"available_capacity_kg":   availableCapacityKg,
			"usage_percent":           usagePercent,
			"total_unit_count":        totalStok,
			"inventory_details":       inventoryDetails,
		},
	})
}
// RecalculateInventory recalculates warehouse inventory based on all transactions
func RecalculateInventory(c *gin.Context) {
	// Get all transactions
	var transactions []models.InventoryStock
	if err := config.DB.Find(&transactions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch transactions: " + err.Error(),
		})
		return
	}

	// Group transactions by (warehouse_id, product_id)
	type InventoryKey struct {
		WarehouseID uint
		ProductID   uint
	}
	inventoryMap := make(map[InventoryKey]int)

	for _, trans := range transactions {
		key := InventoryKey{WarehouseID: trans.WarehouseID, ProductID: trans.ProductID}
		if trans.Type == "masuk" {
			inventoryMap[key] += trans.Jumlah
		} else if trans.Type == "keluar" {
			inventoryMap[key] -= trans.Jumlah
		}
	}

	// Get all warehouse inventory records
	var allInventories []models.WarehouseInventory
	if err := config.DB.Find(&allInventories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch warehouse inventory: " + err.Error(),
		})
		return
	}

	// Update all inventory records
	updateCount := 0
	for i := range allInventories {
		key := InventoryKey{WarehouseID: allInventories[i].WarehouseID, ProductID: allInventories[i].ProductID}
		calculatedStok := inventoryMap[key]
		
		// Ensure stok doesn't go negative
		if calculatedStok < 0 {
			calculatedStok = 0
		}

		// Only update if value changed
		if allInventories[i].Stok != calculatedStok {
			allInventories[i].Stok = calculatedStok
			if err := config.DB.Save(&allInventories[i]).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": "Failed to update inventory: " + err.Error(),
				})
				return
			}
			updateCount++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Inventory recalculated successfully",
		"updated_records": updateCount,
		"total_warehouses": len(allInventories),
	})
}

// GetProductWarehouseInventory retrieves inventory for a specific product across all warehouses
func GetProductWarehouseInventory(c *gin.Context) {
	productID := c.Param("id")

	type InventoryByWarehouse struct {
		WarehouseID   uint    `gorm:"column:warehouse_id" json:"warehouse_id"`
		NamaGudang    string  `gorm:"column:nama_gudang" json:"warehouse_name"`
		ProductID     uint    `gorm:"column:product_id" json:"product_id"`
		NamaBarang    string  `gorm:"column:nama_barang" json:"nama_barang"`
		Stok          int     `gorm:"column:stok" json:"stok"`
		UkuranKg      float64 `gorm:"column:ukuran_kg" json:"ukuran_kg"`
		BeratKg       float64 `json:"berat_kg"`
	}

	var inventoryDetails []InventoryByWarehouse
	if err := config.DB.Table("warehouse_inventory").
		Select("warehouse_inventory.warehouse_id, warehouses.nama_gudang, warehouse_inventory.product_id, products.nama_barang, warehouse_inventory.stok, products.ukuran_kg, (warehouse_inventory.stok * products.ukuran_kg) as berat_kg").
		Joins("LEFT JOIN products ON warehouse_inventory.product_id = products.id").
		Joins("LEFT JOIN warehouses ON warehouse_inventory.warehouse_id = warehouses.id").
		Where("warehouse_inventory.product_id = ?", productID).
		Scan(&inventoryDetails).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Gagal mengambil inventory produk",
			"error":   err.Error(),
		})
		return
	}

	if len(inventoryDetails) == 0 {
		// Product exists but no inventory or doesn't exist
		var product models.Product
		if err := config.DB.First(&product, productID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Produk tidak ditemukan",
			})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    inventoryDetails,
		"count":   len(inventoryDetails),
	})
}