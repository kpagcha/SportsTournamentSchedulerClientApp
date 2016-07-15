var app = angular.module('tournamentSchedulerApp', ['ngRoute', 'ui.materialize']);

app.factory('service', ['$http', function ($http) {
  var servicePath = 'http://localhost:8080/eventscheduler/';
  return {
    getTournaments: function () {
      return $http.get(servicePath);
    },
    getTournament: function (id) {
      return $http.get(servicePath + id);
    },
    deleteTournament: function (id) {
      return $http.delete(servicePath + id);
    }
  };
}]);

app.controller('TournamentListController', function ($scope, $rootScope, service) {
  service.getTournaments().then(function (response) {
    $scope.tournaments = response.data;
  });

  $rootScope.tournament = null;
});

app.controller('TournamentController', function ($scope, $rootScope, $routeParams, $window, service, tournament) {
  var original = tournament.data;

  var allPlayers = original.players;
  var allVenues = original.localizations;
  var allTimeslots = original.timeslots;

  $scope.tournament = angular.copy(original);
  $scope.tournament.id = $routeParams.id;
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

  var scrollTo = function (selector) {
    var offset = $(selector).offset().top + 1;
    $('html, body').animate({ scrollTop: offset }, {duration: 400, queue: false, easing: 'easeOutCubic'});
  };

  $('#teams-link').click(function (e) {
    e.preventDefault();
    scrollTo('#teams');
  });
  $('#assigned-and-unavailable-link').click(function (e) {
    e.preventDefault();
    scrollTo('#assigned-and-unavailable-timeslots');
  });
  $('#unavailable-venues-link').click(function (e) {
    e.preventDefault();
    scrollTo('#unavailable-venues');
  });
  $('#assigned-venues-link').click(function (e) {
    e.preventDefault();
    scrollTo('#assigned-venues');
  });
  $('#matchups-link').click(function (e) {
    e.preventDefault();
    scrollTo('#matchups');
  });

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

  $rootScope.deleteTournament = function () {
    if (confirm("Are you sure you want to delete this tournament?") == true)
      service.deleteTournament($scope.tournament.id).then(function () {
        $window.location.href = "";
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

  $scope.getTimeslotDisplay = function (index, includeChronologicalOrder) {
    return readableTimeslot(allTimeslots[index], includeChronologicalOrder);
  };

  $scope.getDurationDisplay = function (timeslot) {
    if (!timeslot.duration)
      return "";

    var str = timeslot.duration.value + " " + timeslot.duration.type;
    if (str.endsWith('s') && timeslot.duration.value <= 1)
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

  $scope.isMatchupModeRelevant = function () {
    if (!$scope.event)
      return false;
    return $scope.event.playersPerMatch > 1 && $scope.event.matchesPerPlayer > 1;
  };

  $scope.getMatchupMode = function () {
    if (!$scope.event)
      return "";
    return $scope.event.matchupMode.replace("_", " ");
  };
});

app.controller('TournamentCreateController', function ($scope, $rootScope, service) {
  $rootScope.tournament = null;

 // $('select').material_select();

  $scope.tournament = {};

  $scope.tournament.players = [];
  $scope.tournament.venues = [];
  $scope.tournament.timeslots = [];
  $scope.tournament.playersPerMatch = 2;
  $scope.tournament.matchesPerPlayer = 1;
  $scope.tournament.timeslotsPerMatch = 2;

  $scope.timeslot = {};
  $scope.timeslot.chronologicalOrder = 1;
  $scope.withStart = false;
  $scope.withDuration = false;
  $scope.startTypes = {
    available: [
      { value: 'LocalTime', name: 'Time' },
      { value: 'LocalDate', name: 'Date' },
      { value: 'LocalDateTime', name: 'Date and time' },
      { value: 'DayOfWeek', name: 'Day of week' },
      { value: 'MonthDay', name: 'Day of month' },
      { value: 'Month', name: 'Month' },
      { value: 'YearMonth', name: 'Month and year' },
      { value: 'Year', name: 'Year' }
    ],
    selected: { value: 'LocalTime', name: 'Time' }
  };
  $scope.durationTypes = {
    available: [
      { value: 'milliseconds', name: 'Milliseconds' },
      { value: 'seconds', name: 'Seconds' },
      { value: 'minutes', name: 'Minutes' },
      { value: 'hours', name: 'Hours' },
      { value: 'days', name: 'Days' },
      { value: 'months', name: 'Months' },
      { value: 'years', name: 'Years' }
    ],
    selected: { value: 'hours', name: 'Hours' }
  };
  $scope.form = {};

  $scope.addPlayer = function () {
    if (!$scope.player)
      return;
    $scope.tournament.players.push($scope.player);
    $scope.player = null;
  };

  $scope.deletePlayer = function (index) {
    if (index > -1)
      $scope.tournament.players.splice(index, 1);
  };

  $scope.addVenue = function () {
    if (!$scope.venue)
      return;
    $scope.tournament.venues.push($scope.venue);
    $scope.vensue = null;
  };

  $scope.deleteVenue = function (index) {
    if (index > -1)
      $scope.tournament.venues.splice(index, 1);
  };

  $scope.getTimeslotDisplay = function (timeslot) {
    return readableTimeslot(timeslot, true);
  };
  
  $scope.addTimeslot = function () {
    if (!$scope.timeslot)
      return;

    if ($scope.withStart) {

    }

    if ($scope.withDuration && $scope.durationType && $scope.durationValue) {
      $scope.timeslot.duration = {
        type: $scope.durationType,
        value: $scope.durationValue
      }
    }

    $scope.tournament.timeslots.push($scope.timeslot);
    console.log($scope.timeslot);

    $scope.timeslot = { chronologicalOrder: $scope.timeslot.chronologicalOrder + 1 };
  };

  $scope.deleteTimeslot = function (index) {
    if (index > -1)
      $scope.tournament.timeslots.splice(index, 1);
  }
});

app.config(['$routeProvider', function ($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'partials/list.html',
      controller: 'TournamentListController'
    })
    .when('/create', {
      templateUrl: 'partials/form/form.html',
      controller: 'TournamentCreateController'
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

function readableTimeslot(t, includeChronologicalOrder) {
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

  if (includeChronologicalOrder)
    str += " (" + t.chronologicalOrder + ")";

  return  str;
}