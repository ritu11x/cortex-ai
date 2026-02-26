 const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
const fetchUrlRoute = require('./routes/fetchUrl')

// Add this with your other routes:
app.use('/api/fetch-url', fetchUrlRoute)
app.use(cors())
app.use(express.json())

const itemsRouter = require('./routes/items')
const chatRouter = require('./routes/chat')

app.get('/', (req, res) => {
  res.json({ message: 'Miles Clone API running!' })
})

app.use('/api/items', itemsRouter)
app.use('/api/chat', chatRouter)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})