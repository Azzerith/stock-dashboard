package routes

import (
    "stock-dashboard/controllers"
    "stock-dashboard/middleware"
    "stock-dashboard/websocket"
    
    "github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine, hub *websocket.Hub) {
    r.GET("/health", func(c *gin.Context) {
    c.JSON(200, gin.H{"status": "ok"})
})
    // WebSocket endpoint
    r.GET("/ws", func(c *gin.Context) {
        hub.HandleWebSocket(c)
    })
    
    // Public routes
    api := r.Group("/api")
    {
        api.POST("/login", controllers.Login)
    }
    
    // Protected routes
    protected := api.Group("/")
    protected.Use(middleware.AuthMiddleware())
    {
        // Profile
        protected.GET("/profile", controllers.GetProfile)
        
        // Barang routes
        protected.GET("/barang", controllers.GetBarang)
        protected.GET("/barang/:id", controllers.GetBarangByID)
        protected.POST("/barang", func(c *gin.Context) {
            controllers.CreateBarang(c, hub)
        })
        protected.PUT("/barang/:id", func(c *gin.Context) {
            controllers.UpdateBarang(c, hub)
        })
        protected.DELETE("/barang/:id", func(c *gin.Context) {
            controllers.DeleteBarang(c, hub)
        })
        
        // Transaksi routes
        protected.GET("/transaksi", controllers.GetTransaksi)
        protected.POST("/transaksi", func(c *gin.Context) {
            controllers.CreateTransaksi(c, hub)
        })
        
        // User routes (admin only)
        userRoutes := protected.Group("/users")
        userRoutes.Use(middleware.AdminOnly())
        {
            userRoutes.GET("", controllers.GetUsers)
            userRoutes.POST("", controllers.CreateUser)
            userRoutes.PUT("/:id", controllers.UpdateUser)
            userRoutes.DELETE("/:id", controllers.DeleteUser)
        }
    }
}