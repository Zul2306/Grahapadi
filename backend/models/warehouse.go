package models

import "time"

// Warehouse represents a warehouse/location in the inventory system
type Warehouse struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	NamaGudang string    `gorm:"column:nama_gudang" json:"nama_gudang"`
	Kapasitas int       `gorm:"column:kapasitas" json:"kapasitas"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName specifies the table name for the Warehouse model
func (Warehouse) TableName() string {
	return "warehouses"
}

