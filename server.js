// requiring all the things
var express           = require('express'),
    morgan            = require('morgan'),
    bodyParser        = require('body-parser'),
    // ejs               = require('ejs'),
    // expressEjsLayouts = require('express-ejs-layouts'),
    methodOverride    = require('method-override'),
    session           = require('express-session'),
    less              = require('less'),
    bcrypt            = require('bcrypt');

// server setup
var PORT    = process.env.PORT || 1111,
    server  = express();

// setting up mongoose stuff
var MONGOURI = process.env.MONGOLAB_URI || "mongodb://localhost:27017",
    dbname   = "memory_palace",
    mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

// SET
mongoose.set('debug', true);

// creating the User schema..
var userSchema  = new Schema({
  userEmail: { type: String, required: true },
  password: { type: String, required: true },
  created: { type: Date, default: Date.now }
});
var User = mongoose.model('User', userSchema);

// server.set('views', './views');
// server.set('view engine', 'ejs');

// USE
server.use(session({
  secret: "biLpoD1ngus",
  resave: true,
  saveUninitialized: false
}));

server.use(morgan('dev'));

server.use(express.static('./public'));
server.use('/bower_components',  express.static('./bower_components'));

// server.use(expressEjsLayouts);

server.use(bodyParser.json());

server.use(methodOverride('_method'));

// SUPER LOGGER
server.use(function(req, res, next){
  // res.locals.userLoggedIn = req.session.username;

  console.log("*************** [ REQ START ] ***************");
  console.log("REQ DOT BODY: \n", req.body);
  console.log("REQ DOT PARAMS: \n", req.params);
  console.log("REQ DOT SESSION: \n", req.session);
  console.log("*************** [ REQ END ] ***************");
  next();
});

// specific routes--starting with a test one
server.get('/wicked-secret-test', function(req, res){
  res.write("welcome to my craptastic app!");
  res.end();
});

// for testing
// server.get('/', function(req, res){
//   res.json({
//     you: "suck",
//     go: "home"
//   });
// });

// to sign up
server.post('/signup', function(req, res) {
  var newUser = User(req.body);
  console.log("newUser in server.post('/signup') is: ", newUser);

  User.findOne( {
    userEmail: req.body.userEmail
  }, function(err, foundUser) {
    if (err) {
      console.log("there was an error creating this user: \n", err);
      res.json({ error: "there was an error creating this user: " + err })
    } else if (foundUser) {
      console.log("Someone has already signed up with that username or email");
      res.json({ error: "Someone has already signed up with that email address"});
    } else {
      newUser.save(function(err2, user) {
        if (err2) {
          console.log("There was an error saving this user to the database: \n", err2);
          res.json({ error: "There was an error saving this user to the database: " + err2 });
        } else {
          console.log(user.userName, " successfully saved!");
          req.session.currentUser = user._id;
          req.session.currentUserEmail = user.userEmail;
          res.json({
            currentUser: req.session.currentUser,
            currentUserEmail: req.session.currentUserEmail
          });
        }
      });
    }
  });
});

// to check for user login
server.post('/login', function(req, res){
  var attemptedLogin = req.body;
  console.log("user trying to log in as: \n", attemptedLogin);

  User.findOne({ userEmail: attemptedLogin.userEmail },
    function(err, foundUser){
      if (foundUser && foundUser.password === attemptedLogin.password) {
        console.log(foundUser, "user found in database, and passwords match..");

        req.session.currentUser = foundUser._id;
        req.session.currentUserEmail = foundUser.email;

        res.json(foundUser);
      } else {
        console.log("Error locating this user in the database OR password didn't match: ", err);
        res.json({ error: "Error locating this user in the database OR password didn't match: " + err });
      }
  });
});

// END ROUTES

// server listen and mongoose connect
mongoose.connect(MONGOURI + "/" + dbname, function(){
  console.log("DATABASE IS UP!");
});
server.listen(PORT, function() {
  console.log("SERVER IS UP ON PORT: ", PORT);
});
