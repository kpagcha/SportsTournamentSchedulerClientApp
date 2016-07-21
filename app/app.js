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
    },
    createTournament: function (tournament) {
      return $http.post(servicePath, tournament);
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
    $('html, body').animate({scrollTop: offset}, {duration: 400, queue: false, easing: 'easeOutCubic'});
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

app.controller('TournamentCreateController', function ($scope, $rootScope, $window, service) {
  $rootScope.tournament = null;

  $scope.createTournament = function () {
    var tournament = angular.copy($scope.tournament);
    tournament.localizations = angular.copy(tournament.venues);
    delete tournament.venues;

    service.createTournament(tournament)
      .success(function (data, status) {
        $window.location.href = "";
      })
      .error(function (data, status) {
        $scope.error = data;
      });
  };

  $scope.tournament = {};
  $scope.tournament.players = [];
  $scope.tournament.venues = [];
  $scope.tournament.timeslots = [];

  $scope.timeslot = {};
  $scope.timeslot.chronologicalOrder = 1;

  $scope.form = {
    date: moment().format("DD MMM, YYYY"),
    withStart: false,
    withDuration: false,
    durationValue: 1,
    autoIncrement: true
  };
  $scope.startTypes = {
    available: [
      {value: 'LocalTime', name: 'Time'},
      {value: 'LocalDate', name: 'Date'},
      {value: 'LocalDateTime', name: 'Date and time'},
      {value: 'DayOfWeek', name: 'Day of the week'},
      {value: 'MonthDay', name: 'Month and day'},
      {value: 'Month', name: 'Month'},
      {value: 'YearMonth', name: 'Year and month'},
      {value: 'Year', name: 'Year'}
    ],
    selected: {value: 'LocalTime', name: 'Time'}
  };
  $scope.durationTypes = {
    available: [
      {value: 'milliseconds', name: 'Milliseconds'},
      {value: 'seconds', name: 'Seconds'},
      {value: 'minutes', name: 'Minutes'},
      {value: 'hours', name: 'Hours'},
      {value: 'days', name: 'Days'},
      {value: 'weeks', name: 'Weeks'},
      {value: 'months', name: 'Months'},
      {value: 'years', name: 'Years'}
    ],
    selected: {value: 'hours', name: 'Hours'}
  };
  $scope.daysOfWeek = {
    available: [
      {value: 1, name: 'Monday'},
      {value: 2, name: 'Tuesday'},
      {value: 3, name: 'Wednesday'},
      {value: 4, name: 'Thursday'},
      {value: 5, name: 'Friday'},
      {value: 6, name: 'Saturday'},
      {value: 7, name: 'Sunday'}
    ],
    selected: {value: 1, name: 'Monday'}
  };
  $scope.months = {
    available: [
      {value: 1, name: 'January'},
      {value: 2, name: 'February'},
      {value: 3, name: 'March'},
      {value: 4, name: 'April'},
      {value: 5, name: 'May'},
      {value: 6, name: 'June'},
      {value: 7, name: 'July'},
      {value: 8, name: 'August'},
      {value: 9, name: 'September'},
      {value: 10, name: 'October'},
      {value: 11, name: 'November'},
      {value: 12, name: 'December'}
    ],
    selected: {value: 1, name: 'January'}
  };

  $scope.addPlayer = function () {
    if (!$scope.player)
      return;
    $scope.tournament.players.push({name: $scope.player});
    $scope.player = null;
  };

  $scope.deletePlayer = function (index) {
    if (index > -1)
      $scope.tournament.players.splice(index, 1);
  };

  $scope.addVenue = function () {
    if (!$scope.venue)
      return;
    $scope.tournament.venues.push({name: $scope.venue});
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

    if ($scope.form.withStart && $scope.startTypes.selected) {
      $scope.timeslot.start = {
        type: $scope.startTypes.selected.value
      };

      switch ($scope.startTypes.selected.value) {
        case 'LocalTime':
          $scope.timeslot.start.value = $scope.form.time;
          break;
        case 'LocalDate':
          $scope.timeslot.start.value = moment($scope.form.date, "DD MMM, YYYY").format("YYYY-MM-DD");
          break;
        case 'LocalDateTime':
          $scope.timeslot.start.value = {
            date: moment($scope.form.date, "DD MMM, YYYY").format("YYYY-MM-DD"),
            time: $scope.form.time
          };
          break;
        case 'DayOfWeek':
          $scope.timeslot.start.value = $scope.daysOfWeek.selected.value;
          break;
        case 'MonthDay':
          $scope.timeslot.start.value = {
            month: $scope.months.selected.value,
            dayOfMonth: $scope.form.day
          };
          break;
        case 'Month':
          $scope.timeslot.start.value = $scope.months.selected.value;
          break;
        case 'YearMonth':
          $scope.timeslot.start.value = {
            year: $scope.form.year,
            month: $scope.months.selected.value
          };
          break;
        case 'Year':
          $scope.timeslot.start.value = $scope.form.year;
          break;
      }
    }

    if ($scope.form.withDuration && $scope.durationTypes.selected && $scope.form.durationValue) {
      $scope.timeslot.duration = {
        type: $scope.durationTypes.selected.value,
        value: $scope.form.durationValue
      }
    }

    $scope.tournament.timeslots.push($scope.timeslot);

    var order = $scope.timeslot.chronologicalOrder;
    $scope.timeslot = {
      chronologicalOrder: $scope.form.autoIncrement ? order + 1 : order
    };
  };

  $scope.deleteTimeslot = function (index) {
    if (index > -1)
      $scope.tournament.timeslots.splice(index, 1);
  };


  $scope.form.tournamentConfirmed = false;
  $scope.formEvt = {
    domainConfirmed: false,
    hasTeams: false
  };

  $scope.confirmTournament = function () {
    $scope.form.tournamentConfirmed = true;
  };

  var demoClicked = false;
  $scope.demoTournament = function () {
    if (!demoClicked) {
      demoClicked = true;
      $scope.tournament = {
        name: 'Demo Tournament',
        players: [
          {name: 'Player 1'},
          {name: 'Player 2'},
          {name: 'Player 3'},
          {name: 'Player 4'},
          {name: 'Player 5'},
          {name: 'Player 6'},
          {name: 'Player 7'},
          {name: 'Player 8'},
          {name: 'Player 9'},
          {name: 'Player 10'},
          {name: 'Player 11'},
          {name: 'Player 12'},
          {name: 'Player 13'},
          {name: 'Player 14'},
          {name: 'Player 15'},
          {name: 'Player 16'}
        ],
        venues: [
          {name: 'Centre Court'},
          {name: 'Court 2'},
          {name: 'Court 6'},
          {name: 'Court 7'}
        ],
        timeslots: [
          {
            chronologicalOrder: 1,
            start: {
              type: 'LocalTime',
              value: '10:00'
            }
          },
          {
            chronologicalOrder: 1,
            start: {
              type: 'LocalTime',
              value: '11:00'
            }
          },
          {
            chronologicalOrder: 1,
            start: {
              type: 'LocalTime',
              value: '12:00'
            }
          },
          {
            chronologicalOrder: 1,
            start: {
              type: 'LocalTime',
              value: '13:00'
            }
          },
          {
            chronologicalOrder: 1,
            start: {
              type: 'LocalTime',
              value: '14:00'
            }
          },
          {
            chronologicalOrder: 1,
            start: {
              type: 'LocalTime',
              value: '15:00'
            }
          },
          {
            chronologicalOrder: 1,
            start: {
              type: 'LocalTime',
              value: '16:00'
            }
          },
          {
            chronologicalOrder: 1,
            start: {
              type: 'LocalTime',
              value: '17:00'
            }
          }
        ]
      };

      var i;
      for (i = 0; i < $scope.tournament.players.length; i++) $scope.event.players.push(i);
      for (i = 0; i < $scope.tournament.venues.length; i++) $scope.event.venues.push(i);
      for (i = 0; i < $scope.tournament.timeslots.length; i++) $scope.event.timeslots.push(i);
    }
    else if (!$scope.form.tournamentConfirmed)
      $scope.form.tournamentConfirmed = true;
  };

  $scope.event = {
    playersPerMatch: 2,
    matchesPerPlayer: 1,
    timeslotsPerMatch: 2,
    players: [],
    venues: [],
    timeslots: [],
    breaks: []
  };

  $scope.toggle = function (val, arr) {
    var index = arr.indexOf(val);
    if (index == -1)
      arr.push(val);
    else
      arr.splice(index, 1);
  };

  $scope.confirmEventDomains = function () {
    $scope.formEvt.domainConfirmed = true;

    $scope.event.players.sort(function (i, j) {
      return i - j;
    });
    $scope.event.venues.sort(function (i, j) {
      return i - j;
    });
    $scope.event.timeslots.sort(function (i, j) {
      return i - j;
    });

    $scope.formEvt.players = [];
    $scope.formEvt.venues = [];
    $scope.formEvt.timeslots = [];
    $scope.event.players.forEach(function (i) {
      var player = $scope.tournament.players[i];
      player.val = i;
      $scope.formEvt.players.push(player);
    });
    $scope.event.venues.forEach(function (i) {
      var venue = $scope.tournament.venues[i];
      venue.val = i;
      $scope.formEvt.venues.push(venue);
    });
    $scope.event.timeslots.forEach(function (i) {
      var timeslot = $scope.tournament.timeslots[i];
      timeslot.val = i;
      $scope.formEvt.timeslots.push(timeslot);
    });

    $scope.formEvt.teams = {
      unassignedPlayers: angular.copy($scope.formEvt.players),
      selectedPlayers: []
    };

    $scope.formEvt.unavailablePlayers = {
      selected: $scope.formEvt.players[0],
      values: {}
    };
    $scope.formEvt.unavailableVenues = {
      selected: $scope.formEvt.venues[0],
      values: {}
    };
    $scope.formEvt.playersAtTimeslots = {
      selected: $scope.formEvt.players[0],
      values: {}
    };
    $scope.formEvt.playersInVenues = {
      values: {}
    };
    $scope.formEvt.matchup = {
      players: [],
      localizations: [],
      timeslots: [],
      occurrences: 1
    };
    $scope.formEvt.matchupModes = {
      values: [
        {name: 'All different', val: 'ALL_DIFFERENT'},
        {name: 'All equal', val: 'ALL_EQUAL'},
        {name: 'Any', val: 'ANY'},
        {name: 'Custom', val: 'CUSTOM'}
      ],
      selected: {name: 'Any', val: 'ANY'}
    };

    $scope.event.players.forEach(function (playerIndex) {
      $scope.formEvt.unavailablePlayers.values[playerIndex] = [];
      $scope.formEvt.playersAtTimeslots.values[playerIndex] = [];
      $scope.formEvt.playersInVenues.values[playerIndex] = [];
    });
    $scope.event.venues.forEach(function (venueIndex) {
      $scope.formEvt.unavailableVenues.values[venueIndex] = [];
    })
  };

  $scope.toggleTeams = function () {
    $scope.event.playersPerTeam = $scope.formEvt.hasTeams ? 2 : undefined;
  };

  $scope.addTeam = function () {
    if ($scope.formEvt.teams.selectedPlayers.length != $scope.event.playersPerTeam)
      return;

    if (!$scope.event.teams)
      $scope.event.teams = [];

    $scope.event.teams.push({players: $scope.formEvt.teams.selectedPlayers});

    $scope.formEvt.teams.selectedPlayers.forEach(function (selected) {
      var index;
      $scope.formEvt.teams.unassignedPlayers.forEach(function (player, i) {
        if (player.val == selected)
          index = i;
      });
      if (index !== undefined)
        $scope.formEvt.teams.unassignedPlayers.splice(index, 1);
    });
    $scope.formEvt.teams.selectedPlayers = []
  };

  $scope.deleteTeam = function (teamIndex) {
    if (teamIndex > -1) {
      var team = $scope.event.teams[teamIndex];
      team.players.forEach(function (playerIndex) {
        var player = {
          val: playerIndex,
          name: $scope.tournament.players[playerIndex].name
        };
        $scope.formEvt.teams.unassignedPlayers.push(player);
      });

      $scope.formEvt.teams.unassignedPlayers.sort(function (a, b) {
        return a.val - b.val;
      });

      $scope.event.teams.splice(teamIndex, 1);
    }
  };

  $scope.getTeamDisplay = function (team) {
    var str = "";
    team.players.forEach(function (index) {
      var player = $scope.tournament.players[index];
      str += player.name + "-";
    });
    return str.substr(0, str.length - 1);
  };

  $scope.addMatchup = function () {
    if ($scope.formEvt.matchup.players.length != $scope.event.playersPerMatch)
      return;

    if (!$scope.event.predefinedMatchups)
      $scope.event.predefinedMatchups = [];

    $scope.event.predefinedMatchups.push($scope.formEvt.matchup);
    $scope.formEvt.matchup = {
      players: [],
      localizations: [],
      timeslots: [],
      occurrences: 1
    };
  };

  $scope.deleteMatchup = function (matchupIndex) {
    if (matchupIndex > -1)
      $scope.event.predefinedMatchups.splice(matchupIndex, 1);
  };

  $scope.getPlayersDisplay = function (playersIndices) {
    var displayablePlayers = [];
    playersIndices.forEach(function (playerIndex) {
      displayablePlayers.push($scope.tournament.players[playerIndex].name);
    });
    return displayablePlayers.join(', ');
  };

  $scope.getVenuesDisplay = function (venuesIndices) {
    if (!venuesIndices.length)
      return 'any';

    var displayableVenues = [];
    venuesIndices.forEach(function (venueIndex) {
      displayableVenues.push($scope.tournament.venues[venueIndex].name);
    });
    return displayableVenues.join(', ');
  };

  $scope.getTimeslotsDisplay = function (timeslotsIndices) {
    if (!timeslotsIndices.length)
      return 'any';

    var displayableTimeslots = [];
    timeslotsIndices.forEach(function (timeslotIndex) {
      displayableTimeslots.push($scope.getTimeslotDisplay($scope.tournament.timeslots[timeslotIndex]));
    });
    return displayableTimeslots.join(', ');
  };

  $scope.confirmEvent = function () {
    if (!$scope.tournament.events)
      $scope.tournament.events = [];

    if (!$scope.event.breaks.length)
      delete $scope.event.breaks;

    var hasUnavailablePlayer = false;
    for (var playerIndex in $scope.formEvt.unavailablePlayers.values) {
      if ($scope.formEvt.unavailablePlayers.values[playerIndex].length) {
        hasUnavailablePlayer = true;
      } else {
        delete $scope.formEvt.unavailablePlayers.values[playerIndex];
      }
    }
    if (hasUnavailablePlayer)
      $scope.event.unavailablePlayers = $scope.formEvt.unavailablePlayers.values;

    var hasUnavailableVenue = false;
    for (var venueIndex in $scope.formEvt.unavailableVenues.values) {
      if ($scope.formEvt.unavailableVenues.values[venueIndex].length) {
        hasUnavailableVenue = true;
      } else {
        delete $scope.formEvt.unavailableVenues.values[venueIndex];
      }
    }
    if (hasUnavailableVenue)
      $scope.event.unavailableLocalizations = $scope.formEvt.unavailableVenues.values;

    var hasPlayersInVenues = false;
    for (var playerIndex in $scope.formEvt.playersInVenues.values) {
      if ($scope.formEvt.playersInVenues.values[playerIndex].length) {
        hasPlayersInVenues = true;
      } else {
        delete $scope.formEvt.playersInVenues.values[playerIndex];
      }
    }
    if (hasPlayersInVenues)
      $scope.event.playersInLocalizations = $scope.formEvt.playersInVenues.values;

    var hasPlayersAtTimeslots = false;
    for (var playerIndex in $scope.formEvt.playersAtTimeslots.values) {
      if ($scope.formEvt.playersAtTimeslots.values[playerIndex].length) {
        hasPlayersAtTimeslots = true;
      } else {
        delete $scope.formEvt.playersAtTimeslots.values[playerIndex];
      }
    }
    if (hasPlayersAtTimeslots)
      $scope.event.playersAtTimeslots = $scope.formEvt.playersAtTimeslots.values;

    $scope.event.matchupMode = $scope.formEvt.matchupModes.selected.val;

    $scope.tournament.events.push($scope.event);

    $scope.event = {
      playersPerMatch: 2,
      matchesPerPlayer: 1,
      timeslotsPerMatch: 2,
      players: [],
      venues: [],
      timeslots: [],
      breaks: []
    };
    $scope.formEvt = {
      domainConfirmed: false,
      hasTeams: false
    };
  };

  $scope.getEventPlayerDisplay = function (playerIndex) {
    return $scope.tournament.players[playerIndex].name;
  };

  $scope.getEventVenueDisplay = function (venueIndex) {
    return $scope.tournament.venues[venueIndex].name;
  };

  $scope.getEventTimeslotDisplay = function (timeslotIndex) {
    return $scope.getTimeslotDisplay($scope.tournament.timeslots[timeslotIndex]);
  };
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
      str = moment().day(t.start.value).format("dddd");
      break;
    case "Month":
      str = moment().month(t.start.value - 1).format("MMMM");
      break;
    case "Year":
      str = moment().year(t.start.value).format("YYYY");
      break;
    case "YearMonth":
      str = moment().year(t.start.value.year).month(t.start.value.month - 1).format("MMM YYYY");
      break;
    case "LocalTime":
      str = t.start.value;
      break;
    case "MonthDay":
      str = moment().month(t.start.value.month - 1).date(t.start.value.dayOfMonth).format("MMM Do");
      break;
    case "LocalDate":
      str = moment(t.start.value).format("MMM Do YYYY");
      break;
    case "LocalDateTime":
      var time = moment(t.start.value.time, "hh:mm");
      var date = moment(t.start.value.date, "YYYY-MM-DD");
      var timeStr = time.format("hh:mm");
      var dateStr = date.format("YYYY-MM-DD");
      str = moment(timeStr + " " + dateStr, "hh:mm YYYY-MM-DD").format("MMM Do YYYY, HH:mm");
      break;
  }

  if (includeChronologicalOrder)
    str += " (" + t.chronologicalOrder + ")";

  return str;
}