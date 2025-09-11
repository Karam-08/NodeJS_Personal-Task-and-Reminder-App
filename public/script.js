$(document).ready(function(){

    let taskIDCounter = 0; // Unique ID counter for each task

    loadFromServer(); // Loads tasks from the server when the page loads

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
        
            if(delay <= 0){
                $("#reminders").append(
                    `<div class="reminder">Task "${task}" is already overdue!</div>`
                );
                $(`#task-list li[data-id="${taskID}"]`).addClass("overdue");
            }else if(delay <= 24 * 60 * 60 * 1000){
                setTimeout(function(){
                    $("#reminders").append(
                        `<div class="reminder">Task "${task}" is due within 24 hours!</div>`
                    );
                    $(`#task-list li[data-id="${taskID}"]`).addClass("warning");
                }, delay - (60 * 60 * 1000)); 
                // fire 1 hour before deadline, adjust as needed
                setTimeout(function(){
                    $("#reminders").append(
                        `<div class="reminder">🚨 Task "${task}" is due now!</div>`
                    );
                    $(`#task-list li[data-id="${taskID}"]`).addClass("overdue");
                }, delay);
            }else{
                setTimeout(function(){
                    $("#reminders").append(
                        `<div class="reminder">🚨 Task "${task}" is due now!</div>`
                    );
                    $(`#task-list li[data-id="${taskID}"]`).addClass("overdue");
                }, delay);
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
        saveToServer();
    })

    $("#task-list").on('click', '.check', function(e){
        e.preventDefault();
        $(this).parent().toggleClass("done");
        saveToServer();
    })

    $("#task-list").on('click', '.delete', function(e){
        e.preventDefault();
        $(this).parent().remove();
        saveToServer();
    })

    $("#clear-all").on('click', function(e){
        e.preventDefault();
        $("#task-list").empty();
        saveToServer();
    })

    $("#clear-all").on('click', function(e){
        e.preventDefault();
        $("#task-list li.done").remove();
        saveToServer();
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

    function saveToServer(){
        const tasks = [];
        $("#task-list li").each(function(){
            tasks.push({
                id: $(this).data("id"),
                text: $(this).clone().children("button").remove().end().text().trim(),
                done: $(this).hasClass("done")
            })
        })
        fetch('/tasks', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(tasks)
        })
    }
    function loadFromServer(){
        fetch('/tasks')
        .then(res => res.json())
        .then(tasks => {
            $("#task-list").empty();
            tasks.forEach(task => {
                $("#task-list").append(
                    `<li data-id="${task.id}" class="${task.done ? "done" : ""}">
                        ${task.text}
                        <button class="check">Check off Task</button>
                        <button class="delete">Delete</button>
                    </li>`
                );
            });
        });
    }
});