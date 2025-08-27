const mongoose = require('mongoose');



const productSchema = new mongoose.Schema({

  name: {

    type: String,

    required: [true, 'Product name is required'],

    trim: true,

    maxlength: [100, 'Product name cannot exceed 100 characters']

  },

  description: {

    type: String,

    required: [true, 'Product description is required'],

    maxlength: [500, 'Description cannot exceed 500 characters']

  },

  price: {

    type: Number,

    required: [true, 'Price is required'],

    min: [0, 'Price cannot be negative']

  },

  category: {

    type: String,

    required: [true, 'Category is required'],

    enum: ['food', 'clothing', 'electronics', 'home', 'books', 'other']

  },

  images: [{

    url: String,

    publicId: String

  }],

  seller: {

    type: mongoose.Schema.Types.ObjectId,

    ref: 'User',

    required: true

  },

  stock: {

    type: Number,

    required: [true, 'Stock quantity is required'],

    min: [0, 'Stock cannot be negative'],

    default: 0

  },

  rating: {

    type: Number,

    default: 0,

    min: 0,

    max: 5

  },

  numReviews: {

    type: Number,

    default: 0

  },

  reviews: [{

    user: {

      type: mongoose.Schema.Types.ObjectId,

      ref: 'User',

      required: true

    },

    name: String,

    rating: {

      type: Number,

      required: true,

      min: 1,

      max: 5

    },

    comment: String,

    createdAt: {

      type: Date,

      default: Date.now

    }

  }],

  isActive: {

    type: Boolean,

    default: true

  },

  tags: [String],

  weight: Number,

  dimensions: {

    length: Number,

    width: Number,

    height: Number

  }

}, {

  timestamps: true

});



// Index for search functionality

productSchema.index({ name: 'text', description: 'text', tags: 'text' });

productSchema.index({ category: 1, price: 1 });

productSchema.index({ seller: 1 });



module.exports = mongoose.model('Product', productSchema);
                    