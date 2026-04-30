package handlers

import (
    "encoding/json"
    "net/http"
    "stock-dashboard/database"
    "stock-dashboard/models"
    "stock-dashboard/websocket"
    "time"
)

func CreateTransaksi(db *gorm.DB, hub *websocket.Hub) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        var transaksi models.Transaksi
        if err := json.NewDecoder(r.Body).Decode(&transaksi); err != nil {
            http.Error(w, err.Error(), http.StatusBadRequest)
            return
        }
        
        transaksi.Tanggal = time.Now()
        
        // Gunakan transaction untuk handle race condition
        err := database.DB.Transaction(func(tx *gorm.DB) error {
            // Lock row untuk update - mencegah race condition
            var barang models.Barang
            if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&barang, transaksi.IDBarang).Error; err != nil {
                return err
            }
            
            // Update stok berdasarkan tipe transaksi
            if transaksi.TipeTransaksi == "masuk" {
                barang.Stok += transaksi.Jumlah
            } else if transaksi.TipeTransaksi == "keluar" {
                if barang.Stok < transaksi.Jumlah {
                    return errors.New("stok tidak mencukupi")
                }
                barang.Stok -= transaksi.Jumlah
            }
            
            // Save updated barang
            if err := tx.Save(&barang).Error; err != nil {
                return err
            }
            
            // Create transaksi record
            if err := tx.Create(&transaksi).Error; err != nil {
                return err
            }
            
            return nil
        })
        
        if err != nil {
            if err.Error() == "stok tidak mencukupi" {
                http.Error(w, err.Error(), http.StatusBadRequest)
            } else {
                http.Error(w, "Internal server error", http.StatusInternalServerError)
            }
            return
        }
        
        // Broadcast ke WebSocket
        hub.BroadcastMessage(websocket.Message{
            Type:    "stock_update",
            Payload: transaksi,
        })
        
        json.NewEncoder(w).Encode(map[string]interface{}{
            "message": "Transaksi berhasil",
            "data": transaksi,
        })
    }
}