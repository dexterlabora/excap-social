// Configure the app settings here such as Web port, certificates, etc.



// read from the file system (used for SSL certs)
var fs = require('fs');

module.exports = {
  port: 8181,
  key  : fs.readFileSync('yourkey.key'),
  cert : fs.readFileSync('yourcert-gd-signed.crt'),
  ca: [fs.readFileSync('yourca.crt')]
};
