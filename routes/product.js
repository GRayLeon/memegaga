const express = require('express')
const router = express.Router()
const Product = require('../models/product')

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

router.get("/:id", getProduct, (req, res) => {
  res.json(res.product)
})

router.delete("/:id", getProduct, async (req, res) => {
  try {
    await res.product.deleteOne()
    res.json(`已成功刪除產品： ${res.product.name}`)
  } catch (err) {
    res
      .status(500)
      .json({ message: "Remove product faild." })
  }
})

router.patch("/:id", getProduct, async (req, res) => {
  Object.assign(res.product, req.body)
  try {
    const updateProduct = await res.product.save()
    res.json(`已成功更新產品資訊： ${updateProduct.name}`)
  } catch (err) {
    console.log(err)
    res
      .status(400)
      .json({ message:"Update product failed" })
  }
})

router.post("/", async (req, res) => {
    const product = new Product({ ...req.body })
    try {
        const newProduct = await product.save()
        res
          .status(201)
          .json(`已成功新增使用者： ${newProduct.name}`)
    } catch (err) {
        res
          .status(400)
          .json({ message: err.message })
    }
})

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