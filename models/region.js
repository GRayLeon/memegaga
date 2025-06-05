const mongoose = require('mongoose')

const regionSchema = new mongoose.Schema({
  name: {
    type: Map,
    of: String,
    // required: true
  },
  status: {
    type: Boolean,
    // required: true
  },
  imageURL: {
    type: String
  },
  imagePublicId: {
    type: String
  }
})

module.exports = mongoose.model('region', regionSchema)