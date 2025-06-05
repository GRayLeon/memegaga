const express = require('express')
const router = express.Router()
const Inquiry = require('../models/inquiry')
const authenticateToken = require('../middleware/auth')

const path = require('path')
const fs = require('fs')
const { createReport } = require('docx-templates')

require('dotenv').config()

// api
//// 取得所有詢問表單

router.get("/", getInquirys, (req, res) => {
  res.json(res.inquirys)
})


//// 下載表單

router.get("/download/:id", async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id)
    if (inquiry) {
      const templatePath = path.join(__dirname, '..', 'templates', 'report-template.docx')
      const template = fs.readFileSync(templatePath)

      const docxBuffer = await createReport({
        template,
        data: {
          ...inquiry.data,
          ...inquiry.printData,
          category: inquiry.category,
          status: inquiry.status,
          createTime: inquiry.createTime,
        },
        cmdDelimiter: ['{{', '}}']
      })

      fs.writeFileSync('./test.docx', docxBuffer)

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      res.setHeader('Content-Disposition', 'attachment; filename=report.docx')
      res.setHeader('Content-Length', docxBuffer.length)
      res.status(200)
      res.end(docxBuffer)
    } else {
      return res
              .status(404)
              .json({
                message: "Can't find inquiry."
              })
    }
  } catch (err) {
    console.error('Error generating docx:', err)
    res.status(500).send('產生 Word 文件失敗')
  }
})


//// 依 ID 取得詢問表單

router.get("/:id", async(req, res) => {
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


// 新增/編輯諮詢表單資訊

router.post("/:type", async (req, res) => {
  let inquiry = null
  let status = null

  const type = req.params.type
  if (type == 'edit') {
    try {
      inquiry = await Inquiry.findById(req.body._id)
      Object.assign(inquiry, req.body)
      status = 200
      wording = '修改'
    } catch (err) {
      res
        .status(400)
        .json({ message: err.message })
    }
  } else if (type == 'add') {
    inquiry = new Inquiry({ ...req.body })
    status = 201
    wording = '新增'
  }

  try {
    await inquiry.save()
    let id = (status == 201)? inquiry._id : null
    res.status(status).send(id)
  } catch (err) {
    res
      .status(400)
      .json({ message: err.message })
  }
})


//// 依條件查詢資料庫

async function getInquirys(req, res, next) {
  const {
    status,
    category,
    sortBy = "_id",
    sortOrder = "asc"
  } = req.query

  const filter = {}
  if (category) { filter.category = category }
  if (status) { filter.status = status }

  const sortDirection = sortOrder === "desc" ? -1 : 1
  const sort = { [sortBy]: sortDirection }

  try {
    const total = await Inquiry.countDocuments(filter);
    const inquirys = await Inquiry
                            .find(filter)
                            .sort(sort)
    if (inquirys == undefined) {
        return res
                .status(404)
                .json({
                  message: "Can't find inquiry."
                })
    } else {
      res.inquirys = {
        data: inquirys,
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