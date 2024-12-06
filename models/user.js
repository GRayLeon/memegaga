const mongoose = require('mongoose')

const userScheme = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    age: Number
})

module.exports = mongoose.model('user', userScheme)