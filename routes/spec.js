const express = require('express')
const router = express.Router()
const Spec = require('../models/spec')
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

    transformation = [{ 
      width: 500 ,
      height: 500,
      crop: "limit",
      quality: "auto",
      fetch_format: "auto"
    }]

    return {
      folder: "brands",
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
    const maxSize = 1 * 500 * 1024
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      callback(new Error("僅接受 JPG 或 PNG 格式的圖片"))
    }

    if (file.size > maxSize) {
      callback(new Error("商品圖片大小不得超過 500k"))
    }

    callback(null, true)
  }
})


// 限制上傳的圖片數量
const uploadFields = upload.fields([
  { name: "brandImages", maxCount: 20 }
])


// api
//// 取得規格列表

router.get("/", async (req, res) => {
  try {
    const spec = await Spec.findOne()
    res.json(spec)
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message })
  }
})


// 編輯規格

router.post("/", authenticateToken, uploadFields, async (req, res) => {
  // 透過 upload 上傳圖片至 cloudinary 並取得相關資訊

  let brandImagesData = null

  const brandImages = req.files["brandImages"] || null
  if (brandImages) {
    brandImagesData = brandImages.map( file => ({
      'imageURL': file.path,
      'imagePublicId': file.filename
    }))
  }

  req.body.updateBrands = JSON.parse(req.body.updateBrands)
  req.body.origin = JSON.parse(req.body.origin)
  req.body.appearance = JSON.parse(req.body.appearance)
  req.body.functionality = JSON.parse(req.body.functionality)
  req.body.support = JSON.parse(req.body.support)
  req.body.brands = JSON.parse(req.body.brands)

  let spec

  try {
    spec = await Spec.findOne()
    Object.assign(spec, req.body)

    // 若有新的 brandImages 則刪除舊的
    const deleteBrands = []
    if (brandImagesData && brandImagesData.length > 0) {
      const newBrands = req.body.brands.list
      const updatedBrands = newBrands.map( (newBrand, idx) => {
        let image
        for (const update of req.body.updateBrands) {
          if (update.idx == idx) {
            brandImagesData.forEach( data => {
              let checkName = data.imagePublicId.split("-")[1]
              if (update.name == checkName) {
                image = data
              }
            })
            if (spec.brands.list[idx].imagePublicId) {
              deleteBrands.push(spec.brands.list[idx].imagePublicId)
            }
          }
        }
        if (!image) {
          return {
            'name': newBrand.name,
            'imageURL': newBrand.imageURL,
            'imagePublicId': newBrand.imagePublicId
          }
        } else {
          return {
            'name': newBrand.name,
            'imageURL': image.imageURL,
            'imagePublicId': image.imagePublicId
          }
        }
      })
      for (const image of deleteBrands) {
        try {
          await cloudinary.uploader.destroy(image)
        } catch (err) {
          return res
                  .status(400)
                  .json({ message: err.message })
        }
      }
      spec.brands.list = updatedBrands
    }

  } catch (err) {
    res
      .status(400)
      .json({ message: err.message })
  }

  try {
    await spec.save()
    res.status(200).send()
  } catch (err) {
    res
      .status(400)
      .json({ message: err.message })
  }
})

// 新增規格

router.post("/add", async (req, res) => {
  let spec = null

  spec = new Spec({ ...req.body })
  wording = '新增'

  try {
    await spec.save()
    res.status(201).send()
  } catch (err) {
    res
      .status(400)
      .json({ message: err.message })
  }
})

router.delete("", authenticateToken, async (req, res) => {
  try {
    let spec = await Spec.findOne()
    if (spec) {
      await spec.deleteOne()
      res.json(`已成功刪除規格`)
    } else {
      return res
              .status(404)
              .json({
                message: "Can't find spec."
              })
    } 
  } catch (err) {
    res
      .status(400)
      .json({ error: err.message })
  }
})

module.exports = router