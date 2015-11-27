var app = angular.module('MemoryPalace', ['ngRoute']);

// *** MAIN CONTROLLER ***
app.controller('MainController', ['$http', '$location', function($http, $location){
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
          controller.currentUsername = data.data.currentUsername
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
        controller.currentUsername = data.data.currentUsername
        console.log("controller.currentUsername: ", controller.currentUsername);
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
app.controller('LoggedInController', ['$http', '$location', '$routeParams', function($http, $location, $routeParams){
  var controller = this;

  this.allPalaceUrl = '/' + $routeParams.id + '/palaces';
  this.newPalaceUrl = '/' + $routeParams.id + '/palaces/new';
  this.userID = $routeParams.id;

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
      _owner: controller.userID
    }).then(function(data){
        // console.log(data);
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

    $http.delete(deletePalaceUrl, palace).then(function(data){
      console.log("palace successfully deleted: ", data);
      controller.refresh();
    }, function(error){
      console.log("there was an error deleting this palace: ", error);
      }
    );
  };

  // calling this upon instantiation of the controller so that the palace list is loaded
  this.refresh();
}]);

// *** PALACE CONTROLLER ***
app.controller('PalaceController', ['$http', '$location', '$routeParams', '$compile', '$scope', function($http, $location, $routeParams, $compile, $scope){
  var controller = this;

  this.allPalaceUrl = '/' + $routeParams.id + '/palaces';
  this.singlePalaceUrl = '/' + $routeParams.id + '/palaces/' + $routeParams.palaceID;
  this.editPalaceUrl = '/' + $routeParams.id + '/palaces/' + $routeParams.palaceID + '/edit';
  this.name;

  $http.get(this.singlePalaceUrl).then(function(data){
    // console.log('data from singlePalaceUrl get: ', data);
    controller.palace = data.data[0];
    controller.name = data.data[0].name;
  }, function(error){
    console.log("there was an error retrieving the data: ", error);
  });

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
      console.log("there was an error retrieving the data: ", error);
    });
  };

  this.addCardToImg = function(event) {
    // get x and y coordinates of where the moust was clicked, through the event (from $event on ng-click). Convert to string values for easier concatenation, too
    var x = event.clientX.toString();
    var y = event.clientY.toString();

    // position is correct for the click, but not appending to the right place in the div--maybe have to set the image as a background of the container div, then set these coords in relation to that?
    var divString = '<div draggable id="draggable-div" style="position: relative; left:' + x + '; top: ' + y + ';"></div>';
    console.log("divString is: ", divString);

    // append a div to the img, using the draggable directive. And using $compile and $scope to apply the directive to the div, since it's being added after document ready
    $('#image-container').append($compile(divString)($scope));
  };

  // function for resizing divs -- NOT WORKING YET
  this.resize = function(evt,ui) {
    console.log (evt,ui);
    alert('inside of palaceCtrl.resize() function');
    $scope.w = ui.size.width;
    $scope.h = ui.size.height;
  }
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

// ***DIRECTIVES for jQuery UI***

// This makes any element draggable
// Usage: <div draggable>Foobar</div>
app.directive('draggable', function() {
  return {
    // A = attribute, E = Element, C = Class and M = HTML Comment
    restrict:'A',
    //The link function is responsible for registering DOM listeners as well as updating the DOM.
    link: function(scope, element, attrs) {
      element.draggable({
        revert:'invalid'
      });
    }
  };
});

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
