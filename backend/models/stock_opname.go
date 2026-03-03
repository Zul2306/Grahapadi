package models

import "time"

type StockOpname struct {
	ID         uint      `json:"id" gorm:"column:id;primaryKey"`
	ProductID  uint      `json:"product_id" gorm:"column:product_id"`
	WarehouseID uint     `json:"-" gorm:"column:warehouse_id"`
	UserID     uint      `json:"user_id" gorm:"column:user_id"`
	StokSistem int32     `json:"stok_sistem" gorm:"column:stok_sistem;type:integer"`
	StokFisik  int32     `json:"stok_fisik" gorm:"column:stok_fisik;type:integer"`
	Selisih    *int32    `json:"selisih" gorm:"column:selisih;->"`
	Catatan    string    `json:"catatan" gorm:"column:catatan"`
	IsAdjusted bool      `json:"-" gorm:"column:is_adjusted"`
	Timestamp  time.Time `json:"timestamp" gorm:"column:timestamp"`
	Status     string    `json:"status" gorm:"column:status;default:pending"`
}

func (StockOpname) TableName() string {
	return "stock_opnames"
}
