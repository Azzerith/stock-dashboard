package controllers

import (
    "net/http"
    "stock-dashboard/database"
    "stock-dashboard/models"
    "stock-dashboard/utils"
    
    "github.com/gin-gonic/gin"
)

func Login(c *gin.Context) {
    var req models.LoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    // Find user by username
    var user models.User
    result := database.DB.Where("username = ?", req.Username).First(&user)
    if result.Error != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
        return
    }
    
    // Check password
    if !utils.CheckPasswordHash(req.Password, user.Password) {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
        return
    }
    
    // Generate token
    token, err := utils.GenerateToken(user.ID, user.Username, user.Role)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
        return
    }
    
    // Return response without password
    user.Password = ""
    
    c.JSON(http.StatusOK, models.LoginResponse{
        Token: token,
        User:  user,
    })
}

func GetProfile(c *gin.Context) {
    userID := c.GetUint("user_id")
    
    var user models.User
    result := database.DB.First(&user, userID)
    if result.Error != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
        return
    }
    
    user.Password = ""
    c.JSON(http.StatusOK, user)
}