const express = require('express')
const router = express.Router()
const Pages = require('../models/pages')
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
    if (file.fieldname === "indexImages" || file.fieldname === "visionImage") {
      transformation = [{ 
        width: 1024,
        height: 1024,
        crop: "limit",
        quality: "auto",
        fetch_format: "auto"
      }]
    } else if (file.fieldname === "partnerImages") {
      transformation = [{
        width: 100,
        height: 100,
        crop: "limit",
        quality: "auto",
        fetch_format: "auto"
      }]
    }
    
    return {
      folder: "pages",
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
    
    if ((file.fieldname === "indexImages" || file.fieldname === "visionImage") && file.size > maxSizeLargeImage) {
      callback(new Error("商品圖片大小不得超過 1MB"))
    }

    if (file.fieldname === "partnerImages" && file.size > maxSizeSmallImage) {
      callback(new Error("規格圖片大小不得超過 300KB"))
    }

    callback(null, true)
  }
})


// 限制上傳的圖片數量
const uploadFields = upload.fields([
  { name: "indexImages", maxCount: 5 },
  { name: "visionImage", maxCount: 1 },
  { name: "partnerImages", maxCount: 20 }
])


// api
//// 取得產品列表

router.get("/", async (req, res) => {
  try {
    const pages = await Pages.findOne()
    res.json(pages)
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message })
  }
})


// 新增/編輯商品資訊

router.post("/:type", authenticateToken, uploadFields, async (req, res) => {
  // 透過 upload 上傳圖片至 cloudinary 並取得相關資訊

  // const indexImage = req.files["indexImage"] ? req.files["indexImage"][0] : null
  // const indexImageURL = indexImage?.path || null
  // const indexImagePublicId = indexImage?.filename || null

  let indexImagesData = null

  const indexImages = req.files["indexImages"] || []
  if (indexImages) {
    indexImagesData = indexImages.map( file => ({
      'imageURL': file.path,
      'imagePublicId': file.filename
    }))
  }

  const visionImage = req.files["visionImage"] ? req.files["visionImage"][0] : null
  const visionImageURL = visionImage?.path || null
  const visionImagePublicId = visionImage?.filename || null

  let partnerImagesData = null

  const partnerImages = req.files["partnerImages"] || []
  if (partnerImages) {
    partnerImagesData = partnerImages.map( file => ({
      'imageURL': file.path,
      'imagePublicId': file.filename
    }))
  }

  req.body.index = JSON.parse(req.body.index)
  req.body.vision = JSON.parse(req.body.vision)
  req.body.partners = JSON.parse(req.body.partners)
  req.body.contact = JSON.parse(req.body.contact)

  let pages
  let status
  let wording

  const type = req.params.type
  if (type == 'edit') {
    try {
      pages = await Pages.findOne()
      Object.assign(pages, req.body)

      // 若有新的 indexImagePublicId 則刪除舊的
      // if (indexImagePublicId) {
      //   if (pages.index.imagePublicId) {
      //     await cloudinary.uploader.destroy(pages.index.imagePublicId)
      //   }
      //   pages.index.imagePublicId = indexImagePublicId
      //   pages.index.imageURL = indexImageURL
      // }

      const deleteIndexImages = []
      if (indexImagesData && indexImagesData.length > 0) {
        const newImages = req.body.index.images
        req.body.updateIndexImages = JSON.parse(req.body.updateIndexImages)
        const updateIndexImages = newImages.map( (newImage, idx) => {
          let image
          for (const update of req.body.updateIndexImages) {
            if (update.idx == idx) {
              indexImagesData.forEach( data => {
                let checkName = data.imagePublicId.split("-")[1]
                if (update.name == checkName) {
                  image = data
                }
              })
              if (pages.index.images[idx] && pages.index.images[idx].imagePublicId) {
                deleteIndexImages.push(pages.index.images[idx].imagePublicId)
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
        for (const image of deleteIndexImages) {
          try {
            await cloudinary.uploader.destroy(image)
          } catch (err) {
            return res
                    .status(400)
                    .json({ message: err.message })
          }
        }
        pages.index.images = updateIndexImages
      }

      // 若有新的 imagePublicId 則刪除舊的
      if (visionImagePublicId) {
        if (pages.vision.imagePublicId) {
          await cloudinary.uploader.destroy(pages.vision.imagePublicId)
        }
        pages.vision.imagePublicId = visionImagePublicId
        pages.vision.imageURL = visionImageURL
      }

      // 若有新的 partnerImages 則刪除舊的
      const deletePartnerImages = []
      if (partnerImagesData && partnerImagesData.length > 0) {
        const newImages = req.body.partners
        req.body.updatePartnerImages = JSON.parse(req.body.updatePartnerImages)
        const updatePartnerImages = newImages.map( (newImage, idx) => {
          let image
          for (const update of req.body.updatePartnerImages) {
            if (update.idx == idx) {
              partnerImagesData.forEach( data => {
                let checkName = data.imagePublicId.split("-")[1]
                if (update.name == checkName) {
                  image = data
                }
              })
              if (pages.partners[idx] && pages.partners[idx].imagePublicId) {
                deletePartnerImages.push(pages.partners[idx].imagePublicId)
              }
            }
          }
          if (!image) {
            return {
              'name': newImage.name,
              'imageURL': newImage.imageURL,
              'imagePublicId': newImage.imagePublicId
            }
          } else {
            return {
              'name': newImage.name,
              'imageURL': image.imageURL,
              'imagePublicId': image.imagePublicId
            }
          }
          
        })
        for (const image of deletePartnerImages) {
          try {
            await cloudinary.uploader.destroy(image)
          } catch (err) {
            return res
                    .status(400)
                    .json({ message: err.message })
          }
        }
        pages.partners = updatePartnerImages
      }

      status = 200
      wording = '修改'
    } catch (err) {
      res
        .status(400)
        .json({ message: err.message })
    }
  } else if (type == 'add') {
    pages = new Pages({ ...req.body })
    status = 201
    wording = '新增'
  }

  try {
    await pages.save()
    res.status(status).send()
  } catch (err) {
    res
      .status(400)
      .json({ message: err.message })
  }
})


module.exports = router