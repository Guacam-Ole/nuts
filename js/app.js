angular.module('boomApp', [])
    .controller('tableController', function($scope) {
        $scope.isTraining=true; // Training= Man spielt alle Spieler selbst
        $scope.currentPlayerId="1";
        $scope.selectedCards=[];
        $scope.players= [
            {
                "id":"1",
                "name":"Lee Everett",
                "cards":[],
                "state":"watching"
            },
            {
                "id":"2",
                "name":"Clementine",
                "cards":[],
                "state":"waiting"
            },
            {
                "id":"3",
                "name":"Hershell Greene",
                "cards":[],
                "state":"waiting"
            },
            {
                "id":"4",
                "name":"Shawn Greene",
                "cards":[],
                "state":"playing"
            },
            {
                "id":"5",
                "name":"Kenny",
                "cards":[],
                "state":"waiting"
            },
            {
                "id":"6",
                "name":"Glenn",
                "cards":[],
                "state":"bombed"
            },
            {
                "id":"7",
                "name":"Christa",
                "cards":[],
                "state":"bombed"
            },
            {
                "id":"8",
                "name":"Omid",
                "cards":[],
                "state":"waiting"
            }
        ];
   //     $scope.playedCards=[];
        $scope.currentGame=new game();

        $scope.setAsCurrentPlayer=function(player) {
            if ($scope.isTraining) {
                $scope.id=player.id;
            }
        };
        $scope.getState=function() {

            if ($scope.currentGame===undefined) {
                return "initializing";
            } else if ($scope.currentGame.allCards===undefined || $scope.currentGame.allCards.length===0) {
                return "waiting for game to start";
            } else if ($scope.currentGame.players===undefined  || $scope.currentGame.players.length===0) {
                return "waiting for players";
            } else if ($scope.currentGame.currentPlayer().id===$scope.id) {
                return "Please play a card or select a card from the deck to end your turn";
            } else {
                return "waiting for "+$scope.currentGame.currentPlayer().name;
            }
        };

        $scope.getStateIcon=function(state) {
            switch (state) {
                case "watching":
                    return "fa-eye";
                case "waiting":
                    return "fa-hourglass-half";
                case "bombed":
                    return "fa-bomb";
                case "playing":
                    return "fa-gamepad";
            }
        };
        $scope.cardIsSelected=function(card) {
            var foundcard= $.grep($scope.selectedCards, function(e){ return e.id === card.id; });
            return foundcard.length>0;
        };
        $scope.selectCard=function (card) {
            if ($scope.cardIsSelected(card)) {
                for(i = $scope.selectedCards.length - 1; i >= 0; i--) {
                    if($scope.selectedCards[i].id===card.id) {
                        $scope.selectedCards.splice(i, 1);
                    }
                }
            } else {
                $scope.selectedCards.push(card);
            }

        };

        $scope.canPlay=function()  {
            if ($scope.currentGame===undefined || $scope.currentGame.currentPlayer()===undefined) {
                return false;
            }
            if ($scope.currentGame.currentPlayer().id!==$scope.id) {
                return false;
            }    else if ($scope.selectedCards.length===0 || $scope.selectedCards.length>2) {
                return false;
            } else if ($scope.selectedCards.length===1) {
                return $scope.selectedCards[0].type!=="thief" && $scope.selectedCards[0].type!=="disposal";
            } else {
                // zwei Karten gewählt
                return $scope.selectedCards[0].image===$scope.selectedCards[1].image && $scope.selectedCards[0].type==="thief";
            }
        };
        $scope.startGame=function() {
          $scope.currentGame.init($scope.players.length);
            var playerIds=[];
            var playerNames=[];
            $scope.players.forEach(function (player) {
                playerIds.push(player.id);
                playerNames.push(player.name);
            });
            $scope.currentGame.initPlayers(playerIds,playerNames);
        };


    });