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
    
    Barang *Barang `gorm:"foreignKey:IDBarang" json:"barang,omitempty"`
    User   *User   `gorm:"foreignKey:IDUser" json:"user,omitempty"`
}

type TransaksiRequest struct {
    IDBarang      uint   `json:"id_barang" binding:"required"`
    TipeTransaksi string `json:"tipe_transaksi" binding:"required,oneof=masuk keluar"`
    Jumlah        int    `json:"jumlah" binding:"required,min=1"`
    IDUser        uint   `json:"id_user" binding:"required"`
}