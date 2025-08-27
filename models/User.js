const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');



const userSchema = new mongoose.Schema({

  name: {

    type: String,

    required: [true, 'Name is required'],

    trim: true,

    maxlength: [50, 'Name cannot exceed 50 characters']

  },

  email: {

    type: String,

    required: [true, 'Email is required'],

    unique: true,

    lowercase: true,

    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']

  },

  password: {

    type: String,

    required: [true, 'Password is required'],

    minlength: [6, 'Password must be at least 6 characters']

  },

  phone: {

    type: String,

    required: [true, 'Phone number is required'],

    match: [/^(\+234|0)[789][01]\d{8}$/, 'Please enter a valid Nigerian phone number']

  },

  address: {

    street: String,

    city: String,

    state: String,

    country: { type: String, default: 'Nigeria' }

  },

  role: {

    type: String,

    enum: ['buyer', 'seller', 'admin'],

    default: 'buyer'

  },

  isVerified: {

    type: Boolean,

    default: false

  },

  avatar: String,

  totalSales: {

    type: Number,

    default: 0

  },

  rating: {

    type: Number,

    default: 0,

    min: 0,

    max: 5

  }

}, {

  timestamps: true

});



// Hash password before saving

userSchema.pre('save', async function(next) {

  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  next();

});



// Compare password method

userSchema.methods.comparePassword = async function(candidatePassword) {

  return await bcrypt.compare(candidatePassword, this.password);

};



module.exports = mongoose.model('User', userSchema);