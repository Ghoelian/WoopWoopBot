const tmi = require('tmi.js')
const request = require('request')
const fs = require('fs')
const server = require('./server.js')
require('dotenv').config()

const opts = {
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.OAUTH_TOKEN
  },
  channels: [
    process.env.CHANNEL_NAME
  ]
}

const client = new tmi.Client(opts)

const addSong = (spotifyURL) => {
  const access = JSON.parse(fs.readFileSync('access.json'))

  const spotifyURI = checkFormat(spotifyURL)
  let result = 'Song added to queue!'

  if (spotifyURI === undefined) {
    result = 'This is not a supported URL format.'
  } else {
    request({
      headers: {
        Authorization: 'Bearer ' + access.SPOTIFY_USER_ACCESS,
        'Content-Type': 'application/json'
      },
      method: 'POST',
      url: `https://api.spotify.com/v1/playlists/${process.env.SPOTIFY_PLAYLIST_ID}/tracks?uris=${spotifyURI}`
    },
    (error, response, body) => {
      if (error || JSON.parse(body).error) {
        if (JSON.parse(body).error) {
          if (JSON.parse(body).error.message === 'The access token expired') {
            if (server.refresh() === 0) {
              console.log('[Bot] Refreshed token')
              result = 'Refreshed token, please try adding the song again.'
            } else {
              console.log('[Bot] Function server.refresh() returned exit code 1.')
              result = 'Refreshing token failed.'
            }
          }

          console.log('[Bot] We not good bois\n' + JSON.parse(body).error.status + '\n' + JSON.parse(body).error.message)
          result = 'Something went wrong'
        } else {
          console.log(error)
          result = 'Something went wrong'
        }
      } else {
        result = 'Song added to queue!'
      }
    })
  }

  return result
}

const onMessageHandler = (target, context, msg, self) => {
  if (self) { return }

  const parts = msg.split(' ')
  let commandNameIndex
  let commandName
  let songURL

  for (let i = 0; i < parts.length; i++) {
    if (parts[i].charAt(0) === '!' && commandNameIndex === undefined) {
      commandNameIndex = i
    }
  }

  if (commandNameIndex !== undefined && parts.length >= commandNameIndex + 1) {
    commandName = parts[commandNameIndex]
    songURL = parts[commandNameIndex + 1]
  }

  if (commandName === '!request') {
    const result = addSong(songURL)
    console.log(result)
    client.say(target, result)
  }
}

const onConnectedHandler = (addr, port) => {
  console.log(`[Bot] Connected to ${addr}:${port}`)
}

const checkFormat = (link) => {
  let buffer = ''
  let uri

  for (let i = 0; i < 7; i++) {
    if (link.charAt(i) !== undefined) {
      buffer += link.charAt(i)
    }
  }

  if (buffer === 'spotify') {
    uri = link
  } else if (buffer === 'https:/') {
    const temp = link.split('/')
    uri = `spotify:track:${temp[4]}`
  }

  return uri
}

client.on('message', onMessageHandler)
client.on('connected', onConnectedHandler)

client.connect()
