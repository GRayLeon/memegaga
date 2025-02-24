const express = require('express')
const router = express.Router()
const Region = require('../models/region')
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
    let transformation = [{ 
      width: 100,
      height: 100,
      crop: "limit",
      quality: "auto",
      fetch_format: "auto"
    }]

    return {
      folder: "regions",
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
    const maxSize = 500 * 1024
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      callback(new Error("僅接受 JPG 或 PNG 格式的圖片"))
    }

    if (file.size > maxSize) {
      callback(new Error("圖片大小不得超過 500KB"))
    }

    callback(null, true)
  }
})


// api
//// 取得所有地區

router.get("/", async (req, res) => {
  try {
    const region = await Region.find()
    res.json(region)
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message })
  }
})


//// 依 ID 刪除地區

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const region = await Region.findById(req.params.id)
    
    await region.deleteOne()
    res.json(`已成功刪除地區： ${region.name}`)
  } catch (err) {
    res
      .status(500)
      .json({ message: "Remove region faild." })
  }
})


// 新增/編輯商品資訊

router.post("/:type", authenticateToken, upload.single("image"), async (req, res) => {
  // 透過 upload 上傳圖片至 cloudinary 並取得相關資訊

  const imageURL = req.file?.path
  const imagePublicId = req.file?.filename

  // 判斷 type 再生成 region
  let region
  let status
  let wording

  req.body.name = JSON.parse(req.body.name)

  const type = req.params.type
  if (type == 'edit') {
    try {
      region = await Region.findById(req.body._id)
      Object.assign(region, req.body)
      
      // 若有新的 imagePublicId 則刪除舊的
      if (imagePublicId) {
        if (region.imagePublicId) {
          await cloudinary.uploader.destroy(region.imagePublicId)
        }
        region.imagePublicId = imagePublicId
        region.imageURL = imageURL
      }

      status = 200
      wording = '修改'
    } catch (err) {
      res
        .status(400)
        .json({ message: err.message })
    }
  } else if (type == 'add') {
    region = new Region({ ...req.body, imageURL, imagePublicId })
    status = 201
    wording = '新增'
  }

  try {
    await region.save()
    res.status(status).send()
  } catch (err) {
    res
      .status(400)
      .json({ message: err.message })
  }
})


module.exports = router