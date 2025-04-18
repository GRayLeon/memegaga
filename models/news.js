const mongoose = require('mongoose')

const newsSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true
  },
  mainImage: {
    imageURL: {
      type: String
    },
    imagePublicId: {
      type: String
    }
  },
  content: [{
    layout: {
      type: String,
      required: true,
      enum: [
        'image-left',
        'image-right',
        'image-top',
        'image-bottom'
      ],
      default: 'image-top'
    },
    article: [{
      text: {
        type: String,
        required: function() { return !this.image }
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

})

module.exports = mongoose.model('news', newsSchema)