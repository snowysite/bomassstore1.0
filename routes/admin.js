const express = require('express');

const jwt = require('jsonwebtoken');

const Product = require('../models/Product');

const User = require('../models/User');

const Order = require('../models/Order');

const { auth, adminAuth } = require('../middleware/auth');



const router = express.Router();



// Admin login (separate from regular login)

router.post('/login', async (req, res) => {

  try {

    const { email, password } = req.body;



    // Find admin user

    const admin = await User.findOne({ email, role: 'admin' });

    if (!admin) {

      return res.status(401).json({

        success: false,

        message: 'Admin access denied'

      });

    }



    // Check password

    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {

      return res.status(401).json({

        success: false,

        message: 'Invalid admin credentials'

      });

    }



    // Generate JWT token

    const token = jwt.sign(

      { userId: admin._id, role: 'admin' },

      process.env.JWT_SECRET,

      { expiresIn: '8h' } // Shorter session for admin

    );



    res.json({

      success: true,

      message: 'Admin login successful',

      token,

      admin: {

        id: admin._id,

        name: admin.name,

        email: admin.email,

        role: admin.role

      }

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

});



// Get pending products for approval

router.get('/products/pending', adminAuth, async (req, res) => {

  try {

    const { page = 1, limit = 20 } = req.query;



    const products = await Product.find({ status: 'pending' })

      .populate('seller', 'name email phone')

      .sort({ createdAt: -1 })

      .limit(limit * 1)

      .skip((page - 1) * limit);



    const total = await Product.countDocuments({ status: 'pending' });



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



// Approve product

router.put('/products/:id/approve', adminAuth, async (req, res) => {

  try {

    const product = await Product.findByIdAndUpdate(

      req.params.id,

      {

        status: 'approved',

        approvedBy: req.userId,

        approvedAt: new Date(),

        rejectionReason: undefined

      },

      { new: true }

    ).populate('seller', 'name email');



    if (!product) {

      return res.status(404).json({

        success: false,

        message: 'Product not found'

      });

    }



    res.json({

      success: true,

      message: 'Product approved successfully',

      product

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

});



// Reject product

router.put('/products/:id/reject', adminAuth, async (req, res) => {

  try {

    const { reason } = req.body;



    const product = await Product.findByIdAndUpdate(

      req.params.id,

      {

        status: 'rejected',

        rejectionReason: reason || 'Does not meet platform guidelines',

        approvedBy: req.userId,

        approvedAt: new Date()

      },

      { new: true }

    ).populate('seller', 'name email');



    if (!product) {

      return res.status(404).json({

        success: false,

        message: 'Product not found'

      });

    }



    res.json({

      success: true,

      message: 'Product rejected',

      product

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

});



// Get admin dashboard stats

router.get('/dashboard', adminAuth, async (req, res) => {

  try {

    const [

      totalUsers,

      totalProducts,

      pendingProducts,

      totalOrders,

      pendingOrders

    ] = await Promise.all([

      User.countDocuments({ role: { $ne: 'admin' } }),

      Product.countDocuments(),

      Product.countDocuments({ status: 'pending' }),

      Order.countDocuments(),

      Order.countDocuments({ orderStatus: 'pending' })

    ]);



    res.json({

      success: true,

      stats: {

        totalUsers,

        totalProducts,

        pendingProducts,

        totalOrders,

        pendingOrders

      }

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