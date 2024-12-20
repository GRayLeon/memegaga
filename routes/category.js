const express = require('express')
const router = express.Router()
const Category = require('../models/category')
const authenticateToken = require('../middleware/auth')

require('dotenv').config()


// api
//// 取得分類列表

router.get("/", async (req, res) => {
  try {
    const category = await Category.find()
    res.json(category)
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message })
  }
})


//// 依 ID 刪除產品

router.delete("/:id", authenticateToken, getCategory, async (req, res) => {
  try {
    await res.category.deleteOne()
    res.json(`已成功刪除分類： ${res.category.name}`)
  } catch (err) {
    res
      .status(500)
      .json({ message: "Remove category faild." })
  }
})


// 新增/編輯分類資訊

router.post("/:type", authenticateToken, async (req, res) => {
  let category = null
  let status = null

  const type = req.params.type
  if (type == 'edit') {
    try {
      category = await Category.findById(req.body._id)
      Object.assign(category, req.body)
      status = 200
      wording = '修改'
    } catch (err) {
      res
        .status(400)
        .json({ message: err.message })
    }
  } else if (type == 'add') {
    category = new Category({ ...req.body })
    status = 201
    wording = '新增'
  }

  try {
    await category.save()
    res.status(status).send()
  } catch (err) {
    res
      .status(400)
      .json({ message: err.message })
  }
})


//// 依 ID 查詢資料庫

async function getCategory(req, res, next) {
  let category
  try {
    category = await Category.findById(req.params.id)
    if (category == undefined) {
      return res
              .status(404)
              .json({
                message: "Can't find category."
              })
    }
  } catch (err) {
      res
        .status(500)
        .json({ message: err.message })
  }
  res.category = category
  next()
}

module.exports = router