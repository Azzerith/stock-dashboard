package models

import (
    "time"
    "stock-dashboard/utils"
    
    "gorm.io/gorm"
)

type User struct {
    ID        uint           `gorm:"primaryKey" json:"id"`
    Name      string         `gorm:"size:100;not null" json:"name"`
    Username  string         `gorm:"uniqueIndex;size:50;not null" json:"username"`
    Password  string         `gorm:"size:255;not null" json:"-"` // Hide password from JSON
    Role      string         `gorm:"type:enum('admin','operator');default:'operator'" json:"role"`
    CreatedAt time.Time      `json:"created_at"`
    UpdatedAt time.Time      `json:"updated_at"`
    DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// Hash password before create/update
func (u *User) BeforeCreate(tx *gorm.DB) error {
    if u.Password != "" {
        hashed, err := utils.HashPassword(u.Password)
        if err != nil {
            return err
        }
        u.Password = hashed
    }
    return nil
}

func (u *User) BeforeUpdate(tx *gorm.DB) error {
    // Only hash password if it's being changed
    if tx.Statement.Changed("Password") && u.Password != "" {
        hashed, err := utils.HashPassword(u.Password)
        if err != nil {
            return err
        }
        u.Password = hashed
    }
    return nil
}

type LoginRequest struct {
    Username string `json:"username" binding:"required"`
    Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
    Token string `json:"token"`
    User  User   `json:"user"`
}