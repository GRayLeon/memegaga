const express = require('express')
const router = express.Router()
const Size = require('../models/size')
const authenticateToken = require('../middleware/auth')

require('dotenv').config()


// api
//// 取得分類列表

router.get("/", async (req, res) => {
  try {
    const size = await Size.find()
    res.json(size)
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message })
  }
})


//// 依 ID 刪除產品

router.delete("/:id", authenticateToken, getSize, async (req, res) => {
  try {
    await res.size.deleteOne()
    res.json(`已成功刪除尺寸： ${res.size.size}`)
  } catch (err) {
    res
      .status(500)
      .json({ message: "Remove size faild." })
  }
})


// 新增/編輯分類資訊

router.post("/:type", async (req, res) => {
  let size = null
  let status = null

  const type = req.params.type
  if (type == 'edit') {
    try {
      size = await Size.findById(req.body._id)
      Object.assign(size, req.body)
      status = 200
      wording = '修改'
    } catch (err) {
      res
        .status(400)
        .json({ message: err.message })
    }
  } else if (type == 'add') {
    size = new Size({ ...req.body })
    status = 201
    wording = '新增'
  }

  try {
    await size.save()
    res.status(status).send()
  } catch (err) {
    res
      .status(400)
      .json({ message: err.message })
  }
})


//// 依 ID 查詢資料庫

async function getSize(req, res, next) {
  let size
  try {
    size = await Size.findById(req.params.id)
    if (size == undefined) {
        return res
                .status(404)
                .json({
                  message: "Can't find size."
                })
    }
  } catch (err) {
      res
        .status(500)
        .json({ message: err.message })
  }
  res.size = size
  next()
}

module.exports = router