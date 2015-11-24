var app = angular.module('MemoryPalace', ['ngRoute']);


// *** MAIN CONTROLLER ***
app.controller('MainController', ['$http', '$location', function($http, $location){
  var controller = this;

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
        console.log(data);
        if (data.data.currentUser) {
          $location.path('/' + data.data.currentUsername + '/loggedin');
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
      console.log(data);
      if (data.data.currentUser) {
        $location.path('/' + data.data.currentUsername + '/loggedin');
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

  this.currentUsername = $routeParams.username;

  console.log("$routeParams: ", this.currentUsername);
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
    when('/:username/loggedin', {
      templateUrl: 'partials/loggedin.html',
      controller: 'LoggedInController',
      controllerAs: 'loggedinCtrl'
    }).
    otherwise({
      redirectTo: '/'
    });
}]);
