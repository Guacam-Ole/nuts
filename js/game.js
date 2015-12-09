var game = function () {
    this.deck=[];
    this.players=[];
    this.allCards=[];
    this.playedCards=[];
    this.log=[];
    this.readAllCards();
};


game.prototype = {
    constructor: game,
    init:function(numPlayers) {
        this.log=[];
        this.log.unshift("Waiting for players...")
        this.filldeck(numPlayers);
    },
    getDeckCount:function() {
        return this.deck.length;
    },

    lastPlayedCards:function(count) {
        if (this.playedCards.length<count) {
            return this.playedCards;
        }
        var playedCards=[];
        for (i=0; i<count; i++) {
            playedCards.push(this.playedCards[i]);
        }
        return playedCards;
    },
    getMyProfile:function(playerId) {
        var me = $.grep(this.players, function(e){ return e.id == playerId; })[0];
        return me;
    },
    readAllCards:function() {
        this.log.unshift("cards read");
        var obj=this;
        // Alle Kartentypen aus JSON-File lesen
        if (obj.allCards.length===0) {
            $.getJSON("./json/cards.json", function (data) {

                data.cards.forEach(function(card) {
                    obj.allCards.push(card);
                });
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
    addCardsToDeck:function(card, number) {
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
        // Karte aus Deck ziehen
        if (player.name!==undefined) {
            this.log.unshift(player.name + " took one card from the deck (ending his turn)");
        }
        var card=this.deck.shift();
        player.cards.push(card);
        return card;
    },
    playCard:function(cards, secondPlayer) {
        var obj=this;
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
                // Zufällige Karte von Spieler nehmen:
                var cardId=Math.floor(Math.random() * secondPlayer.cards.length);
                var card=secondPlayer.cards[cardId];
                secondPlayer.cards.splice(cardId,1);
                player.cards.push(card);
        }



        // TODO: Auswirkung der Karte
    },
    initPlayers:function(ids, names) {
        var obj=this;
        var counter=0;
        ids.forEach(function(id) {
            obj.players[counter].id=id;
            obj.players[counter++].state="waiting";
        });
        var counter=0;
        names.forEach(function(name) {
            obj.players[counter++].name=name;
        });
        // Spieler mischen (um zufälligen Anfang zu erhalten)
        obj.shuffle(obj.players);
        obj.players[0].state="playing";
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
        this.players=[];
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

        // Karten für Spieler:
        for (i=0;i<numPlayers; i++) {
            player={
                cards:[]
            };
            player.cards.push(disposal);
            for (cards=0; cards<4; cards++) {
                obj.drawCard(player);
            }
            obj.players.push(player);
        }

        // Bomben und Entschärfer wieder ins Deck:
        obj.addCardsToDeck(bomb,numPlayers-1);
        if (numPlayers===2) {
            obj.addCardsToDeck(disposal,2);
        } else {
            obj.addCardsToDeck(disposal,disposalrest);
        }

        obj.shuffle(obj.deck);
        this.log.unshift("ready to play");
    }
};