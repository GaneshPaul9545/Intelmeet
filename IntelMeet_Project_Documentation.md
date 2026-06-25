# 🧠 IntelMeet — AI-Powered Meeting Platform
**"Revolutionize your meetings with intelligent insights."**

---

## 📄 Documentation Overview
**Project Name:** IntelMeet  
**Tagline:** Bridge the gap between conversation and action.  
**Author:** Ganesh Paul 
**Date:** May 12, 2026  
**Stack:** MERN + AI (Ollama/OpenAI) + WebRTC

---

## 1. Project Overview
### 👁️ Vision & Objectives
IntelMeet was conceived to solve the "Post-Meeting Fatigue" problem. Many professionals spend more time documenting meetings than participating in them. Our objective is to provide a seamless, AI-integrated environment where communication is naturally converted into actionable data.

### 👥 Target Users / Use Cases
- **Corporate Teams:** Remote engineering teams requiring quick standups with automated summaries.
- **Project Managers:** Tracking task progress via an integrated Kanban board directly linked to meeting contexts.
- **Educators:** Recording lectures and providing AI-generated key takeaways for students.

### 💼 Business Value Delivered
- **Time Efficiency:** Reduces manual note-taking time by 80% using automated AI summarization.
- **Accountability:** Built-in task tracking ensures decisions made during meetings are assigned and tracked.
- **Centralized Knowledge:** A single source of truth for recordings, chat logs, and summaries.

### ⚙️ Non-Functional Goals
- **Latency:** Sub-200ms audio/video latency via Peer-to-Peer WebRTC.
- **Concurrency:** Support for up to 50 concurrent participants per room via Socket.io signaling.
- **Availability:** 99.9% uptime target using containerized deployments on Render.

---

## 2. Key Features
| ID | Feature | Description | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **F01** | WebRTC Video | High-definition P2P video conferencing. | Stable 30fps stream, <200ms latency, screen share support. |
| **F02** | AI Summary | Automated meeting minutes using LLaMA3/OpenAI. | Structured summary generated within 30s of meeting end. |
| **F03** | Kanban Board | Integrated task management system. | Drag-and-drop support, task-to-meeting linkage. |
| **F04** | Real-time Chat | Persistent chat with @mentions and notifications. | Instant message delivery, push notifications for mentions. |
| **F05** | Meeting Archive | Historical log of recordings and summaries. | Searchable database, secure playback via Cloudinary. |

---

## 3. Technology Stack
| Category | Technology | Rationale / Alternatives |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite 6 | React 19 offers improved hydration; Vite provides ultra-fast HMR compared to Webpack. |
| **Styling** | Tailwind CSS 4 | Zero-runtime CSS with modern utility-first approach. Alternative: CSS Modules. |
| **Backend** | Node.js + Express 5 | Event-driven architecture perfect for real-time signaling. |
| **Database** | MongoDB Atlas | Flexible schema for storing varying meeting metadata and chat logs. |
| **Real-time** | Socket.io + WebRTC | Socket.io for robust signaling; WebRTC for high-performance P2P media. |
| **AI Engine** | Ollama (LLaMA3) | Chosen for data privacy (Local AI). OpenAI used as a high-performance fallback. |
| **Storage** | Cloudinary | Industry standard for secure video/image hosting and transformation. |

---

## 4. Architecture Diagram
```text
      ┌──────────────────┐           ┌──────────────────┐
      │   React Client   │           │   React Client   │
      │    (Frontend)    │           │    (Frontend)    │
      └────────┬─────────┘           └────────┬─────────┘
               │                              │
               │       WebRTC P2P Stream      │
               │◄────────────────────────────►│
               │                              │
      ┌────────▼──────────────────────────────▼────────┐
      │             Socket.io Signaling Server           │
      │                  (Node.js/Express)               │
      └────────┬──────────────────────────────┬────────┘
               │                              │
      ┌────────▼────────┐            ┌────────▼────────┐
      │  MongoDB Atlas  │            │  AI Engine      │
      │  (Data Store)   │            │ (Ollama/OpenAI) │
      └─────────────────┘            └─────────────────┘
```

---

## 5. Detailed Execution Timeline
| Phase | Duration | Deliverables |
| :--- | :--- | :--- |
| **1. Planning** | Day 1-3 | System design, DB schema, UI wireframes in Excalidraw. |
| **2. Foundation** | Day 4-7 | Backend API setup, Auth (JWT/Google), MongoDB connection. |
| **3. Core Media** | Day 8-14 | WebRTC implementation, Socket.io signaling, Screen sharing. |
| **4. AI & Features**| Day 15-21 | Ollama integration, Kanban board, Notification system. |
| **5. Operations** | Day 22-25 | Cloudinary setup, Recording logic, UI polishing. |
| **6. Deployment** | Day 26-30 | CI/CD on Vercel/Render, Load testing, Bug fixes. |

---

## 6. Technical Highlights
### 🔒 Security Measures
- **JWT Authentication:** Stateless auth with secure HTTP-only cookies.
- **Input Sanitization:** Middleware to prevent XSS and NoSQL injection.
- **CORS Policy:** Strict origin filtering to prevent unauthorized API access.
- **Environment Security:** 100% of sensitive keys managed via secure environment variables.

### 🚀 Performance & Scalability
- **P2P Architecture:** WebRTC offloads media processing from the server to clients.
- **Lazy Loading:** Frontend components are code-split to reduce initial bundle size by 40%.
- **Caching:** Implemented basic caching for meeting metadata to reduce DB hits.

### 🧠 Challenges Faced
- **WebRTC Signaling:** Handling ICE candidate exchange across different NATs was complex; solved using robust STUN/TURN server configurations.
- **AI Latency:** Local LLMs (Ollama) can be slow; optimized by implementing a "streaming response" UI to show progress.

---

## 7. Deployment & Operations
- **Frontend:** Hosted on **Vercel** for global CDN performance and automatic preview deployments.
- **Backend:** Hosted on **Render** using a Node.js web service linked to a GitHub repo for CD.
- **Database:** **MongoDB Atlas** (Shared Cluster) with IP whitelisting for security.
- **Monitoring:** Health check endpoints (`/api/health`) and custom logging via `Winston/Logger`.

---

## 8. Visuals
> [!NOTE]
> Below are placeholders for project visuals. In a portfolio PDF, these should be replaced with actual high-quality captures.

- **[Screenshot: Dashboard]** — Showing recent meetings and analytics.
- **[Screenshot: Meeting Room]** — 4-way video call with active screen share.
- **[Screenshot: AI Summary]** — Beautifully formatted markdown report generated by LLaMA3.
- **[Screenshot: Kanban Board]** — Tasks categorized by meeting context.

---

## 9. Personal Reflection
### 💡 Key Learnings
Building IntelMeet was a masterclass in full-stack orchestration. I learned how to manage complex real-time states in React, handle the nuances of Peer-to-Peer connections, and engineer prompts for reliable AI output. The transition from OpenAI to local LLMs (Ollama) taught me the importance of data privacy in modern software.

### 🏆 Industry Best Practices Applied
- **Modular Codebase:** Separated controllers, services, and routes for scalability.
- **Context API:** Efficient global state management without the overhead of Redux.
- **Atomic Design:** UI components built for maximum reusability.

### 🗺️ Future Roadmap
- **Mobile App:** React Native version for on-the-go meeting participation.
- **AI Sentiment Analysis:** Tracking the emotional tone of meetings to identify friction points.
- **Multi-language Support:** Real-time transcription and translation using Whisper AI.

---
**"Innovation is the bridge between a meeting and a result."**
