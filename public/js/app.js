var app = angular.module('MemoryPalace', ['ngRoute']);


// *** MAIN CONTROLLER ***
app.controller('MainController', ['$http', '$location', function($http, $location){
  var controller = this;

  this.signedIn = false;
  this.currentUser = null;

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

  this.refresh();
}]);

// *** PALACE CONTROLLER ***
app.controller('PalaceController', ['$http', '$location', '$routeParams', function($http, $location, $routeParams){
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
}]);

app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider){
  $locationProvider.html5Mode({ enabled: true });
  $routeProvider.
    when('/', {
      templateUrl: 'partials/welcome.html',
      controller: 'MainController',
      controllerAs: 'mainCtrl'
    }).
    when('/signup', {
      templateUrl: 'partials/signup.html',
      controller: 'MainController',
      controllerAs: 'mainCtrl'
    }).
    when('/login', {
      templateUrl: 'partials/login.html',
      controller: 'MainController',
      controllerAs: 'mainCtrl'
    }).
    when('/:id/loggedin', {
      templateUrl: 'partials/loggedin.html',
      controller: 'LoggedInController',
      controllerAs: 'loggedinCtrl'
    }).
    when('/:id/palaces', {
      templateUrl: 'partials/palaces.html',
      controller: 'LoggedInController',
      controllerAs: 'loggedinCtrl'
    }).
    when('/:id/palaces/new', {
      templateUrl: 'partials/new-palace.html',
      controller: 'LoggedInController',
      controllerAs: 'loggedinCtrl'
    }).
    when('/:id/palaces/:palaceID', {
      templateUrl: 'partials/one-palace.html',
      controller: 'PalaceController',
      controllerAs: 'palaceCtrl'
    }).
    when('/:id/palaces/:palaceID/edit', {
      templateUrl: 'partials/edit-palace.html',
      controller: 'PalaceController',
      controllerAs: 'palaceCtrl'
    }).
    otherwise({
      redirectTo: '/'
    });
}]);
