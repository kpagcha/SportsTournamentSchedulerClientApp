var app = angular.module('tournamentSchedulerApp', ['ngRoute']);

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

  var allPlayers = original.players;
  var allVenues = original.localizations;
  var allTimeslots = original.timeslots;

  $scope.tournament = angular.copy(original);
  $rootScope.tournament = $scope.tournament;
  $scope.tournament.json = JSON.stringify($scope.tournament, null, 2);

  $rootScope.selected = 'info';
  $scope.players = $scope.tournament.players;
  $scope.venues = $scope.tournament.localizations;
  $scope.timeslots = $scope.tournament.timeslots;

  $('.dropdown-button').dropdown({hover: true, belowOrigin: true});
  $('.modal-trigger').leanModal();
  $('.toc-wrapper').pushpin({
    top: $('.toc-wrapper').offset().top,
    offset: Math.max(0, (($(window).height() - $('.toc-wrapper').outerHeight()) / 2) + $(window).scrollTop())
  });
  $('.scrollspy').scrollSpy();

  $rootScope.showTournament = function () {
    $scope.players = $scope.tournament.players;
    $scope.venues = $scope.tournament.localizations;
    $scope.timeslots = $scope.tournament.timeslots;

    $scope.event = null;
  };

  $rootScope.showEvent = function (index) {
    $rootScope.selected = index;

    var events = $scope.tournament.events;
    if (index < 0 || index >= events.length)
      return;

    var event = events[index];
    $scope.event = event;

    $scope.players = [];
    $scope.venues = [];
    $scope.timeslots = [];

    event.players.forEach(function (i) {
      $scope.players.push(allPlayers[i]);
    });

    event.localizations.forEach(function (i) {
      $scope.venues.push(allVenues[i]);
    });

    event.timeslots.forEach(function (i) {
      $scope.timeslots.push(allTimeslots[i]);
    });
  };

  $scope.getPlayer = function (index) {
    return allPlayers[index];
  };

  $scope.getVenue = function (index) {
    return allVenues[index];
  };

  $scope.getTimeslot = function (index) {
    return allTimeslots[index];
  };

  $scope.isBreak = function (index) {
    if (!$scope.event)
      return false;
    return $.inArray($scope.event.timeslots[index], $scope.event.breaks) != -1;
  };

  /* ATECIÓN ESTÁ ESTO DE FORMA TEMPORAL PARA VER COMO QUEDA LA PAGINA DE EVENTO.
   QUITAR CUANDO ESTÉ TERMINADA
   */
  $scope.showEvent(2);
  /**
   * FIN. CUANDO ESTE TERMINADO BORRAR LO DE ARRIBA
   */
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

app.run(function ($rootScope) {
  $rootScope.jQuery = jQuery;

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