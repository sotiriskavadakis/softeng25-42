-- Περιφέρεια
CREATE TABLE IF NOT EXISTS region (
    name VARCHAR(50) PRIMARY KEY,
);

-- Νομός 
CREATE TABLE IF NOT EXISTS county (
    name VARCHAR(50) PRIMARY KEY,
    region_name VARCHAR(50),
    FOREIGN KEY (region_name) REFERENCES region(name) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS charger (
    charger_id SERIAL PRIMARY KEY,
    county_name VARCHAR(50),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    occupied BOOLEAN NOT NULL DEFAULT FALSE,
    max_charging_time INTERVAL NOT NULL,
    max_wattage_kWh DOUBLE PRECISION NOT NULL,
    location_score INTEGER NOT NULL CHECK (location_score >= 1 AND location_score <= 5),
    FOREIGN KEY (county_name) REFERENCES county(name) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS usr (
    usr_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    birth_date DATE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_method (
    method_name VARCHAR(20) PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS saved_card (
    card_id SERIAL PRIMARY KEY,
    payment_method VARCHAR(20) NOT NULL,
    usr_id INTEGER,
    card_number VARCHAR(16) NOT NULL,
    cardholder_name VARCHAR(100) NOT NULL,
    expiration_date DATE NOT NULL,
    -- CVV isn't stored for security reasons
    FOREIGN KEY (usr_id) REFERENCES usr(usr_id) ON DELETE CASCADE,
    FOREIGN KEY (payment_method) REFERENCES payment_method(method_name) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS charging_session (
    session_id SERIAL PRIMARY KEY,
    usr_id INTEGER,
    charger_id INTEGER,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration INTERVAL,
    total_kWh DOUBLE PRECISION,
    total_cost DOUBLE PRECISION,
    card_id INTEGER,
    FOREIGN KEY (usr_id) REFERENCES usr(usr_id) ON DELETE SET NULL,
    FOREIGN KEY (charger_id) REFERENCES charger(charger_id) ON DELETE SET NULL,
    FOREIGN KEY (card_id) REFERENCES saved_card(card_id) ON DELETE SET NULL
);

-- Need a trigger to check non overlapping reservations when a new one is made
CREATE TABLE IF NOT EXISTS reservation (
    reservation_id SERIAL PRIMARY KEY,
    usr_id INTEGER,
    charger_id INTEGER,
    reservation_time TIMESTAMP NOT NULL,
    duration INTERVAL NOT NULL,
    FOREIGN KEY (usr_id) REFERENCES usr(usr_id) ON DELETE CASCADE,
    FOREIGN KEY (charger_id) REFERENCES charger(charger_id) ON DELETE CASCADE,
);