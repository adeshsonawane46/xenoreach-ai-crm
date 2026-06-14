# XenoReach AI CRM - Architecture

## System Overview

XenoReach AI CRM is an AI-native marketing platform that enables marketers to manage customer data, build audience segments, generate AI-powered campaigns, simulate communication delivery, and analyze campaign performance.

---

## High Level Architecture

```text
React Frontend
        │
        ▼
CRM Backend (Express.js)
        │
        ▼
MongoDB Database

Campaign Launch
        │
        ▼
Channel Service (Express.js)
        │
        ▼
Communication Events
        │
        ▼
Webhook Callback API
        │
        ▼
Analytics Engine
        │
        ├────────► Dashboard
        │
        ├────────► Analytics
        │
        └────────► AI Insights
```

---

## Frontend

Technology:
- React
- Vite
- React Router
- Recharts
- CSS

Responsibilities:
- Authentication
- Dashboard
- Data Center
- Segment Builder
- AI Campaign Wizard
- Campaign Management
- Analytics
- AI Insights

---

## CRM Backend

Technology:
- Node.js
- Express.js
- MongoDB
- Mongoose

Responsibilities:
- Authentication
- Customer Management
- Order Management
- Segment Management
- Campaign Management
- Analytics Processing
- Webhook Handling

---

## Channel Service

Technology:
- Node.js
- Express.js

Responsibilities:
- Simulate communication delivery
- Generate communication events
- Send webhook callbacks
- Track communication lifecycle

Supported Events:
- SENT
- DELIVERED
- FAILED
- OPENED
- READ
- CLICKED
- CONVERTED

---

## AI Features

### AI Segment Builder

Input:
"Find inactive premium customers"

Output:
- Segment Rules
- Audience Count
- Matching Customers

### AI Campaign Wizard

Input:
"Create a campaign for customers inactive for 90 days"

Output:
- Audience Recommendation
- Channel Recommendation
- Message Generation
- Campaign Strategy

### AI Insights

Generates:
- Campaign Performance Insights
- Audience Insights
- Channel Recommendations

---

## Communication Flow

```text
Create Campaign
        │
        ▼
Launch Campaign
        │
        ▼
CRM Backend
        │
        ▼
Channel Service
        │
        ▼
Communication Event
        │
        ▼
Webhook Callback
        │
        ▼
CRM Analytics
        │
        ▼
Dashboard Update
```