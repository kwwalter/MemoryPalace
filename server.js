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
    dbname   = "loci",
    mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

// SET
mongoose.set('debug', true);

// creating the User schema..
var userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  userEmail: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  palaces: [{ type: Schema.Types.ObjectId, ref: 'Palace' }],
  created: { type: Date, default: Date.now }
});
var User = mongoose.model('User', userSchema);

// creating the Palace schema..
var palaceSchema = new Schema({
  name: { type: String, required: true },
  facts: [ { type: Schema.Types.ObjectId, ref: 'Fact' } ],
  _owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  created: { type: Date, default: Date.now }
});
var Palace = mongoose.model('Palace', palaceSchema);

// now creating the Fact schema..
var factSchema = new Schema({
  _livesIn: { type: Schema.Types.ObjectId, ref: 'Palace', required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  created: { type: Date, default: Date.now }
});
var Fact = mongoose.model('Fact', factSchema);

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

// to sign up
server.post('/signup', function(req, res) {
  var newUser = User(req.body);
  console.log("newUser in server.post('/signup') is: ", newUser);

  User.findOne( {
    userEmail: req.body.userEmail
  }, function(err, foundUser) {
    if (err) {
      console.log("there was an error creating this user: \n", err);
      res.json({ error: "There was an error creating this user!" })
    } else if (foundUser) {
      console.log("Someone has already signed up with that username or email");
      res.json({ error: "Someone has already signed up with that email address"});
    } else {
      newUser.save(function(err2, user) {
        if (err2) {
          console.log("There was an error saving this user to the database: \n", err2);
          res.json({ error: "There was an error saving this user to the database!" });
        } else {
          console.log(user.userName, " successfully saved!");
          req.session.currentUser = user._id;
          req.session.currentUsername = user.username;
          req.session.currentUserEmail = user.userEmail;
          res.json({
            currentUser: user._id,
            currentUsername: user.username,
            currentUserEmail: user.userEmail
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

  User.findOne({ username: attemptedLogin.username },
    function(err, foundUser){
      if (foundUser && foundUser.password === attemptedLogin.password) {
        console.log(foundUser, "user found in database, and passwords match..");

        req.session.currentUser = foundUser._id;
        req.session.currentUsername = foundUser.username;
        req.session.currentUserEmail = foundUser.userEmail;

        res.json({
          currentUser: foundUser._id,
          currentUsername: foundUser.username,
          currentUserEmail: foundUser.userEmail
        });
      } else {
        console.log("Error locating this user in the database OR password didn't match: ", err);
        res.json({ error: "Invalid username or password!" });
      }
  });
});

// to show all of a user's memory palaces (and the facts)
server.get('/:id/palaces', function(req, res){
  var id = req.params.id;
  console.log("in /:id/palaces, id is: ", id);

  Palace
  .find({ _owner: id })
  .populate('_owner')
  .exec(function(err2, foundPalaces){
    if (err2) {
      console.log("inside of Palace.find, error2: ", err2);
      res.json( { error: err2 });
    } else {
        console.log("inside of Palace.find, foundPalaces is: ", foundPalaces);
        res.json(foundPalaces);
      }
  });
});

// create a new palace
server.post('/:id/palaces/new', function(req, res){
  var newPalace = Palace(req.body);
  console.log("newPalace in server.post('/:id/palaces/new') is: ", newPalace);

  newPalace.save(function(err){
    if (err) {
      console.log("there was an error saving the new palace: ", err);
      res.json({ error: err });
    } else {
      res.json(newPalace);
    }
  })
});

// retrieve a single palace from the database
server.get('/:id/palaces/:palaceID', function(req, res){
  // var id = req.params.id;
  var palaceID = req.params.palaceID;

  Palace
  .find({ _id: palaceID })
  .populate('_owner')
  .exec(function(err, foundPalace){
    if (err) {
      console.log("inside of Palace.find, error: ", err);
      res.json( { error: err });
    } else {
        console.log("inside of Palace.find, foundPalace is: ", foundPalace);
        res.json(foundPalace);
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
