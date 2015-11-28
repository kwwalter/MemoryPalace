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
      _owner: controller.userID
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
  this.editPalaceUrl = '/' + $routeParams.id + '/palaces/' + $routeParams.palaceID + '/edit';

  // can use this to either update Palace or Fact, and associate with the palace in the $routeParams.palaceID if doing the latter
  this.factUrl = '/' + $routeParams.id + '/palaces/' + $routeParams.palaceID + '/fact';

  this.name;

  this.factCount = 1;

  // boolean for whether or not to display the edit palace name form (one line form, anyway)
  this.editBool = false;

  this.displayOnePalace = function() {
    $http.get(controller.singlePalaceUrl).then(function(data){
      // console.log('data from singlePalaceUrl get: ', data);
      controller.palace = data.data[0];
      controller.name = data.data[0].name;
      controller.imageNumber = data.data[0].imageNumber;
    }, function(error){
      console.log("there was an error retrieving the data: ", error);
    });
  }

  // this one might be defunct
  this.editPalace = function() {
    $http.put(controller.editPalaceUrl, {
      name: controller.name,
      question: controller.question,
      answer: controller.answer
    }).then(function(data){
      console.log('data from editPalaceUrl put: ', data);
      // maybe instead of redirecting, can just display the palace information below the forms, so the user can see when their questions have been saved..
      $location.path('/' + data.data._owner + '/palaces/' + data.data._id);
    }, function(error){
      console.log("there was an error modifying the palace / retrieving the data: ", error);
    });
  };

  this.editPalaceName = function() {
    $http.put(controller.editPalaceUrl, {
      name: controller.name,
    }).then(function(data){
      console.log('data from editPalaceUrl put: ', data);
      controller.editBool = false;
      controller.displayOnePalace();
    }, function(error){
      console.log("there was an error modifying the palace / retrieving the data: ", error);
    });
  };

  this.addCardToImg = function(event) {
    // get x and y coordinates of where the moust was clicked, through the event (from $event on ng-click). Convert to string values for easier concatenation, too
    console.log("event is: ", event);

    // subtracting 50 since the click appends the div at the top left corner of the square. This'll get to the center of it.
    var x = event.offsetX - 50;
    var y = event.offsetY - 50;
    var currentFactCount = controller.factCount;

    // position is correct for the click, but not appending to the right place in the div--maybe have to set the image as a background of the container div, then set these coords in relation to that?
    var divString = '<div draggable class="draggable-div" id="fact' + currentFactCount + '" style="left: ' + x + 'px; top: ' + (y - ((4 + currentFactCount) * 100)) + 'px;">Fact #' + currentFactCount + '<button ng-click="palaceCtrl.addFact(' + currentFactCount + ')">Add a fact</button></div>';
    console.log("divString is: ", divString);

    // listening for drag stop, but not working
    $('#fact'+currentFactCount).on( "palaceCtrl.stop", function( event, ui ) {
      console.log("listening for drag stop!");
    } );

    // append a div to the img, using the draggable directive. And using $compile and $scope to apply the directive to the div, since it's being added after document ready
    $('#image-container').append($compile(divString)($scope));

    // increase the fact counter for correct numeration
    controller.factCount += 1;
  };

  this.addFact = function(currentFactCount){
    // when a fact is saved, have to make sure to save the top and left values of the div
    // because this positionService stores information about the div that was recently moved, it might be best to remove the "add fact" button from a draggable div as soon as it's clicked the first time
    // may also have to store top and left from addCardtoImg() when the first card is placed, because otherwise can't read top or left of undefined (if not dragged, nothing will be stored)
    var position = positionService.getStopPos();
    var top = position.top;
    var left = position.left;

    console.log("inside of addFact, top and left are, respectively: ", top, left);

    console.log("inside of addFact, currentFactCount is: ", currentFactCount);
  };

  // function for resizing divs -- NOT WORKING YET
  this.resize = function(evt,ui) {
    console.log (evt,ui);
    alert('inside of palaceCtrl.resize() function');
    $scope.w = ui.size.width;
    $scope.h = ui.size.height;
  };

  this.displayOnePalace();
}]);

app.controller('DragDropController', function($scope) {
  this.handleDrop = function() {
    alert('Item has been dropped');
  }
});

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
