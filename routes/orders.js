const express = require('express');

const Order = require('../models/Order');

const Product = require('../models/Product');

const auth = require('../middleware/auth');

const axios = require('axios');



const router = express.Router();



// Create new order

router.post('/', auth, async (req, res) => {

  try {

    const { items, shippingAddress, paymentMethod } = req.body;



    // Validate and calculate total

    let totalAmount = 0;

    const orderItems = [];



    for (const item of items) {

      const product = await Product.findById(item.productId);

      if (!product) {

        return res.status(404).json({

          success: false,

          message: `Product ${item.productId} not found`

        });

      }



      if (product.stock < item.quantity) {

        return res.status(400).json({

          success: false,

          message: `Insufficient stock for ${product.name}`

        });

      }



      const itemTotal = product.price * item.quantity;

      totalAmount += itemTotal;



      orderItems.push({

        product: product._id,

        quantity: item.quantity,

        price: product.price,

        seller: product.seller

      });

    }



    // Create order

    const order = new Order({

      buyer: req.userId,

      items: orderItems,

      totalAmount,

      shippingAddress,

      paymentMethod

    });



    await order.save();



    // Update product stock

    for (const item of items) {

      await Product.findByIdAndUpdate(

        item.productId,

        { $inc: { stock: -item.quantity } }

      );

    }



    // Initialize payment if using Paystack

    if (paymentMethod === 'paystack') {

      const paymentData = {

        email: req.user.email,

        amount: totalAmount * 100, // Convert to kobo

        reference: order.orderNumber,

        callback_url: `${process.env.FRONTEND_URL}/order-success`

      };



      const response = await axios.post(

        'https://api.paystack.co/transaction/initialize',

        paymentData,

        {

          headers: {

            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,

            'Content-Type': 'application/json'

          }

        }

      );



      return res.status(201).json({

        success: true,

        message: 'Order created successfully',

        order,

        paymentUrl: response.data.data.authorization_url

      });

    }



    res.status(201).json({

      success: true,

      message: 'Order created successfully',

      order

    });

  } catch (error) {

    res.status(400).json({

      success: false,

      message: error.message

    });

  }

});



// Get user orders

router.get('/my-orders', auth, async (req, res) => {

  try {

    const orders = await Order.find({ buyer: req.userId })

      .populate('items.product', 'name images')

      .sort({ createdAt: -1 });



    res.json({

      success: true,

      orders

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



module.exports = router;const filter = { seller: req.userId };