// requiring all the things
var express           = require('express'),
    morgan            = require('morgan'),
    bodyParser        = require('body-parser'),
    methodOverride    = require('method-override'),
    session           = require('express-session'),
    less              = require('less'),
    bcrypt            = require('bcrypt'),
    StatsD            = require('node-dogstatsd').StatsD,
    User              = require('./models/user.js'),
    Palace            = require('./models/palace.js'),
    Fact              = require('./models/fact.js');

// node-dogstatsd setup
var dogstatsd = new StatsD();

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
  dogstatsd.increment('secret-page.views');
  res.write("welcome to my craptastic app!");
  res.end();
});

// to sign up
server.post('/signup', function(req, res) {
  dogstatsd.increment('loci-signup.views');
  var newUser = User(req.body);
  // console.log("newUser in server.post('/signup') is: ", newUser);

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
  dogstatsd.increment('loci-login.views');
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
  dogstatsd.increment('loci-all-palaces.views');
  var id = req.params.id;
  // console.log("in /:id/palaces, id is: ", id);

  Palace
  .find({ _owner: id })
  .populate('_owner')
  .populate('facts')
  .exec(function(err2, foundPalaces){
    if (err2) {
      console.log("inside of Palace.find, error2: ", err2);
      res.json( { error: err2 });
    } else {
        // console.log("inside of Palace.find, foundPalaces is: ", foundPalaces);
        res.json(foundPalaces);
      }
  });
});

// create a new palace
server.post('/:id/palaces/new', function(req, res){
  dogstatsd.increment('loci-new-palace.views');
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
  dogstatsd.increment('loci-single-palace.views');
  // var id = req.params.id;
  var palaceID = req.params.palaceID;

  Palace
  .find({ _id: palaceID })
  .populate('_owner')
  .populate('facts')
  .exec(function(err, foundPalace){
    if (err) {
      console.log("inside of Palace.find, error: ", err);
      res.json( { error: err });
    } else {
        // console.log("inside of Palace.find, foundPalace is: ", foundPalace);
        res.json(foundPalace);
    }
  });
});

// retrieve all of the public palaces from the database
server.get('/all-public-palaces', function(req, res){
  dogstatsd.increment('loci-all-public-palaces.views');
  Palace
  .find({ public: true })
  .populate('_owner')
  .populate('facts')
  .exec(function(err, allPalaces){
    if (err) {
      console.log("error insie of Palace.find for all palaces: ", err);
      res.json( { error: err } );
    } else {
      // console.log("allPalaces found is: ", allPalaces);
      res.json(allPalaces);
    }
  });
});

// retrieve a single public palace from the database
server.get('/public/palaces/:palaceID', function(req, res){
  dogstatsd.increment('loci-single-public-palace.views');

  var palaceID = req.params.palaceID;

  Palace
  .find({ _id: palaceID })
  .populate('_owner')
  .populate('facts')
  .exec(function(err, foundPalace){
    if (err) {
      console.log("inside of Palace.find (one public), error: ", err);
      res.json( { error: err });
    } else {
      // console.log("inside of Palace.find (one public), foundPalace is: ", foundPalace);
      res.json(foundPalace);
    }
  });
});

// edit a palace name
server.put('/:id/palaces/:palaceID/edit-name', function(req, res){
  dogstatsd.increment('loci-edit-palace-name.views');
  console.log("in server.js server.put, req.body is: ", req.body);
  Palace.findOneAndUpdate( {
    _id: req.params.palaceID
  }, {
      name: req.body.name
      // commenting this out for now--it's pushing empty questions into the facts array when simply changing the palace name
      // $push: { facts: { question: req.body.question, answer: req.body.answer } }
     },
     function(err, palace){
       if (err) {
        console.log("Could not update this palace: ", err);
        res.json( { error: err } );
       } else {
         console.log("successfully updated palace!");
         res.json(palace);
       }
  });
});

// edit whether or not a palace is public or private
server.put('/:id/palaces/:palaceID/edit-public', function(req, res){
  dogstatsd.increment('loci-edit-palace-public.views');
  console.log("in server.js server.put, req.body is: ", req.body);
  Palace.findOneAndUpdate( {
    _id: req.params.palaceID
  }, {
      public: req.body.public
     },
     function(err, palace){
       if (err) {
        console.log("Could not update this palace: ", err);
        res.json( { error: err } );
       } else {
         console.log("successfully updated palace!");
         res.json(palace);
       }
  });
});

// delete a palace
server.delete('/:id/palaces/:palaceID', function(req, res) {
  dogstatsd.increment('loci-delete-palace.views');
  var palaceToDelete = req.params.palaceID;

  // going to put in this layer of security?
  // if (req.session.currentUser == req.params.id) {
    Palace.remove({
      _id: palaceToDelete
    }, function(err) {
      if (err) {
        console.log("there was an error deleting this palace: ", err);
        res.json( { error: err } );
      } else {
        console.log("successfully deleted palace! now deleting facts..");
        Fact.remove({
          _livesIn: palaceToDelete
        }, function(err2) {
          if (err2) {
            console.log("there was an error deleting these facts: ", err2);
            res.json( { error: err } );
          } else {
            console.log("facts successfully deleted!");
            res.json( { deleted: true } );
          }
        });
      }
    });
  // };
});

// submit a Fact
server.post('/:id/palaces/:palaceID/submit-fact', function(req, res){
  dogstatsd.increment('loci-submit-fact.views');
  var newFact = Fact(req.body);

  // console.log("newFact in server.post(submit-fact) is: ", newFact);

  newFact.save(function(err){
    if (err) {
      console.log("there was an error saving the new fact: ", err);
      res.json({ error: err });
    } else {
      var palaceID = req.params.palaceID;
      Palace.findOneAndUpdate( {
        _id: palaceID
      }, {
        $push: { facts: newFact._id }
      }, function(err, updatedUser){
        if (err) {
          console.log("there was an error pushing this fact into the palace's fact array: ", err);
          res.json({error: err})
        } else {
          console.log("successfully added fact to palace array");
          res.json(newFact);
        }
      });
    }
  })
});

// return all facts for a given palace
server.get('/palaces/:palaceID/get-facts', function(req, res){
  dogstatsd.increment('loci-all-facts.views');
  var palaceID = req.params.palaceID;

  Fact
  .find({ _livesIn: palaceID })
  .populate('_livesIn')
  .exec(function(err, foundFacts){
    if (err) {
      console.log("inside of Fact.find (all facts), error: ", err);
      res.json( { error: err });
    } else {
      console.log("inside of Fact.find (all facts), foundFacts is: ", foundFacts);
      res.json(foundFacts);
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
