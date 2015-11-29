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

// *** PALACE CONTROLLER ***
app.controller('PalaceController', ['$http', '$location', '$routeParams', '$compile', '$scope', 'positionService', function($http, $location, $routeParams, $compile, $scope, positionService){
  var controller = this;

  this.allPalaceUrl = '/' + $routeParams.id + '/palaces';
  this.singlePalaceUrl = '/' + $routeParams.id + '/palaces/' + $routeParams.palaceID;
  this.editPalaceNameUrl = '/' + $routeParams.id + '/palaces/' + $routeParams.palaceID + '/edit-name';
  this.editPalacePublicUrl = '/' + $routeParams.id + '/palaces/' + $routeParams.palaceID + '/edit-public';
  this.submitFactUrl = '/' + $routeParams.id + '/palaces/' + $routeParams.palaceID + '/submit-fact';
  this.getFactsUrl = '/palaces/' + $routeParams.palaceID + '/get-facts';

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

  this.displayOnePalace = function() {
    // get all the facts first..
    controller.getFacts();

    $http.get(controller.singlePalaceUrl).then(function(data){
      // console.log('data from singlePalaceUrl get: ', data);
      controller.palace = data.data[0];
      controller.name = data.data[0].name;
      controller.imageNumber = data.data[0].imageNumber;

      // now that we have the facts, need to append a div to the image based on the top and left values of each..
      var appendString;
      for (var i = 1; i <= controller.facts.length; i++){
        // console.log("controller.facts[" + (i-1) + "] is: ", controller.facts[i-1]);
        appendString = '<div draggable class="draggable-div" id="fact' + i + '" style="top: ' + controller.facts[i-1].top + 'px; left: ' + controller.facts[i-1].left + 'px;"><h5 class="fact-header' + i + '">Fact #' + i + '</h5></div>';
        // console.log("appendString is: ", appendString);

        // now append it!
        $('#image-container').append($compile(appendString)($scope));

        // also, set a controller-wide variable for the length of the facts array..
        controller.factsLength = controller.facts.length;
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
    // get x and y coordinates of where the moust was clicked, through the event (from $event on ng-click). Convert to string values for easier concatenation, too
    console.log("event is: ", event);

    // subtracting 50 since the click appends the div at the top left corner of the square. This'll get to the center of it.
    var x = event.offsetX - 50;
    var y = event.offsetY - 50;

    // this only impacts the top value for newly-appended divs
    var currentFactCount = controller.factCount;

    // need to keep track of the fact sequence, too, based on the length of the array. Will make a change in the display one palace thing
    var currentFactsLength = controller.factsLength;

    // have to store top and left position when the first card is placed, because otherwise can't read top or left of undefined (if this first card isn't dragged, nothing will be stored)
    var position = {
      top: (y - ((4 + currentFactCount) * 100)),
      left: x
    };
    positionService.setStopPos(position);

    // position is correct for the click, but not appending to the right place in the div--maybe have to set the image as a background of the container div, then set these coords in relation to that?
    var divString = '<div draggable class="draggable-div" id="fact' + currentFactsLength + '" style="top: ' + (y - ((4 + currentFactCount) * 100)) + 'px; left: ' + x + 'px;"><h5 class="fact-header' + currentFactsLength + '">Fact #' + currentFactsLength + '</h5><button ng-hide="palaceCtrl.cardBool" ng-click="palaceCtrl.addFact(' + currentFactsLength + ')">Add a fact</button><div class="fact-form" ng-hide="!palaceCtrl.cardBool">Question: <input type="text" ng-model="palaceCtrl.question"></br>Answer: <input type="text" ng-model="palaceCtrl.answer"></br><button ng-click="palaceCtrl.submitFact(' + currentFactsLength + ')">Submit this fact!"</button></div></div>';
    console.log("divString is: ", divString);

    // append a div to the img, using the draggable directive. And using $compile and $scope to apply the directive to the div, since it's being added after document ready
    $('#image-container').append($compile(divString)($scope));

    // increase the fact counter for correct numeration
    controller.factCount += 1;
  };

  this.addFact = function(currentFactsLength){
    // when a fact is saved, have to make sure to save the top and left values of the div
    // because this positionService stores information about the div that was recently moved, it might be best to remove the "add fact" button from a draggable div as soon as it's clicked the first time
    controller.position = positionService.getStopPos();
    console.log("inside of addFact(), position is now: ", controller.position);
    // var top = position.top;
    // var left = position.left;

    controller.factID = '#fact' + currentFactsLength;
    controller.factHeader = '.fact-header' + currentFactsLength;

    // change the value of the cardBool
    controller.cardBool = true;

    // console.log("inside of addFact, top and left are, respectively: ", top, left);

    console.log("inside of addFact, currentFactsLength is: ", currentFactsLength);

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
      var flipString = '<p class="question">Question: ' + controller.question + '</p><br><p class="answer hidden">Answer: ' + controller.answer + '</p><button ng-click="palaceCtrl.flipCard()">Flip over!</button>';
      console.log("flipString is: ", flipString);
      $(controller.factID).append($compile(flipString)($scope));

      // reset the question and answer values
      controller.question = "";
      controller.answer = "";
    }, function(error){
      console.log("there was an error modifying the palace / retrieving the data: ", error);
    });
  };

  // this can be done with ng-hide and ng-click, but will fix that later if time permits
  this.flipCard = function() {
    // console.log("in the flipCard function");
    $(controller.factID + ' > .answer').toggleClass('hidden');
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
  this.getFacts = function() {
    $http.get(controller.getFactsUrl).then(function(data){
      console.log('data from getFactsUrl get: ', data);
      controller.facts = data.data;
    }, function(error){
      console.log("there was an error retrieving the data: ", error);
    });
  };

  // run once to initialize on controller instantiation
  this.displayOnePalace();
}]);

// controller for all public palaces
app.controller('PublicController', ['$http', '$routeParams', '$scope', function($http, $routeParams, $scope){
  var controller = this;

  this.onePublicPalaceUrl = '/public/palaces/' + $routeParams.palaceID;
  this.getFactsUrl = '/palaces/' + $routeParams.palaceID + '/get-facts';

  // since this is separate from the palaces controller, copying this function here so we can get all the facts for a given palace
  this.getFacts = function() {
    $http.get(controller.getFactsUrl).then(function(data){
      console.log('data from getFactsUrl get: ', data);
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
      templateUrl: '/../views/welcome.html',
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
    when('/all-public-palaces', {
      templateUrl: 'views/all-public-palaces.html',
      controller: 'PublicController',
      controllerAs: 'publicCtrl'
    }).
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
          console.log("in draggable directive, STARTPos is: ", startPos);

          positionService.setStartPos(startPos);
        },
        stop: function(evt, ui){
          stopPos = ui.helper.position();
          console.log("in draggable directive, STOPPos is now: ", stopPos);

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
