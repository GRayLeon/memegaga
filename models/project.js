const mongoose = require('mongoose')

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    // required: true
  },
  category: {
    type: String,
    // required: true
  },
  artist: {
    type: String,
    // required: true
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
  imageList: [{
    class: {
      type: String,
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
  }],
  tags: {
    type: Array,
    of: String,
    // required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'archived'],
    default: 'draft',
    // required: true
  }
})

module.exports = mongoose.model('project', projectSchema)