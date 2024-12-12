const mongoose = require('mongoose')

const productScheme = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageURL: {
    type: String
  },
  imagePublicId: {
    type: String
  },
  price: {
    type: Number,
    required: true
  }
})

module.exports = mongoose.model('product', productScheme)