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

// 多張圖片依規格上傳
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let transformation

    if (file.fieldname === "mainImage") {
      transformation = [{ 
        width: 1024,
        height: 1024,
        crop: "limit",
        quality: "auto",
        fetch_format: "auto"
      }]
    } else if (file.fieldname === "shapeImages") {
      transformation = [{
        width: 100,
        height: 100,
        crop: "limit",
        quality: "auto",
        fetch_format: "auto"
      }]
    }

    return {
      folder: "products",
      format: "jpg",
      public_id: Date.now() + "-" + file.originalname.split(".")[0],
      transformation
    }
  }
})


// 限制檔案類型以及大小
const upload = multer({ 
  storage,
  fileFilter: (req, file, callback) => {
    const allowedMimeTypes = ["image/jpeg", "image/png"]
    const maxSizeMainImage = 1 * 1024 * 1024
    const maxSizeShapeImage = 500 * 1024
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      callback(new Error("僅接受 JPG 或 PNG 格式的圖片"))
    }

    if (file.fieldname === "mainImage" && file.size > maxSizeMainImage) {
      callback(new Error("商品圖片大小不得超過 1MB"))
    }

    if (file.fieldname === "shapeImages" && file.size > maxSizeShapeImage) {
      callback(new Error("面狀圖片大小不得超過 500KB"))
    }

    callback(null, true)
  }
})


// 限制上傳的圖片數量
const uploadFields = upload.fields([
  { name: "mainImage", maxCount: 1 },
  { name: "shapeImages", maxCount: 10 }
])


// api
//// 取得產品列表

router.get("/", getProducts, (req, res) => {
  res.json(res.products)
})


//// 依 ID 取得產品

router.get("/:id", async(req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (product) {
      res.json(res.product)
      
    } else {
      return res
              .status(404)
              .json({
                message: "Can't find product."
              })
    }
  } catch (err) {
    res
      .status(400)
      .json({ message: err.message })
  }
})


//// 依 ID 刪除產品

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (product.imagePublicId) {
      await cloudinary.uploader.destroy(product.imagePublicId)
    }
    
    await product.deleteOne()
    res.json(`已成功刪除產品： ${product.name}`)
  } catch (err) {
    res
      .status(500)
      .json({ message: "Remove product faild." })
  }
})


// 新增/編輯商品資訊

router.post("/:type", authenticateToken, uploadFields, async (req, res) => {
  // 透過 upload 上傳圖片至 cloudinary 並取得相關資訊
  const mainImage = req.files["mainImage"] ? req.files["mainImage"] : null
  const imageURL = mainImage?.path || null
  const imagePublicId = mainImage?.filename || null

  const shapeImages = req.files["shapeImages"] || []
  const shapeImagesData = shapeImages.map( file => ({
    'imageURL': file.path,
    'imagePublicId': file.filename
  }))

  // 判斷 type 再生成 product
  let product
  let status
  let wording

  req.body.name = JSON.parse(req.body.name)
  req.body.description = JSON.parse(req.body.description)
  req.body.sizes = JSON.parse(req.body.sizes)

  const type = req.params.type
  if (type == 'edit') {
    try {
      product = await Product.findById(req.body._id)
      req.body.shapes = JSON.parse(req.body.shapes)
      req.body.tags = JSON.parse(req.body.tags)
      Object.assign(product, req.body)
      // 若有新的 imagePublicId 則刪除舊的
      if (imagePublicId) {
        if (product.imagePublicId) {
          await cloudinary.uploader.destroy(product.imagePublicId)
        }
        product.imagePublicId = imagePublicId
        product.imageURL = imageURL
      }
      
      // 若有新的 shapes 則刪除舊的
      const deleteShapes = []
      if (shapeImagesData.length > 0) {
        const newShapes = req.body.shapes
        const updatedShapes = newShapes.map( (newShape, idx) => {
          let image
          for (const update of req.body.updateShapes) {
            if (update.idx == idx) {
              shapeImagesData.forEach( data => {
                let checkName = data.imagePublicId.split("-")[1]
                if (update.name == checkName) {
                  image = data
                }
              })
              deleteShapes.push(product.shapes[idx].imagePublicId)
            }
          }
          if (!image) {
            return {
              'title': newShape.title,
              'scale': newShape.scale,
              'imageURL': newShape.imageURL,
              'imagePublicId': newShape.imagePublicId
            }
          } else {
            return {
              'title': newShape.title,
              'scale': newShape.scale,
              'imageURL': image.imageURL,
              'imagePublicId': image.imagePublicId
            }
          }
          
        })
        for (const shape of deleteShapes) {
          try {
            await cloudinary.uploader.destroy(shape)
          } catch (err) {
            return res
                    .status(400)
                    .json({ message: err.message })
          }
        }
        product.shapes = updatedShapes
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
    await product.save()
    res.status(status).send()
  } catch (err) {
    res
      .status(400)
      .json({ message: err.message })
  }
})


//// 依條件查詢資料庫

async function getProducts(req, res, next) {
  const { 
    page = 1,
    size = 10,
    status,
    category,
    sortBy = "_id",
    sortOrder = "asc"
  } = req.query

  const pageNumber = parseInt(page, 10)
  const pageSize = parseInt(size, 10)

  const filter = {}
  if (category) { filter.parentCategory = category }
  if (status) { filter.status = status }

  const sortDirection = sortOrder === "desc" ? -1 : 1
  const sort = { [sortBy]: sortDirection }

  try {
    const total = await Product.countDocuments(filter);
    const products = await Product
                            .find(filter)
                            .sort(sort)
                            .skip((pageNumber - 1) * pageSize)
                            .limit(pageSize)
    if (products == undefined) {
        return res
                .status(404)
                .json({
                  message: "Can't find product."
                })
    } else {
      res.products = {
        data: products,
        pagination: {
          total,
          currentPage: pageNumber,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        }
      }
      next()
    }
  } catch (err) {
      res
        .status(500)
        .json({ message: err.message })
  }
}

module.exports = router