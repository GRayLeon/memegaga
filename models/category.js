const mongoose = require('mongoose')

const categoryScheme = new mongoose.Schema({
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
  active: {
    type: Boolean,
    default: false,
    required: true
  }
})

module.exports = mongoose.model('category', categoryScheme)