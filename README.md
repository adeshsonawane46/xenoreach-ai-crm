# XenoReach AI CRM

An AI-powered marketing CRM built using the MERN stack. The platform enables marketers to manage customer data, build intelligent audience segments, generate personalized campaigns, simulate multi-channel communication, and analyze campaign performance through real-time analytics and AI-driven insights.

## Overview

XenoReach AI CRM is designed to help marketing teams understand their customers, create targeted campaigns, track customer engagement, and optimize marketing performance through data-driven insights.

The system combines customer management, campaign orchestration, communication simulation, analytics processing, and AI-assisted decision-making into a single platform.

## Features

### Customer & Data Management

* Customer Management
* Order Management
* CSV Customer Import
* Customer Data Center
* Demo Data Generation

### Audience Segmentation

* Rule-based Segment Builder
* Dynamic Audience Creation
* Customer Filtering
* Segment Insights

### AI Campaign Management

* AI Campaign Wizard
* Campaign Strategy Generation
* Channel Recommendations
* Personalized Message Generation
* Campaign Creation & Editing

### Campaign Execution

* Campaign Launch System
* Channel Service Simulation
* Webhook Event Processing
* Real-time Delivery Tracking

### Analytics & Insights

* Campaign Performance Dashboard
* Conversion Funnel Analysis
* Channel Performance Analytics
* AI Insights Dashboard
* PDF Analytics Export

### Authentication

* User Registration
* User Login
* Google Authentication
* JWT-based Authorization

## Tech Stack

### Frontend

* React
* Vite
* React Router
* Recharts
* CSS

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication

### Services

* Channel Service Microservice
* Webhook Processing
* Analytics Engine

## System Architecture

```text
React Frontend
        │
        ▼
Express Backend API
        │
        ▼
MongoDB Database

Campaign Launch
        │
        ▼
Channel Service
        │
        ▼
Webhook Callback
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

## Project Structure

```text
xenoreach-ai-crm/

├── README.md
├── ARCHITECTURE.md
├── API_DOCUMENTATION.md
├── SETUP.md
├── screenshots/

├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json

├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── server.js

└── channel-service/
    └── server.js
```

## Key Workflow

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

## Screenshots

Add screenshots inside the `screenshots` folder:

* dashboard.png
* analytics.png
* ai-insights.png
* campaign-wizard.png
* segment-builder.png
* data-center.png

## API Highlights

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/google
```

### Customer Management

```http
GET /api/data/customers
POST /api/data/upload
PUT /api/data/customers/:id
DELETE /api/data/customers/:id
```

### Order Management

```http
GET /api/data/orders
PUT /api/data/orders/:id
DELETE /api/data/orders/:id
```

### Campaign Management

```http
GET /api/campaigns
POST /api/campaigns
PUT /api/campaigns/:id
PUT /api/campaigns/:id/launch
DELETE /api/campaigns/:id
POST /api/campaigns/:id/duplicate
```

### AI Services

```http
POST /api/campaigns/ai-segment
POST /api/campaigns/ai-campaign
```

### Analytics

```http
GET /api/analytics
```

### Webhooks

```http
POST /api/webhooks/channel
```

## Project Objective

The goal of this project was to design and develop an AI-powered marketing CRM that enables businesses to manage customer relationships, create targeted campaigns, simulate multi-channel communication workflows, and gain actionable insights through analytics.

The system was built using the MERN stack with a microservice-based communication architecture and focuses on customer segmentation, campaign automation, engagement tracking, and data-driven decision making.

## Author

**Adesh Sonawane**
