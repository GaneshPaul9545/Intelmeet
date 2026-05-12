# 🧠 IntelMeet — AI-Powered Meeting Platform

> **Revolutionize your meetings.** IntelMeet combines real-time video conferencing with AI-driven intelligence to transform conversations into actionable insights. Think Zoom's reliability meets Notion's organization, powered by Local AI.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js&style=flat-square)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-blue?logo=react&style=flat-square)](https://reactjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen?logo=mongodb&style=flat-square)](https://www.mongodb.com)
[![Express](https://img.shields.io/badge/Express-5-lightgrey?logo=express&style=flat-square)](https://expressjs.com)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

---

## ✨ Key Features

### 🎥 Real-Time Video Excellence
- **Peer-to-Peer Video**: Ultra-low latency WebRTC-based conferencing.
- **Smart Screen Share**: High-definition sharing for presentations.
- **Interactive Chat**: Real-time messaging powered by Socket.io.
- **Global Access**: Instant room entry via unique meeting codes.

### 🤖 AI Intelligence (Local & Cloud)
- **Auto-Summarization**: Instantly generate structured meeting minutes using **Ollama (LLaMA3)**.
- **Action Item Extraction**: AI identifies tasks and decisions so you don't have to.
- **Hybrid AI Support**: Seamless fallback to OpenAI when local LLMs are unavailable.
- **Exportable Insights**: Download summaries as professional reports.

### 📋 Agile Project Management
- **Integrated Kanban**: Dynamic boards to track `To Do`, `In Progress`, and `Done`.
- **Contextual Tasks**: Tasks are linked directly to the meetings where they were created.
- **Drag-and-Drop**: Smooth UI for intuitive workflow management.

### 📊 Insightful Analytics
- **Performance Metrics**: Track meeting frequency, duration, and participant engagement.
- **Visual Data**: Beautifully rendered charts using **Recharts**.
- **Historical Log**: A searchable archive of every meeting and its outcome.

---

## 🛠 Modern Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite 6, Tailwind CSS 4, Lucide Icons |
| **Backend** | Node.js, Express 5, Socket.io 4 |
| **Database** | MongoDB (Mongoose 9) |
| **AI Engine** | Ollama (Local LLaMA3) / OpenAI API |
| **Auth** | JWT, Passport.js, Google OAuth 2.0 |
| **Storage** | Cloudinary (Recordings), Multer |
| **Communication** | Nodemailer (SMTP), WebRTC |

---

## 📁 Repository Structure

```text
IntelMeet/
├── backend/                # Node.js + Express API
│   ├── controllers/        # Business logic for auth, meetings, AI, etc.
│   ├── models/             # Mongoose schemas (User, Meeting, Task)
│   ├── routes/             # API endpoints
│   ├── services/           # AI & Third-party integrations
│   └── server.js           # Entry point
├── frontend/               # React + Vite Application
│   ├── src/
│   │   ├── components/     # Atomic UI components
│   │   ├── context/        # Global state (Auth, Theme, Toast)
│   │   ├── pages/          # Full-page views
│   │   └── hooks/          # Custom business logic hooks
│   └── vite.config.js
├── .gitignore              # Secure file exclusions
└── docker-compose.yml      # Containerized deployment
```

---

## 🚀 Quick Start Guide

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/IntelMeet.git
cd IntelMeet
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment Setup
Create a `.env` file in the `backend/` directory based on `.env.example`:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_secret
FRONTEND_URL=http://localhost:5173
```

### 3. Launch Development
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

---

## ☁️ Deployment

### 🎨 Frontend (Vercel)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Root Directory:** `frontend`

### ⚙️ Backend (Render)
- **Build Command:** `npm install`
- **Start Command:** `node server.js`
- **Root Directory:** `backend`

---

## 📄 License
Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 🤝 Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---
Built with ❤️ by [Ganesh Paul](https://github.com/GaneshPaul9545)