package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// Error response body for all API responses as specified in the PDF
type ErrorLogResponse struct {
	Call       string `json:"call"`
	TimeRef    string `json:"timeref"`
	Originator string `json:"originator"`
	ReturnCode int    `json:"return_code"`
	Error      string `json:"error"`
	DebugInfo  string `json:"debuginfo"`
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
