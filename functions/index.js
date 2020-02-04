const functions = require('firebase-functions');
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const firebase = require('firebase')
const app = express()
const path = require('path');
const project = 'recipeact'
const databaseUrl = `${project}.firebaseio.com`;

const corsOptions = {
    origin: true,//'http://localhost:4200',
    optionsSuccessStatus: 200
}

app.use(cors(corsOptions))
app.use(express.json())
app.use(bodyParser.json())

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

firebase.initializeApp(
    { 
      apiKey: "REMOVED FROM GIT", // TODO remove from GITHUB
        authDomain: databaseUrl,
        databaseURL: `https://${databaseUrl}`,
        projectId: `${project}-id`,
        storageBucket: `${project}.appspot.com`,
        messagingSenderId: "sender-id",
        appId: "app-id",
        measurementId: "G-measurement-id",
    }
)

const fm = require('./firebaseMethods.js')(databaseUrl)
const authLogic = require('./logic/auth.js')(firebase, fm);
const recipesLogic = require('./logic/recipes.js')(authLogic, fm);

require('./api/authApi.js')(app, firebase, authLogic);
require('./api/recipesApi.js')(app, recipesLogic);

app.use(function(err, req, res, next) {
    console.error(err) // Log error message in our server's console
    if (!err.statusCode) err.statusCode = 500; // If err has no specified error code, set error code to 'Internal Server Error (500)'
    res.status(err.statusCode).json(err); // All HTTP requests must have a response, so let's send back an error with its status code and message
  });

exports.app = functions.https.onRequest(app);