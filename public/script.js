$(document).ready(function(){
    $('#submit').on('click', function(e){
        e.preventDefault();
        let task = $('#task-input').val()
        let deadline = $("#deadline-input").val()
        let formattedDeadline = "";
        if(deadline){ // Checks if the user entered a deadline
            let dateObj = new Date(deadline);
            formattedDeadline = " (Due: " + dateObj.toLocaleString([], { 
                dateStyle: "short", 
                timeStyle: "short" 
            }) + ")";
        }
        $("#task-list").append("<li>" + task + formattedDeadline + "</li>")
        $("#task-input").val("")
        $("#deadline-input").val("")
    })
    $("#clear-all").on('click', function(e){
        e.preventDefault();
        $("#task-list").empty()
    })
    $(".filters button").on('click', function(){
        $(".filters button").removeClass("active");
        $(this).addClass("active")

        let filter = $(this).attr("id")

        if(filter === "filter-all") {
            $("#task-list li").show();
        }else if(filter === "filter-open"){
            $("#task-list li.done").hide(); // Hides the completed tasks
            $("#task-list li:not(.done)").show();
        }else if(filter === "filter-done"){
            $("#task-list li.done").show(); // Only shows the completed tasks
            $("#task-list li:not(.done)").hide();
        }
    })
})