const mongoose = require('mongoose')

const productScheme = new mongoose.Schema({
  name: {
    type: Map,
    of: String,
    required: true
  },
  description: {
    type: Map,
    of: String,
    required: true
  },
  imageURL: {
    type: String
  },
  imagePublicId: {
    type: String
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  sizes: [
    {
      sizeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Size',
        required: true
      },
      count: {
        type: Number,
        required: true
      }
    }
  ],
  colors: {
    type: Array,
    of: String
  },
  basePrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'archived'],
    default: 'draft',
    required: true
  }
})

module.exports = mongoose.model('product', productScheme)