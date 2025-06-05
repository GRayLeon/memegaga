const mongoose = require('mongoose')

const newsSchema = new mongoose.Schema({
  topic: {
    type: Map,
    of: String,
    // required: true
  },
  category: {
    type: String,
    // required: true
  },
  source: {
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
  detail: {
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
        of: String,
        // required: function() { return !this.image }
      },
      text: {
        type: Map,
        of: String,
        // required: function() { return !this.image }
      },
      imageURL: {
        type: String
      },
      imagePublicId: {
        type: String
      }
    }]
  }],
  createTime: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'archived'],
    default: 'draft',
    // required: true
  }

})

module.exports = mongoose.model('news', newsSchema)