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

    if (file.fieldname === "mainImage" || file.filename === "subImages") {
      transformation = [{ 
        width: 1024,
        height: 1024,
        crop: "limit",
        quality: "auto",
        fetch_format: "auto"
      }]
    } else if (file.fieldname === "shapeImages" || file.fieldname === "colorImages") {
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
    const maxSizeLargeImage = 1 * 1024 * 1024
    const maxSizeSmallImage = 300 * 1024
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      callback(new Error("僅接受 JPG 或 PNG 格式的圖片"))
    }

    if ((file.fieldname === "mainImage" || file.fieldname === "subImages") && file.size > maxSizeLargeImage) {
      callback(new Error("商品圖片大小不得超過 1MB"))
    }

    if ((file.fieldname === "shapeImages" || file.fieldname === "colorImages") && file.size > maxSizeSmallImage) {
      callback(new Error("規格圖片大小不得超過 300KB"))
    }

    callback(null, true)
  }
})


// 限制上傳的圖片數量
const uploadFields = upload.fields([
  { name: "mainImage", maxCount: 1 },
  { name: "subImages", maxCount: 5 },
  { name: "shapeImages", maxCount: 10 },
  { name: "colorImages", maxCount: 10 }
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
      res.json(product)
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

  let subImagesData = null
  let shapeImagesData = null
  let colorImagesData = null

  const mainImage = req.files["mainImage"] ? req.files["mainImage"][0] : null
  const imageURL = mainImage?.path || null
  const imagePublicId = mainImage?.filename || null

  const subImages = req.files["subImages"] || []
  if (subImages) {
    subImagesData = subImages.map( file => ({
      'imageURL': file.path,
      'imagePublicId': file.filename
    }))
  }
  

  const shapeImages = req.files["shapeImages"] || []
  if (shapeImages) {
    shapeImagesData = shapeImages.map( file => ({
      'imageURL': file.path,
      'imagePublicId': file.filename
    }))
  }

  const colorImages = req.files["colorImages"] || []
  if (colorImages) {
    colorImagesData = colorImages.map( file => ({
      'imageURL': file.path,
      'imagePublicId': file.filename
    }))
  }

  req.body.name = JSON.parse(req.body.name)
  req.body.description = JSON.parse(req.body.description)
  req.body.sizes = JSON.parse(req.body.sizes)

  req.body.subImages = JSON.parse(req.body.subImages)
  req.body.updateSubImages = JSON.parse(req.body.updateSubImages)

  req.body.shapes = JSON.parse(req.body.shapes)
  req.body.updateShapeImages = JSON.parse(req.body.updateShapeImages)

  req.body.colors = JSON.parse(req.body.colors)
  req.body.updateColorImages = JSON.parse(req.body.updateColorImages)

  req.body.tags = JSON.parse(req.body.tags)

  req.body.origin = JSON.parse(req.body.origin)
  req.body.appearance = JSON.parse(req.body.appearance)
  req.body.functionality = JSON.parse(req.body.functionality)
  req.body.support = JSON.parse(req.body.support)
  req.body.brand = JSON.parse(req.body.brand)

  let product
  let status
  let wording

  const type = req.params.type
  if (type == 'edit') {
    try {
      product = await Product.findById(req.body._id)
      Object.assign(product, req.body)

      // 若有新的 imagePublicId 則刪除舊的
      if (imagePublicId) {
        if (product.imagePublicId) {
          await cloudinary.uploader.destroy(product.imagePublicId)
        }
        product.imagePublicId = imagePublicId
        product.imageURL = imageURL
      }

      // 若有新的 subImages 則刪除舊的
      const deleteSubImages = []
      if (subImagesData && subImagesData.length > 0) {
        const newImages = req.body.subImages
        const updateSubImages = newImages.map( (newImage, idx) => {
          let image
          for (const update of req.body.updateSubImages) {
            if (update.idx == idx) {
              subImagesData.forEach( data => {
                let checkName = data.imagePublicId.split("-")[1]
                if (update.name == checkName) {
                  image = data
                }
              })
              if (product.subImages[idx] && product.subImages[idx].imagePublicId) {
                deleteSubImages.push(product.subImages[idx].imagePublicId)
              }
            }
          }
          if (!image) {
            return {
              'imageURL': newImage.imageURL,
              'imagePublicId': newImage.imagePublicId
            }
          } else {
            return {
              'imageURL': image.imageURL,
              'imagePublicId': image.imagePublicId
            }
          }
          
        })
        for (const image of deleteSubImages) {
          try {
            await cloudinary.uploader.destroy(image)
          } catch (err) {
            return res
                    .status(400)
                    .json({ message: err.message })
          }
        }
        product.subImages = updateSubImages
      }
      
      // 若有新的 shapes 則刪除舊的
      const deleteShapeImages = []
      if (shapeImagesData && shapeImagesData.length > 0) {
        const newShapes = req.body.shapes
        const updateShapeImages = newShapes.map( (newShape, idx) => {
          let image
          for (const update of req.body.updateShapeImages) {
            if (update.idx == idx) {
              shapeImagesData.forEach( data => {
                let checkName = data.imagePublicId.split("-")[1]
                if (update.name == checkName) {
                  image = data
                }
              })
              if (product.shapes[idx] && product.shapes[idx].imagePublicId) {
                deleteShapeImages.push(product.shapes[idx].imagePublicId)
              }
              
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
        for (const shape of deleteShapeImages) {
          try {
            await cloudinary.uploader.destroy(shape)
          } catch (err) {
            return res
                    .status(400)
                    .json({ message: err.message })
          }
        }
        product.shapes = updateShapeImages
      }

      // 若有新的 colors 則刪除舊的
      const deleteColorImages = []
      if (colorImagesData && colorImagesData.length > 0) {
        const newColors = req.body.colors
        const updateColorImages = newColors.map( (newColor, idx) => {
          let image
          for (const update of req.body.updateColorImages) {
            if (update.idx == idx) {
              colorImagesData.forEach( data => {
                let checkName = data.imagePublicId.split("-")[1]
                if (update.name == checkName) {
                  image = data
                }
              })
              if (product.colors[idx] && product.colors[idx].imagePublicId) {
                deleteColorImages.push(product.colors[idx].imagePublicId)
              }
            }
          }
          if (!image) {
            return {
              'title': newColor.title,
              'imageURL': newColor.imageURL,
              'imagePublicId': newColor.imagePublicId
            }
          } else {
            return {
              'title': newColor.title,
              'imageURL': image.imageURL,
              'imagePublicId': image.imagePublicId
            }
          }
          
        })
        for (const color of deleteColorImages) {
          try {
            await cloudinary.uploader.destroy(color)
          } catch (err) {
            return res
                    .status(400)
                    .json({ message: err.message })
          }
        }
        product.colors = updateColorImages
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
    sortOrder = "asc",
    originEn,
    appearanceEn,
    functionalityEn,
    supportEn,
    brandEn
  } = req.query

  const pageNumber = parseInt(page, 10)
  const pageSize = parseInt(size, 10)

  const filter = {}
  if (status) { filter.status = status }

  if (category) { filter.parentCategory = category }

  if (originEn) { filter['origin.en'] = originEn }
  if (appearanceEn) { filter['appearance.en'] = appearanceEn }
  if (functionalityEn) { filter['functionality.en'] = functionalityEn }
  if (supportEn) { filter['support.en'] = supportEn }
  if (brandEn) { filter['brand'] = brandEn }
  
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