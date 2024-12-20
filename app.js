const express =  require('express')
const mongoose =  require('mongoose')
const cors = require("cors")

const app = express()
const port = 3000

require('dotenv').config()

mongoose.connect(process.env.MONGO_URI)
const db = mongoose.connection

db.on('err', err => console.log(err))
db.once('open', () => console.log('Connected to database.'))

app.use(express.json())
app.use(cors())

const productRouter = require('./routes/product')
const authRouter = require('./routes/auth')
const categoryRouter = require('./routes/category')
const sizeRouter = require('./routes/size')

app.use("/product", productRouter)
app.use("/auth", authRouter)
app.use("/category", categoryRouter)
app.use("/size", sizeRouter)

app.get("/", (req, res) => {
    res.send("Server's running.")
})

app.listen(port, () => console.log(`App is listening on port ${port}.`))