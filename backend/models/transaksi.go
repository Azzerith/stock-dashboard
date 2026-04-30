package models

import (
    "time"
)

type Transaksi struct {
    ID            uint      `gorm:"primaryKey" json:"id"`
    IDBarang      uint      `gorm:"not null;index" json:"id_barang"`
    Tanggal       time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"tanggal"`
    TipeTransaksi string    `gorm:"type:enum('masuk','keluar');not null" json:"tipe_transaksi"`
    Jumlah        int       `gorm:"not null" json:"jumlah"`
    IDUser        uint      `gorm:"not null;index" json:"id_user"`
    CreatedAt     time.Time `json:"created_at"`
    
    // Relations
    Barang Barang `gorm:"foreignKey:IDBarang" json:"barang,omitempty"`
    User   User   `gorm:"foreignKey:IDUser" json:"user,omitempty"`
}