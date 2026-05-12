# IntelliMeet - AI-Powered Meeting Platform

A full-stack web application for real-time meetings with AI summaries, task management, and analytics.

## Features

✅ **Authentication System** - User registration and login with JWT
✅ **Real-Time Meetings** - Create and join meetings with Socket.io
✅ **Meeting Management** - Schedule, update, and delete meetings
✅ **Task Management** - Create, update, and manage tasks with status tracking
✅ **Meeting Summaries** - Generate and view meeting summaries
✅ **Analytics** - Track meetings, productivity, and engagement
✅ **User Profiles** - Update profile information and preferences
✅ **Responsive Design** - Works on desktop and mobile devices

## Project Structure

```
├── backend/                 # Express.js server
│   ├── controllers/        # Business logic
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API endpoint definitions
│   ├── middleware/        # Auth & other middleware
│   ├── server.js          # Server entry point
│   └── .env               # Environment variables
└── src/                   # React frontend
    ├── pages/             # Page components
    ├── components/        # Reusable components
    ├── context/           # React context (Auth)
    ├── layouts/           # Layout components
    └── App.jsx            # Main app component
```

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (running locally on port 27017)
- npm or yarn

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/intellimeet
JWT_SECRET=intellimeet_super_secret_key_12345
OLLAMA_URL=http://localhost:11434/api/generate
CLOUDINARY_CLOUD_NAME=your_dummy_cloud_name
CLOUDINARY_API_KEY=your_dummy_api_key
CLOUDINARY_API_SECRET=your_dummy_api_secret
```

4. Start the backend server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the project root directory (frontend):
```bash
cd ../  # if you're in backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile
- `POST /api/auth/logout` - Logout user

### Meetings
- `GET /api/meetings` - Get all user meetings
- `POST /api/meetings` - Create a new meeting
- `GET /api/meetings/:id` - Get meeting details
- `PUT /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Delete meeting
- `POST /api/meetings/:id/participants` - Add participant
- `PATCH /api/meetings/:id/status` - Update meeting status

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `PATCH /api/tasks/:id/status` - Update task status
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/assignees` - Add assignee

### Summaries
- `GET /api/summaries` - Get all summaries
- `POST /api/summaries` - Create a new summary
- `GET /api/summaries/:meetingId` - Get summary by meeting ID
- `DELETE /api/summaries/:id` - Delete summary

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/password` - Change password
- `PUT /api/users/preferences` - Update preferences

## Usage

### Creating a Meeting
1. Login to your account
2. Click "Instant Meeting" or go to Meetings section
3. Click "Create Meeting"
4. Enter meeting title and details
5. Share the meeting link with participants

### Joining a Meeting
1. Click the meeting from your recent activity
2. Or use the "Join Meeting" button on home page
3. Enter the meeting ID to join

### Managing Tasks
1. Go to "Tasks" section
2. Click "Add Task" to create a new task
3. Set status (To Do, In Progress, Done)
4. Assign to team members

### Viewing Analytics
1. Go to "Analytics" section
2. View charts for:
   - Meetings per week
   - Productivity overview
   - Engagement rate

## Technology Stack

### Frontend
- React 19
- Vite (build tool)
- React Router DOM (routing)
- Tailwind CSS (styling)
- Lucide React (icons)
- Socket.io Client (real-time)
- Recharts (charts)

### Backend
- Express.js 5 (server framework)
- MongoDB (database)
- Mongoose (ODM)
- JWT (authentication)
- Socket.io (real-time communication)
- Bcrypt (password hashing)

## Development

### Running in Development Mode

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
npm run dev
```

### Building for Production

**Frontend:**
```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

## Testing

1. **Register a new account** on the login page
2. **Create a meeting** from the dashboard
3. **Join the meeting** and test real-time features
4. **Create tasks** and organize them
5. **View analytics** to see statistics
6. **Update profile** in settings

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod` (or `mongod --config /usr/local/etc/mongod.conf` on Mac)
- Check that the MONGODB_URI in `.env` is correct

### CORS Issues
- The backend has CORS enabled for all origins in development
- Update the CORS configuration in `server.js` for production

### Port Already in Use
- Change the PORT in `.env` (default 5000)
- Change the frontend dev server port in `vite.config.js`

### Socket.io Connection Issues
- Ensure the Socket.io URL in frontend matches the backend port
- Check browser console for connection errors

## Future Enhancements

- [ ] WebRTC for video/audio conferencing
- [ ] Meeting recording
- [ ] AI-powered summaries with Ollama
- [ ] Integration with Cloudinary for file uploads
- [ ] Real-time collaboration features
- [ ] Email notifications
- [ ] Calendar integration
- [ ] Mobile app

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT

## Support

For issues or questions, please create an issue in the repository.
