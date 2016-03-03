// Configure the app settings here such as Web port, certificates, etc.



// read from the file system (used for SSL certs)
var fs = require('fs');

module.exports = {
  port: 8181,
  key  : fs.readFileSync('./ssl/app.internetoflego.com.key'),
  cert : fs.readFileSync('./ssl/app.internetoflego.com-gd-signed.crt'),
  ca: [fs.readFileSync('./ssl/gd_bundle-g2-g1.crt')]
};
