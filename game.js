var game = function () {
    this.deck=[];
    this.players=[];
    this.allCards=[];
    this.readAllCards();
};


game.prototype = {
    constructor: game,
    init:function(numPlayers) {

        this.filldeck(numPlayers);
    },
    readAllCards:function() {
        // Alle Kartentypen aus JSON-File lesen
        if (allCards.length===0) {
            $.getJSON("./json/cards.json", function (data) {
                $.each(data, function (card) {
                    allCards.push(card);
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
    },
    addCardsToDeck:function(card, number) {
        // Karten zum Deck hinzufügen
        for (i=0; i<number; i++) {
            this.deck.push(card);
        }
    },
    drawCard:function() {
        // Karte aus Deck ziehen
        return obj.deck.shift();    // oberste Karte (index 0)
    },
    filldeck:function(numPlayers) {
        // Deck für Spielstart füllen
        var numberOfDecks=numPlayers %5;    // Pro 5 Spieler ein Kartendeck
        var disposalrest=6*numberOfDecks-numPlayers;
        var obj=this;

        // Kartentypen:
        var bomb = $.grep(allCards, function(e){ return e.type == "bomb"; })[0];
        var disposal = $.grep(allCards, function(e){ return e.type == "disposal"; })[0];
        var attack = $.grep(allCards, function(e){ return e.type == "next"; })[0];
        var nope = $.grep(allCards, function(e){ return e.type == "nope"; })[0];
        var skip = $.grep(allCards, function(e){ return e.type == "skip"; })[0];
        var future = $.grep(allCards, function(e){ return e.type == "future"; })[0];
        var shuffle = $.grep(allCards, function(e){ return e.type == "shuffle"; })[0];
        var favour = $.grep(allCards, function(e){ return e.type == "favour"; })[0];
        var suspects=$.grep(allCards, function(e){ return e.type == "favour"; });

        // Deck:
        obj.addCardsToDeck(nope,5*numberOfDecks);
        obj.addCardsToDeck(attack, 4*numberOfDecks);
        obj.addCardsToDeck(skip,4*numberOfDecks);
        obj.addCardsToDeck(favour,4*numberOfDecks);
        obj.addCardsToDeck(shuffle,4*numberOfDecks);
        obj.addCardsToDeck(future,5*numberOfDecks);
        suspects.forEach(function(suspect) {
            obj.addCardsToDeck(suspect,4*numberOfDecks);
        });

        obj.shuffle(obj.deck);

        // Karten für Spieler:
        for (i=0;i<numPlayers; i++) {
            player={
                cards:[]
            };
            player.cards.push(disposal);
            for (cards=0; cards<4; cards++) {
                player.cards.push(obj.drawCard());
            }
            obj.players.push(player);
        }

        // Bomben und Entschärfer wieder ins Deck:
        obj.deck.push(bomb,numPlayers-1);
        if (numPlayers===2) {
            obj.addCardsToDeck(disposal,2);
        } else {
            obj.addCardsToDeck(disposal,disposalrest);
        }

        obj.shuffle(obj.deck);
    }
};