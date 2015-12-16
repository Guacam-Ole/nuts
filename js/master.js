var master = function () {
    this.deck=[];
    this.players=[];
    this.allCards=[];
    this.playedCards=[];
    this.log=[];

    //GameStatus:
    this.status={
        waitForNope:false,      // Darauf warten, dass jemand "Nope" spielt
        someOneNoped:false,     // Jemand hat "Nope" gespielt?
        secondPlayer:false,     // Zweiter Spieler für Aktion
        reverse:false,          // Umgekehrte Reihenfolge?
        isRunning:false,        // Spiel läuft?
        isWaiting:false         // Warten auf Spieler?
    };

    this.settings={
        nopetime:10 // Sekunden, die man Zeit hat, um "NOPE" auszuspielen    
    }

    
};


master.prototype = {
    constructor: master,

    createGame:function() {
        // Spiel erzeugen
        this.log=[];
        this.log.unshift("game initializing");
        masterscope = angular.element($('#cardTable')).scope();
        this.toClients("gameInit","1");  // Informieren, dass jemand ein Spiel gestartet hat.
        this.readAllCards(this.initData);
    },


    toClients:function(key,value) {
        // Einzelnes Event an alle Clients
        gapi.hangout.data.submitDelta({'isClientMessage':'1', 'actionType':key, 'value': value});
    },
    toSingleClient:function(playerId,key, value) {
        // Einzelnes Event an bestimmten Spieler
        gapi.hangout.data.submitDelta({'isClientMessage':'1', 'actionType':key, 'value': value, 'player':playerId});
    },


    initData:function() {
        // Daten initialisieren
        var obj=this;
        obj.players=[];
        var participants=gapi.hangout.getParticipants();
        participants.forEach(function(participant) {
            var player={};
            if (participant.id===gapi.hangout.getLocalParticipantId()) {
                // Spielleiter
                player.state="waiting";
            } else if (participant.hasAppEnabled) {
                player.state="watching";
            } else {
                player.state="no app";
            }
            player.id=participant.id;
            player.name=participant.person.displayName;
            player.image=participant.person.image.url;
            obj.players.push(player);
        });

        obj.log.unshift("Waiting for players...");
        obj.status.isWaiting=true;
        this.toClients("gameWaiting","1");  // Informieren, dass jemand ein Spiel gestartet hat.
    },
    
    startGame:function() {
        this.status.isWaiting=false;
        var playerCount=this.countPlayers();
        this.filldeck(playerCount);
    },
    
    
    
    countPlayers:function() {
        // Zählen, wie wiele aktive Spieler existieren
        var stats=this.playerStats();
        return stats.waiting+stats.playing+stats.bombed;
    },
    playerStats:function() {
        var watchCount=0;
        var waitCount=0;
        var bombCount=0;
        var playCount=0;
        var noAddonCount=0;

        this.players.forEach(function(player) {
            switch  (player.state) {
                case "waiting":
                    waitCount++;
                    break;
                case "watching":
                    watchCount++;
                    break;
                case "bombed":
                    bombCount++;
                    break;
                case "playing":
                    playCount++;
                    break;
                default:
                    noAddonCount++;
            }

        });
        return {
            total: this.players.length,
            waiting: waitCount,
            watching:watchCount,
            bombed:bombCount,
            playing:playCount,
            noAddon:noAddonCount
        }
    },

    getDeckCount:function() {
        return this.deck.length;
    },

    lastPlayedCards:function(count) {
        if (this.playedCards.length<count) {
            return this.playedCards;
        }
        var playedCards=[];
        for (i=0; i<=count; i++) {
            playedCards.push(this.playedCards[i]);
        }
        return playedCards;
    },
    getMyProfile:function(playerId) {
        var me = $.grep(this.players, function(e){ return e.id == playerId; })[0];
        return me;
    },
    readAllCards:function(afterReading) {
        // Alle Kartentypen aus JSON-File lesen
        this.log.unshift("cards read");
        var obj=this;
        if (obj.allCards.length===0) {
            $.getJSON("json/cards.json", function (data) {

                data.cards.forEach(function(card) {
                    obj.allCards.push(card);
                });
                afterReading();
            });
        }
    },
    shuffle:function(deck) {
        // Fisher-Yates-Shuffle: https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
        for (var i = 0; i < deck.length - 1; i++) {
            var j = i + Math.floor(Math.random() * (deck.length - i));
            var temp = deck[j];
            deck[j] = deck[i];
            deck[i] = temp;
        }
        this.log.unshift("cards shuffled");
    },
    addCardsToDeckdra:function(card, number) {
        // Karten zum Deck hinzufügen
        for (i=0; i<number; i++) {
            var newCard={};
            angular.copy(card,newCard);
            if (newCard.id===undefined) {
                newCard.id = this.getUid();
            }
            this.deck.push(newCard);
        }
        this.log.unshift("added "+number+ " cards to the deck");
    },
    getUid:function() {
        // SO: http://stackoverflow.com/questions/6248666/how-to-generate-short-uid-like-ax4j9z-in-js
        return ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).slice(-4)
    },
    drawCard:function(player) {
        // Karte aus Deck ziehen. Return: Runde beendet?
        if (player.name!==undefined) {
            this.log.unshift(player.name + " took one card from the deck (ending his turn)");
        }
        var card=this.deck.shift();
        if (card.type==="bomb")  {
            // Sofort Spielen
            this.log.unshift(player.name + " is about to go nuts!");
            this.playedCards.unshift(card);
            // Schauen, ob der Spieler einen Nussknacker hat:
            var disposal = $.grep(player.cards, function(e){ return e.type == "disposal"; });
            if (disposal.length>0) {
                this.playerHasToPlayDisposal=true;
                return false;
            }
            else {
                // Raus!
                player.state="bombed";
                this.log.unshift(player.name + " has gone nuts!");
                return true;
            }
        } else {
            player.cards.push(card);
            return true;
        }
    },
    wait:function() {
        scope.$apply(function() {
            scope.wait();
        });
    },
    showFuture:function() {
        scope.$apply(function() {
            scope.showFuture=true;
        });
    },
    playCard:function(cards, secondPlayer) {
        var obj=this;
        obj.waitForNope=false;
        obj.secondPlayer=secondPlayer;
        obj.playerHasToPlayDisposal=false;

        var player=this.currentPlayer();
        var retValue=null;
        this.log.unshift(player.name+" played a card");
        cards.forEach(function(card) {
            obj.playedCards.unshift(card);
            for(i = player.cards.length - 1; i >= 0; i--) {
                if(player.cards[i].id===card.id) {
                    player.cards.splice(i, 1);
                }
            }
        });
        switch (cards[0].type) {
            case "thief":
            case "force":
            case "sleep":
            case "gift":
            case "shuffle":
            case "future":
            case "reverse":
                obj.waitForNope=true;
                break;
        }
        if (secondPlayer!==undefined) {
            this.log.unshift(player.name+" chose "+secondPlayer.name+" as the victim");
        }

        if (obj.waitForNope) {
            obj.setTimeout(cards[0]);
        } else {
            obj.playCardFinally(cards[0],false);
        }
    },
    setTimeout:function(card) {
        var obj=this;
        if (obj.finalTimeout!==undefined) {
            clearTimeout(obj.finalTimeout);
        }
        // Kann abgebrochen werden. Abwarten, ob jemand "Nope" spielt
        obj.finalTimeout=setTimeout(function(){
            obj.playCardFinally(card, true);
        }, 1000*obj.nopetime);
    },
    playNope:function(playerId, card) {

        if (!this.waitForNope) {
            return;
        }
        var player= $.grep(this.players, function(e){ return e.id == playerId; })[0];
        this.log.unshift(player.name+" played 'No'");
        this.someOneNoped=!this.someOneNoped;
        this.playedCards.unshift(card);
        for(i = player.cards.length - 1; i >= 0; i--) {
            if(player.cards[i].id===card.id) {
                player.cards.splice(i, 1);
            }
        }
    },
    playCardFinally:function(card, doWait) {
        this.waitForNope=false;
        if (this.someOneNoped && card.type!="force") {
            this.someOneNoped=false;
            this.wait();
            return; // nix tun
        }
        if (card.type==="gift" && this.offeredGift===undefined) {
            this.waitForGift=true;
            this.setTimeout(card); // Solange warten, bis Spieler Karte ausgewählt hat.
            this.wait();
            return;
        }
        switch (card.type) {
            case "disposal":
                // Nuss entschärft
                this.log.unshift(this.currentPlayer().name+" didn't go nuts");
                this.nextPlayer(doWait);
                break;
            case "thief":
                // Zufallskarte stehlen
                this.log.unshift(this.currentPlayer().name+" took a card from "+this.secondPlayer.name);
                // Zufällige Karte von Spieler nehmen:
                var cardId = Math.floor(Math.random() * this.secondPlayer.cards.length);
                var newcard = this.secondPlayer.cards[cardId];
                this.secondPlayer.cards.splice(cardId, 1);
                this.currentPlayer().cards.push(newcard);
                this.wait();    // Status aktualisieren
                break;
            case "force":
                // Nächster Spieler muss zwei Runden spielen
                this.log.unshift(this.currentPlayer().name+" forces "+this.secondPlayer.name+" to play two rounds");
                if (this.someOneNoped) {
                    this.numRounds=1;
                } else {
                    this.numRounds = 2;   // Nächster Spieler muss zweimal ziehen
                }
                this.nextPlayer(doWait);
                break;
            case "sleep":
                // Glatt verpennt. Keine Karte ziehen am Ende
                this.log.unshift(this.currentPlayer().name+" sleeps missing his turn");
                this.nextPlayer(doWait);
                break;
            case "gift":
                // "Geschenk" von anderem Spiele annehmen:
                this.log.unshift(this.currentPlayer().name+" receives a gift from "+this.secondPlayer.name);
                var newcard = this.secondPlayer.cards[this.offeredGift];
                this.secondPlayer.cards.splice(this.offeredGift, 1);
                this.currentPlayer().cards.push(newcard);
                this.offeredGift=undefined;
                this.wait();    // Status aktualisieren
                break;
            case "shuffle":
                // Mischen des Stapels
                this.log.unshift(this.currentPlayer().name+" shuffles the cards");
                this.shuffle(this.deck);
                this.wait();    // Status aktualisieren
                break;
            case "future":
                // In die Zukunft schauen
                this.log.unshift(this.currentPlayer().name+" looks into the future");
                this.showFuture();
                break;
            case "reverse":
                this.reverse=!this.reverse;
                this.wait();
                break;
        }
        this.someOneNoped=false;
        this.waitForGift=false;
    },
    
    getNextPlayer:function(currentPlayerIndex) {
        var obj=this;
        var counter=0;
        var nextPlayerIndex=obj.reverse?currentPlayerIndex-1:currentPlayerIndex+1;

        var found=false;
        while (!found) {
            if (this.players.length<=nextPlayerIndex) {
                nextPlayerIndex=0;
            }
            if (nextPlayerIndex<0) {
                nextPlayerIndex=this.players.length-1;
            }
            if (this.players[nextPlayerIndex].state==="waiting") {
                found=true;
            } else {
                if (this.reverse) {
                    nextPlayerIndex--;
                } else {
                    nextPlayerIndex++;
                }

            }
        }
    },
    nextPlayer:function(doWait) {
        var obj=this;
        var counter=0;
        var currentPlayerIndex;

        this.players.forEach(function(player) {
            if (player.state==="playing") {
                player.state="waiting";
               currentPlayerIndex=counter;
            }
            counter++;
        });
        var nextPlayerIndex=this.getNextPlayer(currentPlayerIndex);
        obj.players[nextPlayerIndex].state="playing";
        obj.toSingleClient(obj.players[nextPlayerIndex].id,"yourturn","1");
    },
    
  
    
    getLog:function(count) {
        if (this.log===undefined) {
            return [];
        } else if (this.log.length<=count) {
            return this.log;
        } else {
            log=[];
            for (i=0;i<count;i++) {
                log.push(this.log[i]);
            }
            log.push("...");
            return log;
        }
    },
    currentPlayer:function() {
        return $.grep(this.players, function(e){ return e.state == "playing"; })[0];
    },
    filldeck:function(numPlayers) {
        // Deck für Spielstart füllen
        this.deck=[];
        var numberOfDecks=Math.ceil(numPlayers/5);    // Pro 5 Spieler ein Kartendeck
        var disposalrest=6*numberOfDecks-numPlayers;
        var obj=this;

        // Kartentypen:
        var bomb = $.grep(obj.allCards, function(e){ return e.type == "bomb"; })[0];
        var disposal = $.grep(obj.allCards, function(e){ return e.type == "disposal"; })[0];
        var force = $.grep(obj.allCards, function(e){ return e.type == "force"; })[0];
        var nope = $.grep(obj.allCards, function(e){ return e.type == "no"; })[0];
        var sleep = $.grep(obj.allCards, function(e){ return e.type == "sleep"; })[0];
        var future = $.grep(obj.allCards, function(e){ return e.type == "future"; })[0];
        var shuffle = $.grep(obj.allCards, function(e){ return e.type == "shuffle"; })[0];
        var gift = $.grep(obj.allCards, function(e){ return e.type == "gift"; })[0];
        var reverse=$.grep(obj.allCards, function(e){ return e.type == "reverse"; })[0];
        var thiefs=$.grep(obj.allCards, function(e){ return e.type == "thief"; });


        // Deck:
        obj.addCardsToDeck(nope,5*numberOfDecks);
        obj.addCardsToDeck(force, 4*numberOfDecks);
        obj.addCardsToDeck(sleep,4*numberOfDecks);
        obj.addCardsToDeck(gift,4*numberOfDecks);
        obj.addCardsToDeck(reverse,4*numberOfDecks);
        obj.addCardsToDeck(shuffle,4*numberOfDecks);
        obj.addCardsToDeck(future,5*numberOfDecks);
        thiefs.forEach(function(thief) {
            obj.addCardsToDeck(thief,4*numberOfDecks);
        });

        obj.shuffle(obj.deck);

        var playerIndex=getNextPlayer(0);
        // Karten für Spieler:
        for (i=0;i<numPlayers; i++) {
            var player=obj.players[playerIndex];
            player.cards={};
            player.cards.push(disposal);
            for (cards=0; cards<4; cards++) {
                obj.drawCard(player);
            }
            //obj.players.push(player);
        }

        // Bomben und Entschärfer wieder ins Deck:
        obj.addCardsToDeck(bomb,numPlayers-1);
        if (numPlayers===2) {
            obj.addCardsToDeck(disposal,2);
        } else {
            obj.addCardsToDeck(disposal,disposalrest);
        }

        obj.shuffle(obj.deck);

        this.status.isRunning=true;
        this.toClients("gameStarted","1");  // Informieren, dass das Spiel gestartet wurde.
        this.log.unshift("ready to play");
    }
};