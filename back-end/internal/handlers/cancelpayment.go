package handlers

import (
	"net/http"
	"os"
	"softeng25-42/back-end/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/paymentintent"
)

type CancelPaymentRequest struct {
	PaymentIntentID string `json:"payment_intent_id"`
}

// CancelPayment godoc
// @Summary Cancel a previously authorized payment
// @Description Cancels a payment that was previously authorized but not captured.
// @Tags Payments
// @Accept json
// @Produce json
// @Param request body CancelPaymentRequest true "Payment Intent ID to cancel"
// @Success 200 {object} models.StatusResponse "Successfully cancelled payment"
// @Failure 400 {object} ErrorLogResponse "Invalid Request"
// @Failure 500 {object} ErrorLogResponse "Internal Server Error"
// @Router /payment/cancel [post]
func CancelPayment(c *gin.Context) {
	var req CancelPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request", err.Error())
		return
	}
	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")

	pi, err := paymentintent.Cancel(req.PaymentIntentID, nil)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to cancel payment", err.Error())
		return
	}

	c.JSON(http.StatusOK, models.StatusResponse{
		Status: "canceled",
		Data:   pi,
	})
}
