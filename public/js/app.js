var StatsD = require('node-dogstatsd').StatsD;

// node-dogstatsd setup
var dogstatsd = new StatsD();

var app = angular.module('MemoryPalace', ['ngRoute']);

// service to contain user data
app.service('userService', function(){
  var controller = this;

  this.setUser = function(user) {
    controller.currentUsername = user;
  }

  this.getUser = function() {
    return controller.currentUsername;
  }
});

// *** MAIN CONTROLLER ***
app.controller('MainController', ['$http', '$location', 'userService', function($http, $location, userService){
  // testing this out: every time the controller is instantiated, the page_views will increase by one. 
  dogstatsd.increment('loci.page_views');

  var controller = this;

  this.signedIn = false;
  this.currentUser = null;
  this.currentUsername = null;

  this.signup = function() {
    // alert('singup!');

    // clear the flash message every time this is clicked, so it doesn't persist.. maybe use angular-flash for this?
    $('#flashMessage').empty();

    if (controller.password === controller.passwordConfirm) {
      $http.post('/signup', {
        username: controller.username,
        userEmail: controller.userEmail,
        password: controller.password
      }).then(function(data){
        // console.log("data is: ", data);
        if (data.data.currentUser) {
          controller.signedIn = true;
          controller.currentUser = data.data.currentUser;

          // set the current username via the userService
          userService.setUser(data.data.currentUsername);

          // redirect
          $location.path('/' + data.data.currentUser + '/loggedin');
          // console.log("data.data.currentUser: ", data.data.currentUser);
        } else {
        $('#flashMessage').append('<h2>Sorry, there was an error logging you in: ' + data.data.error + '</h2>');
        }
      }, function(error){
        console.log("there was an error: ", error);
      });
    } else {
      $('#flashMessage').append('<h2>Your passwords don\'t match, ya dummy. Try again.</h2>');
      controller.password = '';
      controller.passwordConfirm = '';
    }
  };

  this.login = function() {
    // alert('loggin!');

    // clear the flash message every time this is clicked, so it doesn't persist.. maybe use angular-flash for this?
    $('#flashMessage').empty();

    $http.post('/login', {
      username: controller.username,
      password: controller.password
    }).then(function(data){
      // console.log(data);
      if (data.data.currentUser) {
        // set the current username via the userService
        userService.setUser(data.data.currentUsername);

        // redirect
        $location.path('/' + data.data.currentUser + '/loggedin');
      } else {
        $('#flashMessage').append('<h2>Sorry, there was an error logging you in: ' + data.data.error + '</h2>');
      }
    }, function(error){
      console.log("there was an error: ", error);
    });
  };
}]);


// *** LOGGED IN CONTROLLER ***
app.controller('LoggedInController', ['$http', '$location', '$routeParams', 'userService', function($http, $location, $routeParams, userService){
  var controller = this;

  this.allPalaceUrl = '/' + $routeParams.id + '/palaces';
  this.newPalaceUrl = '/' + $routeParams.id + '/palaces/new';
  this.userID = $routeParams.id;
  this.currentUsername = userService.getUser();
  // console.log("after getUser(), this.currentUsername is: ", this.currentUsername);

  this.refresh = function() {
    $http.get(this.allPalaceUrl).then(function(data){
      // console.log("data after /:id/palaces get request: ", data);
      controller.palaces = data.data;
      // console.log("controller.palaces: ", controller.palaces);
    }, function(error) {
      console.log("there was an error retrieving the data: ", error);
    });
  };

  this.createPalace = function() {
    $http.post(this.newPalaceUrl, {
      name: controller.name,
      imageNumber: controller.imageNumber,
      _owner: controller.userID,
      public: controller.public
    }).then(function(data){
        if (data.data._id) {
          $location.path('/' + data.data._owner + '/palaces/' + data.data._id);
        } else {
          $('#flashMessage').append('<h2>Sorry, there was an error creating this palace: ' + data.data.error + '</h2>');
          }
        }, function(error){
            console.log("there was an error creating this palace: ", error);
           }
      );
  };

  this.deletePalace = function(palace) {
    var deletePalaceUrl = controller.allPalaceUrl + '/' + palace._id;

    if(confirm('Are you sure you want to delete this palace and everything that goes with it?')) {
      $http.delete(deletePalaceUrl, palace).then(function(data){
        console.log("palace successfully deleted: ", data);
        controller.refresh();
      }, function(error){
        console.log("there was an error deleting this palace: ", error);
        }
      );
    };
  };

  // calling this upon instantiation of the controller so that the palace list is loaded
  this.refresh();
}]);

