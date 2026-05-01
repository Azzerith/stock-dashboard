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
    config.LoadConfig()
    database.InitDB()
    
    hub := websocket.NewHub()
    go hub.Run()
    
    r := gin.Default()
    
    r.Use(func(c *gin.Context) {
        // Set allow all origins
        c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
        c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
        c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, Origin, X-Requested-With, Cache-Control")
        
        // Handle preflight request
        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(204)
            return
        }
        
        c.Next()
    })
    
    routes.SetupRoutes(r, hub)
    
    log.Printf("Server starting on port %s (CORS: All origins allowed)", config.AppConfig.Port)
    r.Run(":" + config.AppConfig.Port)
}