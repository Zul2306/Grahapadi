package models

import "time"

type User struct {
	ID             uint      `gorm:"primarykey" json:"id"`
	Nama           string    `gorm:"column:nama;size:100;uniqueIndex" json:"nama"`
	Email          string    `gorm:"size:100;uniqueIndex;not null" json:"email"`
	Password       string    `gorm:"size:255" json:"-"`
	NamaLengkap    string    `gorm:"column:nama_lengkap;size:150" json:"nama_lengkap"`
	Role           string    `gorm:"size:20;default:'staff'" json:"role"`
	Status         string    `gorm:"size:20;default:'pending'" json:"status"` // pending, active, inactive
	SetupToken     string    `gorm:"column:setup_token;size:500" json:"-"`
	SetupTokenExp  time.Time `gorm:"column:setup_token_exp" json:"-"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func (User) TableName() string {
	return "users"
}