// TRUTH Service
app.service('truthService', function(){
  var controller = this;

  this.setTruth = function(bool) {
    controller.questionsAdded = bool;
  }

  this.getTruth = function() {
    return controller.questionsAdded;
  }
});

// *** PALACE CONTROLLER ***
app.controller('PalaceController', ['$http', '$location', '$routeParams', '$compile', '$scope', 'positionService', 'truthService', function($http, $location, $routeParams, $compile, $scope, positionService, truthService){
  var controller = this;

  this.allPalaceUrl = '/' + $routeParams.id + '/palaces';
  this.singlePalaceUrl = '/' + $routeParams.id + '/palaces/' + $routeParams.palaceID;
  this.editPalaceNameUrl = '/' + $routeParams.id + '/palaces/' + $routeParams.palaceID + '/edit-name';
  this.editPalacePublicUrl = '/' + $routeParams.id + '/palaces/' + $routeParams.palaceID + '/edit-public';
  this.submitFactUrl = '/' + $routeParams.id + '/palaces/' + $routeParams.palaceID + '/submit-fact';
  this.getFactsUrl = '/palaces/' + $routeParams.palaceID + '/get-facts';
  this.quizUrl = '/' + $routeParams.id + '/palaces/' + $routeParams.palaceID + '/quiz';
  this.createPalaceUrl = '/' + $routeParams.id + '/palaces/new';

  // can use this to either update Palace or Fact, and associate with the palace in the $routeParams.palaceID if doing the latter
  this.factUrl = '/' + $routeParams.id + '/palaces/' + $routeParams.palaceID + '/fact';

  this.name;

  this.factCount = 1;

  // boolean for whether or not to display the edit palace name form (one line form, anyway)
  this.editBool = false;

  // boolean for adding questions via card
  this.cardBool = false;

  // boolean for "flipping" the question card
  this.flipBool = false;

  // for entering quiz mode
  this.quizMode = false;

  // this is to account for 100px worth of space that's added each time a new div is appended. It'll be incremented by 100 at the end of each submitFact()
  this.incrementer = 0;

  this.displayOnePalace = function() {
    // get all the facts first
    // controller.getFacts(); <-- might not need if all the facts are in the palace facts array now

    $http.get(controller.singlePalaceUrl).then(function(data){
      // console.log('data from singlePalaceUrl get: ', data);
      controller.palace = data.data[0];
      controller.name = data.data[0].name;
      controller.imageNumber = data.data[0].imageNumber;

      // functionality carried over from old getFacts() function..
      controller.facts = data.data[0].facts;
      // console.log("now at the beginning of $http.get in displayOnePalace, controller.facts is: ", controller.facts);

      // if we're getting all the facts again, we've navigated away from the edit page where user can append divs. Time to set the value back to one:
      controller.factCount = 1;
      // console.log("navigated away, so controller.factCount is now: ", controller.factCount);

      // can do the same for controller.incrementer
      controller.incrementer = 0;

      // also, set a controller-wide variable for the length of the facts array..
      if (controller.facts.length > 0) {
        controller.factsLength = controller.facts.length + 1;

        // if the palace has any facts, then have to set the setTruth to true (so that, if someone logs in and goes to a palace where they have a bunch of facts already saved, they can add one and the top value will be correct)
        truthService.setTruth(true);

        // console.log("in if, controller.factsLength is: ", controller.factsLength);
      } else {
        controller.factsLength = 1;

        // if there are no facts, this should be false
        truthService.setTruth(false);
      }

      // now that we have the facts, need to append a div to the image based on the top and left values of each..
      // trying to use controller.facts.length again
      var appendString;
      for (var i = 1; i <= controller.facts.length; i++){
        // console.log("controller.facts[" + (i-1) + "] is: ", controller.facts[i-1]);
        appendString = '<div draggable class="draggable-div" id="fact' + i + '" style="top: ' + controller.facts[i-1].top + 'px; left: ' + controller.facts[i-1].left + 'px;"><h5 class="fact-header' + i + '">Card #' + i + '</h5><p class="question">Q: ' + controller.facts[i-1].question + '</p><br><p class="answer hidden">A: ' + controller.facts[i-1].answer + '</p><button ng-if="!palaceCtrl.quizMode" ng-click="palaceCtrl.flipCard(' + i + ')">Show/Hide Answer!</button></div>';
        // console.log("appendString is: ", appendString);

        // now append it!
        $('#image-container').append($compile(appendString)($scope));
      };
    }, function(error){
      console.log("there was an error retrieving the data: ", error);
    });
  }

  this.editPalaceName = function() {
    $http.put(controller.editPalaceNameUrl, {
      name: controller.name
    }).then(function(data){
      // console.log('data from editPalaceNameUrl put (editPalaceName): ', data);
      controller.editBool = false;
      controller.displayOnePalace();
    }, function(error){
      console.log("there was an error modifying the palace / retrieving the data: ", error);
    });
  };

  this.doneEditing = function() {
    controller.factCount = 1;

    // controller.questionsAdded = true;
    // console.log("in doneEditing, controller.questionsAdded is now: ", controller.questionsAdded);

    truthService.setTruth(true);

    // finally, redirect back to the palace view
    $location.path(controller.singlePalaceUrl);
  };

  this.goPublicOrPrivate = function(palaceBool) {
    if(confirm('Are you sure you want to change the status?')) {
      $http.put(controller.editPalacePublicUrl, {
        public: palaceBool,
      }).then(function(data){
        // console.log('data from editPalacePublicUrl put (goPublicOrPrivate): ', data);
        controller.displayOnePalace();
      }, function(error){
        console.log("there was an error modifying the palace / retrieving the data: ", error);
      });
    };
  };

  this.addCardToImg = function(event) {
    // get x and y coordinates of where the moust was clicked, through the event (from $event on ng-click)
    // console.log("event is: ", event);

    // subtracting 50 since the click appends the div at the top left corner of the square. This'll get to the center of it.
    var x = event.offsetX - 50;
    var y = event.offsetY - 50;

    // this only impacts the top value for newly-appended divs
    // var currentFactCount = controller.factCount;

    // need to keep track of the fact sequence, too, based on the length of the array. Will make a change in the display one palace thing
    // var currentFactsLength = controller.factsLength;

    // going to try doing this based on the controller.questionsAdded function now.. starting with if true..
    if (!truthService.getTruth()) {
      // console.log("getTruth() is false, so nothing has been added until the user got to this page: ", truthService.getTruth());
      // have to store top and left position when the first card is placed, because otherwise can't read top or left of undefined (if this first card isn't dragged, nothing will be stored)
      var position = {
        top: (y - ((4 + controller.factCount) * 100)),
        left: x
      };
      positionService.setStopPos(position);

      // position is correct for the click, but not appending to the right place in the div--maybe have to set the image as a background of the container div, then set these coords in relation to that?
      var divString = '<div draggable class="draggable-div" id="fact' + controller.factsLength + '" style="top: ' + (y - ((4 + controller.factCount) * 100)) + 'px; left: ' + x + 'px;"><h5 class="fact-header' + controller.factsLength + '">Card #' + controller.factsLength + '</h5><button ng-hide="palaceCtrl.cardBool" ng-click="palaceCtrl.addFact(' + controller.factsLength + ')">Add Q/A</button><div class="fact-form" ng-hide="!palaceCtrl.cardBool">Q: <input type="text" ng-model="palaceCtrl.question"></br>A: <input type="text" ng-model="palaceCtrl.answer"></br><button class="btn btn-default" ng-click="palaceCtrl.submitFact(' + controller.factsLength + ')">Submit this fact!</button></div></div>';
      // console.log("divString is: ", divString);

      // append a div to the img, using the draggable directive. And using $compile and $scope to apply the directive to the div, since it's being added after document ready
      $('#image-container').append($compile(divString)($scope));

      // increase the fact counter for correct numeration
      controller.factCount += 1;
      // console.log("at the end of addCardtoImg(), controller.factCount is: ", controller.factCount);

      // also have to increase the factsLength!!
      controller.factsLength += 1;
      // console.log("at the end of addCardtoImg(), controller.factsLength is: ", controller.factsLength);
    } else {
      // console.log("getTruth() is true, so the user has added stuff already: ", truthService.getTruth());

      var newY = (y - ((4 + controller.factCount) * 100)) - ((controller.factsLength - 1) * 100) + controller.incrementer;
      // console.log("newY is: ", newY);

      var position = {
        top: newY,
        left: x
      };
      positionService.setStopPos(position);

      // position is correct for the click, but not appending to the right place in the div--maybe have to set the image as a background of the container div, then set these coords in relation to that?
      var divString = '<div draggable class="draggable-div" id="fact' + controller.factsLength + '" style="top: ' + newY + 'px; left: ' + x + 'px;"><h5 class="fact-header' + controller.factsLength + '">Card #' + controller.factsLength + '</h5><button ng-hide="palaceCtrl.cardBool" ng-click="palaceCtrl.addFact(' + controller.factsLength + ')">Add Q/A</button><div class="fact-form" ng-hide="!palaceCtrl.cardBool">Q: <input type="text" ng-model="palaceCtrl.question"></br>A: <input type="text" ng-model="palaceCtrl.answer"></br><button class="btn btn-default" ng-click="palaceCtrl.submitFact(' + controller.factsLength + ')">Submit this fact!</button></div></div>';
      // console.log("divString is: ", divString);

      // append a div to the img, using the draggable directive. And using $compile and $scope to apply the directive to the div, since it's being added after document ready
      $('#image-container').append($compile(divString)($scope));

      // increase the fact counter for correct numeration
      controller.factCount += 1;
      // console.log("at the end of addCardtoImg(), controller.factCount is: ", controller.factCount);

      // also have to increase the factsLength!!
      controller.factsLength += 1;
      // console.log("at the end of addCardtoImg(), controller.factsLength is: ", controller.factsLength);

      // to account for the additional 100px worth of space that the last div took up..
      controller.incrementer += 100;
    }
  };

  this.addFact = function(currentFactsLength){
    // when a fact is saved, have to make sure to save the top and left values of the div
    // because this positionService stores information about the div that was recently moved, it might be best to remove the "add fact" button from a draggable div as soon as it's clicked the first time
    controller.position = positionService.getStopPos();
    // console.log("inside of addFact(), position is now: ", controller.position);
    // var top = position.top;
    // var left = position.left;

    controller.factID = '#fact' + currentFactsLength;
    controller.factHeader = '.fact-header' + currentFactsLength;

    // change the value of the cardBool
    controller.cardBool = true;

    // console.log("inside of addFact, top and left are, respectively: ", top, left);

    // console.log("inside of addFact, currentFactsLength is: ", currentFactsLength);

    // add the classes to animate the div and to make the image unclickable for the moment
    $(controller.factID).addClass('fact-clicked show');
    $('#palace-img').addClass('cover');
  };

  this.submitFact = function(currentFactsLength) {
    $http.post(controller.submitFactUrl, {
      _livesIn: $routeParams.palaceID,
      question: controller.question,
      answer: controller.answer,
      number: currentFactsLength,
      top: controller.position.top,
      left: controller.position.left
    }).then(function(data){
      // console.log('data from submitFactUrl post: ', data);
      controller.cardBool = false;

      // now remove the classes from before to put things back as they were
      $(controller.factID).removeClass('fact-clicked show');
      $('#palace-img').removeClass('cover');

      // hide the form div so it doesn't come up next time
      $(controller.factID + ' > div').addClass('hidden');

      // hide the add quesiton button too, otherwise the user could click this and the form won't show up.
      $(controller.factID + ' > button').addClass('hidden');

      // append the question (and not the answer)) to the div so the user can see them. Include button to show the answer (flip the card over).
      var flipString = '<p class="question">Q: ' + controller.question + '</p><br><p class="answer hidden">A: ' + controller.answer + '</p><button ng-if="!palaceCtrl.quizMode" ng-click="palaceCtrl.flipCard(' + currentFactsLength + ')">Show/Hide Answer!</button>';
      // console.log("flipString is: ", flipString);
      $(controller.factID).append($compile(flipString)($scope));

      // reset the question and answer values
      controller.question = "";
      controller.answer = "";
    }, function(error){
      console.log("there was an error modifying the palace / retrieving the data: ", error);
    });
  };

  // this can be done with ng-hide and ng-click, but will fix that later if time permits
  this.flipCard = function(cardToFlip) {
    // console.log("in the flipCard function");
    $('#fact' + cardToFlip + ' > .answer').toggleClass('hidden');
    $('#fact' + cardToFlip + ' > .answer').parent().toggleClass('fact-clicked');
    $('#fact' + cardToFlip + ' > p').toggleClass('embiggen');
  };

  // function for resizing divs -- NOT WORKING YET
  // this.resize = function(evt,ui) {
  //   console.log (evt,ui);
  //   alert('inside of palaceCtrl.resize() function');
  //   $scope.w = ui.size.width;
  //   $scope.h = ui.size.height;
  // };

  // function to get all the facts for a given palace
  // there's an error when a user first creates a palace, when there are no questions..

  /* UPDATE: might not need to call this in displayOnePalace anymore since the facts should now be contained within the palace object. Going to take this functionality and move it into the display function

  this.getFacts = function() {
    $http.get(controller.getFactsUrl).then(function(data){
      // console.log('data from getFactsUrl get: ', data);
      controller.facts = data.data;

      // if we're getting all the facts again, we've navigated away from the edit page where user can append divs. Time to set the value back to one:
      controller.factCount = 1;
      // console.log("navigated away, so controller.factCount is now: ", controller.factCount);

      // can do the same for controller.incrementer
      controller.incrementer = 0;

      // also, set a controller-wide variable for the length of the facts array..
      if (controller.facts.length > 0) {
        controller.factsLength = controller.facts.length + 1;

        // if the palace has any facts, then have to set the setTruth to true (so that, if someone logs in and goes to a palace where they have a bunch of facts already saved, they can add one and the top value will be correct)
        truthService.setTruth(true);

        // console.log("in if, controller.factsLength is: ", controller.factsLength);
      } else {
        controller.factsLength = 1;

        // if there are no facts, this should be false
        truthService.setTruth(false);

        // console.log("in else, controller.factsLength is: ", controller.factsLength);
      }
    }, function(error){
      console.log("there was an error retrieving the data: ", error);
    });
  };
  */

  this.startQuiz = function() {
    // first, specify that we're entering quiz mode.. might not even be working
    controller.quizMode = true;
    // console.log("in startQuiz, and controller.quizMode is now: ", controller.quizMode);

    // redirect to quiz
    $location.path(controller.quizUrl);

    // set up the empty array for the quiz answers. Oddly, upon first quiz submission, it saves as an associative array. Not sure why.
    // controller.quizAnswers = [];
  };

  this.submitQuiz = function() {
    // console.log("answers: ", controller.quizAnswers);
    // console.log("controller.facts: ", controller.facts)

    controller.resultsBool = true;

    controller.correctCounter = 0;

    // first, check to make sure we have the same number of answers from the user and answers in the data..
    // for some reason, controller.quizAnswers comes back as an object first. Might have to just skip this for now.
    // if (controller.quizAnswers.length != controller.facts.length) {
    //   // flash message isn't working, just going to use an alert instead
    //   // $('#flashMessage').append('<h2>You have to enter an answer for every quesiton, ya dummy! If you don\'t know, take a guess!</h2>');
    //   alert('You have to enter an answer for every quesiton, ya dummy! If you don\'t know, take a guess!');
    //   return;
    // } else {
    //   // clear this out
    //   // $('#flashMessage').empty();
    // }

    for (var i = 0; i < controller.facts.length; i++){
      if (controller.quizAnswers[i].toLowerCase() === controller.facts[i].answer.toLowerCase()){
        // console.log("answer to question #" + (i+1) + " is correct!");
        $('#quiz-question' + (i + 1) + ' > .incorrect').addClass('hidden');
        // console.log('#quizquestion' + (i + 1) + ' > h4 is: ', '#quizquestion' + (i + 1) + ' > h4');

        controller.correctCounter += 1;
      } else {
        // console.log("answer to question #" + (i+1) + " is incorrect!");
        $('#quiz-question' + (i + 1) + ' > .correct').addClass('hidden');
      }
    }

    // at the end, set this to false -- is it even working?
    controller.quizMode = false;
    // console.log("exiting submitQuiz function, quizMode is now: ", controller.quizMode);
  };

  this.tryAgain = function() {
    // reset these values
    controller.resultsBool = false;

    controller.quizAnswers = [];

    controller.correctCounter = 0;

    // remove the hidden class from the respective correct/incorrect tags
    for (var i = 0; i < controller.facts.length; i++){
        $('#quiz-question' + (i + 1) + ' > .incorrect').removeClass('hidden');

        $('#quiz-question' + (i + 1) + ' > .correct').removeClass('hidden');
    }
  };

  // this.getAllPublics = function() {
  //   console.log("testing in getAllPublics()");
  //
  //   // redirect to /all-public-palaces
  //   $location.path('/all-public-palaces');
  //
  //   // query the db for all palaces with public boolean of true
  //   $http.get('/all-public-palaces').then(function(data){
  //     console.log('data from all-public-palaces get: ', data);
  //     controller.publicPalaces = data.data;
  //     console.log("publicPalaces is: ", controller.publicPalaces);
  //   }, function(error){
  //     console.log("there was an error retrieving the data: ", error);
  //   });
  // };

  // run once to initialize on controller instantiation
  this.displayOnePalace();

  // running this to get all of the facts as well
  // this.getFacts();
}]);

