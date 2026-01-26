package handlers

import (
	"net/http"
	"os"

	"softeng25-42/back-end/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/checkout/session"
)

// CreatePaymentSession godoc
// @Summary Create a Stripe Payment Session
// @Description Initiates a checkout session for an EV charging transaction.
// @Description Returns a URL to redirect the user to the Stripe hosted payment page.
// @Tags Payments
// @Accept json
// @Produce json
// @Param request body models.CreatePaymentRequest true "Payment Amount (in cents)"
// @Success 200 {object} models.CreatePaymentResponse "Successfully created payment session"
// @Failure 400 {object} ErrorLogResponse "Invalid Request - Bad JSON or Amount"
// @Failure 500 {object} ErrorLogResponse "Internal Server Error - Stripe API failure"
// @Router /payment/create-session [post]
func CreatePaymentSession(c *gin.Context) {
	var req models.CreatePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid Request Format", "Could not parse JSON body: "+err.Error())
		return
	}

	if req.Amount <= 0 {
		sendError(c, http.StatusBadRequest, "Invalid Amount", "Amount must be greater than 0")
		return
	}

	stripeKey := os.Getenv("STRIPE_SECRET_KEY")
	domain := os.Getenv("DOMAIN")

	if stripeKey == "" || domain == "" {
		sendError(c, http.StatusInternalServerError, "Configuration Error", "Missing STRIPE_SECRET_KEY or DOMAIN in .env")
		return
	}

	stripe.Key = stripeKey

	params := &stripe.CheckoutSessionParams{
		PaymentMethodTypes: stripe.StringSlice([]string{"card"}),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				PriceData: &stripe.CheckoutSessionLineItemPriceDataParams{
					Currency: stripe.String("eur"),
					ProductData: &stripe.CheckoutSessionLineItemPriceDataProductDataParams{
						Name: stripe.String("EV Charging Session"),
					},
					UnitAmount: stripe.Int64(req.Amount),
				},
				Quantity: stripe.Int64(1),
			},
		},
		Mode:       stripe.String(string(stripe.CheckoutSessionModePayment)),
		SuccessURL: stripe.String(domain + "/success.html"),
		CancelURL:  stripe.String(domain + "/cancel.html"),
	}

	sess, err := session.New(params)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Stripe API Error", "Failed to create session: "+err.Error())
		return
	}

	resp := models.CreatePaymentResponse{
		CheckoutURL: sess.URL,
	}

	c.JSON(http.StatusOK, resp)
}