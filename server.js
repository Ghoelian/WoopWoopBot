const express = require('express')
const app = express()
const fs = require('fs')
require('dotenv').config()

// const key = JSON.parse(fs.readFileSync('.key.json'))

app.use(express.static('public'))

app.get('/login', (req, res) => {
  const scopes = 'user-read-private user-read-email'
  res.redirect('https://accounts.spotify.com/authorize?response_type=code&client_id=' + process.env.SPOTIFY_API_ID + (scopes ? '&scope=' + encodeURIComponent(scopes) : '') + '&redirect_uri=' + encodeURIComponent('http://localhost:3000/callback'))
})

app.get('/callback', (req, res) => {
  process.env.SPOTIFY_USER_KEY = req.query.code

  const data = JSON.stringify({
    SPOTIFY_USER_KEY: req.query.code,
    SPOTIFY_USER_KEY_DATE: Date.now()
  }, null, 2)

  fs.writeFileSync('.key.json', data)
  res.send('Spotify authenticated.')
})

const listener = app.listen(process.env.PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
