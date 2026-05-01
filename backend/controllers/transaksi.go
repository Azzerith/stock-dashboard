package controllers

import (
	"errors"
	"net/http"
	"stock-dashboard/database"
	"stock-dashboard/models"
	"stock-dashboard/websocket"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func GetTransaksi(c *gin.Context) {
	var transaksiList []models.Transaksi
	result := database.DB.
		Preload("Barang").
		Preload("User").
		Order("created_at DESC").
		Limit(100).
		Find(&transaksiList)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, transaksiList)
}

func CreateTransaksi(c *gin.Context, hub *websocket.Hub) {
	var req models.TransaksiRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var updatedBarang models.Barang
	var transaksi models.Transaksi

	err := database.DB.Transaction(func(tx *gorm.DB) error {

		if req.TipeTransaksi == "masuk" {
			// UPDATE langsung
			result := tx.Exec(`
                UPDATE barangs 
                SET stok = stok + ?, updated_at = NOW() 
                WHERE id = ?
            `, req.Jumlah, req.IDBarang)

			if result.Error != nil {
				return result.Error
			}
			if result.RowsAffected == 0 {
				return errors.New("barang tidak ditemukan")
			}

		} else if req.TipeTransaksi == "keluar" {
			result := tx.Exec(`
                UPDATE barangs 
                SET stok = stok - ?, updated_at = NOW() 
                WHERE id = ? AND stok >= ?
            `, req.Jumlah, req.IDBarang, req.Jumlah)

			if result.Error != nil {
				return result.Error
			}
			if result.RowsAffected == 0 {
				return errors.New("stok tidak mencukupi")
			}

		} else {
			return errors.New("tipe transaksi tidak valid")
		}

		// Ambil data barang terbaru
		if err := tx.Raw("SELECT * FROM barangs WHERE id = ?", req.IDBarang).Scan(&updatedBarang).Error; err != nil {
			return err
		}

		// Catat transaksi
		transaksi = models.Transaksi{
			IDBarang:      req.IDBarang,
			TipeTransaksi: req.TipeTransaksi,
			Jumlah:        req.Jumlah,
			IDUser:        req.IDUser,
		}

		return tx.Create(&transaksi).Error
	})

	if err != nil {
		if err.Error() == "stok tidak mencukupi" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		} else if err.Error() == "barang tidak ditemukan" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		}
		return
	}

	if hub != nil {
		hub.BroadcastMessage(websocket.Message{
			Type: "stock_updated",
			Payload: gin.H{
				"barang":  updatedBarang,
				"message": "Stok berhasil diupdate",
			},
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Transaksi berhasil",
		"barang":  updatedBarang,
	})
}
