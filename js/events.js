var apiReady=false;
var documentReady=false;
$( document ).ready(function() {
    documentReady=true;
    initGame();
});

gapi.hangout.onApiReady.add(function(eventObj){
    if (eventObj.isApiReady) {
        apiReady=true;
        initGame();

    }
});

function initGame() {
       if (apiReady && documentReady) {
           var scope=angular.element($('#cardTable')).scope();
           if (scope!==undefined) {
               if (scope.servant !== undefined) {
                   scope.servant.id=gapi.hangout.getLocalParticipantId();
                   if (scope.servant.readState(gapi.hangout.data.getState())) {
                       scope.$apply(function () {
                           scope.wait();
                       });
                   }
               }
           }
       }
};

gapi.hangout.data.onStateChanged.add(function (event ) {
    if (!apiReady) {
        return;
    }
    console.log(event.state);
    var scope=angular.element($('#cardTable')).scope();
    if (scope.servant!==undefined) {
        if (scope.servant.readState(event.state)) {
            scope.$apply(function() {
                scope.wait();
            });
        }
    }

    if (scope.master!==undefined) {
        scope.master.readState(event.state);
    }


    // ALT: KANN WEG

    if (event.state['isClientMessage']==='1') {
        switch (event.state["actionType"]) {
            case "gameWaiting":
            case "gameInit":
                scope.gameCreated=true;
                break;
            case "gameStarted":
                scope.gameRunning=true;
                break;
        }


    } else if (event.state['isServerMessage']==='1') {
        if (scope.master!==undefined) {
            switch (event.state["actionType"]) {
                case "joinGame":
                    scope.master.playerJoining(event.state["player"]);
                    break;
                case "watchGame":
                    scope.master.playerWatching(event.state["player"]);
                    break;
            }
        }
    }
});