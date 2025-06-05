const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
  name: {
    type: Map,
    of: String,
    // required: true
  },
  description: {
    type: Map,
    of: String,
    // required: true
  },
  active: {
    type: Boolean,
    default: false,
    // required: true
  }
})

module.exports = mongoose.model('category', categorySchema)