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
// app.listen(8000, () => {
//     console.log('Server started!')
// })
app.use(bodyParser.json())

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

/*
app.get('/', (req, res) => {
    return res.status(200).json(`${project} API running,  usage example /api/recipes  or /api/categories `); 
})
*/

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


let fm = require('./common/firebaseMethods.js')(databaseUrl)
let ds = require('./bll/dataStorage.js')(fm);
let recipesBll = require('./bll/recipesBll.js')(ds);
let authBll = require('./bll/authBll.js')(firebase);
require('./api/authApi.js')(app, ds, firebase, authBll);
require('./api/recipesApi.js')(app, ds, recipesBll);

app.use(function(err, req, res, next) {
    console.error(err) // Log error message in our server's console
    if (!err.statusCode) err.statusCode = 500; // If err has no specified error code, set error code to 'Internal Server Error (500)'
    res.status(err.statusCode).json(err); // All HTTP requests must have a response, so let's send back an error with its status code and message
  });

exports.app = functions.https.onRequest(app);