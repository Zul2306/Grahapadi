package models

import "time"

type Barang struct {
	ID            uint      `gorm:"primarykey" json:"id"`
	KodeBarang    string    `gorm:"size:100;not null" json:"kode_barang"`
	NamaBarang    string    `gorm:"size:150;not null" json:"nama_barang"`
	JenisBarang   string    `gorm:"size:50;not null" json:"jenis_barang"` // premium, medium, super
	UkuranKg      float64   `gorm:"type:numeric" json:"ukuran_kg"`
	StokMinimal   int       `gorm:"default:0" json:"stok_minimal"`
	CreatedAt     time.Time `json:"created_at"`
}

func (Barang) TableName() string {
	return "barang"
}
