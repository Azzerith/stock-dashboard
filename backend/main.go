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
    
    // CORS middleware
    r.Use(func(c *gin.Context) {
        origin := c.Request.Header.Get("Origin")
        if origin != "" {
            c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
        } else {
            c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
        }
        c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
        c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
        c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")
        
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
    r.Run(":" + config.AppConfig.Port)
}