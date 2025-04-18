const express = require('express')
const router = express.Router()
const Inquiry = require('../models/inquiry')
const authenticateToken = require('../middleware/auth')

require('dotenv').config()

// api
//// 取得所有詢問表單

router.get("/", getInquirys, (req, res) => {
  res.json(res.inquirys)
})


//// 依 ID 取得詢問表單

router.get("/:id", authenticateToken, async(req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id)
    if (inquiry) {
      res.json(inquiry)
    } else {
      return res
              .status(404)
              .json({
                message: "Can't find inquiry."
              })
    }
  } catch (err) {
    res
      .status(400)
      .json({ message: err.message })
  }
})


// 新增/編輯商品資訊

router.post("/", async (req, res) => {
  const inquiry = new Inquiry({ ...req.body })

  try {
    await inquiry.save()
    res.status(201).send()
  } catch (err) {
    res
      .status(400)
      .json({ message: err.message })
  }
})


//// 依條件查詢資料庫

async function getInquirys(req, res, next) {

  try {
    const inquirys = await Inquiry.find()
    if (inquirys == undefined) {
        return res
                .status(404)
                .json({
                  message: "Can't find inquiry."
                })
    } else {
      res.inquirys = inquirys
      next()
    }
  } catch (err) {
      res
        .status(500)
        .json({ message: err.message })
  }
}

module.exports = router