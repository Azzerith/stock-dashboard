package controllers

import (
    "net/http"
    "strconv"
    "stock-dashboard/database"
    "stock-dashboard/models"
    "stock-dashboard/websocket"
    
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
)

func GetBarang(c *gin.Context) {
    var barangList []models.Barang
    result := database.DB.Order("created_at DESC").Find(&barangList)
    
    if result.Error != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
        return
    }
    
    c.JSON(http.StatusOK, barangList)
}

func GetBarangByID(c *gin.Context) {
    id, err := strconv.ParseUint(c.Param("id"), 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
        return
    }
    
    var barang models.Barang
    result := database.DB.First(&barang, uint(id))
    if result.Error != nil {
        if result.Error == gorm.ErrRecordNotFound {
            c.JSON(http.StatusNotFound, gin.H{"error": "Barang not found"})
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
        }
        return
    }
    
    c.JSON(http.StatusOK, barang)
}

func CreateBarang(c *gin.Context, hub *websocket.Hub) {
    var req models.BarangRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    barang := models.Barang{
        Kode:      req.Kode,
        Nama:      req.Nama,
        Stok:      req.Stok,
        LokasiRak: req.LokasiRak,
    }
    
    result := database.DB.Create(&barang)
    if result.Error != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
        return
    }
    
    // Broadcast via WebSocket
    if hub != nil {
        hub.BroadcastMessage(websocket.Message{
            Type:    "barang_created",
            Payload: barang,
        })
    }
    
    c.JSON(http.StatusCreated, barang)
}

func UpdateBarang(c *gin.Context, hub *websocket.Hub) {
    id, err := strconv.ParseUint(c.Param("id"), 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
        return
    }
    
    var req models.BarangRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    var barang models.Barang
    result := database.DB.First(&barang, uint(id))
    if result.Error != nil {
        if result.Error == gorm.ErrRecordNotFound {
            c.JSON(http.StatusNotFound, gin.H{"error": "Barang not found"})
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
        }
        return
    }
    
    barang.Kode = req.Kode
    barang.Nama = req.Nama
    barang.Stok = req.Stok
    barang.LokasiRak = req.LokasiRak
    
    database.DB.Save(&barang)
    
    // Broadcast via WebSocket
    if hub != nil {
        hub.BroadcastMessage(websocket.Message{
            Type:    "barang_updated",
            Payload: barang,
        })
    }
    
    c.JSON(http.StatusOK, barang)
}

func DeleteBarang(c *gin.Context, hub *websocket.Hub) {
    id, err := strconv.ParseUint(c.Param("id"), 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
        return
    }
    
    result := database.DB.Delete(&models.Barang{}, uint(id))
    if result.Error != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
        return
    }
    
    if result.RowsAffected == 0 {
        c.JSON(http.StatusNotFound, gin.H{"error": "Barang not found"})
        return
    }
    
    // Broadcast via WebSocket
    if hub != nil {
        hub.BroadcastMessage(websocket.Message{
            Type:    "barang_deleted",
            Payload: id,
        })
    }
    
    c.JSON(http.StatusOK, gin.H{"message": "Barang deleted successfully"})
}