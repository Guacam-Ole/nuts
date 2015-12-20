angular.module('boomApp', [])
    .controller('tableController', function($scope) {
        $scope.isTraining=false; // Training= Man spielt alle Spieler selbst
        $scope.showStart=true;
        $scope.selectedCards=[];
        $scope.servant=new game();

//        $scope.servant.readState(gapi.hangout.data.getState().state);



        $scope.initGame=function() {
            $scope.master=new master();
            $scope.master.createGame(gapi.hangout.getLocalParticipantId());
        };
        $scope.selectDeckPos=function() {
            $scope.deckNumbers=[];
            $scope.deckSelector=-1;
            $scope.deckNumbers.push({
                key:0,
                value:'to the top'
            });
            for (i=1; i<$scope.servant.status.deckCount; i++) {
               $scope.deckNumbers.push({
                   key:i,
                   value:i+1
               }) ;
            }
            $scope.deckNumbers.push({
                key:$scope.servant.status.deckCount,
                value:'at the end'
            });
        };

        $scope.deckSelect=function() {
          $scope.deckNumbers=undefined;
            $scope.servant.endDraw($scope.deckSelector);
        };

        $scope.playerCounts=function() {
            if ($scope.master===undefined) {
                return {total:0, waiting:0, watching:0,noaddon:0};
            } else {
                var stats=$scope.master.playerStats();
                return {
                    total: stats.total,
                    waiting: stats.waiting,
                    watching: stats.watching,
                    noaddon: stats.noAddon
                }
            }
        };
        $scope.alreadyPlaying=function() {
            if ($scope.servant.me()===undefined) {
                return false;
            }
            if ($scope.servant.me().state!==undefined && $scope.servant.me().state!=="unknown" && $scope.servant.me().state!=="no app") {
                return $scope.servant.status.isRunning;
            }
        };

        $scope.showStartSelection=function() {
            return $scope.servant.me()===undefined || ($scope.servant.me().state!=="waiting" && $scope.servant.me().state!=="watching");
        };

        $scope.showWait=function() {
            return $scope.servant.status.isWaiting;
        };

        $scope.joinGame=function() {
            $scope.servant.joinGame();
        };

        $scope.watchGame=function() {
            $scope.servant.watchGame();
        };

        $scope.startNewGame=function() {
            $scope.master.startGame();
        };

        $scope.myTurn=function() {
            if ($scope.servant===undefined) {
                return false;
            }
            if ($scope.servant.currentPlayer()===undefined) {
                return false;
            }
            if ($scope.servant.currentPlayer().id===$scope.servant.id) {
                if (($scope.servant.status.secondPlayerId===undefined || $scope.servant.status.secondPlayerId==='none') && !$scope.servant.status.waitForNope) {
                    if ($scope.showLastDrawnCard()) {
                        // Karte bereits gezogen
                        return $scope.servant.status.lastDrawnCard.type==="nut"; // Nussknacker muss gespielt werden
                    } else {
                        return true;
                    }
                }
            } else {
                if ($scope.servant.status.secondPlayerId===$scope.servant.id) {
                    if ($scope.status.waitForGift && $scope.status.offeredGift==undefined) {
                        return true;
                    }
                } else if ($scope.servant.status.waitForNope) {
                        // TODO: Nur erlauben, wenn auch Nope - Karte vorhanden
                        return true;
                }
            }
            return false;
        };


        $scope.gameStarted=function() {
            return $scope.servant!==undefined && $scope.servant.players!==undefined && $scope.servant.players.length>0 && $scope.servant.currentPlayer()!==undefined;
        };

        $scope.wait=function() {

        };

        $scope.showTheFuture=function() {
            if (!$scope.showFuture) {
                return false;
            }
            return $scope.currentGame.currentPlayer().id===$scope.servant.id;
        };

        $scope.getState=function() {

            if ($scope.servant===undefined) {
                return {
                    mood: 'idle wait',
                    message: 'initializing'
                }
            } else if (!$scope.servant.status.isRunning) {
                return {
                    mood: 'idle wait',
                    message: 'waiting for game to start'
                };
            } else if ($scope.servant.players===undefined  || $scope.servant.players.length===0 || $scope.servant.currentPlayer()===undefined) {
                return {
                    mood: 'idle wait',
                    message: 'waiting for players'
                };
            } else if ($scope.servant.currentPlayer().id===$scope.servant.id ) {
                if ($scope.showLastDrawnCard()) {
                    if ($scope.servant.status.lastDrawnCard.type==="nut") {
                        return {
                            mood: 'warning play',
                            message: 'Please play the nutcracker!'
                        };
                    } else {
                        return {
                            mood: 'success play',
                            message: 'Please click onto to the card above to take it'
                        };
                    }
                } else {
                    return {
                        mood: 'success play',
                        message: 'Please play a card or draw a card to end your turn '
                    };
                }

            } else if ($scope.servant.status.waitForGift && $scope.servant.status.secondPlayerId===$scope.servant.id) {
                return {
                    mood: 'success gift',
                    message: 'please select a card you want to offer as a gift'
                };
            } else if ($scope.servant.status.waitForNope) {
                return {
                    mood: 'success play',
                    message: 'play the "no" - card if you want to (and have one)'
                };
            } else {
                return {
                    mood: 'idle wait',
                    message: "waiting for "+$scope.servant.currentPlayer().name
                };
            }
        };

        $scope.playerSelectable= function (player) {
            // Spieler ist auswählbar? (true nach Spielen von bestimmten Karten)
            if ($scope.waitingForPlayerSelection===undefined || $scope.servant.id===player.id) {
                return false;
            } else if ($scope.waitingForPlayerSelection==="getCard") {
                return player.state==="waiting" && player.cards.length>0;
            }
        };
        $scope.canEndRound=function() {

            if ($scope.servant===undefined) {
                return false;
            }
            if ($scope.servant.currentPlayer()===undefined) {
                return false;
            }
            if ($scope.servant.status.lastDrawnCard!==undefined) {
                // Hat schon eine Karte gezogen
                return false;
            }
            return  $scope.servant.currentPlayer().id===$scope.servant.id && !$scope.servant.status.playerHasToPlayDisposal && !$scope.servant.status.waitForNope && !$scope.showFuture;
        };

        $scope.getStateTitle=function(state) {
            switch (state) {
                case "watching":
                    return "Just watching the game";
                case "waiting":
                    return "Waiting for his turn";
                case "nuts":
                    return "Gone nuts";
                case "playing":
                    return "Playing";
            }
        };
        $scope.getStateIcon=function(state) {
            switch (state) {
                case "watching":
                    return "fa-eye";
                case "waiting":
                    return "fa-hourglass-half";
                case "nuts":
                    return "fa-bam";
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


        $scope.beginRound=function() {
            $scope.selectedCards=[];
        };
        $scope.showLastDrawnCard=function() {
            if (!$scope.gameStarted()) {
                return false;
            }
          return $scope.servant.status.lastDrawnCard!==undefined && $scope.servant.currentPlayer().id===$scope.servant.id ;
        };
        $scope.playCard=function() {
            if (!$scope.canPlay()) {
                return;
            }
            if ($scope.servant.currentPlayer().id===$scope.servant.id) {
                switch ($scope.selectedCards[0].type) {
                    case "thief":
                    case "gift":
                        $scope.waitingForPlayerSelection = "getCard";
                        break;
                    case "disposal":
                        $scope.waitingForPlayerSelection = undefined;
                        $scope.selectDeckPos();
                        break;

                    default:
                        $scope.waitingForPlayerSelection = undefined;
                        $scope.servant.playCard($scope.selectedCards[0]);
                        $scope.selectedCards=[];
                        break;
                }
            } else {
                // Reaktionskarte
                if ($scope.servant.status.waitForGift) {
                    $scope.servant.status.offeredGift=$scope.selectedCards[0];
                    $scope.servant.status.waitForGift=false;
                } else if ($scope.servant.status.waitForNope) {
                    $scope.servant.playNope($scope.servant.id, $scope.selectedCards[0])
                }
                $scope.selectedCards=[];
            }
        };
        $scope.endRound= function () {
            if ($scope.canEndRound()) {
                if ($scope.servant.drawCard()) {
                    $scope.servant.nextPlayer();
                }
            }
        };
        $scope.endDraw=function() {
            if ($scope.servant.status.lastDrawnCard!==undefined && $scope.servant.status.lastDrawnCard.type!=='nut') {
                $scope.servant.endDraw(-1);
              //  $scope.servant.status.lastDrawnCard=undefined;
            }
        };
        $scope.cardSelectable=function(card) {

            if ($scope.servant===undefined || $scope.servant.currentPlayer()===undefined) {
                return false;
            }
            if ($scope.servant.currentPlayer().id===$scope.servant.id && ($scope.servant.status.waitForGift || $scope.servant.status.waitForNope || $scope.servant.status.offeredGift!==undefined || $scope.showFuture)) {
                // Gemach!
                return false;
            }
            if ($scope.servant.currentPlayer().id!==$scope.servant.id) {
                if ($scope.servant.status.waitForNope) {
                    return card.type==="no";
                } else  if ($scope.servant.status.waitForGift && $scope.servant.status.secondPlayerId===$scope.servant.id) {
                    // Spieler muss eine Karte abgeben:
                    return true;
                } else {
                    return false;
                }
            } else {
                if ($scope.servant.status.playerHasToPlayDisposal) {
                    return card.type==="disposal";
                } else {
                    return card.type === "thief" || card.type==="shuffle" || card.type==="force" || card.type==="sleep" || card.type==="future" || card.type==="gift" || card.type==="reverse";
                }
            }
        };


        $scope.setAsCurrentPlayer=function(player) {
            if ($scope.waitingForPlayerSelection!==undefined && $scope.playerSelectable(player)) {
                $scope.servant.playCard($scope.selectedCards[0],player.id);
                $scope.selectedCards=[];
                $scope.waitingForPlayerSelection=undefined;
            }
        };
        $scope.showSelect=function() {
            return $scope.waitingForPlayerSelection!==undefined;
        };

        $scope.canPlay=function()  {
            var cardsAllValid=true;
            $scope.selectedCards.forEach(function(card) {
                cardsAllValid &=$scope.cardSelectable(card);
            });
            if (!cardsAllValid) {
                return false;
            }
            if ($scope.selectedCards.length===1) {
                if ($scope.servant.currentPlayer().id===$scope.servant.id) {
                    if ($scope.servant.status.playerHasToPlayDisposal) {
                        return $scope.selectedCards[0].type==="disposal";
                    } else {
                        return $scope.selectedCards[0].type!=="thief";
                    }
                } else {
                    return true;
                }
            } else if ($scope.selectedCards.length===2) {
                return $scope.servant.currentPlayer().id===$scope.servant.id && !$scope.servant.status.playerHasToPlayDisposal && $scope.selectedCards[0].type==="thief";
            }
        };
    });


