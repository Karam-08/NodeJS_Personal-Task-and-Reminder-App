$(document).ready(function(){

    let taskIDCounter = 0; 
    const countdownTimers = {}; // Keeps track of countdowns

    loadFromServer(); // Loads tasks when page starts

    // Add task
    $('#submit').on('click', function(e){
        e.preventDefault();
        let task = $('#task-input').val(); // Gets task input
        let deadline = $("#deadline-input").val(); // Gets deadline input (if there is one)
        let formattedDeadline = "";
        let taskID = "task-" + taskIDCounter++; // Each task gets a unique ID

        if(task === "") return; // Prevents adding empty tasks

        if(deadline){ 
            let dateObj = new Date(deadline);
            formattedDeadline = " (Due: " + dateObj.toLocaleString([], {
                dateStyle: "short", 
                timeStyle: "short" 
            }) + ")"; // Formats deadline nicely

            let now = new Date();
            let delay = dateObj.getTime() - now.getTime();
            let urgencyClass = "";

            // Sets urgency based on how much time is left
            if(delay <= 0){
                urgencyClass = "overdue";
            }else if(delay < 60 * 60 * 1000){
                urgencyClass = "warning";
            }else{
                urgencyClass = "";
            }

            // Adds the task to the list
            $("#task-list").append(
            `<li class="${urgencyClass}" data-id="${taskID}">
                ${task}${formattedDeadline}
                <button class="check">Check off Task</button>
                <button class="delete">Delete</button>
            </li>`
            );

            // Adds countdown to the reminders section
            $("#reminders").append(
                `<div class="countdown" data-task="${taskID}" data-deadline="${dateObj.getTime()}">${task}</div>`
            );

            // Starts the countdown
            startCountdown($(`#task-list li[data-id="${taskID}"]`), dateObj.getTime());

        }else{ 
            // Task without deadline
            $("#task-list").append(
            `<li data-id="${taskID}">
                ${task}
                <button class="check">Check off Task</button>
                <button class="delete">Delete</button>
            </li>`
            );
        }

        $("#task-input").val("");
        $("#deadline-input").val("");
        saveToServer(); // Syncs to server
    });

    // Toggle done
    $("#task-list").on('click', '.check', function(e){
        e.preventDefault();
        let li = $(this).parent();
        let id = li.data("id");
        let countdown = $(`#reminders .countdown[data-task="${li.data("id")}"]`);

        li.toggleClass("done"); // Toggles completed state

        if(li.hasClass("done")){
            // Marks as done in reminders
            if(countdown.length){
                let taskText = li.clone().children("button, .countdown").remove().end().text().trim(); // Gives clean task text without buttons or button labels
                countdown.text(`Completed - ${taskText}`);
            }
            if(countdownTimers[id]){
                // Stops countdown
                clearInterval(countdownTimers[id]);
                delete countdownTimers[id];
            }
        }else{
            // If undone, restart countdown
            if(countdown.length && countdown.data("deadline")){
                startCountdown(li, countdown.data("deadline"));
            }
        }
        saveToServer();
    });

    // Delete task
    $("#task-list").on('click', '.delete', function(e){
        e.preventDefault();
        let li = $(this).parent();
        let id = li.data("id");

        if(countdownTimers[id]){
            // Stops the countdown if it exists
            clearInterval(countdownTimers[id]);
            delete countdownTimers[id];
        }
        // Removes the task and its reminder
        li.remove();
        $(`#reminders .countdown[data-task="${id}"]`).remove();
        saveToServer();
    });

    // Clear all
    $("#clear-all").on('click', function(e){
        e.preventDefault();
        // Stops all of the timers
        $.each(countdownTimers, function(id, timer){
            clearInterval(timer);
        });
        for(let key in countdownTimers){
            delete countdownTimers[key];
        }
        // Clears tasks and reminders
        $("#task-list").empty();
        $("#reminders").empty();
        saveToServer();
    });

    // Filters
    $(".filters button").on('click', function(){
        $(".filters button").removeClass("active");
        $(this).addClass("active");

        let filter = $(this).attr("id");
        if(filter === "filter-all"){
            $("#task-list li").show(); // Shows all tasks
        }else if(filter === "filter-open"){
            $("#task-list li.done").hide();
            $("#task-list li:not(.done)").show(); // Only shows incomplete tasks
        }else if(filter === "filter-done"){
            $("#task-list li.done").show();
            $("#task-list li:not(.done)").hide(); // Only shows completed tasks
        }
    });

    // Quotes
    $("#get-quote").on('click', async function(){
        try{
            const response = await fetch("https://api.allorigins.win/get?url=" + encodeURIComponent("https://zenquotes.io/api/quotes"));
            if(!response.ok) throw new Error("Network response was not ok");
            
            const data = await response.json();
            const quotes = JSON.parse(data.contents);
            const randomIndex = Math.floor(Math.random() * quotes.length);
            const quote = quotes[randomIndex];
            $("#quote-box").text(quote.q + " - " + quote.a + " ✨");
        }catch(error){
            console.error("There was a problem with the fetch operation:", error);
        }
    });

    function saveToServer(){
        const tasks = [];
        $("#task-list li").each(function(){
            let li = $(this);
            let isDone = li.hasClass("done");
            let countdown = $(`#reminders .countdown[data-task="${li.data("id")}"]`);

            let taskObj = {
                id: li.data("id"),
                text: li.clone().children("button").remove().end().text().trim(),
                done: isDone,
                deadline: null
            };
            // Only saves the deadline if the task isn't done
            if(!isDone){
                if(countdown.length){
                    taskObj.deadline = countdown.data("deadline");
                }
            }
            tasks.push(taskObj);
        });

        fetch('/tasks', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(tasks)
        });
    }

    function loadFromServer(){
        fetch('/tasks')
        .then(res => res.json())
        .then(tasks => {
            // Clears before reloading
            $("#task-list").empty();
            $("#reminders").empty();

            // Stops all existing timers 
            $.each(countdownTimers, function(id, timer){
                clearInterval(timer);
            });
            for(let key in countdownTimers){
                delete countdownTimers[key];
            }
            
            tasks.forEach(task =>{ // Sets the class if it's done
                let liClass = "";
                if(task.done){
                    liClass = "done";
                }

                // Adds the task back to the list
                $("#task-list").append(
                    `<li data-id="${task.id}" class="${liClass}">
                        ${task.text}
                        <button class="check">Check off Task</button>
                        <button class="delete">Delete</button>
                    </li>`
                );

                // Adds back the reminder if the deadline exists
                if(task.deadline){
                    $("#reminders").append(
                        `<div class="countdown" data-task="${task.id}" data-deadline="${task.deadline}">${task.text}</div>`
                    );
                }

                let li = $(`#task-list li[data-id="${task.id}"]`);
                if(task.done){ // Shows as complete
                    $(`#reminders .countdown[data-task="${task.id}"]`).text(`Completed - ${task.text}`);
                }else if(task.deadline){
                    // Restarts countdown
                    startCountdown(li, task.deadline);
                }
            });
        });
    }

    function startCountdown(li, deadlineTime){
        let countdown = $(`#reminders .countdown[data-task="${li.data("id")}"]`);
        let id = li.data("id");

        function updateCountdown(){
            if(li.hasClass("done")){
                countdown.text(`Completed - ${li.text().trim()}`);
                // Stops countdown if the task is done
                clearInterval(countdownTimers[id]);
                delete countdownTimers[id];
                return;
            }

            let now = Date.now();
            let distance = deadlineTime - now;

            if(distance <= 0){
                // If the deadline has passed
                countdown.text(`Due now! - ${li.text().trim()}`);
                li.addClass("overdue");
                clearInterval(countdownTimers[id]);
                delete countdownTimers[id];
            }else{
                // Shows the live countdown
                let hours = Math.floor(distance / (1000 * 60 * 60));
                let minutes = Math.floor((distance / (1000 * 60)) % 60);
                let seconds = Math.floor((distance / 1000) % 60);
                let taskName = li.clone().children("button").remove().end().text().trim();
                countdown.text(`${hours}h ${minutes}m ${seconds}s remaining - ${taskName}`);
            }
        }
        updateCountdown(); // Runs immediately
        countdownTimers[id] = setInterval(updateCountdown, 1000); // Updates every second
    }
});
