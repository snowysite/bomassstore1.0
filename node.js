const express = require('express');

const mongoose = require('mongoose');

const cors = require('cors');

const dotenv = require('dotenv');

const path = require('path');



// Import routes

const authRoutes = require('./routes/auth');

const productRoutes = require('./routes/products');

const orderRoutes = require('./routes/orders');

const adminRoutes = require('./routes/admin');



dotenv.config();



const app = express();

const PORT = process.env.PORT || 5000;



// Middleware

app.use(cors());

app.use(express.json({ limit: '10mb' }));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));



// Serve static files

app.use('/uploads', express.static('uploads'));



// Database connection

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bomass-store', {

  useNewUrlParser: true,

  useUnifiedTopology: true

});



mongoose.connection.on('connected', () => {

  console.log('✅ Connected to MongoDB');

});



mongoose.connection.on('error', (err) => {

  console.error('❌ MongoDB connection error:', err);

});



// Routes

app.use('/api/auth', authRoutes);

app.use('/api/products', productRoutes);

app.use('/api/orders', orderRoutes);

app.use('/api/admin', adminRoutes);



// Health check endpoint

app.get('/api/health', (req, res) => {

  res.json({ 

    status: 'OK', 

    message: 'Bomass Store API is running',

    timestamp: new Date().toISOString()

  });

});



// Error handling middleware

app.use((err, req, res, next) => {

  console.error(err.stack);

  res.status(500).json({ 

    success: false, 

    message: 'Something went wrong!' 

  });

});



app.listen(PORT, () => {

  console.log(`🚀 Bomass Store server running on port ${PORT}`);

});