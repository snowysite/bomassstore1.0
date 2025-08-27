const express = require('express');

const Product = require('../models/Product');

const auth = require('../middleware/auth');

const upload = require('../middleware/upload');



const router = express.Router();



// Get all products with filtering and pagination

router.get('/', async (req, res) => {

  try {

    const { 

      page = 1, 

      limit = 12, 

      category, 

      search, 

      minPrice, 

      maxPrice, 

      sortBy = 'createdAt',

      sortOrder = 'desc'

    } = req.query;



    // Build filter object - only show approved products to public

    const filter = { isActive: true, status: 'approved' };



    if (category && category !== 'all') {

      filter.category = category;

    }



    if (search) {

      filter.$text = { $search: search };

    }



    if (minPrice || maxPrice) {

      filter.price = {};

      if (minPrice) filter.price.$gte = parseFloat(minPrice);

      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);

    }



    // Build sort object

    const sort = {};

    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;



    // Execute query with pagination

    const products = await Product.find(filter)

      .populate('seller', 'name rating')

      .sort(sort)

      .limit(limit * 1)

      .skip((page - 1) * limit);



    const total = await Product.countDocuments(filter);



    res.json({

      success: true,

      products,

      pagination: {

        currentPage: parseInt(page),

        totalPages: Math.ceil(total / limit),

        totalProducts: total,

        hasNext: page < Math.ceil(total / limit),

        hasPrev: page > 1

      }

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

});



// Create new product

router.post('/', auth, upload.array('images', 5), async (req, res) => {

  try {

    const { name, description, price, category, stock, tags } = req.body;



    // Process uploaded images

    const images = req.files ? req.files.map(file => ({

      url: file.path,

      publicId: file.filename

    })) : [];



    const product = new Product({

      name,

      description,

      price: parseFloat(price),

      category,

      stock: parseInt(stock),

      seller: req.userId,

      images,

      tags: tags ? tags.split(',').map(tag => tag.trim()) : []

    });



    await product.save();

    await product.populate('seller', 'name rating');



    res.status(201).json({

      success: true,

      message: 'Product created successfully',

      product

    });

  } catch (error) {

    res.status(400).json({

      success: false,

      message: error.message

    });

  }

});



// Get single product

router.get('/:id', async (req, res) => {

  try {

    const product = await Product.findById(req.params.id)

      .populate('seller', 'name rating totalSales')

      .populate('reviews.user', 'name');



    if (!product) {

      return res.status(404).json({

        success: false,

        message: 'Product not found'

      });

    }



    res.json({

      success: true,

      product

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
                    