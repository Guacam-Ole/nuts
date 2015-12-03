$( document ).ready(function() {
    $('.singleCard')
        .hover(
            function() {
                $(this).
                animate({
                    height: "100%"
                }, 500);
            }
        ,
        function() {
                $(this).
                animate({
                    height: "40%"
                }, 200);
        });
});