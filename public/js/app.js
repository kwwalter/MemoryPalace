var app = angular.module('MemoryPalace', ['ngRoute']);

app.controller('MainController', ['$http', '$window', function($http, $window){
  var controller = this;

  this.signup = function() {
    // alert('singup!');
    // console.log("controller.email: ", controller.userEmail);
    // console.log("controller.password: ", controller.password);
    $http.post('/signup', {
      userEmail: controller.userEmail,
      password: controller.password
    }).then(function(data){
      console.log(data);
      if (data.data._id) {
        $window.location.href = '/' + data.data._id + '/loggedin';
      } else {
        $('body').append('<h2>Sorry, there was an error signing you up--try again!</h2>');
      }
    }, function(error){
      console.log("there was an error: ", error);
    });
  };

  this.login = function() {
    // alert('loggin!');
    $http.post('/login', {
      userEmail: controller.userEmail,
      password: controller.password
    }).then(function(data){
      console.log(data);
      if (data.data._id) {
        $window.location.href = '/' + data.data._id + '/loggedin';
      } else {
        $('body').append('<h2>Sorry, there was an error logging you in--try again!</h2>');
      }
    }, function(error){
      console.log("there was an error: ", error);
    });
  };
}]);

app.controller('LoggedInController', ['$http', '$window', '$routeParams', function($http, $window, $routeParams){
  var controller = this;

  this.userEmail = $routeParams.userEmail;
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
    otherwise({
      redirectTo: '/'
    });
}]);
