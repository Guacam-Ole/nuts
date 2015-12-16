var apiReady=false;
var gameReady=false;
gapi.hangout.onApiReady.add(function(eventObj){
    if (eventObj.isApiReady) {
        apiReady=true;
    }
});


gapi.hangout.data.onStateChanged.add(function (event ) {
    if (!apiReady) {
        return;
    }
    console.log(event.state);
    var scope=angular.element($('#cardTable')).scope();

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

        scope.$apply(function() {
            scope.wait();
        });
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