// controller for all public palaces
app.controller('PublicController', ['$http', '$routeParams', '$scope', function($http, $routeParams, $scope){
  var controller = this;

  this.onePublicPalaceUrl = '/public/palaces/' + $routeParams.palaceID;
  this.getFactsUrl = '/palaces/' + $routeParams.palaceID + '/get-facts';

  // since this is separate from the palaces controller, copying this function here so we can get all the facts for a given palace
  this.getFacts = function() {
    $http.get(controller.getFactsUrl).then(function(data){
      // console.log('data from getFactsUrl get: ', data);
      controller.facts = data.data;
    }, function(error){
      console.log("there was an error retrieving the data: ", error);
    });
  };

  // query the db for all palaces with public boolean of true
  $http.get('/all-public-palaces').then(function(data){
    // console.log('data from all-public-palaces get: ', data);
    controller.publicPalaces = data.data;
  }, function(error){
    console.log("there was an error retrieving the data: ", error);
  });

  // query the db for one public palace with a specific id
  $http.get(controller.onePublicPalaceUrl).then(function(data){
    // console.log('data from onePublicPalaceUrl get: ', data);
    controller.palace = data.data[0];

    // having it set up this way, the getFacts function is still called when the controller is instantiated (when we get to 'all-public-palaces'), so on the index page, it results in an error..
    controller.getFacts();
  }, function(error){
    console.log("there was an error retrieving the data: ", error);
  });
}]);

