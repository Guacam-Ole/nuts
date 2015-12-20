var master = function () {
    this.deck=[];
    this.players=[];
    this.allCards=[];
    this.playedCards=[];
    this.log=[];
    this.readChanges=[];

    this.finalTimeout=undefined;

    //GameStatus:
    this.status={
        masterId:null,
        playerHasToPlayDisposal:false,

        waitForNope:false,      // Darauf warten, dass jemand "Nope" spielt
        someOneNoped:false,     // Jemand hat "Nope" gespielt?
        secondPlayerId:undefined,     // Zweiter Spieler für Aktion
        reverse:false,          // Umgekehrte Reihenfolge?
        isRunning:false,        // Spiel läuft?
        isWaiting:false,        // Warten auf Spieler?
        serverStarted:true,
        deckCount:0             // verbleibende Karten im Deck
    };

    this.settings={
        nopetime:15 // Sekunden, die man Zeit hat, um "NOPE" auszuspielen
    }

    
};


master.prototype = {
    constructor: master,
    readState:function(state) {
        var obj=this;
        var clientChanges=false;
        obj.players.forEach(function(player) {
            if (state[player.id]!==undefined) {
                JSON.parse(state[player.id]).forEach(function (clientMessage) {
                    var alreadyProcessed= $.inArray(clientMessage.id, obj.readChanges)>=0;
                    if (!alreadyProcessed) {
                        clientChanges = true;
                        switch (clientMessage.key) {
                            case "join":
                                if (obj.status.isRunning) {
                                    // Zu spät, ändern in watch
                                    player.state = "watching";
                                } else {
                                    player.state = "waiting";
                                }
                                break;
                            case "watch":
                                player.state = "watching";
                                break;
                        }
                        if (obj.status.isRunning) {
                            switch (clientMessage.key) {
                                case "draw":
                                    obj.drawCard(obj.currentPlayer());
                                    break;
                                case "endDraw":
                                    obj.drawCardFinally(obj.currentPlayer(), clientMessage.value);
                                    break;
                                case "playCard":
                                    obj.playCard(clientMessage.playerId, clientMessage.cardId, clientMessage.secondId);
                                    break;
                                case "playNope":
                                    obj.playNope(clientMessage.playerId, clientMessage.cardId);
                                    break;
                                case "reset":
                                    obj.reset();
                                    break;
                            }

                        }
                        obj.readChanges.push(clientMessage.id);
                    }
                });
            }
        });

        if (clientChanges) {
            obj.toClients();
        }
    },
    reset:function() {
        this.players.forEach(function(player) {
            gapi.hangout.data.clearValue(player.id);
        });
        this.deck=[];
        //this.players=[];
        this.playedCards=[];
        this.log=[];
      //  this.readChanges=[];
        this.newMessages=[];
        this.status={
            waitForNope:false,      // Darauf warten, dass jemand "Nope" spielt
            someOneNoped:false,     // Jemand hat "Nope" gespielt?
            secondPlayer:false,     // Zweiter Spieler für Aktion
            reverse:false,          // Umgekehrte Reihenfolge?
            isRunning:false,        // Spiel läuft?
            isWaiting:false,        // Warten auf Spieler?
            deckCount:0,            // verbleibende Karte im Deck
            serverStarted:false,
            masterId:null           // Server gestartet

        };
       this.toClients();
    },

    toClients:function() {
        var obj=this;
        obj.status.deckCount=obj.deck.length;
        gapi.hangout.data.submitDelta(
            {
                'players':JSON.stringify(obj.players),
                'log':JSON.stringify(obj.getLog(10)),
                'playedCards':JSON.stringify(obj.lastPlayedCards(3)),
                'status':JSON.stringify(obj.status)
            });
    },
    toSingleClient:function(playerId,key, value ) {
        if (value===undefined) {
            value='';
        }
        // TODO: Einzelnen Spieler finden und Befehl senden
    },

    createGame:function(masterId) {
        // Spiel erzeugen
        this.log=[];
        this.log.unshift("game initializing");
        if (masterId!==undefined) {
            this.masterId = masterId;
        }
        this.toClients();  // Informieren, dass jemand ein Spiel initialisiert hat.
        this.readAllCards(this.initData);
    },



    playerJoining:function(playerId) {
        var player = $.grep(this.players, function(e){ return e.id == playerId; })[0];
        player.wantsToPlay=true;
        if (this.status.gameRunning) {
            // Spiel läuft schon, ab nächster Runde:
            player.state="watching";
        } else {
            // Kann los gehen!
            player.state="waiting";
        }
    },
    playerWatching:function(playerId) {
        var player = $.grep(this.players, function(e){ return e.id == playerId; })[0];
        player.wantsToPlay=false;
        player.state="watching";
    },



    initData:function(obj) {
        // Daten initialisieren
        //var obj=this;
        obj.players=[];
        obj.log=[];
        var participants=gapi.hangout.getParticipants();
        participants.forEach(function(participant) {
            var player={};
            if (participant.id===gapi.hangout.getLocalParticipantId()) {
                // Spielleiter
                player.state="waiting";
            } else if (participant.hasAppEnabled) {
                player.state="unknown";
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
        obj.toClients();  // Informieren, dass jemand ein Spiel gestartet hat.
    },
    
    startGame:function() {
        this.status.isWaiting=false;
        var playerCount=this.countPlayers();
        this.filldeck(playerCount);
        this.nextPlayer();
    },
    
    
    
    countPlayers:function() {
        // Zählen, wie wiele aktive Spieler existieren
        var stats=this.playerStats();
        return stats.waiting+stats.playing+stats.nuts;
    },
    playerStats:function() {
        var watchCount=0;
        var waitCount=0;
        var nutsCount=0;
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
                case "nuts":
                    nutsCount++;
                    break;
                case "playing":
                    playCount++;
                    break;
                default:
                    noAddonCount++;
                    break;
            }

        });
        return {
            total: this.players.length,
            waiting: waitCount,
            watching:watchCount,
            nuts:nutsCount,
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
        for (var i=0; i<=count; i++) {
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
            allcards.forEach(function(card) {
                obj.allCards.push(card);
            });
            afterReading(obj);
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
    addCardsToDeck:function(card, number) {
        // Karten zum Deck hinzufügen
        for (var i=0; i<number; i++) {
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
    drawCard:function(player, dontLog) {
        // Karte aus Deck ziehen
        if (player.name!==undefined && !dontLog) {
            this.log.unshift(player.name + " took one card");
        }
        var card=this.deck.shift();
        this.status.lastDrawnCard=card;
        if (card.type==="nut")  {
            // Nuss.
            this.log.unshift(player.name + " is about to go nuts!");

            // Schauen, ob der Spieler einen Nussknacker hat:
            var disposal = $.grep(player.cards, function(e){ return e.type == "disposal"; });
            if (disposal.length>0) {
                this.status.playerHasToPlayDisposal=true;
                this.toClients();
            } else {
                // Raus!
                player.state="nuts";
                this.log.unshift(player.name + " has gone nuts!");
                this.playedCards.unshift(card);
                this.nextPlayer();
            }
        }
        if (dontLog) {
            this.drawCardFinally(player,-1,dontLog);
        }
    },
    drawCardFinally:function(player, nutPosition, dontLog) {
        // Karte angeschaut und genommen
        // NutPosition= Position, an der die Nuss eingefügt wird (wenn Knacker gespielt)
        var card=this.status.lastDrawnCard;
     //   this.playedCards.unshift(card);
        player.cards.push(card);
        this.status.lastDrawnCard=undefined;
        if (nutPosition>=0) {
            this.status.playerHasToPlayDisposal=false;
            var disposal = $.grep(player.cards, function(e){ return e.type == "disposal"; })[0];
            this.log.unshift(player.name + " did NOT go nuts!");
            this.playedCards.unshift(disposal);
            for(var i = player.cards.length - 1; i >= 0; i--) {
                if(player.cards[i].id===disposal.id) {
                    player.cards.splice(i, 1);
                }
            }
            var nut = $.grep(this.allCards, function(e){ return e.type == "nut"; })[0];
            this.deck.splice(nutPosition, 0, nut);
        }
        if (!dontLog) {
            this.nextPlayer();
            this.toClients();
        }
    },

    showFuture:function() {

    },
    getSecondPlayer:function() {
        if (this.status.secondPlayerId===undefined) {
            return undefined;
        }
        var secondplayer= $.grep(this.players, function(e){ return e.id == this.status.secondPlayerId; })[0];
    },
    playCard:function(playerId, cardId, secondPlayerId) {
        var obj=this;
        obj.status.waitForNope=false;
        obj.status.secondPlayerId=secondPlayerId;
        obj.status.playerHasToPlayDisposal=false;
        var playedCards=[];
        var player=$.grep(obj.players, function(e){ return e.id == playerId; })[0];
        var card= $.grep(player.cards, function(e){ return e.id == cardId; })[0];
        playedCards.push(card);
        if (card.type==="thief") {
            // Zweite Karte suchen
            var secondcard= $.grep(player.cards, function(e){ return e.id !== cardId && e.image===card.image; })[0];
            playedCards.push(secondcard);
        }

        var retValue=null;
        this.log.unshift(player.name+" played a card");
        playedCards.forEach(function(singleCard){
            obj.playedCards.unshift(singleCard);
            for(var i = player.cards.length - 1; i >= 0; i--) {
                if(player.cards[i].id===singleCard.id) {
                    player.cards.splice(i, 1);
                }
            }
        });
        switch (card.type) {
            case "thief":
            case "force":
            case "sleep":
            case "gift":
            case "shuffle":
            case "future":
            case "reverse":
                obj.status.waitForNope=true;
                break;
        }
        if (secondPlayerId!=='none' && secondPlayerId!==undefined) {
            var secondPlayer= $.grep(obj.players, function(e){ return e.id == secondPlayerId; })[0];
            this.log.unshift(player.name+" chose "+secondPlayer.name+" as the victim");
        }

        if (obj.status.waitForNope) {
            obj.setTimeout(card,secondPlayer);
        } else {
            obj.playCardFinally(card,secondPlayer);
        }
    },
    setTimeout:function(card, secondPlayer) {
        var obj=this;
        obj.lastCard=card;
        obj.lastSecond=secondPlayer;
        if (obj.finalTimeout!==undefined) {
            clearTimeout(obj.finalTimeout);
        }
        // Kann abgebrochen werden. Abwarten, ob jemand "Nope" spielt
        obj.finalTimeout=setTimeout(function(){
            obj.playCardFinally(card,  secondPlayer);
        }, 1000*obj.settings.nopetime);
        obj.toClients();
    },
    playNope:function(playerId, cardId) {

        if (!this.status.waitForNope) {
            return;
        }
        var player= $.grep(this.players, function(e){ return e.id == playerId; })[0];
        var card= $.grep(player.cards, function(e){ return e.id == cardId; })[0];
        this.log.unshift(player.name+" played 'No'");
        this.status.someOneNoped=!this.status.someOneNoped;
        this.playedCards.unshift(card);
        for(var i = player.cards.length - 1; i >= 0; i--) {
            if(player.cards[i].id===card.id) {
                player.cards.splice(i, 1);
            }
        }
        this.setTimeout(this.lastCard, this.lastSecond);
        this.toClients();
    },
    playCardFinally:function(card,secondPlayer) {
        this.status.waitForNope=false;
        if (this.someOneNoped && card.type!="force") {
            this.someOneNoped=false;
            return; // nix tun
        }
        if (card.type==="gift" && this.status.offeredGift===undefined) {
            this.status.waitForGift=true;
            this.setTimeout(card); // Solange warten, bis Spieler Karte ausgewählt hat.
            return;
        }
        switch (card.type) {
            case "disposal":
                // Nuss entschärft
                this.log.unshift(this.currentPlayer().name+" didn't go nuts");
                this.nextPlayer();
                break;
            case "thief":
                // Zufallskarte stehlen
                this.log.unshift(this.currentPlayer().name+" took a card from "+secondPlayer.name);
                // Zufällige Karte von Spieler nehmen:
                var cardId = Math.floor(Math.random() * secondPlayer.cards.length);
                var newcard = secondPlayer.cards[cardId];
                secondPlayer.cards.splice(cardId, 1);
                this.currentPlayer().cards.push(newcard);
                this.status.secondPlayerId=undefined;
                break;
            case "force":
                // Nächster Spieler muss zwei Runden spielen
                this.log.unshift(this.currentPlayer().name+" forces the next player to play two rounds");
                if (this.someOneNoped) {
                    this.numRounds=1;
                } else {
                    this.numRounds = 2;   // Nächster Spieler muss zweimal ziehen
                }
                this.nextPlayer();
                break;
            case "sleep":
                // Glatt verpennt. Keine Karte ziehen am Ende
                this.log.unshift(this.currentPlayer().name+" sleeps missing his turn");
                this.nextPlayer();
                break;
            case "gift":
                // "Geschenk" von anderem Spiele annehmen:
                this.log.unshift(this.currentPlayer().name+" receives a gift from "+secondPlayer.name);
                var newcard = secondPlayer.cards[this.status.offeredGift];
                secondPlayer.cards.splice(this.status.offeredGift, 1);
                this.currentPlayer().cards.push(newcard);
                this.status.offeredGift=undefined;
                this.status.secondPlayerId=undefined;
                break;
            case "shuffle":
                // Mischen des Stapels
                this.log.unshift(this.currentPlayer().name+" shuffles the cards");
                this.shuffle(this.deck);
                break;
            case "future":
                // In die Zukunft schauen
                this.log.unshift(this.currentPlayer().name+" looks into the future");
                this.showFuture();
                break;
            case "reverse":
                this.status.reverse=!this.status.reverse;
                this.log.unshift("direction changed");
                break;
        }
        this.status.someOneNoped=false;
        this.status.waitForGift=false;
        this.toClients();
    },
    
    getNextPlayer:function(currentPlayerIndex) {
        var obj=this;
        var counter=0;
        var nextPlayerIndex=obj.status.reverse?currentPlayerIndex-1:currentPlayerIndex+1;

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
                if (this.status.reverse) {
                    nextPlayerIndex--;
                } else {
                    nextPlayerIndex++;
                }
            }
        }
        return nextPlayerIndex;
    },
    nextPlayer:function() {
        var obj=this;
        var counter=0;
        var currentPlayerIndex=0;

        this.players.forEach(function(player) {
            if (player.state==="playing") {
                player.state="waiting";
               currentPlayerIndex=counter;
            }
            counter++;
        });

        var nextPlayerIndex=this.getNextPlayer(currentPlayerIndex);
        obj.players[nextPlayerIndex].state="playing";
        obj.status.lastDrawnCard=undefined;

        obj.toClients();
    },

    getLog:function(count) {
        if (this.log===undefined) {
            return [];
        } else if (this.log.length<=count) {
            return this.log;
        } else {
            log=[];
            for (var i=0;i<count;i++) {
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
        obj.playedCards=[];

        // Kartentypen:
        var nut = $.grep(obj.allCards, function(e){ return e.type == "nut"; })[0];
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

        var playerIndex=0;
        // Karten für Spieler:
        for (var i=0;i<numPlayers; i++) {
            playerIndex=obj.getNextPlayer(playerIndex);
            var player=obj.players[playerIndex];
            player.cards=[];
            player.cards.push(disposal);
            for (var cards=0; cards<4; cards++) {
                obj.drawCard(player, true);
            }
            //obj.players.push(player);
        }

        // Nüsse und Knacker wieder ins Deck:
        obj.addCardsToDeck(nut,numPlayers-1);
        if (numPlayers===2) {
            obj.addCardsToDeck(disposal,2);
        } else {
            obj.addCardsToDeck(disposal,disposalrest);
        }

        obj.shuffle(obj.deck);

        obj.status.isRunning=true;
        obj.log.unshift("ready to play");
        obj.status.lastDrawnCard=obj.deck[0];

        // TEST: Bombe an den start:
        obj.toClients();  // Informieren, dass das Spiel gestartet wurde.


    }
};

var allcards=
 [
        {
            "type":"nut",
            "name":"Hazelnut",
            "image":"nut.png",
            "description":"draw this and you get nuts!"
        },
        {
            "type":"disposal",
            "name":"Nutcracker",
            "image":"disposal.png",
            "description":"use this when you draw a hazelnut"
        },
        {
            "type":"thief",
            "name":"Thief",
            "image":"thief1.png",
            "description":"play two thiefs of the same head color to steal a card from an opponent"
        },
        {
            "type":"thief",
            "name":"Thief",
            "image":"thief2.png",
            "description":"play two thiefs of the same head color to steal a card from an opponent"
        },
        {
            "type":"thief",
            "name":"Thief",
            "image":"thief3.png",
            "description":"play two thiefs of the same head color to steal a card from an opponent"
        },
        {
            "type":"thief",
            "name":"Thief",
            "image":"thief4.png",
            "description":"play two thiefs of the same head color to steal a card from an opponent"
        },
        {
            "type":"thief",
            "name":"Thief",
            "image":"thief5.png",
            "description":"play two thiefs of the same head color to steal a card from an opponent"
        },
        {
            "type":"force",
            "name":"Force",
            "image":"attack.png",
            "description":"force the next player to play two rounds"
        },
        {
            "type":"no",
            "name":"No",
            "image":"no.png",
            "description":"disable the last card"
        },
        {
            "type":"sleep",
            "name":"Sleep",
            "image":"sleep.png",
            "description":"end the round without drawing a card"
        },
        {
            "type":"future",
            "name":"See the future",
            "image":"future.png",
            "description":"look what's on the deck"
        },
        {
            "type":"shuffle",
            "name":"Shuffle",
            "image":"shuffle.png",
            "description":"shuffle the deck"
        }, {
            "type":"gift",
            "name":"Gift",
            "image":"gift.png",
            "description":"take a card from an opponent"
        },
        {
            "type":"reverse",
            "name":"Reverse",
            "image":"reverse.png",
            "description":"reverse the play order"
        }
    ];
