// app.js

// ################################################################
// Overview
// ################################################################
/*
External Captive Portal (ExCAP) for Cisco Meraki MR access points and MX security appliances.

This application provides a basic click-through and sign-on (with RADIUS auth) splash page where the login will complete on a success page.

Click-through usage:   https://yourserver/click
  Authentication provided by Passport OAuth for social network login
  http://passportjs.org/

Sign-on usage:         https://yourserver/signon
  Authentication provided by third party RADIUS server

Data can be exported using the MongoDB REST API
  https://yourserver.com:8181/api/v1/users
  https://yourserver.com:8181/api/v1/sessions

NOTE:
The config directory will need to be updated prior to running application.
The database, social OAuth API keys and SSL certificates will need to be defined.

All session and user data is stored in a local MongoDB, which needs to be configured first!
https://docs.mongodb.org/manual/installation/

All HTML content uses Handlebars to provide dynamic data to the various pages.
The structure of the HTML pages can be modified under /views/
Images, styles and client scripts are stored in /public/

Written by Cory Guynn - 2015
www.InternetOfLego.com

This application comes with no guarantee and is intended as a proof of concept.
Feel free to use and abuse this code.
*/

// ################################################################
// Utilities
// ################################################################

// used for debugging purposes to easily print out object data
var util = require('util');
  //Example: console.log(util.inspect(myObject, false, null));

// display all web requests on concole
var morgan = require('morgan');

// database to store user & session info
var configDB = require('./config/database.js');
var mongoose = require('mongoose');

// ################################################################
// Web Services and Middleware
//  Express with SSL
// ################################################################


var config = require('./config/config.js')
var port = config.port;
var https = require('https');
var app = require('express')();
var options = {
   key  : config.key,
   cert : config.cert,
   ca   : config.ca
};

// =================================
// express webserver service
// =================================
var express = require('express');

// create the web app
var app = express();


// =================================
// passport configuration
// =================================

// connect to our database via mongoose
mongoose.connect(configDB.url);

// social extra utils
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var passport = require('passport');
var flash    = require('connect-flash');

app.use(morgan('dev')); // log every request to the console
app.use(flash()); // use connect-flash for flash messages stored in session

require('./config/passport')(passport); // pass passport for configuration
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(cookieParser()); // read cookies (needed for auth)

// =================================
// session state
// =================================

var session = require('express-session');
var MongoDBStore = require('connect-mongodb-session')(session);
var store = new MongoDBStore({
    //uri: 'mongodb://localhost:27017/excap',
    uri: configDB.url,
    collection: 'sessions'
});
// Catch errors
store.on('error', function(error) {
    console.log("error connecting to MongoDBStore: "+error);
});

app.use(require('express-session')({
  secret: 'supersecret',  // this secret is used to encrypt cookie and session state. Client will not see this.
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  },
  store: store,
  resave: true,
  saveUninitialized: true
}));


// =================================
// define the static resources for the splash pages
// =================================
app.use(express.static('./public'));
/*
var path = require('path');
app.use("/public", express.static(path.join(__dirname, 'public')));
app.use("/css",  express.static(__dirname + '/public/css'));
app.use("/img", express.static(__dirname + '/public/img'));
app.use("/js", express.static(__dirname + '/public/js'));
*/


// instruct the app to use the `bodyParser()` middleware for all routes
app.use(bodyParser.urlencoded({
extended: true
}));
app.use(bodyParser.json());


// =================================
// Handlebars to provide dynamic content in HTML pages
// =================================

var exphbs = require('express3-handlebars');
app.engine('.hbs', exphbs({defaultLayout: 'single', extname: '.hbs'}));
app.set('view engine', '.hbs');

// =================================
// ROUTES #########################################################
// =================================

// =================================
// Admin Site mongodb API access
// =================================

// provide MongoDB REST API for JSON session data
// SECURITY WARNING -- ALL USER and SESSION DATA IS AVAILABLE BY ACCESSING THIS ROUTE ! ! ! !
// need to implement tokens / auth solution
  // example to pull JSON data http://yourserver:8181/api/v1/users
var expressMongoRest = require('express-mongo-rest');
app.use('/api/v1', expressMongoRest('mongodb://localhost:27017/excap'));



// ################################################################
// Click-through Splash Page: using passport for social login
// ################################################################


// serving the static click-through HTML splash page
app.get('/click', function (req, res) {

  // extract parameters (queries) from URL
  req.session.host = req.headers.host;
  req.session.base_grant_url = req.query.base_grant_url;
  req.session.user_continue_url = req.query.user_continue_url;
  req.session.node_mac = req.query.node_mac;
  req.session.client_ip = req.query.client_ip;
  req.session.client_mac = req.query.client_mac;
  req.session.splashclick_time = new Date().toString();

  // success page options instead of continuing on to intended url
  req.session.success_url = 'https://' + req.session.host + "/success";
  req.session.continue_url = req.query.user_continue_url;

  // display session data for debugging purposes
  console.log("Session data at click page = " + util.inspect(req.session, false, null));

  // render login page using handlebars template and send in session data
  res.render('click-through', req.session);

});


// ***************************************
// No "login" required. Just Terms, branding and survey
// ***************************************
// handle form submit button and send data to Cisco Meraki - Click-through
app.post('/survey', function(req, res){

  // save data from HTML form
  req.session.form = req.body.form1;
  req.session.splashlogin_time = new Date().toString();

  // do something with the session and form data (i.e. console, database, file, etc. )
    // write to console
  console.log("Session data at login page = " + util.inspect(req.session, false, null));

  // forward request onto Cisco Meraki to grant access
    // *** Send user to success page : success_url
  res.writeHead(302, {'Location': req.session.base_grant_url + "?continue_url="+req.session.success_url});

  res.end();

});

