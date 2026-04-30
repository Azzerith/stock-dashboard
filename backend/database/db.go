package database

import (
    "log"
    "os"
    "stock-dashboard/models"
    "golang.org/x/crypto/bcrypt"
    "gorm.io/driver/mysql"
    "gorm.io/gorm"
    "gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() *gorm.DB {
    dbUser := os.Getenv("DB_USER")
    dbPass := os.Getenv("DB_PASSWORD")
    dbHost := os.Getenv("DB_HOST")
    dbPort := os.Getenv("DB_PORT")
    dbName := os.Getenv("DB_NAME")

    if dbUser == "" {
        dbUser = "root"
    }
    if dbPass == "" {
        dbPass = "password"
    }
    if dbHost == "" {
        dbHost = "localhost"
    }
    if dbPort == "" {
        dbPort = "3306"
    }
    if dbName == "" {
        dbName = "stock_db"
    }

    dsn := dbUser + ":" + dbPass + "@tcp(" + dbHost + ":" + dbPort + ")/" + dbName + "?charset=utf8mb4&parseTime=True&loc=Local"
    
    var err error
    DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
        Logger: logger.Default.LogMode(logger.Info),
    })
    if err != nil {
        log.Fatal("Failed to connect to database:", err)
    }

    // Auto Migrate
    err = DB.AutoMigrate(
        &models.User{},
        &models.Barang{},
        &models.Transaksi{},
    )
    if err != nil {
        log.Fatal("Failed to migrate database:", err)
    }

    log.Println("Database migration completed successfully")

    seedData()
    
    return DB
}

func seedData() {
    // Check if admin exists
    var adminCount int64
    DB.Model(&models.User{}).Where("username = ?", "admin").Count(&adminCount)
    
    if adminCount == 0 {
        hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
        
        admin := models.User{
            Name:     "Administrator",
            Username: "admin",
            Password: string(hashedPassword),
            Role:     "admin",
        }
        
        if err := DB.Create(&admin).Error; err != nil {
            log.Println("Failed to create admin user:", err)
        } else {
            log.Println("Admin user created successfully")
        }
    }
    
    // Check if operator exists
    var operatorCount int64
    DB.Model(&models.User{}).Where("username = ?", "operator").Count(&operatorCount)
    
    if operatorCount == 0 {
        hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("operator123"), bcrypt.DefaultCost)
        
        operator := models.User{
            Name:     "Operator User",
            Username: "operator",
            Password: string(hashedPassword),
            Role:     "operator",
        }
        
        if err := DB.Create(&operator).Error; err != nil {
            log.Println("Failed to create operator user:", err)
        } else {
            log.Println("Operator user created successfully")
        }
    }
    
    //sample barang data
    var barangCount int64
    DB.Model(&models.Barang{}).Count(&barangCount)
    
    if barangCount == 0 {
        sampleBarang := []models.Barang{
            {Kode: "BRG001", Nama: "Laptop", Stok: 15, LokasiRak: "A-01"},
            {Kode: "BRG002", Nama: "Mouse", Stok: 8, LokasiRak: "A-02"},
            {Kode: "BRG003", Nama: "Keyboard", Stok: 5, LokasiRak: "A-03"},
            {Kode: "BRG004", Nama: "Monitor", Stok: 12, LokasiRak: "B-01"},
            {Kode: "BRG005", Nama: "Speaker", Stok: 3, LokasiRak: "B-02"},
        }
        
        DB.Create(&sampleBarang)
        log.Println("Sample barang data created")
    }
}