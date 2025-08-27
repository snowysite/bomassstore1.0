const express = require('express');

const jwt = require('jsonwebtoken');

const User = require('../models/User');

const auth = require('../middleware/auth');



const router = express.Router();



// Register new user

router.post('/register', async (req, res) => {

  try {

    const { name, email, password, phone, address } = req.body;



    // Check if user already exists

    const existingUser = await User.findOne({ email });

    if (existingUser) {

      return res.status(400).json({

        success: false,

        message: 'User already exists with this email'

      });

    }



    // Create new user

    const user = new User({

      name,

      email,

      password,

      phone,

      address

    });



    await user.save();



    // Generate JWT token

    const token = jwt.sign(

      { userId: user._id },

      process.env.JWT_SECRET,

      { expiresIn: '7d' }

    );



    res.status(201).json({

      success: true,

      message: 'User registered successfully',

      token,

      user: {

        id: user._id,

        name: user.name,

        email: user.email,

        role: user.role

      }

    });

  } catch (error) {

    res.status(400).json({

      success: false,

      message: error.message

    });

  }

});



// Login user

router.post('/login', async (req, res) => {

  try {

    const { email, password } = req.body;



    // Find user by email

    const user = await User.findOne({ email });

    if (!user) {

      return res.status(401).json({

        success: false,

        message: 'Invalid email or password'

      });

    }



    // Check password

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {

      return res.status(401).json({

        success: false,

        message: 'Invalid email or password'

      });

    }



    // Generate JWT token

    const token = jwt.sign(

      { userId: user._id },

      process.env.JWT_SECRET,

      { expiresIn: '7d' }

    );



    res.json({

      success: true,

      message: 'Login successful',

      token,

      user: {

        id: user._id,

        name: user.name,

        email: user.email,

        role: user.role

      }

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

});



// Get user profile

router.get('/profile', auth, async (req, res) => {

  try {

    const user = await User.findById(req.userId).select('-password');

    res.json({

      success: true,

      user

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

});



// Get seller's products with status (for sellers to see their pending/rejected products)

router.get('/my-products', auth, async (req, res) => {

  try {

    const { status, page = 1, limit = 12 } = req.query;



    const filter = { seller: req.userId };

    if (status && status !== 'all') {

      filter.status = status;

    }



    const products = await Product.find(filter)

      .sort({ createdAt: -1 })

      .limit(limit * 1)

      .skip((page - 1) * limit);



    const total = await Product.countDocuments(filter);



    res.json({

      success: true,

      products,

      pagination: {

        currentPage: parseInt(page),

        totalPages: Math.ceil(total / limit),

        totalProducts: total

      }

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

});



module.exports = router;