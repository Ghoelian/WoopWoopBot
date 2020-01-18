const express = require('express')
const app = express()
const fs = require('fs')
const uuidv4 = require('uuid/v4')
const request = require('request')
require('dotenv').config()

let state

app.use(express.static('public'))

app.get('/login', (req, res) => {
  state = uuidv4()
  const scopes = 'playlist-modify-public playlist-modify-private'
  res.redirect('https://accounts.spotify.com/authorize?response_type=code&client_id=' + process.env.SPOTIFY_API_ID + (scopes ? '&scope=' + encodeURIComponent(scopes) : '') + '&redirect_uri=' + encodeURIComponent('http://localhost:3000/auth') + '&state=' + state)
})

const refresh = () => {
  const access = JSON.parse(fs.readFileSync('access.json'))
  let result

  request({
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      Authorization: 'Basic ' + Buffer.from(process.env.SPOTIFY_API_ID + ':' + process.env.SPOTIFY_API_SECRET).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    method: 'POST',
    body: 'grant_type=refresh_token&refresh_token=' + access.SPOTIFY_USER_REFRESH_TOKEN
  },
  (error, response, body) => {
    if (error || JSON.parse(body).error) {
      if (JSON.parse(body).error) {
        console.log('[Server] We not good bois\n' + JSON.parse(body).error + '\n' + JSON.parse(body).error_description)
        result = 1
      } else {
        console.log('[Server] We not good bois\n' + error)
        result = 1
      }
      console.log('[Server] Something went wrong.')
      result = 1
    } else {
      console.log('[Server] We good bois')
      result = 0
      const data = JSON.stringify({
        SPOTIFY_USER_ACCESS: JSON.parse(body).access_token,
        SPOTIFY_USER_ACCESS_EXPIRES_IN: JSON.parse(body).expires_in,
        SPOTIFY_USER_REFRESH_TOKEN: access.SPOTIFY_USER_REFRESH_TOKEN
      }, null, 2)

      fs.writeFileSync('access.json', data)
      console.log('[Server] We good')
      result = 0
    }
  })

  return result
}

app.get('/auth', (req, res) => {
  const key = JSON.parse(fs.readFileSync('auth.json'))

  if (req.query.state === state) {
    const data = JSON.stringify({
      SPOTIFY_USER_AUTHORIZATION: req.query.code,
      SPOTIFY_USER_AUTHORIZATION_DATE: Date.now()
    }, null, 2)

    fs.writeFileSync('auth.json', data)
    console.log(key.SPOTIFY_USER_AUTHORIZATION)
    request({
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        Authorization: 'Basic ' + Buffer.from(process.env.SPOTIFY_API_ID + ':' + process.env.SPOTIFY_API_SECRET).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      body: `grant_type=authorization_code&code=${key.SPOTIFY_USER_AUTHORIZATION}&redirect_uri=http://localhost:3000/auth`
    },
    (error, response, body) => {
      if (error || JSON.parse(body).error) {
        if (JSON.parse(body).error) {
          console.log('We not good bois\n' + JSON.parse(body).error + '\n' + JSON.parse(body).error_description)
        } else {
          console.log('We not good bois\n' + error)
        }
        console.log('Something went wrong.')
      } else {
        console.log('We good bois')
        const data = JSON.stringify({
          SPOTIFY_USER_ACCESS: JSON.parse(body).access_token,
          SPOTIFY_USER_ACCESS_EXPIRES_IN: JSON.parse(body).expires_in,
          SPOTIFY_USER_REFRESH_TOKEN: JSON.parse(body).refresh_token
        }, null, 2)

        fs.writeFileSync('access.json', data)
        res.send('We good')
      }
    })
  } else {
    res.send('Invalid state parameter.')
  }
})

const listener = app.listen(process.env.PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

exports.refresh = refresh
