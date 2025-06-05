const mongoose = require('mongoose')

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    // required: true
  },
  imageURL: {
    type: String
  },
  imagePublicId: {
    type: String
  },
  description: {
    type: Map,
    of: String,
    // required: true
  },
  content: [{
    layout: {
      direction: {
        type: String,
        // required: true,
        enum: [
          'single-vertical',
          'double-vertical',
          'single-horizon',
          'double-horizon'
        ],
        default: 'single-vertical'
      },
      position: {
        type: String,
        // required: true,
        enum: [
          'image-left',
          'image-right',
          'image-top',
          'image-bottom'
        ],
        default: 'image-top'
      }
    },
    article: [{
      title: {
        type: Map,
        of: String
      },
      text: {
        type: Map,
        of: String
      },
      imageURL: {
        type: String
      },
      imagePublicId: {
        type: String
      }
    }]
  }],
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'archived'],
    default: 'draft',
    // required: true
  }
})

module.exports = mongoose.model('brand', brandSchema)