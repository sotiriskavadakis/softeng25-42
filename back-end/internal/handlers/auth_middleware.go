package handlers

import (
	"net/http"
	"strings"

	authsvc "softeng25-42/back-end/internal/services/auth"

	"github.com/gin-gonic/gin"
)

const (
	claimsContextKey = "authClaims"
	userIDContextKey = "authUserID"
)

func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			sendError(c, http.StatusUnauthorized, "Unauthorized", "Missing Authorization header")
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			sendError(c, http.StatusUnauthorized, "Unauthorized", "Invalid Authorization header")
			return
		}

		tokenString := strings.TrimSpace(parts[1])
		if tokenString == "" {
			sendError(c, http.StatusUnauthorized, "Unauthorized", "Missing token")
			return
		}

		claims, err := authsvc.ParseToken(tokenString)
		if err != nil {
			sendError(c, http.StatusUnauthorized, "Unauthorized", err.Error())
			return
		}

		c.Set(claimsContextKey, claims)
		c.Set(userIDContextKey, claims.UserID)
		c.Next()
	}
}
