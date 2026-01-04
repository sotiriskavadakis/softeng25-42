package auth

import (
	"errors"
	"os"
	"time"

	"softeng25-42/back-end/internal/models"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID uint   `json:"uid"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

func secret() (string, error) {
	s := os.Getenv("JWT_SECRET")
	if s == "" {
		return "", errors.New("JWT_SECRET is not set")
	}
	return s, nil
}

func GenerateToken(user models.User, ttl time.Duration) (string, error) {
	s, err := secret()
	if err != nil {
		return "", err
	}

	now := time.Now()
	claims := Claims{
		UserID: user.ID,
		Email:  user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   "user",
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s))
}

func ParseToken(tokenString string) (*Claims, error) {
	s, err := secret()
	if err != nil {
		return nil, err
	}

	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(s), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}