app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider){
  $locationProvider.html5Mode({ enabled: true });
  $routeProvider.
    when('/', {
      templateUrl: 'views/welcome.html',
      controller: 'MainController',
      controllerAs: 'mainCtrl'
    }).
    when('/signup', {
      templateUrl: 'views/signup.html',
      controller: 'MainController',
      controllerAs: 'mainCtrl'
    }).
    when('/login', {
      templateUrl: 'views/login.html',
      controller: 'MainController',
      controllerAs: 'mainCtrl'
    }).
    when('/:id/loggedin', {
      templateUrl: 'views/loggedin.html',
      controller: 'LoggedInController',
      controllerAs: 'loggedinCtrl'
    }).
    when('/:id/palaces', {
      templateUrl: 'views/palaces.html',
      controller: 'LoggedInController',
      controllerAs: 'loggedinCtrl'
    }).
    when('/:id/palaces/new', {
      templateUrl: 'views/new-palace.html',
      controller: 'LoggedInController',
      controllerAs: 'loggedinCtrl'
    }).
    // had to move this one ahead of /:id/palaces/:palaceID to avoid incorrect redirect
    when('/public/palaces/:palaceID', {
      templateUrl: 'views/one-public-palace.html',
      controller: 'PublicController',
      controllerAs: 'publicCtrl'
    }).
    when('/:id/palaces/:palaceID', {
      templateUrl: 'views/one-palace.html',
      controller: 'PalaceController',
      controllerAs: 'palaceCtrl'
    }).
    when('/:id/palaces/:palaceID/edit', {
      templateUrl: 'views/edit-palace.html',
      controller: 'PalaceController',
      controllerAs: 'palaceCtrl'
    }).
    when('/:id/palaces/:palaceID/quiz', {
      templateUrl: 'views/quiz.html',
      controller: 'PalaceController',
      controllerAs: 'palaceCtrl'
    }).
    when('/all-public-palaces', {
      templateUrl: 'views/all-public-palaces.html',
      controller: 'PublicController',
      controllerAs: 'publicCtrl'
    }).
    // when('/all-public-palaces', {
    //   templateUrl: 'views/all-public-palaces.html',
    //   controller: 'PalaceController',
    //   controllerAs: 'palaceCtrl'
    // }).
    otherwise({
      redirectTo: '/'
    });
}]);

