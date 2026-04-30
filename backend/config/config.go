package config

import (
    "os"
    "log"
    "github.com/joho/godotenv"
)

type Config struct {
    DBUser     string
    DBPassword string
    DBHost     string
    DBPort     string
    DBName     string
    JWTSecret  string
    Port       string
}

var AppConfig *Config

func LoadConfig() {
    err := godotenv.Load()
    if err != nil {
        log.Println("Warning: .env file not found, using environment variables")
    }

    AppConfig = &Config{
        DBUser:     getEnv("DB_USER", "root"),
        DBPassword: getEnv("DB_PASSWORD", "password"),
        DBHost:     getEnv("DB_HOST", "localhost"),
        DBPort:     getEnv("DB_PORT", "3306"),
        DBName:     getEnv("DB_NAME", "stock_db"),
        JWTSecret:  getEnv("JWT_SECRET", "default-secret-key"),
        Port:       getEnv("PORT", "8080"),
    }
}

func getEnv(key, defaultValue string) string {
    if value, exists := os.LookupEnv(key); exists {
        if value == "" && key != "DB_PASSWORD" {
        }
        return value
    }
    return defaultValue
}