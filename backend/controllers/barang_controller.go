package controllers

import (
	"net/http"

	"warehouse/backend/config"
	"warehouse/backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CreateBarangRequest struct {
	KodeBarang  string  `json:"kode_barang" binding:"required,min=2"`
	NamaBarang  string  `json:"nama_barang" binding:"required,min=2"`
	JenisBarang string  `json:"jenis_barang" binding:"required,oneof=premium medium super"`
	UkuranKg    float64 `json:"ukuran_kg" binding:"required,gt=0"`
	StokMinimal int     `json:"stok_minimal" binding:"required,gte=0"`
}

// CreateBarang creates a new barang
// POST /api/v1/barang
func CreateBarang(c *gin.Context) {
	var req CreateBarangRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Check if kode_barang already exists
	var existing models.Barang
	if err := config.DB.Where("kode_barang = ?", req.KodeBarang).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"success": false,
			"message": "Kode barang already exists",
		})
		return
	}

	barang := models.Barang{
		KodeBarang:  req.KodeBarang,
		NamaBarang:  req.NamaBarang,
		JenisBarang: req.JenisBarang,
		UkuranKg:    req.UkuranKg,
		StokMinimal: req.StokMinimal,
	}

	if err := config.DB.Create(&barang).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to create barang",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Barang created successfully",
		"data":    barang,
	})
}

// GetAllBarang returns all barang
// GET /api/v1/barang
func GetAllBarang(c *gin.Context) {
	var barangs []models.Barang
	config.DB.Order("id ASC").Find(&barangs)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    barangs,
		"total":   len(barangs),
	})
}

// GetBarangByID returns a barang by ID
// GET /api/v1/barang/:id
func GetBarangByID(c *gin.Context) {
	id := c.Param("id")

	var barang models.Barang
	if err := config.DB.First(&barang, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Barang not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to retrieve barang",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    barang,
	})
}

// UpdateBarang updates a barang
// PUT /api/v1/barang/:id
func UpdateBarang(c *gin.Context) {
	id := c.Param("id")

	var req CreateBarangRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	var barang models.Barang
	if err := config.DB.First(&barang, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Barang not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to retrieve barang",
		})
		return
	}

	// Check if new kode_barang exists in other records
	if barang.KodeBarang != req.KodeBarang {
		var existing models.Barang
		if err := config.DB.Where("kode_barang = ?", req.KodeBarang).First(&existing).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "Kode barang already exists",
			})
			return
		}
	}

	config.DB.Model(&barang).Updates(models.Barang{
		KodeBarang:  req.KodeBarang,
		NamaBarang:  req.NamaBarang,
		JenisBarang: req.JenisBarang,
		UkuranKg:    req.UkuranKg,
		StokMinimal: req.StokMinimal,
	})

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Barang updated successfully",
		"data":    barang,
	})
}

// DeleteBarang soft-deletes a barang
// DELETE /api/v1/barang/:id
func DeleteBarang(c *gin.Context) {
	id := c.Param("id")

	result := config.DB.Delete(&models.Barang{}, id)
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Barang not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Barang deleted successfully",
	})
}