// Service for storing position information
app.service('positionService', function(){
  var controller = this;

  this.setStartPos = function(startPos) {
    controller.startPos = startPos;
    // console.log("in setStartPos function in service, startPos is: ", controller.startPos);
  }

  this.getStartPos = function() {
    return controller.startPos;
  }

  this.setStopPos = function(stopPos) {
    controller.stopPos = stopPos;
  }

  this.getStopPos = function() {
    return controller.stopPos;
  }
});

// ***DIRECTIVES for jQuery UI***

// This makes any element draggable
// Usage: <div draggable>Foobar</div>
app.directive('draggable', ['positionService', function(positionService) {
  var startPos,
      stopPos;

  return {
    // A = attribute, E = Element, C = Class and M = HTML Comment
    restrict:'A',
    scope: {
        callback: '&onStop'
    },
    //The link function is responsible for registering DOM listeners as well as updating the DOM.
    link: function(scope, element, attrs) {
      element.draggable({
        revert:'invalid',
        start: function(evt, ui){
          startPos = ui.helper.position();
          // console.log("in draggable directive, STARTPos is: ", startPos);

          positionService.setStartPos(startPos);
        },
        stop: function(evt, ui){
          stopPos = ui.helper.position();
          // console.log("in draggable directive, STOPPos is now: ", stopPos);

          positionService.setStopPos(stopPos);
        }
      });
    }
  };
}]);

