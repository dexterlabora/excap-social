# Cisco Meraki ExCap Splash Page Server /w Social OAuth using Passport

##Overview

This NodeJS applications demonstrates how the ExCap API can be used for delivering a custom Captive Portal / Splash Page with Cisco Meraki access points.

More info about the ExCap API: https://meraki.cisco.com/lib/pdf/meraki_whitepaper_captive_portal.pdf

Complete write-up for this application can be found here: http://www.InternetOfLEGO.com/wifi-hotspot-with-social-oauth-passport-mongodb

###Written by
Cory Guynn, 2016
www.InternetOfLego.com




#Installation

##Configure the Cisco Meraki Wi-Fi SSID

* Logon to the Meraki Dashboard

* Dashboard --> Wireless --> Access Control: (select SSID name from list)

* Configure an SSID with a Sign-on or Click-through splash page.

* Scroll down the page and enable the "Walled Garden". Enter the IP address of your web server, to provide access to your splash page content prior to authentication. Enter any additional IP addresses for hosted content such as social websites (OAuth), style sheets, images, terms of service, etc in this section as well.

##Configure the Splash Page

* Dashboard --> Wireless --> Configure --> Splash Page Select: Use custom URL

* Enter the URL for the splash page. 

Sign-on w/ RADIUS

* http://yourserver/signon


Click-through w/ Social Passport

* http://yourserver/click


#Run


Clone and install the app
```
git clone "https://github.com/dexterlabora/excap-social"

npm install

```   

##Install MongoDB

Download and instructions:
https://www.mongodb.org/downloads#production

##Create Config files

These files are used to store your API credentials, MongoDB connection, and configs (Express options). They are not included in the GitHub repo, so please copy and paste these samples into a new file.

###config/auth.js
```
// config/auth.js


// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        'clientID'        : 'xxxxxxxxxxxxx', // your App ID
        'clientSecret'    : 'yyyyyyyyyyyyyyyy', // your App Secret
        'callbackURL'     : 'https://excap.internetoflego.com:8181/auth/facebook/callback'
    },

    'twitterAuth' : {
        'consumerKey'        : 'xxxxxxxxxxxxxxxxx',
        'consumerSecret'     : 'yyyyyyyyyyyyyyyyyy',
        'callbackURL'        : 'https://excap.internetoflego.com:8181/auth/twitter/callback'
    },

    'linkedinAuth' : {
        'consumerKey'        : 'xxxxxxxxxxxxxxxxx',
        'consumerSecret'     : 'yyyyyyyyyyyyyyyyy',
        'callbackURL'        : 'https://excap.internetoflego.com:8181/auth/linkedin/callback'
    },

    'googleAuth' : {
        'clientID'         : 'xxxxxxxxxxxxxxxxxx',
        'clientSecret'     : 'yyyyyyyyyyyyyyyyyyy,
        'callbackURL'      : 'https://excap.internetoflego.com:8181/auth/google/callback'
    }

};
```
###config/config.js

This is where you will define the web port that the server listens on (i.e. 8181) and the SSL certificate information. You will need to create your own self-signed certificate or purchase one. This examples uses a GoDaddy SSL certificate and places the files in an SSL directory. 
```
// Configure the app settings here such as Web port, certificates, etc.

// read from the file system (used for SSL certs)
var fs = require('fs');

module.exports = {
  port: 8181,  // WEB PORT
  key  : fs.readFileSync('./ssl/excap.yourserver.com.key'),
  cert : fs.readFileSync('./ssl/excap.yourserver.com-gd-signed.crt'),
  ca: [fs.readFileSync('./ssl/gd_bundle-g2-g1.crt')]
};
```

###config/database.js
```
Store the connection string to your MongoDB database here

// config/database.js
module.exports = {

    'url' : 'mongodb://localhost/excap' 

};
``` 

#Start the Server and Test

While in the /excap-social directory, use "node" to start the application.

```
node app.js
```
To run this app in production, I highly suggest using PM2. This will run the NodeJS application as a service, which supports logging and auto-restart.

```
pm2 start app.js --name "excap-social"
```



#Reporting
You can see the session data by going to the MongoDB REST API or exploring the MongoDB manually.

*http://yourserver/ap1/v1/users
*http://yourserver/ap1/v1/sessions




#Security Notes

- You should run this using SSL. 
- Store your session and user data in a secure system behind a firewall
- Disable the built-in MongoDB Rest interface (which is for demo only)



##Disable MongoDB REST interface

Find the following code and comment out the middleware to prevent unauthorized access to sensitive session and user data after you have examined the data and place this into production. At that point, you may want to build a separate application to utilize this data or use a third party application. The MongoDB website offers several admin and reporting UI options.
```
// =================================
// Admin Site mongodb API access
// =================================

// provide MongoDB REST API for JSON session data
// SECURITY WARNING -- ALL USER and SESSION DATA IS AVAILABLE BY ACCESSING THIS ROUTE ! ! ! !
// need to implement tokens / auth solution
  // example to pull JSON data http://yourserver:8181/api/v1/users
var expressMongoRest = require('express-mongo-rest');
//app.use('/api/v1', expressMongoRest('mongodb://localhost:27017/excap'));
```

Disclaimer

This ExCap server is intended as a proof of concept and comes with no guarantee. Please feel free to use, abuse or contribute to this code. Feedback is appreciated!
