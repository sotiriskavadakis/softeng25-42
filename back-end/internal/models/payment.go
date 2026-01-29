package models

type CreatePaymentRequest struct {
    Amount      int64  `json:"amount"`       // Amount in cents
}

type CreatePaymentResponse struct {
    CheckoutURL string `json:"checkout_url"` 
    PaymentIntentID string `json:"payment_intent_id"`
}