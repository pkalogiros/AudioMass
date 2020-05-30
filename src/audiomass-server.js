const express = require('express')
const app = express()

var dir = __dirname;
app.use(express.static(dir+ '/'));

app.get('*', function (req, res) {
  res.sendFile(dir + 'index.html')
})

app.listen(5050, function () {
  console.log('Audiomass app listening on port 5050')
})
