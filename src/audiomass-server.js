const express = require('express')
const app = express()
var router = express.Router();


var dir = __dirname;
app.use(express.static(dir+ '/'));

app.get('*', function (req, res) {
  res.sendFile(dir + 'index.html')
  //res.sendFile('/index.html')
})

app.listen(5050, function () {
  console.log('Example app listening on port 5050')
})
