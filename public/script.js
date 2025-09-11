$(document).ready(function(){

    let taskIDCounter = 0; // Unique ID counter for each task

    $('#submit').on('click', function(e){
        e.preventDefault();
        let task = $('#task-input').val()
        let deadline = $("#deadline-input").val()
        let formattedDeadline = "";
        let taskID = "task-" + taskIDCounter++; // Creates a unique ID

        if(task == ""){
            return;
        }
        if(deadline){ // Checks if the user entered a deadline
            let dateObj = new Date(deadline);
            formattedDeadline = " (Due: " + dateObj.toLocaleString([], { 
                dateStyle: "short", 
                timeStyle: "short" 
            }) + ")";

            let now = new Date();
            let delay = dateObj.getTime() - now.getTime();

            let urgencyClass = "";
            if(delay <= 0){
                urgencyClass = "overdue";
            }else if(delay < 60 * 60 *  1000){
                urgencyClass = "warning";
            }

            $("#task-list").append(
            `<li class="${urgencyClass}" data-id="${taskID}">
            ${task}${formattedDeadline}
            <button class="check">Check off Task</button>
            <button class="delete">Delete</button>
            </li>`
            );
        
            if(delay > 0){
                setTimeout(function(){
                    $("#reminders").append(
                    `<div class="reminder">Reminder: Task "${task}" is due now!</div>`
                    );
                    $(`#task-list li[data-id="${taskID}"]`).addClass("overdue")
                }, delay)
            }else if(delay < 1000 * 60 * 60 * 24){
                setTimeout(function(){
                    $("#reminders").append(
                    `<div class="reminder">Reminder: Task "${task}" is due within 24 hours!</div>`
                    );
                    $(`#task-list li[data-id="${taskID}"]`).addClass("warning")
                })
            }
        }else{
            $("#task-list").append(
            `<li data-id="${taskID}">
            ${task}
            <button class="check">Check off Task</button>
            <button class="delete">Delete</button>
            </li>`
            )
        }

        $("#task-input").val("")
        $("#deadline-input").val("")
    })

    $("#task-list").on('click', '.check', function(e){
        e.preventDefault();
        $(this).parent().toggleClass("done");
    })

    $("#task-list").on('click', '.delete', function(e){
        e.preventDefault();
        $(this).parent().remove();
    })

    $("#clear-all").on('click', function(e){
        e.preventDefault();
        $("#task-list").empty();
    })

    $("#clear-all").on('click', function(e){
        e.preventDefault();
        $("#task-list li.done").remove();
    })

    $(".filters button").on('click', function(){
        $(".filters button").removeClass("active");
        $(this).addClass("active");

        let filter = $(this).attr("id");

        if(filter === "filter-all") {
            $("#task-list li").show();

        }else if(filter === "filter-open"){
            $("#task-list li.done").hide();
            $("#task-list li:not(.done)").show();
            
        }else if(filter === "filter-done"){
            $("#task-list li.done").show();
            $("#task-list li:not(.done)").hide();
        }
    })

    $("#get-quote").on('click', async function(){
        try{
            const response = await fetch("https://api.allorigins.win/get?url=" + encodeURIComponent("https://zenquotes.io/api/quotes"));
            if(!response.ok){
                throw new Error("Network response was not ok");
            }
            const data = await response.json();
            const quotes = JSON.parse(data.contents);
            
            const randomIndex = Math.floor(Math.random() * quotes.length); // Picks a random quote
            const quote = quotes[randomIndex];
            $("#quote-box").text(quote.q + " - " + quote.a + " ✨");
        }catch(error){
            console.error("There was a problem with the fetch operation:", error);
        }
    })
});