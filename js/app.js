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
                return $scope.servant.status.secondPlayerId===undefined && !$scope.servant.status.waitForNope;
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
                return "initializing";
            } else if ($scope.servant.allCards===undefined || $scope.servant.allCards.length===0) {
                return "waiting for game to start";
            } else if ($scope.servant.players===undefined  || $scope.servant.players.length===0) {
                return "waiting for players";
            } else if ($scope.servant.currentPlayer().id===$scope.servant.id) {
                return "Please play a card or select a card from the deck to end your turn";
            } else if ($scope.servant.status.waitForGift && $scope.servant.status.secondPlayerId===$scope.servant.id)
            {
                return "please select a card you want to offer as a gift"
            }
            else
            {
                return "waiting for "+$scope.servant.currentPlayer().name;
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
        $scope.playCard=function() {
            if ($scope.servant.currentPlayer().id===$scope.servant.id) {
                switch ($scope.selectedCards[0].type) {
                    case "thief":
                    case "force":
                    case "gift":
                        $scope.waitingForPlayerSelection = "getCard";
                        break;
                    default:
                        $scope.waitingForPlayerSelection = undefined;
                        $scope.servant.playCard($scope.selectedCards);
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
                } else  {
                    $scope.servant.playCard($scope.selectedCards);  // Nussknacker
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


