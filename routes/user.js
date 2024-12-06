const express = require('express')
const router = express.Router()
const User = require('../models/user')
const user = require('../models/user')

router.get("/", async (req, res) => {
    try {
        const user = await User.find()
        res.json(user)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

router.get("/:id", getUser, (req, res) => {
    res.json(res.user)
})

router.delete("/:id", getUser, async (req, res) => {
    try {
        await res.user.deleteOne()
        res.json(`已成功刪除使用者： ${res.user.name}`)
    } catch (err) {
        res.status(500).json({ message: "Remove user faild." })
    }
})

router.patch("/email/:email", getUserByEmail, async (req, res) => {
    if (req.body.name !== null) {
        res.user.name = req.body.name
    }
    if (req.body.age !== null) {
        res.user.age = req.body.age
    }
    try {
        const updateUser = await res.user.save()
        res.json(`已成功更新使用者： ${updateUser.name}`)
    } catch (err) {
        res.status(400).json({ message:"Update User failed" })
    }
})

async function getUser(req, res, next) {
    let user
    try {
        user = await User.findById(req.params.id)
        if (user == undefined) {
            return res.status(404).json({ message: "Can't find user."})
        }
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
    res.user = user
    next()
}

async function getUserByEmail(req, res, next) {
    let user
    try {
        user = await User.findOne({ email: req.params.email })
        if (user == undefined) {
            return res.status(404).json({ message: "Can't find user."})
        }
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
    res.user = user
    next()
}

router.post("/", async (req, res) => {
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        age: req.body.age
    })
    try {
        const newUser = await user.save()
        res.status(201).json(`已成功新增使用者： ${newUser.name}`)
    } catch (err) {
        res.status(400).json({ message: err.message })
    }
})

module.exports = router