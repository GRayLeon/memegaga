const mongoose = require('mongoose')

const specSchema = new mongoose.Schema({
  origin: {
    name: {
      type: Map,
      of: String,
      // required: true
    },
    list: [{
      type: Map,
      of: String
    }]
  },
  appearance: {
    name: {
      type: Map,
      of: String,
      // required: true
    },
    list: [{
      type: Map,
      of: String
    }]
  },
  functionality: {
    name: {
      type: Map,
      of: String,
      // required: true
    },
    list: [{
      type: Map,
      of: String
    }]
  },
  support: {
    name: {
      type: Map,
      of: String,
      // required: true
    },
    list: [{
      type: Map,
      of: String
    }]
  },
  brands: {
    name: {
      type: Map,
      of: String,
      // required: true
    },
    list: [{
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
    }]
  }
})

module.exports = mongoose.model('spec', specSchema)