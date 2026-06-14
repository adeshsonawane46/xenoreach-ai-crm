# XenoReach AI CRM

An AI-native marketing CRM built using the MERN stack that helps marketers identify target audiences, generate personalized campaigns, simulate multi-channel communication workflows, and derive actionable insights through AI-powered recommendations and analytics.

The platform combines customer management, audience segmentation, campaign orchestration, communication simulation, analytics processing, and AI-assisted decision-making into a single intelligent marketing workspace.

---

# Live Demo

| Service              | URL                                           |
| -------------------- | --------------------------------------------- |
| Frontend Application | https://xenoreach-ai-crm.vercel.app           |
| Backend API          | https://xenoreach-ai-crm.onrender.com         |
| Channel Service      | https://xenoreach-ai-crm-1.onrender.com       |

---

# Repositories

| Repository                 | Link                                                                          |
| -------------------------- | ----------------------------------------------------------------------------- |
| Main Project Repository    | https://github.com/adeshsonawane46/xenoreach-ai-crm                           |
| Frontend Repository        | https://github.com/adeshsonawane46/xenoreach-ai-crm/tree/main/frontend        | 
| Backend Repository         | https://github.com/adeshsonawane46/xenoreach-ai-crm/tree/main/backend         |
| Channel Service Repository | https://github.com/adeshsonawane46/xenoreach-ai-crm/tree/main/channel-service |

---

# Why XenoReach AI?

Modern marketing teams often face challenges such as:

* Identifying the right audience for a campaign
* Choosing the most effective communication channel
* Crafting personalized marketing messages
* Tracking customer engagement across channels
* Measuring campaign effectiveness and ROI

XenoReach AI addresses these challenges through AI-assisted segmentation, intelligent campaign generation, communication simulation, real-time analytics, and actionable AI insights.

---

# Overview

XenoReach AI CRM is designed to help marketers:

* Understand customer behavior
* Build targeted audience segments
* Generate personalized campaigns
* Simulate real-world communication workflows
* Track customer engagement
* Analyze campaign performance
* Optimize marketing decisions using AI

The platform follows an AI-first approach where AI assists marketers in audience discovery, campaign planning, message creation, and performance analysis.

---

# Features

## Customer & Data Management

* Customer Management
* Order Management
* CSV Customer Import
* Customer Data Center
* Demo Data Generation

## Audience Segmentation

* Rule-Based Segment Builder
* Dynamic Audience Creation
* Customer Filtering
* Segment Insights
* AI-Assisted Segmentation

## AI Campaign Management

* AI Campaign Wizard
* Campaign Strategy Generation
* Channel Recommendations
* Personalized Message Generation
* Campaign Creation & Editing

## Campaign Execution

* Campaign Launch System
* Channel Service Simulation
* Webhook Event Processing
* Real-Time Delivery Tracking

## Analytics & Insights

* Campaign Performance Dashboard
* Conversion Funnel Analysis
* Channel Performance Analytics
* AI Insights Dashboard
* PDF Analytics Export

## Authentication & Security

* User Registration
* User Login
* Google Authentication
* JWT-Based Authorization
* Protected Routes

---

# Tech Stack

## Frontend

* React
* Vite
* React Router
* Axios
* Recharts
* CSS

## Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication

## Services

* Channel Service Microservice
* Webhook Processing
* Analytics Engine

---

# Design Decisions

This project intentionally focuses on:

* AI-assisted audience segmentation
* AI-powered campaign creation
* Event-driven communication tracking
* Webhook-based delivery simulation
* Analytics-driven campaign optimization

Rather than building a traditional sales CRM, the goal was to create an AI-native marketing platform that helps marketers decide:

* Who to target
* What message to send
* Which channel to use
* How campaigns perform over time

The Channel Service was implemented as a separate microservice to closely mimic how real-world messaging providers operate through asynchronous event delivery and webhook callbacks.

---

# System Architecture

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

# Project Structure

```text
xenoreach-ai-crm/

├── README.md
├── ARCHITECTURE.md
├── API_DOCUMENTATION.md
├── SETUP.md
├── screenshots/

├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── context/
│   ├── assets/
│   ├── styles/
│   └── package.json

├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── config/
│   └── server.js

└── channel-service/
    ├── controllers/
    ├── routes/
    ├── services/
    └── server.js
```

---

# Key Workflow

```text
Customer Import
        │
        ▼
Audience Segmentation
        │
        ▼
AI Campaign Generation
        │
        ▼
Campaign Creation
        │
        ▼
Campaign Launch
        │
        ▼
Channel Service Simulation
        │
        ▼
Webhook Events
        │
        ▼
Analytics Processing
        │
        ▼
Dashboard & AI Insights
```

---

# Screenshots

Add screenshots inside the `screenshots` folder:

* dashboard.png
* analytics.png
* ai-insights.png
* campaign-wizard.png
* segment-builder.png
* data-center.png

Example:

```text
screenshots/
├── dashboard.png
├── analytics.png
├── ai-insights.png
├── campaign-wizard.png
├── segment-builder.png
└── data-center.png
```

---

# API Highlights

## Authentication

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/google
```

## Customer Management

```http
GET /api/data/customers
POST /api/data/upload
PUT /api/data/customers/:id
DELETE /api/data/customers/:id
```

## Order Management

```http
GET /api/data/orders
PUT /api/data/orders/:id
DELETE /api/data/orders/:id
```

## Campaign Management

```http
GET /api/campaigns
POST /api/campaigns
PUT /api/campaigns/:id
PUT /api/campaigns/:id/launch
DELETE /api/campaigns/:id
POST /api/campaigns/:id/duplicate
```

## AI Services

```http
POST /api/campaigns/ai-segment
POST /api/campaigns/ai-campaign
```

## Analytics

```http
GET /api/analytics
```

## Webhooks

```http
POST /api/webhooks/channel
```

---

# Project Objective

The objective of XenoReach AI CRM is to provide marketers with an AI-powered platform for customer engagement and campaign management.

The system enables users to:

* Manage customer and order data
* Build intelligent audience segments
* Generate AI-powered marketing campaigns
* Simulate communication delivery workflows
* Track customer engagement events
* Analyze campaign effectiveness
* Generate actionable AI-driven recommendations

The project is built using the MERN stack and follows a microservice-based communication architecture with a dedicated Channel Service responsible for simulating communication events and webhook callbacks.

---

# Future Enhancements

* Multi-Tenant Support
* Advanced Campaign Scheduling
* Multi-Channel Personalization
* Predictive Customer Scoring
* Advanced AI Recommendations
* Real Messaging Provider Integrations (WhatsApp, Email, SMS)

---

# Author

**Adesh Sonawane**