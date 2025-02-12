const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const accountScheme = new mongoose.Schema({
    account: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        required: true
    },
    status: {
        type: Number,
        default: 1,
        required: false
    },
    description: {
        type: String
    },
    password: {
        type: String,
        required: true
    },
    lastLogin: {
        type: Date,
        default: null
    }
})

accountScheme.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next()
    }
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
})

accountScheme.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password)
}

module.exports = mongoose.model('Account', accountScheme)