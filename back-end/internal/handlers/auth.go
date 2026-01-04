package handlers

import (
	"net/http"
	"time"

	"softeng25-42/back-end/internal/models"
	"softeng25-42/back-end/internal/repository"
	authsvc "softeng25-42/back-end/internal/services/auth"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type RegisterRequest struct {
	Email     string `json:"email" binding:"required"`
	Username  string `json:"username"`
	Password  string `json:"password" binding:"required"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	Token string `json:"token"`
}

func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		sendError(c, http.StatusBadRequest, "Bad Request", err.Error())
		return
	}

	db := repository.DB

	var existing models.User
	err := db.Where("email = ?", req.Email).First(&existing).Error
	if err == nil {
		sendError(c, http.StatusConflict, "Conflict", "Email already registered")
		return
	}
	if err != gorm.ErrRecordNotFound {
		sendError(c, http.StatusInternalServerError, "Database Error", err.Error())
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Crypto Error", err.Error())
		return
	}

	user := models.User{
		Email:        req.Email,
		Username:     req.Username,
		PasswordHash: string(hash),
		FirstName:    req.FirstName,
		LastName:     req.LastName,
	}

	if err := db.Create(&user).Error; err != nil {
		sendError(c, http.StatusInternalServerError, "Database Error", err.Error())
		return
	}

	token, err := authsvc.GenerateToken(user, 24*time.Hour)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Auth Error", err.Error())
		return
	}

	c.JSON(http.StatusOK, AuthResponse{Token: token})
}

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		sendError(c, http.StatusBadRequest, "Bad Request", err.Error())
		return
	}

	db := repository.DB

	var user models.User
	if err := db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		sendError(c, http.StatusUnauthorized, "Unauthorized", "Invalid credentials")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		sendError(c, http.StatusUnauthorized, "Unauthorized", "Invalid credentials")
		return
	}

	token, err := authsvc.GenerateToken(user, 24*time.Hour)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Auth Error", err.Error())
		return
	}

	c.JSON(http.StatusOK, AuthResponse{Token: token})
}
