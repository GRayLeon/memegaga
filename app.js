const express =  require('express')

const rfs = require('rotating-file-stream')
const path = require('path')
const morgan = require('morgan')

const mongoose =  require('mongoose')
const cors = require("cors")

const app = express()
const port = 3000

const accessLogStream = rfs.createStream('access.log', {
  interval: '1d',
  path: path.join(__dirname, 'logs'),
  maxFiles: 30
})

app.use(morgan('common', { stream: accessLogStream }))

require('dotenv').config()

mongoose.connect(process.env.MONGO_URI)
const db = mongoose.connection

db.on('err', err => console.log(err))
db.once('open', () => console.log('Connected to database.'))

app.use(express.json())
app.use(cors())

const productRouter = require('./routes/product')
const projectRouter = require('./routes/project')
const newsRouter = require('./routes/news')
const brandRouter = require('./routes/brand')
const pagesRouter = require('./routes/pages')
const authRouter = require('./routes/auth')
const categoryRouter = require('./routes/category')
const sizeRouter = require('./routes/size')
const regionRouter = require('./routes/region')
const specRouter = require('./routes/spec')
const inquiryRouter = require('./routes/inquiry')

app.use("/product", productRouter)
app.use("/project", projectRouter)
app.use("/brand", brandRouter)
app.use("/news", newsRouter)
app.use("/pages", pagesRouter)
app.use("/auth", authRouter)
app.use("/category", categoryRouter)
app.use("/size", sizeRouter)
app.use("/region", regionRouter)
app.use("/spec", specRouter)
app.use("/inquiry", inquiryRouter)

app.get("/", (req, res) => {
  res.send("Server's running.")
})

app.listen(port, () => console.log(`App is listening on port ${port}.`))