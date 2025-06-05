const mongoose = require('mongoose')

const inquirySchema = new mongoose.Schema({
  data: {
    userType: {
      type: String,
      // required: true
    },
    topic: {
      type: String,
      // required: true
    },
    question: {
      type: String,
      // required: true
    },
    firstName: {
      type: String,
      // required: true
    },
    lastName: {
      type: String,
      // required: true
    },
    email: {
      type: String,
      // required: true
    },
    number: {
      type: String,
      // required: true
    },
    subscribe: {
      type: Boolean,
      default: false
    },
  },
  printData: {
    type: Object
  },
  category: {
    type: String,
    enum: ['form', 'calculate'],
    // required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'processed', 'ignore'],
    default: 'pending',
    // required: true
  },
  processer: {
    type: String
  },
  createTime: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('inquiry', inquirySchema)