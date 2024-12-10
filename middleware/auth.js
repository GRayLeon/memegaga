const jwt = require('jsonwebtoken')
const JWT_SECRET = 'memegaga_jwt_secret'

const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]
  if (!token) {
    return res
            .status(401)
            .json({ error: 'No token provided.' })
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res
              .status(403)
              .json({ error: 'Invalid token' })
    }
    req.account = decoded
    next()
  })
}

module.exports = authenticateToken