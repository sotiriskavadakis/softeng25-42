# EV Charging Network API - Complete Reference

**API Version**: 1.0.0  
**Last Updated**: January 5, 2026  
**Base URL**: `http://localhost:9876/api`

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [Base URL & Response Formats](#base-url--response-formats)
4. [Data Formats](#data-formats)
5. [API Endpoints](#api-endpoints)
6. [Error Handling](#error-handling)
7. [Status Values](#status-values)
8. [Examples](#examples)
9. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Register or Login

Get a JWT token first:

```bash
# Register new account
curl -X POST http://localhost:9876/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePass123",
    "username": "john_doe",
    "first_name": "John",
    "last_name": "Doe"
  }'

# Response:
{"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
```

### 2. Use Token for All Requests

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:9876/api/points
```

### 3. Check Health (No Auth Required)

```bash
curl http://localhost:9876/api/admin/healthcheck
```

---

## Authentication

### JWT Bearer Token

All endpoints except `/auth/*` and `/admin/healthcheck` require JWT authentication.

**Token Validity**: 24 hours from issuance

**Usage**:
```
Authorization: Bearer <your_jwt_token>
```

**Token Structure** (decoded):
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "name": "John Doe",
  "iat": 1674321200,
  "exp": 1674407600
}
```

**Security Features**:
- Password hashed with bcrypt (never stored in plain text)
- Tokens are stateless (no session storage)
- No email enumeration (invalid email/password return same error)
- Slow hashing to prevent brute force attacks

---

## Base URL & Response Formats

### Base URL
```
http://localhost:9876/api
```

### Default Format
All responses are in **JSON** format by default.

### CSV Export
Some endpoints support CSV export:
```bash
curl "http://localhost:9876/api/points?format=csv"
curl "http://localhost:9876/api/sessions/123/20250101/20250131?format=csv"
```

---

## Data Formats

### DateTime Format
**Format**: `YYYY-MM-DD HH:MM` (24-hour time)

Examples:
- `2025-12-25 14:30` (2:30 PM Christmas)
- `2026-01-05 04:25` (4:25 AM January 5)

**Timezone**: UTC by default

### Date Format
**Format**: `YYYYMMDD`

Examples:
- `20251225` (December 25, 2025)
- `20260105` (January 5, 2026)

**Usage**: Date range queries (from/to parameters)

### Geographic Coordinates
**Format**: WGS84 decimal degrees

Examples:
- Latitude: `37.9838` (Athens)
- Longitude: `23.7275` (Athens)

### Numeric Precision

| Field | Format | Example | Range |
|-------|--------|---------|-------|
| Price (€/kWh) | 2 decimals | 0.35 | 0.00 - 999.99 |
| Energy (kWh) | 1 decimal | 45.5 | 0.0 - 9999.9 |
| Capacity (kW) | Integer | 22 | 0 - 999 |
| SOC (%) | Integer | 80 | 0 - 100 |

---

## API Endpoints

### Authentication

#### POST /auth/register
Register a new user account

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "username": "john_doe",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors**:
- `400 Bad Request` - Missing required fields
- `409 Conflict` - Email already registered
- `500 Internal Server Error` - Database or hashing error

---

#### POST /auth/login
Authenticate user with email and password

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors**:
- `400 Bad Request` - Missing credentials
- `401 Unauthorized` - Invalid email or password
- `500 Internal Server Error` - Database error

---

### System

#### GET /admin/healthcheck
Check API health and database connectivity (No auth required)

**Response** (200 OK):
```json
{
  "status": "OK",
  "dbconnection": "postgres://user:***@localhost:5432/evcharging",
  "n_charge_points": 1454,
  "n_charge_points_online": 1416,
  "n_charge_points_offline": 38
}
```

**Use Cases**:
- Load balancer health checks
- Deployment verification
- Uptime monitoring

---

### Charging Points

#### GET /points
List all charging points with optional filtering

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status (AVAILABLE, OCCUPIED, RESERVED, FAULTED, OFFLINE) |
| lat | number | Center latitude for radius search |
| lng | number | Center longitude for radius search |
| radius | number | Search radius in kilometers |
| min_lat | number | Min latitude for bounding box |
| max_lat | number | Max latitude for bounding box |
| min_lon | number | Min longitude for bounding box |
| max_lon | number | Max longitude for bounding box |
| format | string | Response format (json or csv) |

**Examples**:
```bash
# All available points
curl "http://localhost:9876/api/points?status=AVAILABLE"

# Points near location (50km radius)
curl "http://localhost:9876/api/points?lat=37.9838&lng=23.7275&radius=50"

# Points in bounding box
curl "http://localhost:9876/api/points?min_lat=37.5&max_lat=38.5&min_lon=23.0&max_lon=24.5"

# Export as CSV
curl "http://localhost:9876/api/points?format=csv"
```

**Response** (200 OK):
```json
[
  {
    "providerName": "EMPower",
    "pointid": "3508687",
    "lon": "24.056048",
    "lat": "37.711387",
    "status": "AVAILABLE",
    "cap": 22
  }
]
```

**Response Codes**:
- `200 OK` - One or more results found
- `204 No Content` - No results matching criteria

---

#### GET /point/{id}
Get detailed information about a specific charging point

**Path Parameters**:
- `id` (required): Charging point ID

**Example**:
```bash
curl http://localhost:9876/api/point/3508687
```

**Response** (200 OK):
```json
{
  "pointid": "3508687",
  "lon": "24.056048",
  "lat": "37.711387",
  "status": "AVAILABLE",
  "cap": 22,
  "reservationendtime": "2026-01-05 04:25",
  "kwhprice": 0.0304,
  "is_manual_price": false
}
```

**Errors**:
- `400 Bad Request` - Invalid point ID format
- `404 Not Found` - Charging point doesn't exist

---

#### GET /pointstatus/{pointid}/{from}/{to}
Get status change history for a charging point

**Path Parameters**:
- `pointid` (required): Charging point ID
- `from` (required): Start date in YYYYMMDD format
- `to` (required): End date in YYYYMMDD format

**Example**:
```bash
# Status changes from Dec 1-25, 2025
curl http://localhost:9876/api/pointstatus/3508687/20251201/20251225
```

**Response** (200 OK):
```json
[
  {
    "timeref": "2025-12-25 14:30",
    "old_state": "AVAILABLE",
    "new_state": "OCCUPIED"
  },
  {
    "timeref": "2025-12-25 15:45",
    "old_state": "OCCUPIED",
    "new_state": "AVAILABLE"
  }
]
```

**Errors**:
- `400 Bad Request` - Invalid date format
- `404 Not Found` - Charging point doesn't exist

---

### Reservations

#### POST /reserve/{id}
Reserve a charging point (30 minutes default)

**Path Parameters**:
- `id` (required): Charging point ID

**Authentication**: Required (JWT token)

**Example**:
```bash
curl -X POST http://localhost:9876/api/reserve/3508687 \
  -H "Authorization: Bearer token123..."
```

**Response** (200 OK):
```json
{
  "pointid": "3508687",
  "status": "RESERVED",
  "reservationendtime": "2026-01-05 05:05"
}
```

**Status Field Values**:
- `RESERVED` - Reservation successful
- `AVAILABLE` / `OCCUPIED` / `FAULTED` / `OFFLINE` - Point not available
- `not_found` - Point doesn't exist

---

#### POST /reserve/{id}/{minutes}
Reserve a charging point with custom duration

**Path Parameters**:
- `id` (required): Charging point ID
- `minutes` (required): Desired duration (15-60 minutes, auto-clamped)

**Duration Clamping**:
- 10 min requested → 15 min reserved (minimum)
- 45 min requested → 45 min reserved (exact)
- 90 min requested → 60 min reserved (maximum)

**Example**:
```bash
curl -X POST http://localhost:9876/api/reserve/3508687/45 \
  -H "Authorization: Bearer token123..."
```

**Race-Condition Guarantee**: Uses database-level row locking to ensure atomic operations.

---

### Point Management

#### POST /updpoint/{id}
Update charging point properties

**Path Parameters**:
- `id` (required): Charging point ID

**Authentication**: Required (JWT token)

**Request Body** (at least one field required):
```json
{
  "status": "AVAILABLE",
  "kwhprice": 0.45,
  "is_manual_price": true
}
```

**Valid Status Values**:
- AVAILABLE, OCCUPIED, RESERVED, FAULTED, OFFLINE

**Response** (200 OK):
```json
{
  "pointid": "3508687",
  "status": "AVAILABLE",
  "kwhprice": 0.45,
  "is_manual_price": true
}
```

**Errors**:
- `400 Bad Request` - Invalid input or no fields provided
- `401 Unauthorized` - Missing/invalid token
- `404 Not Found` - Point doesn't exist

---

### Sessions

#### POST /newsession
Record a new charging session

**Authentication**: Required (JWT token)

**Request Body** (all fields required):
```json
{
  "pointid": "3508687",
  "starttime": "2025-12-25 10:00",
  "endtime": "2025-12-25 11:30",
  "startsoc": 20,
  "endsoc": 80,
  "totalkwh": 45.5,
  "kwhprice": 0.35,
  "amount": 15.93
}
```

**Field Descriptions**:
- `pointid`: Charging point ID
- `starttime`: Session start (YYYY-MM-DD HH:MM)
- `endtime`: Session end (YYYY-MM-DD HH:MM)
- `startsoc`: Battery % at start (0-100)
- `endsoc`: Battery % at end (0-100)
- `totalkwh`: Energy delivered (kWh)
- `kwhprice`: Price per kWh
- `amount`: Total charge amount

**Response** (200 OK):
Empty body (success)

**Errors**:
- `400 Bad Request` - Invalid format or missing fields
- `401 Unauthorized` - Missing/invalid token
- `404 Not Found` - Point doesn't exist

---

#### GET /sessions/{id}/{from}/{to}
Retrieve charging sessions for a point

**Path Parameters**:
- `id` (required): Charging point ID
- `from` (required): Start date (YYYYMMDD)
- `to` (required): End date (YYYYMMDD, inclusive)

**Authentication**: Required (JWT token)

**Example**:
```bash
# Get sessions from Dec 1-25, 2025
curl -H "Authorization: Bearer token123..." \
  http://localhost:9876/api/sessions/3508687/20251201/20251225

# Export as CSV
curl -H "Authorization: Bearer token123..." \
  "http://localhost:9876/api/sessions/3508687/20251201/20251225?format=csv"
```

**Response** (200 OK):
```json
[
  {
    "starttime": "2025-12-25 10:00",
    "endtime": "2025-12-25 11:30",
    "startsoc": 20,
    "endsoc": 80,
    "totalkwh": 45.5,
    "kwhprice": 0.35,
    "amount": 15.93
  }
]
```

**Response Codes**:
- `200 OK` - Sessions found
- `204 No Content` - No sessions in date range

---

## Error Handling

### Error Response Format

All error responses follow this structure:

```json
{
  "error_code": "VALIDATION_ERROR",
  "error_message": "Human-readable error description",
  "timestamp": "2025-12-25 14:30"
}
```

### Error Codes

| Code | HTTP Status | Meaning |
|------|------------|---------|
| VALIDATION_ERROR | 400 | Input validation failed |
| INVALID_REQUEST | 400 | Bad request format |
| INVALID_CREDENTIALS | 401 | Wrong email/password |
| UNAUTHORIZED | 401 | Missing or invalid token |
| DUPLICATE_EMAIL | 409 | Email already registered |
| NOT_FOUND | 404 | Resource doesn't exist |
| DATABASE_ERROR | 500 | Database operation failed |
| INTERNAL_ERROR | 500 | Unexpected server error |

### Error Handling Strategy

1. Check HTTP status code for error category
2. Read error_code for machine-readable identifier
3. Read error_message for human-readable description
4. Implement retries for 500 errors with exponential backoff

---

## Status Values

### Charging Point Status

| Status | Meaning |
|--------|---------|
| AVAILABLE | Ready for charging |
| OCCUPIED | Currently charging |
| RESERVED | Reserved for future use |
| FAULTED | Hardware malfunction detected |
| OFFLINE | Not operational |

---

## Examples

### Complete Workflow

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:9876/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}' \
  | jq -r '.token')

# 2. Find nearby charging points
curl "http://localhost:9876/api/points?lat=37.9838&lng=23.7275&radius=50&status=AVAILABLE" | jq

# 3. Get point details
curl http://localhost:9876/api/point/3508687 | jq

# 4. Reserve a point
curl -X POST http://localhost:9876/api/reserve/3508687/45 \
  -H "Authorization: Bearer $TOKEN" | jq

# 5. Record session
curl -X POST http://localhost:9876/api/newsession \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pointid":"3508687",
    "starttime":"2025-12-25 10:00",
    "endtime":"2025-12-25 11:30",
    "startsoc":20,
    "endsoc":80,
    "totalkwh":45.5,
    "kwhprice":0.35,
    "amount":15.93
  }' | jq

# 6. Get session history
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:9876/api/sessions/3508687/20251201/20251225" | jq
```

---

## Troubleshooting

### "401 Unauthorized"
- Check token is included in Authorization header
- Token format: `Authorization: Bearer <token>`
- Tokens expire after 24 hours
- Get new token via `/auth/login`

### "404 Not Found" on valid point
- Verify point ID is correct
- List available points: `GET /points`
- Point may have been removed from database

### "400 Bad Request"
- Check JSON syntax is valid
- Verify required fields are present
- Check date format (YYYY-MM-DD HH:MM or YYYYMMDD)

### "204 No Content"
- This is NOT an error - no results found matching criteria
- Try broader filters or different date range

### CSV Export Not Working
- Only supported endpoints: /points, /pointstatus, /sessions
- Add query parameter: `?format=csv`

---

## Support

For issues or questions:
- **Email**: support@example.com
- **GitHub**: https://github.com/example/issues
- **Documentation**: See swagger.json or swagger.yaml for complete specification

---

**Last Updated**: January 5, 2026  
**API Version**: 1.0.0
