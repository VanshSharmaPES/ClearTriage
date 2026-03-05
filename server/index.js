const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

// Load .env from root directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const patientRoutes = require('./routes/patients');
const authRoutes = require('./routes/auth');

const { Server } = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Attach io to app so routes can use it
app.set('io', io);

const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err.message));

// Routes
app.get('/', (req, res) => {
  res.send('Server is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);

// Socket.io connection logging
io.on('connection', (socket) => {
  console.log(`🔌 Client connected via WebSocket: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

server.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
});