// ****************************************
// PASSPORT Login Methods
// ****************************************

// email --------------------------------
// LOGIN ===============================

// show the login form
app.get('/auth/login', function(req, res) {
    res.render('login', { message: req.flash('loginMessage') });
});

// process the login form
app.post('/auth/login', 
    passport.authenticate('local-login', {
        successRedirect : '/auth/wifi', // redirect to the secure profile section
        failureRedirect : '/auth/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
}));

// SIGNUP =================================
// show the signup form
app.get('/auth/signup', function(req, res) {
    res.render('signup', { message: req.flash('signupMessage') });
});

// process the signup form
app.post('/auth/signup', 
    passport.authenticate('local-signup', {
        successRedirect : '/auth/wifi', // redirect to the secure profile section
        failureRedirect : '/auth/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    })
);

// facebook -------------------------------

// send to facebook to do the authentication
app.get('/auth/facebook',
    passport.authenticate('facebook', {
        scope : 'email'
  })
);

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', {
    successRedirect : '/auth/wifi',
    failureRedirect : '/auth/facebook'
  })
);


// handle the callback after facebook has authenticated the user
/*
app.get('/auth/facebook/callback',function(req, res, next) {
  passport.authenticate('facebook',
    function(err, user, info) {
      if (err) { return next(err); }
      if (!user) { return res.redirect('/auth/facebook'); }
      req.logIn(user, function(err) {
        // store user id with session log

        req.session.userId = user.id;
        req.session.userName = user.username;
        if (err) { return next(err); }
        //return res.render('/auth/wifi', req.session);
        return res.redirect('/auth/wifi');
      });
    })(req, res, next);
});
*/


// linkedin --------------------------------

app.get('/auth/linkedin',
  passport.authenticate('linkedin',{
    scope : ['r_basicprofile', 'r_emailaddress']
  })
);

app.get('/auth/linkedin/callback',
  passport.authenticate('linkedin', {
    successRedirect : '/auth/wifi',
    failureRedirect : '/login'
  })
);

// google ---------------------------------

// send to google to do the authentication
app.get('/auth/google', passport.authenticate('google',{
  scope : ['profile', 'email']
  })
);

// the callback after google has authenticated the user
app.get('/auth/google/callback',
  passport.authenticate('google', {
    successRedirect : '/auth/wifi',
    failureRedirect : '/login'
  })
);


// WiFi Auth ---------------------------------
// authenticate wireless session with Cisco Meraki
app.get('/auth/wifi', function(req, res){
  req.session.splashlogin_time = new Date().toString();
  
  // link passport user account to session
  req.session.user = req.user; 
  
  console.log("Session data at login page = " + util.inspect(req.session, false, null));

    // *** Send user to success page : success_url
  res.writeHead(302, {'Location': req.session.base_grant_url + "?continue_url="+req.session.success_url});
  res.end();
});

// ################################################################
// Sign-on Splash Page /w RADIUS username and password
// ################################################################

// #######
// signon page
// #######
app.get('/signon', function (req, res) {

  // extract parameters (queries) from URL
  req.session.host = req.headers.host;
  req.session.login_url = req.query.login_url;
  req.session.continue_url = req.query.continue_url;
  req.session.ap_name = req.query.ap_name;
  req.session.ap_tags = req.query.ap_tags;
  req.session.client_ip = req.query.client_ip;
  req.session.client_mac = req.query.client_mac;
  req.session.success_url = 'http://' + req.session.host + "/success";
  req.session.signon_time = new Date();
    // display data for debugging purposes
  console.log("Session data at signon page = " + util.inspect(req.session, false, null));

  res.render('sign-on', req.session);
});

// #############
// success page
// #############
app.get('/success', function (req, res) {
  // extract parameters (queries) from URL
  req.session.host = req.headers.host;
  req.session.logout_url = req.query.logout_url;
  req.user_logout_url = req.query.user_logout_url + "&continue_url=" + 'http://' + req.session.host + "/logout";
  req.session.success_time = new Date();

  console.log("Session data at success page = " + util.inspect(req.session, false, null));

  // render sucess page using handlebars template and send in session data
  res.render('success', req.session);
});

// #############
// logged-out page
// #############
app.get('/logout', function (req, res) {
  // determine session duration
  req.session.loggedout_time = new Date();
  req.session.duration = {};
  req.session.duration.ms = Math.abs(req.session.loggedout_time - req.session.success_time); // total milliseconds
  req.session.duration.sec = Math.floor((req.session.duration.ms/1000) % 60);
  req.session.duration.min = (req.session.duration.ms/1000/60) << 0;

  // extract parameters (queries) from URL
  req.session.host = req.headers.host;
  req.session.logout_url = req.query.logout_url + "?continue_url=" + 'http://' + req.session.host + "/logged-out";

  // do something with the session data (i.e. console, database, file, etc. )
    // display data for debugging purposes
  console.log("Session data at logged-out page = " + util.inspect(req.session, false, null));

  // render sucess page using handlebars template and send in session data
  res.render('logged-out', req.session);
});

// #############
// terms of service page
// #############
app.get('/terms', function (req, res) {
  res.render('terms', req.session);
});




// ################################################################
// Start application
// ################################################################

// start web services
// app.listen(process.env.PORT || port);
console.log("Server listening on port " + port);

https.createServer(options, app).listen(port, function () {
   console.log('Started!');
});
