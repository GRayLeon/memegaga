const express = require('express')
const router = express.Router()
const Project = require('../models/project')
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
      width: 1024,
      height: 1024,
      crop: "limit",
      quality: "auto",
      fetch_format: "auto"
    }]
    
    return {
      folder: "projects",
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
    const maxSize = 1 * 1024 * 1024
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      callback(new Error("僅接受 JPG 或 PNG 格式的圖片"))
    }

    if (file.size > maxSize) {
      callback(new Error("商品圖片大小不得超過 1MB"))
    }

    callback(null, true)
  }
})


// 限制上傳的圖片數量
const uploadFields = upload.fields([
  { name: "projectImages", maxCount: 10 }
])


// api
//// 取得產品列表

router.get("/", getProjects, (req, res) => {
  res.json(res.projects)
})


//// 依 ID 取得產品

router.get("/:id", async(req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (project) {
      res.json(project)
    } else {
      return res
              .status(404)
              .json({
                message: "Can't find project."
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
    const project = await Project.findById(req.params.id)
    if (project.imagePublicId) {
      await cloudinary.uploader.destroy(project.imagePublicId)
    }
    
    await project.deleteOne()
    res.json(`已成功刪除產品： ${project.name}`)
  } catch (err) {
    res
      .status(500)
      .json({ message: "Remove project faild." })
  }
})

// 新增/編輯商品資訊

router.post("/:type", authenticateToken, uploadFields, async (req, res) => {
  // 透過 upload 上傳圖片至 cloudinary 並取得相關資訊

  let projectImagesData = null

  const projectImages = req.files["projectImages"] || []
  if (projectImages) {
    projectImagesData = projectImages.map( file => ({
      'imageURL': file.path,
      'imagePublicId': file.filename
    }))
  }

  req.body.description = JSON.parse(req.body.description)
  req.body.detail = JSON.parse(req.body.detail)
  req.body.tags = JSON.parse(req.body.tags)
  req.body.imageList = JSON.parse(req.body.imageList)

  req.body.updateProjectImages = JSON.parse(req.body.updateProjectImages)

  let project
  let status
  let wording

  const type = req.params.type
  if (type == 'edit') {
    try {
      project = await Project.findById(req.body._id)
      Object.assign(project, req.body)


      // 若有新的 subImages 則刪除舊的
      const deleteProjectImages = []
      if (projectImagesData && projectImagesData.length > 0) {
        const newImages = []
        req.body.imageList.forEach( (list, listIdx) => {
          list.images.forEach( (image, idx) => {
            newImages.push({
              listIdx: listIdx,
              idx: idx,
              image: image
            })
          })
        })
        const updateProjectImages = newImages.map( newImage => {
          let image
          for (const update of req.body.updateProjectImages) {
            if (update.index[0] == newImage.listIdx && update.index[1] == newImage.idx) {
              projectImagesData.forEach( data => {
                let checkName = data.imagePublicId.split("-")[1]
                if (update.name == checkName) {
                  image = data
                }
              })
              if (project.imageList[newImage.listIdx].images[newImage.idx] && project.imageList[newImage.listIdx].images[newImage.idx].imagePublicId) {
                deleteProjectImages.push(project.imageList[newImage.listIdx].images[newImage.idx].imagePublicId)
              }
            }
          }
          if (!image) {
            return {
              'listIdx': newImage.listIdx,
              'idx': newImage.idx,
              'imageURL': newImage.image.imageURL,
              'imagePublicId': newImage.image.imagePublicId
            }
          } else {
            return {
              'listIdx': newImage.listIdx,
              'idx': newImage.idx,
              'imageURL': image.imageURL,
              'imagePublicId': image.imagePublicId
            }
          }
        })
        for (const image of deleteProjectImages) {
          try {
            await cloudinary.uploader.destroy(image)
          } catch (err) {
            return res
                    .status(400)
                    .json({ message: err.message })
          }
        }
        updateProjectImages.forEach( update => {
          project.imageList[update.listIdx].images[update.idx].imageURL = update.imageURL
          project.imageList[update.listIdx].images[update.idx].imagePublicId = update.imagePublicId
        })
        project.markModified('imageList')
      }

      status = 200
      wording = '修改'
    } catch (err) {
      res
        .status(400)
        .json({ message: err.message })
    }
  } else if (type == 'add') {
    project = new Project({ ...req.body })
    status = 201
    wording = '新增'
  }

  try {
    await project.save()
    res.status(status).send()
  } catch (err) {
    res
      .status(400)
      .json({ message: err.message })
  }
})


//// 依條件查詢資料庫

async function getProjects(req, res, next) {
  const { 
    status,
    category,
    sortBy = "_id",
    sortOrder = "asc",
    search
  } = req.query

  let filter = {}
  if (category) { filter.category = category }
  if (status) { filter.status = status }
  if (search) {
    const regex = new RegExp(search, 'i')
    filter = {
      $or: [
        { 'title': regex },
        { 'artist': regex },
        { 'artist': regex },
        { 'description.en': regex },
        { 'description.zh': regex },
        { 'detail.en': regex },
        { 'detail.zh': regex },
        { tags: { $elemMatch: { $regex: regex } } }
      ]
    }
  }

  const sortDirection = sortOrder === "desc" ? -1 : 1
  const sort = { [sortBy]: sortDirection }

  try {
    const total = await Project.countDocuments(filter);
    const projects = await Project
                            .find(filter)
                            .sort(sort)
    if (projects == undefined) {
        return res
                .status(404)
                .json({
                  message: "Can't find project."
                })
    } else {
      res.projects = {
        data: projects,
        pagination: {
          total
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