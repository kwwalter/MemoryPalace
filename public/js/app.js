var app = angular.module('MemoryPalace', ['ngRoute']);

app.controller('MainController', ['$http', function($http){
  var controller = this;

  this.signup = function() {
    alert('singup!');
    // to do
  };

  this.login = function() {
    alert('loggin!');
    // to do
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
