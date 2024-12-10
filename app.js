const express =  require('express')
const mongoose =  require('mongoose')
const cors = require("cors")

const app = express()
const port = 3000

mongoose.connect("mongodb+srv://maxgray1986:M8q6Xp5epiC6bz5@cluster0.jyh9t.mongodb.net/")
const db = mongoose.connection

db.on('err', err => console.log(err))
db.once('open', () => console.log('Connected to database.'))

app.use(express.json())
app.use(cors())

const productRouter = require('./routes/product')
const authRouter = require('./routes/auth')
app.use("/product", productRouter)
app.use("/auth", authRouter)

app.get("/", (req, res) => {
    res.send("Server's running.")
})

app.listen(port, () => console.log(`App is listening on port ${port}.`))