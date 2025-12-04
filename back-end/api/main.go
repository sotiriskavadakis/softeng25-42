package main

import (
    "softeng25-42/back-end/database"
    "fmt"
)

func main() {
    fmt.Println("Starting application...")

    // ΑΥΤΗ Η ΓΡΑΜΜΗ φτιάχνει το Schema!
    // Καλεί τη συνάρτηση Connect() που έγραψες στο db.go,
    // η οποία με τη σειρά της τρέχει το AutoMigrate.
    database.Connect() 

    // ... εδώ θα ξεκινάει ο server (π.χ. gin.Run()) ...
}