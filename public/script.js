$(document).ready(function(){

    let taskIDCounter = 0; 
    const countdownTimers = {}; // ✅ keep track of countdowns

    loadFromServer(); // ✅ load tasks when page starts

    // --- ADD TASK ---
    $('#submit').on('click', function(e){
        e.preventDefault();
        let task = $('#task-input').val();
        let deadline = $("#deadline-input").val();
        let formattedDeadline = "";
        let taskID = "task-" + taskIDCounter++;

        if(task === "") return;

        if(deadline){ 
            let dateObj = new Date(deadline);
            formattedDeadline = " (Due: " + dateObj.toLocaleString([], { 
                dateStyle: "short", 
                timeStyle: "short" 
            }) + ")";

            let now = new Date();
            let delay = dateObj.getTime() - now.getTime();
            let urgencyClass = delay <= 0 ? "overdue" : delay < 60 * 60 * 1000 ? "warning" : "";

            $("#task-list").append(
            `<li class="${urgencyClass}" data-id="${taskID}">
                ${task}${formattedDeadline}
                <button class="check">Check off Task</button>
                <button class="delete">Delete</button>
            </li>`
            );

            $("#reminders").append(
                `<div class="countdown" data-task="${taskID}" data-deadline="${dateObj.getTime()}">${task}</div>`
            );

            // Start countdown
            startCountdown($(`#task-list li[data-id="${taskID}"]`), dateObj.getTime());

        }else{
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

    // --- TOGGLE DONE ---
    $("#task-list").on('click', '.check', function(e){
        e.preventDefault();
        let li = $(this).parent();
        let id = li.data("id");
        let countdown = $(`#reminders .countdown[data-task="${li.data("id")}"]`);

        li.toggleClass("done");

        if(li.hasClass("done")){
            if(countdown.length) countdown.text(`Completed - ${li.text().trim()}`);
            if(countdownTimers[id]){
                clearInterval(countdownTimers[id]);
                delete countdownTimers[id];
            }
        }else{
            if(countdown.length && countdown.data("deadline")){
                startCountdown(li, countdown.data("deadline"));
            }
        }

        saveToServer();
    });

    // --- DELETE TASK ---
    $("#task-list").on('click', '.delete', function(e){
        e.preventDefault();
        let li = $(this).parent();
        let id = li.data("id");

        if(countdownTimers[id]){
            clearInterval(countdownTimers[id]);
            delete countdownTimers[id];
        }
        li.remove();
        $(`#reminders .countdown[data-task="${id}"]`).remove(); // ✅ also remove from reminders
        saveToServer();
    });

    // --- CLEAR ALL ---
    $("#clear-all").on('click', function(e){
        e.preventDefault();
        $.each(countdownTimers, function(id, timer){
            clearInterval(timer);
        });
        for (let key in countdownTimers) delete countdownTimers[key];

        $("#task-list").empty();
        $("#reminders").empty(); // ✅ clear reminders too
        saveToServer();
    });

    // --- FILTERS ---
    $(".filters button").on('click', function(){
        $(".filters button").removeClass("active");
        $(this).addClass("active");

        let filter = $(this).attr("id");
        if(filter === "filter-all"){
            $("#task-list li").show();
        } else if(filter === "filter-open"){
            $("#task-list li.done").hide();
            $("#task-list li:not(.done)").show();
        } else if(filter === "filter-done"){
            $("#task-list li.done").show();
            $("#task-list li:not(.done)").hide();
        }
    });

    // --- QUOTES ---
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

    // --- SAVE TO SERVER ---
    function saveToServer(){
        const tasks = [];
        $("#task-list li").each(function(){
            let li = $(this);
            let isDone = li.hasClass("done");
            let countdown = $(`#reminders .countdown[data-task="${li.data("id")}"]`);

            tasks.push({
                id: li.data("id"),
                text: li.clone().children("button").remove().end().text().trim(),
                done: isDone,
                deadline: isDone ? null : (countdown.length ? countdown.data("deadline") : null)
            });
        });

        fetch('/tasks', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(tasks)
        });
    }

    // --- LOAD FROM SERVER ---
    function loadFromServer(){
        fetch('/tasks')
        .then(res => res.json())
        .then(tasks => {
            $("#task-list").empty();
            $("#reminders").empty(); // ✅ clear reminders before re-adding

            $.each(countdownTimers, function(id, timer){
                clearInterval(timer);
            });
            for(let key in countdownTimers) delete countdownTimers[key];

            tasks.forEach(task =>{
                $("#task-list").append(
                    `<li data-id="${task.id}" class="${task.done ? "done" : ""}">
                        ${task.text}
                        <button class="check">Check off Task</button>
                        <button class="delete">Delete</button>
                    </li>`
                );

                if(task.deadline){
                    $("#reminders").append(
                        `<div class="countdown" data-task="${task.id}" data-deadline="${task.deadline}">${task.text}</div>`
                    );
                }

                let li = $(`#task-list li[data-id="${task.id}"]`);
                if(task.done){
                    $(`#reminders .countdown[data-task="${task.id}"]`).text(`Completed - ${task.text}`);
                } else if(task.deadline){
                    startCountdown(li, task.deadline);
                }
            });
        });
    }

    // --- COUNTDOWN ---
    function startCountdown(li, deadlineTime){
        let countdown = $(`#reminders .countdown[data-task="${li.data("id")}"]`);
        let id = li.data("id");

        function updateCountdown(){
            if(li.hasClass("done")){
                countdown.text(`Completed - ${li.text().trim()}`);
                clearInterval(countdownTimers[id]);
                delete countdownTimers[id];
                return;
            }

            let now = Date.now();
            let distance = deadlineTime - now;

            if(distance <= 0){
                countdown.text(`Due now! - ${li.text().trim()}`);
                li.addClass("overdue");
                clearInterval(countdownTimers[id]);
                delete countdownTimers[id];
            }else{
                let hours = Math.floor(distance / (1000 * 60 * 60));
                let minutes = Math.floor((distance / (1000 * 60)) % 60);
                let seconds = Math.floor((distance / 1000) % 60);
                let taskName = li.clone().children("button").remove().end().text().trim();
                countdown.text(`${hours}h ${minutes}m ${seconds}s remaining - ${taskName}`);
            }
        }
        updateCountdown();
        countdownTimers[id] = setInterval(updateCountdown, 1000);
    }
});
