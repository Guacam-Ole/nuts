


$(document).on({
    mouseenter: function () {
        if ($(this).hasClass("selected")) {
            $(this).css("z-index","25");
        } else {
            $(this).css("z-index","20");
        }

    },
    mouseleave: function () {
        if ($(this).hasClass("selected")) {
            $(this).css("z-index", "22");
        } else {
            $(this).css("z-index", "10");
        }
    }
}, ".yourCards .singleCard"); //pass the element as an argument to .on
var bombTimer;
var bombInterval;
function  startBomb() {
    bombTimer=10;
    showBomb=true;
    $('.gonnaBoom').slideDown();
    tickBomb();
    bombInterval=setInterval(tickBomb,1000);
}
function tickBomb() {
    if (bombTimer===0) {
        showBomb=false;
        clearInterval(bombInterval);
        $('.gonnaBoom').slideUp();
        scope = angular.element($('#cardTable')).scope();
        scope.$apply(function() {
            scope.bombDetonated();
        });
    } else {
        bombTimer--;

        $('.bombTimer').circleProgress({
            value:  bombTimer / 10,
            animation: false,
            fill: {gradient: ['#ff1e41', '#ff5f43']}
        });
        $('.bombCount').text(bombTimer);
    }
}
