require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Route imports
const authRoutes = require('./routes/authRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const taskRoutes = require('./routes/taskRoutes');
const summaryRoutes = require('./routes/summaryRoutes');
const userRoutes = require('./routes/userRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const recordingRoutes = require('./routes/recordingRoutes');
const aiRoutes = require('./routes/aiRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const Meeting = require('./models/Meeting');
const logger = require('./utils/logger');
const { createAndEmitNotification } = require('./controllers/notificationController');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers
app.use(helmet());

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per 15 minutes
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'https://intelmeet.vercel.app', // Add your actual Vercel URL here if known
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin matches allowed origins or is a vercel/railway deploy
    const isAllowed = allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.railway.app') || origin.endsWith('.onrender.com');
    if (isAllowed) {
      return callback(null, true);
    } else {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/summaries', summaryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/recordings', recordingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'IntelliMeet Backend is running.' });
});

// HTTP + Socket.io Server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.railway.app') || origin.endsWith('.onrender.com');
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Expose io globally so other modules (e.g. taskController) can emit events
app.set('io', null); // will be set after server starts

// ==========================================
// WebRTC Signaling + Room Management
// ==========================================
const rooms = new Map(); // roomId -> Map<socketId, { userId, userName, isAudioEnabled, isVideoEnabled }>

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  // ---- Personal Notification Room ----
  // Client should emit 'register-user' with their userId right after connecting
  socket.on('register-user', (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
      logger.info(`Socket ${socket.id} registered for user:${userId}`);
    }
  });

  // Join a meeting room
  socket.on('join-room', (roomId, userData) => {
    const { userId, userName, isAudioEnabled, isVideoEnabled } = userData || {};
    socket.join(roomId);

    // Initialize room if doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }

    const room = rooms.get(roomId);
    room.set(socket.id, {
      userId: userId || socket.id,
      userName: userName || 'Guest',
      isAudioEnabled: isAudioEnabled ?? true,
      isVideoEnabled: isVideoEnabled ?? true
    });

    // Notify existing participants about new user
    socket.to(roomId).emit('user-connected', {
      socketId: socket.id,
      userId: userId || socket.id,
      userName: userName || 'Guest',
      isAudioEnabled: isAudioEnabled ?? true,
      isVideoEnabled: isVideoEnabled ?? true
    });

    // Send current participants list to the new user
    const participants = [];
    room.forEach((data, sid) => {
      if (sid !== socket.id) {
        participants.push({ socketId: sid, ...data });
      }
    });
    socket.emit('existing-participants', participants);

    console.log(`User ${userName || socket.id} joined room ${roomId}. Total: ${room.size}`);

    // ---- WebRTC Signaling ----

    // Relay offer to a specific peer
    socket.on('offer', ({ to, offer }) => {
      socket.to(to).emit('offer', {
        from: socket.id,
        offer
      });
    });

    // Relay answer to a specific peer
    socket.on('answer', ({ to, answer }) => {
      socket.to(to).emit('answer', {
        from: socket.id,
        answer
      });
    });

    // Relay ICE candidate to a specific peer
    socket.on('ice-candidate', ({ to, candidate }) => {
      socket.to(to).emit('ice-candidate', {
        from: socket.id,
        candidate
      });
    });

    // ---- Media State Changes ----

    socket.on('toggle-audio', (isEnabled) => {
      if (room.has(socket.id)) {
        room.get(socket.id).isAudioEnabled = isEnabled;
      }
      socket.to(roomId).emit('peer-audio-toggle', {
        socketId: socket.id,
        isAudioEnabled: isEnabled
      });
    });

    socket.on('toggle-video', (isEnabled) => {
      if (room.has(socket.id)) {
        room.get(socket.id).isVideoEnabled = isEnabled;
      }
      socket.to(roomId).emit('peer-video-toggle', {
        socketId: socket.id,
        isVideoEnabled: isEnabled
      });
    });

    // ---- Screen Sharing ----

    socket.on('screen-share-started', () => {
      socket.to(roomId).emit('peer-screen-share-started', {
        socketId: socket.id,
        userName: room.get(socket.id)?.userName || 'Guest'
      });
    });

    socket.on('screen-share-stopped', () => {
      socket.to(roomId).emit('peer-screen-share-stopped', {
        socketId: socket.id
      });
    });

    // ---- In-Call Chat ----

    socket.on('send-message', async (data) => {
      socket.to(roomId).emit('receive-message', {
        ...data,
        socketId: socket.id,
        isMine: false
      });
      
      // Handle mentions
      try {
        const roomState = rooms.get(roomId);
        const userData = roomState?.get(socket.id);
        const text = data.text || '';
        
        // Very basic mention detection: check if text contains @UserName
        if (roomState && text.includes('@')) {
          for (const [sid, participant] of roomState.entries()) {
            // Don't notify self
            if (sid === socket.id) continue;
            
            if (participant.userName && text.includes(`@${participant.userName}`)) {
              await createAndEmitNotification(app.get('io'), {
                userId: participant.userId,
                type: 'mention',
                message: `${userData?.userName || 'Someone'} mentioned you in a meeting chat`,
                link: `/meeting/${roomId}`,
                triggeredBy: userData?.userId
              });
            }
          }
        }
      } catch (err) {
        logger.error('Error handling mention notification:', err);
      }
      
      // Save chat history to MongoDB
      try {
        const roomState = rooms.get(roomId);
        const userData = roomState?.get(socket.id);
        if (roomId && Meeting.isValidObjectId?.(roomId) || /^[0-9a-fA-F]{24}$/.test(roomId)) {
           await Meeting.findByIdAndUpdate(roomId, {
             $push: {
               chatHistory: {
                 sender: data.sender || userData?.userName || 'Guest',
                 text: data.text,
                 time: data.time || new Date().toLocaleTimeString(),
                 senderId: userData?.userId
               }
             }
           });
        } else {
           // Might be a meeting code instead of ID
           await Meeting.findOneAndUpdate({ meetingCode: roomId }, {
             $push: {
               chatHistory: {
                 sender: data.sender || userData?.userName || 'Guest',
                 text: data.text,
                 time: data.time || new Date().toLocaleTimeString(),
                 senderId: userData?.userId
               }
             }
           });
        }
      } catch (err) {
        logger.error('Error saving chat message to DB:', err);
      }
    });

    // ---- Meeting Notes (for AI summary) ----

    socket.on('meeting-notes', (notes) => {
      // Broadcast notes update to all in room
      socket.to(roomId).emit('meeting-notes-updated', {
        socketId: socket.id,
        notes
      });
    });

    // ---- Disconnect ----

    socket.on('disconnect', () => {
      if (rooms.has(roomId)) {
        const room = rooms.get(roomId);
        const userData = room.get(socket.id);
        room.delete(socket.id);

        socket.to(roomId).emit('user-disconnected', {
          socketId: socket.id,
          userId: userData?.userId,
          userName: userData?.userName
        });

        logger.info(`User ${userData?.userName || socket.id} left room ${roomId}. Remaining: ${room.size}`);

        // Clean up empty rooms
        if (room.size === 0) {
          rooms.delete(roomId);
          logger.info(`Room ${roomId} deleted (empty)`);
        }
      }
    });
  });
});

// Generate unique meeting code
app.get('/api/generate-meeting-code', (req, res) => {
  const code = uuidv4().split('-').slice(0, 3).join('-');
  res.json({ code });
});

// MongoDB Connection
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  logger.error('MONGODB_URI is not set. Add it in Render Environment or backend/.env');
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => {
    logger.info('Connected to MongoDB');
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      app.set('io', io);
    });
  })
  .catch((err) => {
    logger.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
