// var app = angular.module('MemoryPalace', ['ngRoute']);

var app = angular.module('fuckthis', []); 

app.controller('MainController', ['$http', function($http){
  this.name = "MainController";
}]);

app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider){
  $locationProvider.html5Mode({ enabled: true });
  $routeProvider.
    when('/', {
      templateUrl: 'partials/welcome.html',
      controller: 'MainController',
      controllerAs: 'mainCtrl'
    }).
    otherwise({
      redirectTo: '/'
    });
}]);
