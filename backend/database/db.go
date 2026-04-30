package database

import (
    "fmt"
    "log"
    "stock-dashboard/config"
    "stock-dashboard/models"
    
    "gorm.io/driver/mysql"
    "gorm.io/gorm"
    "gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() {
    dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
        config.AppConfig.DBUser,
        config.AppConfig.DBPassword,
        config.AppConfig.DBHost,
        config.AppConfig.DBPort,
        config.AppConfig.DBName,
    )

    var err error
    DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
        Logger: logger.Default.LogMode(logger.Info),
    })
    if err != nil {
        log.Fatal("Failed to connect to database:", err)
    }

    log.Println("Database connected successfully")

    err = DB.AutoMigrate(
        &models.User{},
        &models.Barang{},
        &models.Transaksi{},
    )
    if err != nil {
        log.Fatal("Failed to migrate database:", err)
    }
    
    log.Println("Database migration completed")

    seedData()
}

func seedData() {
    var adminCount int64
    DB.Model(&models.User{}).Where("username = ?", "admin").Count(&adminCount)
    
    if adminCount == 0 {
        admin := models.User{
            Name:     "Administrator",
            Username: "admin",
            Password: "admin123",
            Role:     "admin",
        }
        
        if err := DB.Create(&admin).Error; err != nil {
            log.Println("Failed to create admin:", err)
        } else {
            log.Println("Admin user created - username: admin, password: admin123")
        }
    }
    
    // sample operator
    var operatorCount int64
    DB.Model(&models.User{}).Where("username = ?", "operator").Count(&operatorCount)
    
    if operatorCount == 0 {
        operator := models.User{
            Name:     "Operator User",
            Username: "operator",
            Password: "operator123",
            Role:     "operator",
        }
        
        if err := DB.Create(&operator).Error; err != nil {
            log.Println("Failed to create operator:", err)
        } else {
            log.Println("Operator user created - username: operator, password: operator123")
        }
    }
    
    // sample barang
    var barangCount int64
    DB.Model(&models.Barang{}).Count(&barangCount)
    
    if barangCount == 0 {
        sampleBarang := []models.Barang{
            {Kode: "BRG001", Nama: "Laptop Asus", Stok: 15, LokasiRak: "A-01"},
            {Kode: "BRG002", Nama: "Mouse Logitech", Stok: 8, LokasiRak: "A-02"},
            {Kode: "BRG003", Nama: "Keyboard Mechanical", Stok: 5, LokasiRak: "A-03"},
            {Kode: "BRG004", Nama: "Monitor Samsung", Stok: 12, LokasiRak: "B-01"},
            {Kode: "BRG005", Nama: "Speaker JBL", Stok: 3, LokasiRak: "B-02"},
        }
        
        DB.Create(&sampleBarang)
        log.Println("Sample barang data created")
    }
}