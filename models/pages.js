const mongoose = require('mongoose')

const pagesSchema = new mongoose.Schema({
  index: {
    description: {
      type: Map,
      of: String,
      // required: true
    },
    images: [{
      imageURL: {
        type: String
      },
      imagePublicId: {
        type: String
      }
    }]
  },
  vision: {
    description: {
      type: Map,
      of: String,
      // required: true
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
      // required: true
    },
    imageURL: {
      type: String
    },
    imagePublicId: {
      type: String
    }
  }],
  contact: {
    description: {
      type: Map,
      of: String,
      // required: true
    },
    address: {
      type: Map,
      of: String,
      // required: true
    }
  }
})

module.exports = mongoose.model('pages', pagesSchema)