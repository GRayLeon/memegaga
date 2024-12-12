const express = require('express')
const router = express.Router()
const Product = require('../models/product')
const authenticateToken = require('../middleware/auth')

const multer = require('multer')
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const cloudinary = require('cloudinary').v2

require('dotenv').config()

// 圖片上傳相關
//// 配置 cloudinary

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

//// 配置 Multer Storage

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "products",
    format: async (req, file) => "jpg",
    public_id: (req, file) => Date.now()
  }
})

const upload = multer({ storage })

// api
//// 取得產品列表

router.get("/", async (req, res) => {
  try {
    const product = await Product.find()
    res.json(product)
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message })
  }
})


//// 依 ID 取得產品

router.get("/:id", getProduct, (req, res) => {
  res.json(res.product)
})


//// 依 ID 刪除產品

router.delete("/:id", authenticateToken, getProduct, async (req, res) => {
  try {
    // 若商品已有 imagePublicId 則透過 cloudinary 刪除圖片
    if (res.product.imagePublicId) {
      await cloudinary.uploader.destroy(res.product.imagePublicId)
    }
    
    await res.product.deleteOne()
    res.json(`已成功刪除產品： ${res.product.name}`)
  } catch (err) {
    res
      .status(500)
      .json({ message: "Remove product faild." })
  }
})


// 新增/編輯商品資訊

router.post("/:type", authenticateToken, upload.single("image"), async (req, res) => {
  // 透過 upload 上傳圖片至 cloudinary 並取得相關資訊
  const imageURL = req.file?.path
  const imagePublicId = req.file?.filename

  // 判斷 type 再生成 product
  let product = null
  let status = null
  let wording = null

  const type = req.params.type
  if (type == 'edit') {
    try {
      product = await Product.findById(req.body.id)
      Object.assign(product, req.body)
      // 若有新的 imagePublicId 則刪除舊的
      if (imagePublicId) { 
        await cloudinary.uploader.destroy(req.body.imagePublicId)
        product.imagePublicId = imagePublicId
        product.imageURL = imageURL
      }
      status = 200
      wording = '修改'
    } catch (err) {
      res
        .status(400)
        .json({ message: err.message })
    }
  } else if (type == 'add') {
    product = new Product({ ...req.body, imageURL, imagePublicId })
    status = 201
    wording = '新增'
  }

  try {
    const newProduct = await product.save()
    res
      .status(status)
      .json(`已成功${wording}產品： ${newProduct.name} - ${newProduct.imageURL}`)
  } catch (err) {
    res
      .status(400)
      .json({ message: err.message })
  }
})


//// 依 ID 查詢資料庫

async function getProduct(req, res, next) {
  let product
  try {
    product = await Product.findById(req.params.id)
    if (product == undefined) {
        return res
                .status(404)
                .json({
                  message: "Can't find product."
                })
    }
  } catch (err) {
      res
        .status(500)
        .json({ message: err.message })
  }
  res.product = product
  next()
}

module.exports = router