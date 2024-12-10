const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const Account = require('../models/account')

const JWT_SECRET = 'memegaga_jwt_secret'

router.post("/register", async (req, res) => {
  try {
    const { account, password } = req.body
    const newAccount = new Account({ account, password })
    await newAccount.save()
    res
      .status(201)
      .json({ message: 'Account registered successfully.' })
  } catch (err) {
    res
      .status(400)
      .json({ error: err.message })
  }
})

router.post("/login", async (req, res) => {
  try {
    const { account, password } = req.body
    const loginAccount = await Account.findOne({ account })
    if (!loginAccount) {
      return res
              .status(404)
              .json({ error: 'Account not found.' })
    }

    const isMatch = await loginAccount.comparePassword(password)
    if (!isMatch) {
      return res
              .status(401)
              .json({ error: 'Invalid credentials.' })
    }

    const token = jwt.sign({ id: loginAccount._id }, JWT_SECRET, { expiresIn: '1h' })

    res.json({ token })
  } catch (err) {
    res
      .status(400)
      .json({ error: err.message })
  }
})

module.exports = router