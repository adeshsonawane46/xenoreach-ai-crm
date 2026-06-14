# Setup Guide

## Clone Repository

```bash
git clone https://github.com/adeshsonawane46/xenoreach-ai-crm.git
cd xenoreach-ai-crm
```

---

# Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---

# Backend Setup

```bash
cd backend

npm install

npm run dev
```

Backend runs on:

```text
http://localhost:5000
```

---

# Channel Service Setup

```bash
cd channel-service

npm install

npm run dev
```

Channel Service runs on:

```text
http://localhost:5001
```

---

# Environment Variables

Create .env file inside backend.

Example:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

GOOGLE_CLIENT_ID=your_google_client_id

GOOGLE_CLIENT_SECRET=your_google_client_secret

GEMINI_API_KEY=your_gemini_api_key

CHANNEL_SERVICE_URL=http://localhost:5001
```

---

# Build Frontend

```bash
npm run build
```

---

# Deployment

Frontend:
- Vercel

Backend:
- Render

Channel Service:
- Render

Database:
- MongoDB Atlas