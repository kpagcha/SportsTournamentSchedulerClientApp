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

    $scope.event = events[index];

    $scope.players = [];
    $scope.venues = [];
    $scope.timeslots = [];

    $scope.event.players.forEach(function (i) {
      $scope.players.push(allPlayers[i]);
    });

    $scope.event.localizations.forEach(function (i) {
      $scope.venues.push(allVenues[i]);
    });

    $scope.event.timeslots.forEach(function (i) {
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

  $scope.getTimeslotDisplay = function (index) {
    var t = allTimeslots[index];
    var start = t.start;

    var str = "Timeslot " + t.chronologicalOrder;
    if (!start)
      return str;

    switch (t.start.type) {
      case "DayOfWeek":
      case "Month":
      case "Year":
      case "LocalTime":
        str = t.start.value;
        break;
      case "MonthDay":
        str = moment().month(t.start.value.month - 1).date(t.start.value.dayOfMonth).format("MMM Do");
        break;
      case "LocalDate":
        str = moment(timeslot.start.value).format("MMM Do YYYY");
        break;
      case "LocalDateTime":
        str = moment(timeslot.start.value).format("MMM Do YYYY, HH:mm");
        break;
    }
    return str;
  };

  $scope.getDuration = function (timeslot) {
    if (!timeslot.duration)
      return "";

    var str = timeslot.duration.value + " " + timeslot.duration.type;
    if (str.endsWith('s') && timeslot.duration.value < 1)
      str = str.substr(0, str.length - 1);
    return str;
  };

  $scope.isBreak = function (index) {
    if (!$scope.event || !$scope.event.breaks)
      return false;
    return $.inArray($scope.event.timeslots[index], $scope.event.breaks) != -1;
  };

  $scope.isPlayerUnavailable = function (playerIdx, timeslotIdx) {
    if (!$scope.event || !$scope.event.unavailablePlayers)
      return false;
    return $.inArray($scope.event.timeslots[timeslotIdx],
      $scope.event.unavailablePlayers[$scope.event.players[playerIdx]]) != -1;
  };

  $scope.isVenueUnavailable = function (venueIdx, timeslotIdx) {
    if (!$scope.event || !$scope.event.unavailableLocalizations)
      return false;
    return $.inArray($scope.event.timeslots[timeslotIdx],
      $scope.event.unavailableLocalizations[$scope.event.localizations[venueIdx]]) != -1;
  };

  $scope.isTimeslotAssigned = function (playerIdx, timeslotIdx) {
    if (!$scope.event || !$scope.event.playersAtTimeslots)
      return false;
    return $.inArray($scope.event.timeslots[timeslotIdx],
      $scope.event.playersAtTimeslots[$scope.event.players[playerIdx]]) != -1;
  };

  $scope.isVenueAssigned = function (playerIdx, venueIdx) {
    if (!$scope.event || !$scope.event.playersInLocalizations)
      return true;
    return $.inArray($scope.event.localizations[venueIdx],
      $scope.event.playersInLocalizations[$scope.event.players[playerIdx]]) != -1;
  };

  /* ATECIÓN ESTÁ ESTO DE FORMA TEMPORAL PARA VER COMO QUEDA LA PAGINA DE EVENTO.
   QUITAR CUANDO ESTÉ TERMINADA
   */
  $scope.showEvent(0);
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