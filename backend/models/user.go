package models

import (
    "time"
    "gorm.io/gorm"
)

type User struct {
    ID        uint           `gorm:"primaryKey" json:"id"`
    Name      string         `gorm:"size:100;not null" json:"name"`
    Username  string         `gorm:"uniqueIndex;size:50;not null" json:"username"`
    Password  string         `gorm:"size:255;not null" json:"-"`
    Role      string         `gorm:"type:enum('admin','operator');default:'operator'" json:"role"`
    CreatedAt time.Time      `json:"created_at"`
    UpdatedAt time.Time      `json:"updated_at"`
    DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
