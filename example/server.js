const port = 3000

const express = require('express')
const app = express()

app.get('/mirror', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.json({query: req.query, body: req.body})
})

app.post('/mirror', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.json({query: req.query, body: req.body})
})

app.get('/constant', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.json('3.14')
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
