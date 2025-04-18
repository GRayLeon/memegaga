const mongoose = require('mongoose')

const pageSchema = new mongoose.Schema({
  about: {
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
    partner: [{
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
      }
    }]
  }
})

module.exports = mongoose.model('page', pageSchema)