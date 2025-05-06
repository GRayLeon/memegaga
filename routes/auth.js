const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const Account = require('../models/account')
const authenticateToken = require('../middleware/auth')

const JWT_SECRET = 'memegaga_jwt_secret'


// 取得所有帳號

router.get("/", authenticateToken, async (req, res) => {
  try {
    const accounts = await Account.find({ type: { $ne: 'admin' } })
    const filtedAccounts = accounts.map(account => ({
      '_id': account._id,
      'account': account.account,
      'type': account.type,
      'status': account.status,
      'description': account.description,
      'lastLogin': account.lastLogin
    }))
    res.json(filtedAccounts)
  } catch (err) {
    res
      .status(400)
      .json({ error: err.message })
  }
})


// 註冊帳號

router.post("/register", async (req, res) => {
  try {
    const { account, type, password } = req.body
    const newAccount = new Account({ account, type, password })
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


// 帳號登入

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

    loginAccount.lastLogin = new Date()
    await loginAccount.save()

    const expiresIn = 3600
    const token = jwt.sign({ id: loginAccount._id }, JWT_SECRET, { expiresIn })

    res.json({ token, expiresIn })
  } catch (err) {
    res
      .status(400)
      .json({ error: err.message })
  }
})

// 編輯帳號

router.post("/edit", authenticateToken, async (req, res) => {
  let account = null
  try {
    account = await Account.findById(req.body._id)
    Object.assign(account, req.body)
  } catch (err) {
    res
      .status(400)
      .json({ message: err.message })
  }

  try {
    await account.save()
    res.status(200).send()
  } catch (err) {
    res
      .status(400)
      .json({ message: err.message })
  }
})


// 刪除帳號

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    let account = await Account.findById(req.params.id)
    if (account) {
      await account.deleteOne()
      res.json(`已成功刪除使用者： ${account.account}`)
    } else {
      return res
              .status(404)
              .json({
                message: "Can't find account."
              })
    } 
  } catch (err) {
    res
      .status(400)
      .json({ error: err.message })
  }
})


// 取得帳號資料

router.get("/profile", authenticateToken, async (req, res) => {
  try {
    let account = await Account.findById(req.account.id)
    if (account) {
      res.json({
        "id": account._id,
        "account": account.account,
        "type": account.type,
      })
    }
  } catch (err) {
    res
      .status(400)
      .json({ error: err.message })
  }
})

module.exports = router