# API Documentation

## Base URL

```text
/api
```

---

# Authentication

## Register

```http
POST /api/auth/register
```

## Login

```http
POST /api/auth/login
```

## Google Login

```http
POST /api/auth/google
```

---

# Customers

## Get Customers

```http
GET /api/data/customers
```

## Upload Customer CSV

```http
POST /api/data/upload
```

## Update Customer

```http
PUT /api/data/customers/:id
```

## Delete Customer

```http
DELETE /api/data/customers/:id
```

---

# Orders

## Get Orders

```http
GET /api/data/orders
```

## Update Order

```http
PUT /api/data/orders/:id
```

## Delete Order

```http
DELETE /api/data/orders/:id
```

---

# Segments

## Create Segment

```http
POST /api/segments
```

## Get Segments

```http
GET /api/segments
```

## Delete Segment

```http
DELETE /api/segments/:id
```

---

# AI Services

## Generate AI Segment

```http
POST /api/campaigns/ai-segment
```

## Generate AI Campaign

```http
POST /api/campaigns/ai-campaign
```

---

# Campaigns

## Get Campaigns

```http
GET /api/campaigns
```

## Create Campaign

```http
POST /api/campaigns
```

## Launch Campaign

```http
PUT /api/campaigns/:id/launch
```

## Duplicate Campaign

```http
POST /api/campaigns/:id/duplicate
```

## Delete Campaign

```http
DELETE /api/campaigns/:id
```

---

# Analytics

## Get Analytics

```http
GET /api/analytics
```

---

# Webhooks

## Channel Callback

```http
POST /api/webhooks/channel
```

Used by Channel Service to notify CRM about communication events.