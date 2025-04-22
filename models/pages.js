const mongoose = require('mongoose')

const pagesSchema = new mongoose.Schema({
  vision: {
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
    }
  },
  partners: [{
    name: {
      type: String,
      required: true
    },
    imageURL: {
      type: String
    },
    imagePublicId: {
      type: String
    }
  }]
})

module.exports = mongoose.model('pages', pagesSchema)