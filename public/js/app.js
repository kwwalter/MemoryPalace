var app = angular.module('MemoryPalace', ['ngRoute']);

app.controller('MainController', ['$http', function($http){
  var controller = this;

  this.signup = function() {
    // alert('singup!');
    $http.post('/signup', {
      req.body.email: controller.email,
      req.body.password: controller.password
      // console.log("posting to signup..");
      // controller.userEmail = req.body.email;
      // controller.password = req.body.password;
      // console.log("controller.userEmail is: ", controller.userEmail);
      // console.log("controller.password is: ", controller.password);
    });
  };

  this.login = function() {
    // alert('loggin!');
    $http.post('/login', {
      req.body.email: controller.email,
      req.body.password: controller.password
      // console.log("posting to login..");
      // controller.userEmail = req.body.email;
      // controller.password = req.body.password;
      // console.log("controller.userEmail is: ", controller.userEmail);
      // console.log("controller.password is: ", controller.password);
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
