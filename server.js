const express = require("express")
const app = express()
require('dotenv').load()

app.use(express.static("public"))

app.get('/login', (req, res) => {
  const scopes = 'user-read-private user-read-email'
  res.redirect('https://accounts.spotify.com/authorize?response_type=code&client_id=' + process.env.SPOTIFY_API_ID + (scopes ? '&scope=' + encodeURIComponent(scopes) : '') + '&redirect_uri=' + encodeURIComponent('/success'))
})

app.get('/success', (req, res) => {
  console.log('Success')
})

const listener = app.listen(process.env.PORT, () => {
  console.log(process.env)

  console.log("Your app is listening on port " + listener.address().port)
})
