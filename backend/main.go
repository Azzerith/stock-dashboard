package main

import (
    "log"
    "stock-dashboard/config"
    "stock-dashboard/database"
    "stock-dashboard/routes"
    "stock-dashboard/websocket"
    
    "github.com/gin-gonic/gin"
)

func main() {
    // Load configuration
    config.LoadConfig()
    
    // Initialize database
    database.InitDB()
    
    // Initialize WebSocket hub
    hub := websocket.NewHub()
    go hub.Run()
    
    // Setup Gin
    r := gin.Default()

    r.Use(func(c *gin.Context) {
        origin := c.Request.Header.Get("Origin")

        allowedOrigins := []string{
            config.AppConfig.AllowedOrigin,
        }

        allowed := false
        for _, ao := range allowedOrigins {
            if origin == ao {
                allowed = true
                break
            }
        }
        
        if allowed {
            c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
            c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
            c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
            c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")
        } else if origin != "" {
            // Log origin yang tidak dikenal (untuk debugging)
            log.Printf("CORS: Rejected origin: %s", origin)
        }
        
        // Handle preflight request
        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(204)
            return
        }
        
        c.Next()
    })
    
    // Setup routes
    routes.SetupRoutes(r, hub)
    
    // Start server
    log.Printf("Server starting on port %s", config.AppConfig.Port)
    log.Printf("CORS Allowed Origin from config: %s", config.AppConfig.AllowedOrigin)
    r.Run(":" + config.AppConfig.Port)
}