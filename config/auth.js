// config/auth.js


// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        'clientID'        : '1502099026749580', // your App ID
        'clientSecret'    : 'f7e037c16df8bcf2d4466f4a1b7d150b', // your App Secret
        'callbackURL'     : 'http://aws.internetoflego.com:8181/auth/facebook/callback'
    },

    'twitterAuth' : {
        'consumerKey'        : 'your-consumer-key-here',
        'consumerSecret'     : 'your-client-secret-here',
        'callbackURL'        : 'http://localhost:8080/auth/twitter/callback'
    },

    'googleAuth' : {
        'clientID'         : '188593401620-8tl0ur8p0k55vu91i7jtav8sekl540nh.apps.googleusercontent.com',
        'clientSecret'     : 'lPmdglTKWD5In-6x2LBhECjg',
        'callbackURL'      : 'http://aws.internetoflego.com:8181/auth/google/callback'
    }

};
