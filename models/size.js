const mongoose = require('mongoose')

const sizeScheme = new mongoose.Schema({
  size: {
    type: String,
    required: true
  },
  scale: {
    type: Number,
    required: true
  },
  active: {
    type: Boolean,
    default: true,
    required: true
  }
})

module.exports = mongoose.model('size', sizeScheme)