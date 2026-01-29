package handlers

import (
	"net/http"
	"os"
	"softeng25-42/back-end/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/paymentintent"
)

type CapturePaymentRequest struct {
	PaymentIntentID string `json:"payment_intent_id"`
	Amount          int64  `json:"amount"` // Amount in cents
}

// CapturePayment godoc
// @Summary Capture a previously authorized payment
// @Description Captures a specific amount from a payment that was previously authorized.
// @Tags Payments
// @Accept json
// @Produce json
// @Param request body CapturePaymentRequest true "Payment Intent ID and final amount to capture"
// @Success 200 {object} models.StatusResponse "Successfully captured payment"
// @Failure 400 {object} ErrorLogResponse "Invalid Request"
// @Failure 500 {object} ErrorLogResponse "Internal Server Error"
// @Router /payment/capture [post]
func CapturePayment(c *gin.Context) {
	var req CapturePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}
	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")

	params := &stripe.PaymentIntentCaptureParams{
		AmountToCapture: stripe.Int64(req.Amount),
	}

	pi, err := paymentintent.Capture(req.PaymentIntentID, params)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to capture payment", err.Error())
		return
	}

	c.JSON(http.StatusOK, models.StatusResponse{
		Status: "succeeded",
		Data:   pi,
	})
}
