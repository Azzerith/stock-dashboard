package controllers

import (
    "net/http"
    "strconv"
    "stock-dashboard/database"
    "stock-dashboard/models"
    
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
)

func GetUsers(c *gin.Context) {
    var users []models.User
    result := database.DB.Select("id, name, username, role, created_at, updated_at").Find(&users)
    
    if result.Error != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
        return
    }
    
    c.JSON(http.StatusOK, users)
}

func CreateUser(c *gin.Context) {
    var user models.User
    if err := c.ShouldBindJSON(&user); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    // Validate role
    if user.Role != "admin" && user.Role != "operator" {
        user.Role = "operator"
    }
    
    result := database.DB.Create(&user)
    if result.Error != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
        return
    }
    
    // Don't return password
    user.Password = ""
    c.JSON(http.StatusCreated, user)
}

func UpdateUser(c *gin.Context) {
    id, err := strconv.ParseUint(c.Param("id"), 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
        return
    }
    
    var user models.User
    result := database.DB.First(&user, uint(id))
    if result.Error != nil {
        if result.Error == gorm.ErrRecordNotFound {
            c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
        }
        return
    }
    
    var updateData models.User
    if err := c.ShouldBindJSON(&updateData); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    // Update fields
    if updateData.Name != "" {
        user.Name = updateData.Name
    }
    if updateData.Username != "" {
        user.Username = updateData.Username
    }
    if updateData.Password != "" {
        user.Password = updateData.Password // Will be hashed by BeforeUpdate hook
    }
    if updateData.Role != "" && (updateData.Role == "admin" || updateData.Role == "operator") {
        user.Role = updateData.Role
    }
    
    database.DB.Save(&user)
    
    user.Password = ""
    c.JSON(http.StatusOK, user)
}

func DeleteUser(c *gin.Context) {
    id, err := strconv.ParseUint(c.Param("id"), 10, 32)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
        return
    }
    
    // Prevent deleting admin
    var user models.User
    database.DB.First(&user, uint(id))
    if user.Username == "admin" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete admin user"})
        return
    }
    
    result := database.DB.Delete(&models.User{}, uint(id))
    if result.Error != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
        return
    }
    
    if result.RowsAffected == 0 {
        c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}