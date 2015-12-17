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



        $scope.setAsCurrentPlayer=function(player) {
            if ($scope.waitingForPlayerSelection!==undefined && $scope.playerSelectable(player)) {
              //  $scope.currentGame.playCard($scope.selectedCards,player);
                $scope.selectedCards=[];
                $scope.waitingForPlayerSelection=undefined;
            } else {
                if ($scope.isTraining) {
                    $scope.id = player.id;
                    $scope.beginRound();
                }
            }
        };


        $scope.wait=function() {

        };
        $scope.showTheFuture=function() {
            if (!$scope.showFuture) {
                return false;
            }
            return $scope.currentGame.currentPlayer().id===$scope.id;
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
            } else if ($scope.currentGame.waitForGift && $scope.currentGame.secondPlayer.id===$scope.id)
            {
                return "please select a card you want to offer as a gift"
            }
            else
            {
                return "waiting for "+$scope.currentGame.currentPlayer().name;
            }
        };

        $scope.playerSelectable= function (player) {
            // Spieler ist auswählbar? (true nach Spielen von bestimmten Karten)
            if ($scope.waitingForPlayerSelection===undefined || $scope.id===player.id) {
                return false;
            } else if ($scope.waitingForPlayerSelection==="getCard") {
                return player.state==="waiting" && player.cards.length>0;
            }
        };
        $scope.canEndRound=function() {
            if ($scope.currentGame===undefined) {
                return false;
            }
            if ($scope.currentGame.currentPlayer()===undefined) {
                return false;
            }
            return  $scope.currentGame.currentPlayer().id===$scope.id && !$scope.currentGame.playerHasToPlayDisposal && !scope.currentGame.waitForNope && !scope.showFuture;
        };

        $scope.getStateTitle=function(state) {
            switch (state) {
                case "watching":
                    return "Just watching the game";
                case "waiting":
                    return "Waiting for his turn";
                case "bombed":
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
                case "bombed":
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
            if ($scope.currentGame.currentPlayer().id===$scope.id) {
                switch ($scope.selectedCards[0].type) {
                    case "thief":
                    case "force":
                    case "gift":
                        $scope.waitingForPlayerSelection = "getCard";
                        break;
                    default:
                        $scope.waitingForPlayerSelection = undefined;
                        $scope.currentGame.playCard($scope.selectedCards);
                        $scope.selectedCards=[];
                        break;
                }

            } else {
                // Reaktionskarte
                if ($scope.currentGame.waitForGift) {
                    $scope.currentGame.offeredGift=$scope.selectedCards[0];
                    $scope.currentGame.waitForGift=false;
                } else if ($scope.currentGame.waitForNope) {
                    $scope.currentGame.playNope($scope.id, $scope.selectedCards[0])
                } else  {
                    $scope.currentGame.playCard($scope.selectedCards);  // Nussknacker
                }
                $scope.selectedCards=[];
            }
        };
        $scope.endRound= function () {
            if ($scope.canEndRound()) {
                if ($scope.currentGame.drawCard($scope.currentGame.currentPlayer())) {
                    $scope.currentGame.nextPlayer(false);
                }
            }
        };
        $scope.cardSelectable=function(card) {

            if ($scope.currentGame===undefined || $scope.currentGame.currentPlayer()===undefined) {
                return false;
            }
            if ($scope.currentGame.currentPlayer().id===$scope.id && ($scope.currentGame.waitForGift || $scope.currentGame.waitForNope || $scope.currentGame.offeredGift!==undefined || $scope.showFuture)) {
                // Gemach!
                return false;
            }
            if ($scope.currentGame.currentPlayer().id!==$scope.id) {
                if ($scope.currentGame.waitForNope) {
                    return card.type==="no";
                } else  if ($scope.currentGame.waitForGift && $scope.currentGame.secondPlayer.id===$scope.id) {
                    // Spieler muss eine Karte abgeben:
                    return true;
                } else {
                    return false;
                }
            } else {
                if ($scope.currentGame.playerHasToPlayDisposal) {
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
                if ($scope.currentGame.currentPlayer().id===$scope.id) {
                    if ($scope.currentGame.playerHasToPlayDisposal) {
                        return $scope.selectedCards[0].type==="disposal";
                    } else {
                        return $scope.selectedCards[0].type!=="thief";
                    }
                } else {
                    return true;
                }
            } else if ($scope.selectedCards.length===2) {
                return $scope.currentGame.currentPlayer().id===$scope.id && !$scope.currentGame.playerHasToPlayDisposal && $scope.selectedCards[0].type==="thief";
            }
        };
    });


