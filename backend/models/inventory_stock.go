package models

import "time"

type InventoryStock struct {
	ID               uint      `json:"id" gorm:"column:id;primaryKey"`
	ProductID        uint      `json:"product_id" gorm:"column:product_id"`
	WarehouseID      uint      `json:"warehouse_id" gorm:"column:warehouse_id"`
	PenanggungJawab  uint      `json:"penanggung_jawab" gorm:"column:penanggung_jawab"`
	Type             string    `json:"type" gorm:"column:type"`
	Jumlah           int       `json:"jumlah" gorm:"column:jumlah"`
	Timestamp        time.Time `json:"timestamp" gorm:"column:timestamp"`
	Status           string    `json:"status" gorm:"column:status;default:pending"`
}

func (InventoryStock) TableName() string {
	return "transactions"
}
