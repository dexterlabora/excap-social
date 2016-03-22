// config/auth.js


// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        'clientID'        : 'xxxxxxxxx', // your App ID
        'clientSecret'    : 'xxxxxxxxx', // your App Secret
        'callbackURL'     : 'https://localhost:8181/auth/facebook/callback'
    },

    'twitterAuth' : {
        'consumerKey'        : 'xxxxxxxxx',
        'consumerSecret'     : 'xxxxxxxxx',
        'callbackURL'        : 'https://localhost:8181/auth/twitter/callback'
    },

    'linkedinAuth' : {
        'consumerKey'        : 'xxxxxxxxx',
        'consumerSecret'     : 'xxxxxxxxx',
        'callbackURL'        : 'https://localhost:8181/auth/linkedin/callback'
    },

    'googleAuth' : {
        'clientID'         : 'xxxxxxxxx.apps.googleusercontent.com',
        'clientSecret'     : 'xxxxxxxxx',
        'callbackURL'      : 'https://localhost:8181/auth/google/callback'
    }

};
