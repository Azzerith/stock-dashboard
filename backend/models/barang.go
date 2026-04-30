package models

import (
    "time"
    "gorm.io/gorm"
)

type Barang struct {
    ID        uint           `gorm:"primaryKey" json:"id"`
    Kode      string         `gorm:"uniqueIndex;size:50;not null" json:"kode"`
    Nama      string         `gorm:"size:100;not null" json:"nama"`
    Stok      int            `gorm:"default:0;not null" json:"stok"`
    LokasiRak string         `gorm:"size:50;not null" json:"lokasi_rak"`
    CreatedAt time.Time      `json:"created_at"`
    UpdatedAt time.Time      `json:"updated_at"`
    DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type BarangRequest struct {
    Kode      string `json:"kode" binding:"required"`
    Nama      string `json:"nama" binding:"required"`
    Stok      int    `json:"stok" binding:"min=0"`
    LokasiRak string `json:"lokasi_rak" binding:"required"`
}