var app = angular.module('tournamentSchedulerApp', ['ngRoute']).run(function ($rootScope) {
  $rootScope.helpers = {
    moment: function (str, format) {
      if (typeof str === 'undefined')
        return moment();
      if (typeof format === 'undefined')
        return moment(str);
      return moment(str, format);
    }
  };
});

app.factory('service', ['$http', function ($http) {
  var servicePath = 'http://localhost:8080/eventscheduler/';
  return {
    getTournaments: function () {
      return $http.get(servicePath);
    },
    getTournament: function (id) {
      return $http.get(servicePath + id);
    }
  };
}]);

app.controller('TournamentListController', function ($scope, $rootScope, service) {
  service.getTournaments().then(function (response) {
    $scope.tournaments = response.data;
  });

  $rootScope.tournament = null;
});

app.controller('TournamentController', function ($scope, $rootScope, service, tournament) {
  var original = tournament.data;
  $scope.tournament = angular.copy(original);
  $rootScope.tournament = $scope.tournament;
  $scope.tournament.prettyJson = JSON.stringify($scope.tournament, null, 2);
});

app.config(['$routeProvider', function ($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'partials/list.html',
      controller: 'TournamentListController'
    })
    .when('/:id', {
      templateUrl: 'partials/tournament.html',
      controller: 'TournamentController',
      resolve: {
        tournament: function (service, $route) {
          return service.getTournament($route.current.params.id);
        }
      }
    })
    .otherwise({
      redirectTo: '#/'
    });
}]);