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

// RegisterRequest represents a user registration request
// @Description Request body for creating a new user account
type RegisterRequest struct {
	// User's email address (must be unique)
	Email string `json:"email" binding:"required" example:"user@example.com"`
	// Username for the account (optional)
	Username string `json:"username" example:"john_doe"`
	// User's password (will be hashed using bcrypt)
	Password string `json:"password" binding:"required" example:"securePassword123"`
	// User's first name (optional)
	FirstName string `json:"first_name" example:"John"`
	// User's last name (optional)
	LastName string `json:"last_name" example:"Doe"`
}

// LoginRequest represents a user login request
// @Description Request body for authenticating a user and obtaining a JWT token
type LoginRequest struct {
	// User's email address registered in the system
	Email string `json:"email" binding:"required" example:"user@example.com"`
	// User's password (will be compared against bcrypt hash)
	Password string `json:"password" binding:"required" example:"securePassword123"`
}

// AuthResponse represents the authentication response
// @Description Response containing a valid JWT token for authenticated requests
type AuthResponse struct {
	// JWT token valid for 24 hours from issuance
	// Use in Authorization header: Bearer <token>
	Token string `json:"token" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
}

// Register godoc
// @Summary Register a new user account
// @Description Creates a new user account with email, password, and optional profile information.
// @Description The password is hashed using bcrypt before storage.
// @Description Returns a valid JWT token that can be used immediately for authenticated requests.
// @Description The token is valid for 24 hours from the time of registration.
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body RegisterRequest true "User registration details"
// @Success 200 {object} AuthResponse "Account successfully created, returns JWT token"
// @Failure 400 {object} ErrorLogResponse "Bad Request - Missing required fields (email or password)"
// @Failure 409 {object} ErrorLogResponse "Conflict - Email address already registered"
// @Failure 500 {object} ErrorLogResponse "Internal Server Error - Password hashing or database error"
// @Router /auth/register [post]
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

// Login godoc
// @Summary Authenticate user and obtain JWT token
// @Description Authenticates a user by verifying email and password against stored credentials.
// @Description The password is verified using bcrypt comparison against the stored hash.
// @Description Upon successful authentication, returns a JWT token valid for 24 hours.
// @Description Token can be used in the Authorization header for authenticated requests.
// @Description Example: Authorization: Bearer <token>
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body LoginRequest true "User login credentials"
// @Success 200 {object} AuthResponse "Authentication successful, returns valid JWT token"
// @Failure 400 {object} ErrorLogResponse "Bad Request - Missing required fields (email or password)"
// @Failure 401 {object} ErrorLogResponse "Unauthorized - Invalid email or password (no user found or password mismatch)"
// @Failure 500 {object} ErrorLogResponse "Internal Server Error - Database error or token generation failure"
// @Router /auth/login [post]
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