// This makes any element droppable
// Usage: <div droppable></div>
app.directive('droppable', function($compile) {
  return {
    restrict: 'A',
    link: function(scope,element,attrs){
      //This makes an element Droppable
      element.droppable({
        drop:function(event,ui) {
          var dragIndex = angular.element(ui.draggable).data('index'),
              reject = angular.element(ui.draggable).data('reject'),
              dragEl = angular.element(ui.draggable).parent(),
              dropEl = angular.element(this);

          if (dragEl.hasClass('list1') && !dropEl.hasClass('list1') && reject !== true) {
            scope.list2.push(scope.list1[dragIndex]);
            scope.list1.splice(dragIndex, 1);
          } else if (dragEl.hasClass('list2') && !dropEl.hasClass('list2') && reject !== true) {
            scope.list1.push(scope.list2[dragIndex]);
            scope.list2.splice(dragIndex, 1);
          }
          scope.$apply();
        }
      });
    }
  };
});

// directive to make an element resizable -- NOT WORKING YET
app.directive('resizable', function () {
  return {
    restrict: 'A',
    scope: {
        callback: '&onResize'
    },
    link: function postLink(scope, elem, attrs) {
        elem.resizable();
        elem.on('resize', function (evt, ui) {
          scope.$apply(function() {
            if (scope.callback) {
              scope.callback({$evt: evt, $ui: ui });
            }
          })
        });
    }
  };
});
