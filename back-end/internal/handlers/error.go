package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// ErrorLogResponse represents the standard error response format for all API errors
// @Description Standard error response body containing details about the error occurrence
type ErrorLogResponse struct {
	// The API endpoint/URL that was called
	Call string `json:"call" example:"/getpoint/123"`
	// Timestamp when the error occurred (format: YYYY-MM-DD HH:MM)
	TimeRef string `json:"timeref" example:"2025-12-25 14:30"`
	// IP address or identifier of the request originator
	Originator string `json:"originator" example:"192.168.1.100"`
	// HTTP status code returned
	ReturnCode int `json:"return_code" example:"404"`
	// Short error title/description
	Error string `json:"error" example:"Not Found"`
	// Detailed debug information about the error
	DebugInfo string `json:"debuginfo" example:"Point with ID 123 not found"`
}

// Helper to format the Error Log exactly as requested [cite: 31, 42]
func sendErrorHTTP(w http.ResponseWriter, r *http.Request, code int, errTitle string, debugInfo string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)

	errResponse := ErrorLogResponse{
		Call:       r.URL.String(),
		TimeRef:    time.Now().Format("2006-01-02 15:04"), // Format requested in PDF
		Originator: r.RemoteAddr,
		ReturnCode: code,
		Error:      errTitle,
		DebugInfo:  debugInfo,
	}

	json.NewEncoder(w).Encode(errResponse)
}

func sendError(c *gin.Context, code int, errTitle string, debugInfo string) {
	errResponse := ErrorLogResponse{
		Call:       c.Request.URL.String(),
		TimeRef:    time.Now().Format("2006-01-02 15:04"),
		Originator: c.ClientIP(), // Gin has a helper for IP!
		ReturnCode: code,
		Error:      errTitle,
		DebugInfo:  debugInfo,
	}

	// AbortWithStatusJSON stops the chain and sends the JSON
	c.AbortWithStatusJSON(code, errResponse)
}
