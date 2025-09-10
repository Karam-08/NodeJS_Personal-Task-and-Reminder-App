$(document).ready(function(){
    $('#submit').on('click', function(e){
        e.preventDefault();
        let task = $('#task-input').val()
        let deadline = $("#deadline-input").val()
        let formattedDeadline = "";
        if(task == ""){
            return;
        }
        if(deadline){ // Checks if the user entered a deadline
            let dateObj = new Date(deadline);
            formattedDeadline = " (Due: " + dateObj.toLocaleString([], { 
                dateStyle: "short", 
                timeStyle: "short" 
            }) + ")";
        }
        $("#task-list").append(
            `<li>
            ${task}${formattedDeadline}
            <button id="check">Check off Task</button>
            <button id="delete">Delete</button>
            </li>`
        );
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

        // let filter = $(this).attr("id")

        // if(filter === "filter-all") {
        //     $("#task-list li").show();
        // }else if(filter === "filter-open"){
        //     $("#task-list li.done").hide(); // Hides the completed tasks
        //     $("#task-list li:not(.done)").show();
        // }else if(filter === "filter-done"){
        //     $("#task-list li.done").show(); // Only shows the completed tasks
        //     $("#task-list li:not(.done)").hide();
        // }
    })
    $("#get-quote").on('click', async function(){
        try{
            const response = await fetch("https://api.allorigins.win/get?url=" + encodeURIComponent("https://zenquotes.io/api/quotes"));
            if(!response.ok){
                throw new Error("Network response was not ok");
            }
            const data = await response.json();
            const quotes = JSON.parse(data.contents);
            
            // Pick a random quote
            const randomIndex = Math.floor(Math.random() * quotes.length);
            const quote = quotes[randomIndex];
            $("#quote-box").text(quote.q + " - " + quote.a + " ✨");
        }catch(error){
            console.error("There was a problem with the fetch operation:", error);
        }
    })
});