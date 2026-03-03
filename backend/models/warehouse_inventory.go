package models

import "time"

// WarehouseInventory tracks the stock of products in each warehouse
type WarehouseInventory struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	WarehouseID uint      `gorm:"index:idx_warehouse_product,unique" json:"warehouse_id"`
	ProductID   uint      `gorm:"index:idx_warehouse_product,unique" json:"product_id"`
	Stok        int       `gorm:"default:0" json:"stok"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// TableName specifies the table name for the WarehouseInventory model
func (WarehouseInventory) TableName() string {
	return "warehouse_inventory"
}
