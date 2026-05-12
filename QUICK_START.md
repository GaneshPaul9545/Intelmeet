# 🚀 Quick Start Guide

## Prerequisites
- Node.js installed (v16+)
- MongoDB installed and running
- npm or yarn

## Installation & Setup (3 Steps)

### Step 1: Install Frontend Dependencies
```bash
npm install
```

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
cd ..
```

### Step 3: Start MongoDB
Make sure MongoDB is running:
```bash
mongod
# Or on Mac: brew services start mongodb-community
```

---

## Running the Application

### Open 2 Terminals

**Terminal 1: Backend Server**
```bash
cd backend
npm start
# Listens on http://localhost:5000
```

**Terminal 2: Frontend App**
```bash
npm run dev
# Opens on http://localhost:5173
```

---

## First Steps After Launch

1. **Register Account**
   - Go to Login page
   - Click "Sign up"
   - Fill in name, email, password
   - Click "Sign Up"

2. **Create Your First Meeting**
   - Click "Instant Meeting" button
   - Choose a meeting title
   - Meeting is created and you can share the link

3. **Explore Features**
   - Dashboard: View your meetings
   - Tasks: Create and manage tasks
   - Analytics: See statistics
   - Settings: Update your profile

---

## Default Test Account (Optional)

To quickly test without registering:
1. Register with: `test@example.com` / `password123`
2. Start using the app immediately

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| MongoDB not connecting | Check if `mongod` is running |
| Port 5000 in use | Change PORT in `backend/.env` |
| Port 5173 in use | Vite will use next available port |
| CORS errors | Ensure backend is running on correct port |
| Socket.io issues | Check browser console for connection errors |

---

## Key Features to Try

🎯 **Instant Meetings** - Create and join meetings instantly
📝 **Task Management** - Create tasks and assign team members
📊 **Analytics** - View meeting statistics and productivity
⚙️ **Settings** - Update profile and preferences
💬 **Real-time Chat** - Socket.io powered messaging in meetings

---

## Important Files & Configs

- `backend/.env` - Backend environment variables
- `vite.config.js` - Frontend build configuration
- `SETUP_GUIDE.md` - Comprehensive setup guide
- `FIXES_SUMMARY.md` - Complete list of fixes

---

## API Documentation

All API endpoints are protected with JWT tokens. After login, your token is automatically stored in localStorage:

```javascript
// Example API call from frontend
fetch('/api/meetings', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
})
```

See `SETUP_GUIDE.md` for complete API documentation.

---

## Need Help?

1. Check `SETUP_GUIDE.md` for detailed documentation
2. Check `FIXES_SUMMARY.md` for what was fixed
3. Look at browser console for error messages
4. Ensure both servers are running in separate terminals

---

**Enjoy IntelliMeet! 🎉**
