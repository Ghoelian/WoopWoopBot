const express = require('express')
const app = express()
const fs = require('fs')
const uuidv4 = require('uuid/v4')
const request = require('request')

require('dotenv').config()

const key = JSON.parse(fs.readFileSync('auth.json'))
let state

app.use(express.static('public'))

app.get('/login', (req, res) => {
  state = uuidv4()
  const scopes = 'playlist-modify-public playlist-modify-private'
  res.redirect('https://accounts.spotify.com/authorize?response_type=code&client_id=' + process.env.SPOTIFY_API_ID + (scopes ? '&scope=' + encodeURIComponent(scopes) : '') + '&redirect_uri=' + encodeURIComponent('http://localhost:3000/callback') + '&state=' + state)
})

app.get('/callback', (req, res) => {
  if (req.query.state === state) {
    const data = JSON.stringify({
      SPOTIFY_USER_AUTHORIZATION: req.query.code,
      SPOTIFY_USER_AUTHORIZATION_DATE: Date.now(),
      SPOTIFY_USER_AUTHORIZATION_EXPIRES_IN: req.query.expires_in
    }, null, 2)

    fs.writeFileSync('auth.json', data)

    request({
      headers: {
        Authorization: 'Basic ' + Buffer.alloc(process.env.SPOTIFY_API_SECRET).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      url: 'https://accounts.spotify.com/api/token',
      body: {
        grant_type: 'authorization_code',
        code: key.SPOTIFY_USER_AUTHORIZATION,
        redirect_uri: 'http://localhost:3000/token'
      }
    },
    (error, response, body) => {
      if (error) {
        console.log('We not good bois ' + error)
      } else {
        console.log('We good bois')
      }
    })

    res.send('Spotify authenticated.')
  } else {
    res.send('Invalid state parameter.')
  }
})

app.get('/token', (req, res) => {
  const data = JSON.stringify({
    SPOTIFY_USER_ACCESS: req.query.access_token,
    SPOTIFY_USER_ACCESS_EXPIRES_IN: req.query.expires_in,
    SPOTIFY_USER_REFRESH_TOKEN: req.query.refresh_token
  })

  fs.writeFileSync('access.json', data)
})

const listener = app.listen(process.env.PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
