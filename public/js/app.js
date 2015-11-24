var app = angular.module('MemoryPalace', ['ngRoute']);

app.controller('MainController', ['$http', function($http){
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
    }, function(error){
      console.log("there was an error: ", error);
    });
  };

  this.login = function() {
    alert('loggin!');
    $http.post('/login', {
      userEmail: controller.userEmail,
      password: controller.password
    }).then(function(data){
      console.log(data);
    }, function(error){
      console.log("there was an error: ", error);
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
    otherwise({
      redirectTo: '/'
    });
}]);
