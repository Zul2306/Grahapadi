package controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"warehouse/backend/config"
	"warehouse/backend/models"

	"github.com/gin-gonic/gin"
)

type CreateProductRequest struct {
	KodeBarang  string  `json:"kode_barang"`
	NamaBarang  string  `json:"nama_barang" binding:"required"`
	JenisBarang string  `json:"jenis_barang" binding:"required"`
	UkuranKg    float64 `json:"ukuran_kg" binding:"required"`
	StokMinimal int     `json:"stok_minimal" binding:"required"`
}

// GenerateProductCode generates unique product code
func GenerateProductCode() string {
	var lastProduct models.Product
	var maxNumber int = 0

	// Get the last product to find the highest number
	config.DB.Order("id DESC").Limit(1).Find(&lastProduct)

	// If there are products, parse the code to get the number
	if lastProduct.ID > 0 && lastProduct.KodeBarang != "" {
		parts := strings.Split(lastProduct.KodeBarang, "-")
		if len(parts) == 2 {
			if num, err := strconv.Atoi(parts[1]); err == nil {
				maxNumber = num
			}
		}
	}

	// Generate new code with padding to 3 digits
	newNumber := maxNumber + 1
	return fmt.Sprintf("PRD-%03d", newNumber)
}

// CreateProduct creates a new product
func CreateProduct(c *gin.Context) {
	var req CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request body: " + err.Error(),
		})
		return
	}

	// Auto-generate kode_barang if empty
	if req.KodeBarang == "" || strings.TrimSpace(req.KodeBarang) == "" {
		req.KodeBarang = GenerateProductCode()
	} else {
		// Check if kode_barang already exists
		var existing models.Product
		if result := config.DB.Where("kode_barang = ?", req.KodeBarang).First(&existing); result.RowsAffected > 0 {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "Kode Barang already exists",
			})
			return
		}
	}

	// Validate jenis_barang enum
	validJenis := []string{"premium", "medium", "super"}
	isValid := false
	for _, j := range validJenis {
		if req.JenisBarang == j {
			isValid = true
			break
		}
	}
	if !isValid {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Jenis Barang must be one of: premium, medium, super",
		})
		return
	}

	product := models.Product{
		KodeBarang:  req.KodeBarang,
		NamaBarang:  req.NamaBarang,
		JenisBarang: req.JenisBarang,
		UkuranKg:    req.UkuranKg,
		StokMinimal: req.StokMinimal,
	}

	if err := config.DB.Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to create product: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Product created successfully",
		"data":    product,
	})
}

// GetAllProducts retrieves all products
func GetAllProducts(c *gin.Context) {
	var products []models.Product
	if err := config.DB.Order("id ASC").Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch products: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    products,
		"count":   len(products),
	})
}

// GetProductByID retrieves a product by ID
func GetProductByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid product ID",
		})
		return
	}

	var product models.Product
	if result := config.DB.First(&product, id); result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Product not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    product,
	})
}

// UpdateProduct updates a product
func UpdateProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid product ID",
		})
		return
	}

	var req CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request body: " + err.Error(),
		})
		return
	}

	// Validate jenis_barang enum
	validJenis := []string{"premium", "medium", "super"}
	isValid := false
	for _, j := range validJenis {
		if req.JenisBarang == j {
			isValid = true
			break
		}
	}
	if !isValid {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Jenis Barang must be one of: premium, medium, super",
		})
		return
	}

	var product models.Product
	if result := config.DB.First(&product, id); result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Product not found",
		})
		return
	}

	// Check if kode_barang is changed and already exists
	if req.KodeBarang != product.KodeBarang {
		var existing models.Product
		if result := config.DB.Where("kode_barang = ?", req.KodeBarang).First(&existing); result.RowsAffected > 0 {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "Kode Barang already exists",
			})
			return
		}
	}

	product.KodeBarang = req.KodeBarang
	product.NamaBarang = req.NamaBarang
	product.JenisBarang = req.JenisBarang
	product.UkuranKg = req.UkuranKg
	product.StokMinimal = req.StokMinimal

	if err := config.DB.Save(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update product: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Product updated successfully",
		"data":    product,
	})
}

// DeleteProduct deletes a product
func DeleteProduct(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid product ID",
		})
		return
	}

	var product models.Product
	if result := config.DB.First(&product, id); result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Product not found",
		})
		return
	}

	if err := config.DB.Delete(&product).Error; err != nil {
		// Check if it's a foreign key constraint error
		if strings.Contains(err.Error(), "violates foreign key constraint") ||
			strings.Contains(err.Error(), "FOREIGN KEY constraint failed") {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "Tidak dapat menghapus produk. Produk memiliki data terkait (transaksi, stok warehouse, dll)",
				"error":   "Product is referenced in other tables",
			})
			return
		}

		// Other database errors
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to delete product: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Product deleted successfully",
	})
}
