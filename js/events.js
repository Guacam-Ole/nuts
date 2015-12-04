$( document ).ready(function() {
    $('.yourCards .singleCard')
        .hover(
            function() {
                $(this).css("z-index","20");
            }
        ,
        function() {
                $(this).css("z-index","10");
        });
});