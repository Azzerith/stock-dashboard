package controllers

import (
    "errors"
    "net/http"
    "stock-dashboard/database"
    "stock-dashboard/models"
    "stock-dashboard/websocket"
    
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
    "gorm.io/gorm/clause"
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
    
    // Gunakan transaction untuk handle race condition
    err := database.DB.Transaction(func(tx *gorm.DB) error {
        // Lock row untuk update (FOR UPDATE)
        var barang models.Barang
        if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&barang, req.IDBarang).Error; err != nil {
            return err
        }
        
        // Update stok
        if req.TipeTransaksi == "masuk" {
            barang.Stok += req.Jumlah
        } else if req.TipeTransaksi == "keluar" {
            if barang.Stok < req.Jumlah {
                return errors.New("stok tidak mencukupi")
            }
            barang.Stok -= req.Jumlah
        } else {
            return errors.New("tipe transaksi tidak valid")
        }
        
        // Save updated barang
        if err := tx.Save(&barang).Error; err != nil {
            return err
        }
        
        // Create transaksi record
        transaksi := models.Transaksi{
            IDBarang:      req.IDBarang,
            TipeTransaksi: req.TipeTransaksi,
            Jumlah:        req.Jumlah,
            IDUser:        req.IDUser,
        }
        
        if err := tx.Create(&transaksi).Error; err != nil {
            return err
        }
        
        updatedBarang = barang
        return nil
    })
    
    if err != nil {
        if err.Error() == "stok tidak mencukupi" {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
        }
        return
    }
    
    // Broadcast via WebSocket
    if hub != nil {
        hub.BroadcastMessage(websocket.Message{
            Type: "stock_updated",
            Payload: gin.H{
                "barang": updatedBarang,
                "message": "Stok berhasil diupdate",
            },
        })
    }
    
    c.JSON(http.StatusOK, gin.H{
        "message": "Transaksi berhasil",
        "barang": updatedBarang,
    })
}