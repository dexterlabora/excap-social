// app.js

// ################################################################
// Overview
// ################################################################
/*
External Captive Portal (ExCAP) for Cisco Meraki MR access points and MX security appliances.

This application provides a basic click-through and sign-on splash page where the login will complete on a success page.

Click-through usage:   https://yourserver/click
Sign-on usage:         https://yourserver/signon

All HTML content uses Handlebars to provide dynamic data to the various pages.
The structure of the HTML pages can be modified under /views/filename.hbs
Images are stored in /public/img

All stateful session data is stored in a local MongoDB, which needs to be configured first.
This data will consist of the collected parameters and any form data collected from the user.

Written by Cory Guynn - 2015
www.InternetOfLego.com
*/

// ################################################################
// Local Variables
// ################################################################

// web port
var port = 8181;

// ExCap parameters and form data object
//var session = {};

// ################################################################
// Utilities
// ################################################################

// used for debugging purposes to easily print out object data
var util = require('util');
  //Example: console.log(util.inspect(session, false, null));



// ################################################################
// Web Services and Middleware
// ################################################################

// express webserver service
var express = require('express');
var session = require('express-session');
var MongoDBStore = require('connect-mongodb-session')(session);



  // social extral utils
  var morgan       = require('morgan');
  var cookieParser = require('cookie-parser');
  var bodyParser   = require('body-parser');
  var passport = require('passport');
  var flash    = require('connect-flash');

  // social login database
  var configDB = require('./config/database.js');
  var mongoose = require('mongoose');

// create the web app
var app = express();

  // configuration ===============================================================
  mongoose.connect(configDB.url); // connect to our database

  require('./config/passport')(passport); // pass passport for configuration
  // required for passport
  app.use(session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
  app.use(passport.initialize());
  app.use(passport.session()); // persistent login sessions
  app.use(flash()); // use connect-flash for flash messages stored in session

  app.use(morgan('dev')); // log every request to the console
  app.use(cookieParser()); // read cookies (needed for auth)
  //app.use(bodyParser.json()); // get information from html forms
  //app.use(bodyParser.urlencoded({ extended: true }));



// session information stored to local mongo database
var store = new MongoDBStore({
    //uri: 'mongodb://localhost:27017/excap',
    uri: configDB.url,
    collection: 'sessions'
});

// Catch errors
store.on('error', function(error) {
  assert.ifError(error);
  assert.ok(false);
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



// define the static resources for the splash pages
var path = require('path');
app.use("/public", express.static(path.join(__dirname, 'public')));
app.use("/css",  express.static(__dirname + '/public/css'));
app.use("/img", express.static(__dirname + '/public/img'));
app.use("/js", express.static(__dirname + '/public/js'));

// parses req.body
var bodyParser = require('body-parser');

// instruct the app to use the `bodyParser()` middleware for all routes
app.use(bodyParser.urlencoded({
extended: true
}));
app.use(bodyParser.json());




// ################################################################
// Handlebars to provide dynamic content in HTML pages
// ################################################################

var exphbs = require('express3-handlebars');
app.engine('.hbs', exphbs({defaultLayout: 'single', extname: '.hbs'}));
app.set('view engine', '.hbs');

// ROUTES #########################################################


// ################################################################
// Admin Site mongodb API access
// ################################################################

var MongoClient = require('mongodb').MongoClient
    , format = require('util').format;

// provide MongoDB REST API for JSON session data
// SECURITY WARNING -- ALL USER and SESSION DATA IS AVAILABLE BY ACCESSING THIS ROUTE ! ! ! !
  // example to pull JSON data http://yourserver:8181/api/v1/users
var expressMongoRest = require('express-mongo-rest');
//app.use('/excapData', expressMongoRest('mongodb://localhost:27017/test'));
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
  req.session.success_url = 'http://' + req.session.host + "/success";
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

// locally --------------------------------
// LOGIN ===============================

// show the login form
app.get('/login', function(req, res) {
    res.render('login', { message: req.flash('loginMessage') });
});

// process the login form
app.post('/login', passport.authenticate('local-login', {
    successRedirect : '/auth/wifi', // redirect to the secure profile section
    failureRedirect : '/login', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}));

// SIGNUP =================================
// show the signup form
app.get('/signup', function(req, res) {
    res.render('signup', { message: req.flash('signupMessage') });
});

// process the signup form
app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/auth/wifi', // redirect to the secure profile section
    failureRedirect : '/signup', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}));

// facebook -------------------------------

// send to facebook to do the authentication
app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

// handle the callback after facebook has authenticated the user
app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        successRedirect : '/auth/wifi',
        failureRedirect : '/login'
    }));



// google ---------------------------------

// send to google to do the authentication
app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

// the callback after google has authenticated the user
app.get('/auth/google/callback',
    passport.authenticate('google', {
        successRedirect : '/auth/wifi',
        failureRedirect : '/login'
    }));


// WiFi Auth ---------------------------------
// authenticate wireless session with Cisco Meraki
app.get('/auth/wifi', function(req, res){
  req.session.splashlogin_time = new Date().toString();
  req.session.user = req.user; // link user account to session
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

  // do something with the session and form data (i.e. console, database, file, etc. )
    // display data for debugging purposes
  console.log("Session data at signon page = " + util.inspect(req.session, false, null));
    // write to log file
  //jsonfile.writeFile(logPath, req.session, function (err) {
    //console.log(err);
  //})

  // render login page using handlebars template and send in session data
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

  // do something with the session data (i.e. console, database, file, etc. )
    // display data for debugging purposes
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
    // write to log file
  //jsonfile.writeFile(logPath, session, function (err) {
  //  console.log(err)
  // })

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
app.listen(process.env.PORT || port);
console.log("Server listening on port " + port);
