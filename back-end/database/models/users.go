package models

type User struct {
	ID           uint   `gorm:"primaryKey;column:usr_id" json:"id"`
	Email        string `gorm:"uniqueIndex;not null" json:"email"`
	Username     string `json:"username"`
	PasswordHash string `json:"-"` // Security: Never export password hash to JSON
	FirstName    string `json:"first_name"`
	LastName     string `json:"last_name"`

	// Relationships
	SavedCards   []SavedCard       `gorm:"foreignKey:UserID" json:"saved_cards,omitempty"`
	Reservations []Reservation     `gorm:"foreignKey:UserID" json:"reservations,omitempty"`
	Sessions     []ChargingSession `gorm:"foreignKey:UserID" json:"sessions,omitempty"`
}

type PaymentMethod struct {
    MethodName string `gorm:"primaryKey" json:"method_name"`
    // Even if this is empty now, having the relationship established above 
    // protects you if you add fields here later (like an icon).
}

type SavedCard struct {
    ID     uint `gorm:"primaryKey;column:card_id" json:"id"`
    UserID uint `gorm:"column:usr_id" json:"user_id"`

    // Κράτα μόνο το foreignKey εδώ.
    // Το GORM θα καταλάβει αυτόματα ότι το 'MethodName' (string) 
    // αναφέρεται στο Primary Key του PaymentMethod struct.
    MethodName string `json:"method_name"` 

    PaymentMethod PaymentMethod `gorm:"foreignKey:MethodName" json:"-"`

    Last4 string `gorm:"column:last_4_digits" json:"last_4"`
    Token string `json:"-"` 
}