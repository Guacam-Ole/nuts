angular.module('boomApp', [])
    .controller('tableController', function($scope) {
        $scope.isTraining=true; // Training= Man spielt alle Spieler selbst
        $scope.currentPlayerId="1";
        $scope.players= [
            {
                "id":"1",
                "name":"Lee Everett",
                "cards":[],
                "state":"watching"
            },
            {
                "id":"2",
                "name":"Clementine",
                "cards":[],
                "state":"waiting"
            },
            {
                "id":"3",
                "name":"Hershell Greene",
                "cards":[],
                "state":"waiting"
            },
            {
                "id":"4",
                "name":"Shawn Greene",
                "cards":[],
                "state":"playing"
            },
            {
                "id":"5",
                "name":"Kenny",
                "cards":[],
                "state":"waiting"
            },
            {
                "id":"6",
                "name":"Glenn",
                "cards":[],
                "state":"bombed"
            },
            {
                "id":"7",
                "name":"Christa",
                "cards":[],
                "state":"bombed"
            },
            {
                "id":"8",
                "name":"Omid",
                "cards":[],
                "state":"waiting"
            }
        ];

        $scope.getStateIcon=function(state) {
            switch (state) {
                case "watching":
                    return "fa-eye";
                case "waiting":
                    return "fa-hourglass-half";
                case "bombed":
                    return "fa-bomb";
                case "playing":
                    return "fa-gamepad";
            }
        }

    });