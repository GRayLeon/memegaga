const mongoose = require('mongoose')

const inquirySchema = new mongoose.Schema({
  userType: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  number: {
    type: String,
    required: true
  },
  subscribe: {
    type: Boolean,
    default: false
  },
  createTime: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('inquiry', inquirySchema)