


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