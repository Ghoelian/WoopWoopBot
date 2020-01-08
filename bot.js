const tmi = require('tmi.js')
const request = require('request')
require('dotenv').load()

const opts = {
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.OAUTH_TOKEN
  },
  channels: [
    process.env.CHANNEL_NAME
  ]
}

const client = new tmi.client(opts)

const addSong = (spotifyURL) => {
  // https://open.spotify.com/track/2c4s8OFu1IkIDdNA953M03
  // spotify:track:2c4s8OFu1IkIDdNA953M03
  const temp = spotifyURL.split('/')
  const spotifyURI = `spotify:track:${temp[4]}`
  let result = 'Oi wut nothin happen'

  request({
    headers: {
      'Authorization': process.env.SPOTIFY_API_SECRET,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    url: `https://api.spotify.com/v1/playlists/${process.env.SPOTIFY_PLAYLIST_ID}/tracks`,
    uri: spotifyURI
  },
    function (error, response, body) {
      if (error) {
        result = 'We not good bois ' + error
      } else {
        result = 'We good bois'
      }
    }
  )
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
    console.log(`Executed ${commandName} command`)
  }
}

const onConnectedHandler = (addr, port) => {
  console.log(`Connected to ${addr}:${port}`)
}

client.on('message', onMessageHandler)
client.on('connected', onConnectedHandler)

client.connect()
