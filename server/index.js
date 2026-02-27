const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

// Load .env from root directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const patientRoutes = require('./routes/patients');

const app = express();
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

app.use('/api/patients', patientRoutes);

app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
});
