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
    const templatePath = path.join(__dirname, '..', 'templates', 'report-template.docx')
    const template = fs.readFileSync(templatePath)

    const docxBuffer = await createReport({
      template,
      data: {
        title: '測試一下',
        subtitle: '你看到表示你成功了'
      },
      cmdDelimiter: ['{{', '}}']
    })

    fs.writeFileSync('./test.docx', docxBuffer)

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    res.setHeader('Content-Disposition', 'attachment; filename=report.docx')
    res.setHeader('Content-Length', docxBuffer.length)
    res.status(200)
    res.end(docxBuffer)
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


// 新增/編輯商品資訊

router.post("/", async (req, res) => {
  const inquiry = new Inquiry({ ...req.body })

  try {
    await inquiry.save()
    res.status(201).send()
  } catch (err) {
    res
      .status(400)
      .json({ message: err.message })
  }
})


//// 依條件查詢資料庫

async function getInquirys(req, res, next) {

  try {
    const inquirys = await Inquiry.find()
    if (inquirys == undefined) {
        return res
                .status(404)
                .json({
                  message: "Can't find inquiry."
                })
    } else {
      res.inquirys = inquirys
      next()
    }
  } catch (err) {
      res
        .status(500)
        .json({ message: err.message })
  }
}

module.exports = router