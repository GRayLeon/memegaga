const mongoose = require('mongoose')

const productScheme = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    images: {
        type: String
    },
    price: {
        type: Number,
        required: true
    }
})

module.exports = mongoose.model('product', productScheme)