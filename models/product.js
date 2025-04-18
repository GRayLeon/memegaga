const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  name: {
    type: Map,
    of: String,
    required: true
  },
  origin: {
    type: Map,
    of: String,
    required: true
  },
  appearance: {
    type: Map,
    of: String,
    required: true
  },
  functionality: {
    type: Map,
    of: String,
    required: true
  },
  support: {
    type: Map,
    of: String,
    required: true
  },
  brand: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  dimension: {
    type: String,
    required: true
  },
  slipResistance: {
    type: Number,
    required: true
  },
  application: {
    type: String,
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
  subImages: [{
    imageURL: {
      type: String
    },
    imagePublicId: {
      type: String
    },
  }],
  shapes: [{
    title: {
      type: String,
      required: true
    },
    scale: {
      type: Number,
      required: true
    },
    imageURL: {
      type: String
    },
    imagePublicId: {
      type: String
    },
  }],
  colors: [{
    title: {
      type: String,
      required: true
    },
    imageURL: {
      type: String
    },
    imagePublicId: {
      type: String
    },
  }],
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
  tags: {
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

module.exports = mongoose.model('product', productSchema)