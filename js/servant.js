var game = function () {
    this.deck=[];
    this.players=[];
    this.playedCards=[];
    this.log=[];
    this.readChanges=[];
    this.id=undefined;
    this.newMessages=[];

    //GameStatus:
    this.status={
        waitForNope:false,      // Darauf warten, dass jemand "Nope" spielt
        someOneNoped:false,     // Jemand hat "Nope" gespielt?
        secondPlayer:false,     // Zweiter Spieler für Aktion
        reverse:false,          // Umgekehrte Reihenfolge?
        isRunning:false,        // Spiel läuft?
        isWaiting:false,        // Warten auf Spieler?
        deckCount:0,            // verbleibende Karte im Deck
        serverStarted:false     // Server gestartet

    };
};


game.prototype = {
    constructor: game,
    readState:function(state) {
        if (state===undefined) {
            return false;
        }
        var clientChanges=false;
        if (state["status"]!==undefined && state["status"]!==JSON.stringify(this.status)) {
            this.status=JSON.parse(state["status"]);
            clientChanges=true;
        }
        if (state["players"]!==undefined && state["players"]!==JSON.stringify(this.players)) {
            this.players=JSON.parse(state["players"]);
            clientChanges=true;
            this.myChanges();
        }
        if (state["log"]!==undefined && state["log"]!==JSON.stringify(this.log)) {
            this.log=JSON.parse(state["log"]);
            clientChanges=true;
        }
        if (state["playedCards"]!==undefined && state["playedCards"]!==JSON.stringify(this.playedCards)) {
            this.playedCards=JSON.parse(state["playedCards"]);
            clientChanges=true;
        }
        return clientChanges ;
    },

    myChanges:function() {
        // Spezifische Anweisungen an Spieler prüfen:
        var obj=this;
        var me= obj.me();
        if (me===undefined) {
            return; // Noch keine Spiele initialisiert
        }
        if (me.toClient!==undefined) {
            me.toClient.forEach(function (clientMessage) {
                var alreadyProcessed= $.inArray(clientMessage.id, obj.readChanges)>=0;
                if (!alreadyProcessed) {
                    switch (clientMessage.key) {
                        // TODO: Einzelne Befehle abfragen
                    }
                    obj.readChanges.push(clientMessage.id);
                }
            });
        }
    },
    addState:function(key,value) {
        var obj=this;
        this.newMessages.push(
            {
                id:obj.getUid(),
                key:key,
                value:value
            }
        )
    },
    writeState:function() {
        // Mitteilung an den Master
        var obj=this;
        if (obj.newMessages.length===0) {
            return;
        }
        var me=obj.me();
        var oldMessages=gapi.hangout.data.getState()[obj.id];
        if (oldMessages===undefined) {
            oldMessages=[];
        } else {
            oldMessages=JSON.parse(oldMessages);
        }
        while (oldMessages.length>10) {
            // Alte Messages raus, um Speicher zu sparen
            oldMessages.shift();
        }
        obj.newMessages.forEach(function(newMessage) {
            oldMessages.push(newMessage);
        });
        gapi.hangout.data.setValue(obj.id, JSON.stringify(oldMessages));
    },
    reset:function() {
        this.deck=[];
        this.players=[];
        this.playedCards=[];
        this.log=[];
        this.readChanges=[];
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
    },

    me:function() {
        var obj=this;
        if (this.players===undefined) {
            return undefined;
        }
        var me=$.grep(this.players, function(e){ return e.id == obj.id; });
        if (me===undefined) {
            return undefined;
        }
        return me [0];
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

    joinGame:function() {
        this.addState("join","");
        this.writeState();
    },
    watchGame:function() {
        this.addState("watch","");
        this.writeState();
    },




    init:function() {
    },


    getDeckCount:function() {

    },

    lastPlayedCards:function(count) {

    },
    getMyProfile:function(playerId) {

    },
    readAllCards:function() {

    },
    shuffle:function(deck) {

    },
    addCardsToDeckdra:function(card, number) {

    },
    getUid:function() {
    },
    drawCard:function(player) {
    },
    wait:function() {
        scope.$apply(function() {
            scope.wait();
        });
    },
    showFuture:function() {
    },
    playCard:function(cards, secondPlayer) {
    },
    playNope:function(playerId, card) {
    },
    playCardFinally:function(card, doWait) {
    },
    getLog:function(count) {
    },
    currentPlayer:function() {
        return $.grep(this.players, function(e){ return e.state == "playing"; })[0];
    }
};