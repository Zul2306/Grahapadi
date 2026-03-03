package models

import "time"

type Product struct {
	ID           uint      `json:"id" gorm:"column:id;primaryKey"`
	KodeBarang   string    `json:"kode_barang" gorm:"column:kode_barang"`
	NamaBarang   string    `json:"nama_barang" gorm:"column:nama_barang"`
	JenisBarang  string    `json:"jenis_barang" gorm:"column:jenis_barang"`
	UkuranKg     float64   `json:"ukuran_kg" gorm:"column:ukuran_kg"`
	StokMinimal  int       `json:"stok_minimal" gorm:"column:stok_minimal"`
	CreatedAt    time.Time `json:"created_at" gorm:"column:created_at"`
}

func (Product) TableName() string {
	return "products"
}
