package controllers

import (
	"net/http"
	"strconv"
	"time"

	"warehouse/backend/config"
	"warehouse/backend/models"

	"github.com/gin-gonic/gin"
)

type CreateStockOpnameRequest struct {
	ProductID  uint   `json:"product_id" binding:"required"`
	WarehouseID uint  `json:"warehouse_id" binding:"required"`
	UserID     uint   `json:"user_id" binding:"required"`
	StokFisik  int32  `json:"stok_fisik" binding:"required"`
	Catatan    string `json:"catatan"`
	IsAdjusted bool   `json:"is_adjusted"`
}

type UpdateStockOpnameRequest struct {
	ProductID  uint   `json:"product_id"`
	WarehouseID uint  `json:"warehouse_id"`
	UserID     uint   `json:"user_id"`
	StokFisik  *int32 `json:"stok_fisik"`
	Catatan    *string `json:"catatan"`
	IsAdjusted *bool  `json:"is_adjusted"`
	Status     *string `json:"status"`
}

func getSystemStockByProduct(productID uint) (int, error) {
	var stok int
	if err := config.DB.Model(&models.WarehouseInventory{}).
		Where("product_id = ?", productID).
		Select("COALESCE(SUM(stok), 0)").
		Scan(&stok).Error; err != nil {
		return 0, err
	}
	return stok, nil
}

func GetAllStockOpnames(c *gin.Context) {
	var stockOpnames []models.StockOpname
	query := config.DB.Order("timestamp DESC")
	
	// Filter by status if provided
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	
	if err := query.Find(&stockOpnames).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch stock opname data: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stockOpnames,
		"count":   len(stockOpnames),
	})
}

func GetStockOpnameByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid stock opname ID",
		})
		return
	}

	var stockOpname models.StockOpname
	if result := config.DB.First(&stockOpname, id); result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Stock opname not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stockOpname,
	})
}

func CreateStockOpname(c *gin.Context) {
	var req CreateStockOpnameRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request body: " + err.Error(),
		})
		return
	}

	if req.StokFisik < 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "stok_fisik tidak boleh negatif",
		})
		return
	}

	var product models.Product
	if result := config.DB.First(&product, req.ProductID); result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Product not found"})
		return
	}

	var warehouse models.Warehouse
	if result := config.DB.First(&warehouse, req.WarehouseID); result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Warehouse not found"})
		return
	}

	var user models.User
	if result := config.DB.First(&user, req.UserID); result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "User not found"})
		return
	}

	stokSistem, err := getSystemStockByProduct(req.ProductID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to calculate system stock: " + err.Error(),
		})
		return
	}

	stockOpname := models.StockOpname{
		ProductID:  req.ProductID,
		WarehouseID: req.WarehouseID,
		UserID:     req.UserID,
		StokSistem: int32(stokSistem),
		StokFisik:  req.StokFisik,
		Catatan:    req.Catatan,
		IsAdjusted: req.IsAdjusted,
		Timestamp:  time.Now(),
	}

	if err := config.DB.Create(&stockOpname).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to create stock opname: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Stock opname created successfully",
		"data":    stockOpname,
	})
}

func UpdateStockOpname(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid stock opname ID",
		})
		return
	}

	var stockOpname models.StockOpname
	if result := config.DB.First(&stockOpname, id); result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Stock opname not found",
		})
		return
	}

	var req UpdateStockOpnameRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request body: " + err.Error(),
		})
		return
	}

	if req.ProductID != 0 {
		stockOpname.ProductID = req.ProductID
	}
	if req.WarehouseID != 0 {
		stockOpname.WarehouseID = req.WarehouseID
	}
	if req.UserID != 0 {
		stockOpname.UserID = req.UserID
	}
	if req.StokFisik != nil {
		if *req.StokFisik < 0 {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "stok_fisik tidak boleh negatif"})
			return
		}
		stockOpname.StokFisik = *req.StokFisik
	}
	if req.Catatan != nil {
		stockOpname.Catatan = *req.Catatan
	}
	if req.IsAdjusted != nil {
		stockOpname.IsAdjusted = *req.IsAdjusted
	}
	if req.Status != nil {
		if *req.Status != "pending" && *req.Status != "approved" {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Status harus 'pending' atau 'approved'",
			})
			return
		}
		stockOpname.Status = *req.Status
	}

	stokSistem, calcErr := getSystemStockByProduct(stockOpname.ProductID)
	if calcErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to calculate system stock: " + calcErr.Error(),
		})
		return
	}

	stockOpname.StokSistem = int32(stokSistem)

	if err := config.DB.Save(&stockOpname).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update stock opname: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Stock opname updated successfully",
		"data":    stockOpname,
	})
}

func DeleteStockOpname(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid stock opname ID",
		})
		return
	}

	if err := config.DB.Delete(&models.StockOpname{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to delete stock opname: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Stock opname deleted successfully",
	})
}

func GetSystemStock(c *gin.Context) {
	productIDStr := c.Query("product_id")
	warehouseIDStr := c.Query("warehouse_id")

	productID, err := strconv.ParseUint(productIDStr, 10, 32)
	if err != nil || productID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "product_id tidak valid"})
		return
	}

	warehouseID, err := strconv.ParseUint(warehouseIDStr, 10, 32)
	if err != nil || warehouseID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "warehouse_id tidak valid"})
		return
	}

	stokSistem, err := getSystemStockByProduct(uint(productID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to get system stock: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"product_id":   uint(productID),
			"warehouse_id": uint(warehouseID),
			"stok_sistem":  stokSistem,
		},
	})
}
