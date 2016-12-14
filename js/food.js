// jQuery plugin for changing the height and width of objects (REQUIRED)
(function($) {
    $.fn.makeBig = function() {
        return this.css({
            "width" : "20px",
            "height" : "20px"
        }); 
    };
})(jQuery);

// On page load...
$(document).ready(function() {
    
    // For all checkboxes, apply the makeBig plug-in
    $("input:checkbox").makeBig();
    
    // Initialize foodArray
    var foodArray = [];
    
    // Render page with existing stored information
    var foodList = getFromLocalStorage("foodList"); // get existing foodList from local storage
    if (foodList) {
        for (var i = 0; i < foodList.length; i++) {
            var newFood = new Food(foodList[i].name); // create a new item for each item in the foodList
            foodArray.push(newFood); // put each item in the foodArray
            addCheckbox(newFood.name); // add a checkbox to the page for each food in foodArray
        }
    }
    
    // Disable addButton when page loads
    var addButton = $("#addFood");
    $(addButton).prop("disabled", true);
    
    // If there is user input, enable addButton; If there is no user input, disable addButton
    $("#foodName").keyup(function() {
        $(addButton).prop("disabled", $("#foodName").val().length === 0);
    });

    // If user presses Enter when in text input field, run addFood function as if addButton were clicked
    // Prevent user from entering special character into input
    $("#foodName").keypress(function(e) {
        if (e.which == 13 && $("#foodName").val().length !== 0 ){ // enter key pressed
            $("#addFood").click(); // trigger addFood function
            return false;
        }
        
        // Code source: http://stackoverflow.com/questions/18608954/how-to-prevent-user-from-entering-special-characters-in-text-box-when-length-is
        // Why used: I researched ways to disallow users to enter special characters as a way of preemptive form validation and this seemed to work the best. Since there wasn"t much I could change, I am siting this source directly
        // What changed: I changed the variable names, added space, and added backspace
        var key = e.which;
        // Initialize allowed input using Ascii values
        var input = key >= 65 && key <= 90 || // A-Z
            key >= 97 && key <= 122 || // a-z
            key >= 48 && key <= 57 || // 0-9
            key == 32 || // space
            key == 08; // space
        if (!input) { // user attempts to enter any character outside of the defined values
            e.preventDefault(); // do not render those characters
        }
    });
    
    // When user clicks the addButton, run the addFood function
    addButton.click(addFood);
    
    // List of functions...
    
    // Dynamically add a checkbox and label for each food added by the user
    function addCheckbox(output) {
        var listDiv = $("#list");
        var checkboxDiv = $("<div />", { "class": "checkbox" });
        checkboxDiv.appendTo(listDiv);
        var newCheckbox = $("<input />", { type: "checkbox", "class": "listItem", value: output });
        newCheckbox.appendTo(checkboxDiv);
        var label = $("<label />", { "for": "listItem", "class": "listLabel", value: output, text: output }).appendTo(checkboxDiv);
        
        // For all checkboxes, apply the makeBig plug-in
        $("input:checkbox").makeBig();
        
        // Apply toggleDel function to dynamically added checkboxes
        newCheckbox.change(function() {
            toggleDel();
        });
        
        // Apply checkBox function to any clicked labels that were added dynamically
        label.click(function() {
           checkBox(this.innerHTML); 
        });
    }
    
    // Addfood function is applied to click event for addButton
    function addFood() {
        // Code source: http://stackoverflow.com/questions/29553375/js-capitalize-first-letter-of-every-word-entered-into-input
        // Why used: I researched ways to make all first letters of each word of user input and found that this one worked best
        // What changed: I changed the variable names and the html attribute values. I also added the trim function to trim user input.
        var foodName = document.getElementById("foodName").value;
        foodName = document.getElementById("foodName").value.replace(/\b[a-z]/g, function(w) { return w.toUpperCase(w); }).trim();
        
        // In case errors are already showing, do not show them any longer once addButton is clicked
        $("#error").css("display", "none");
        $("#inList").css("display", "none");
        
        // Check to see if the food the user entered is already in the user"s grocery list
        for (var i = 0; i < foodArray.length; i++) { // iterate over foodArray
            if (foodArray[i].name == foodName) { // if match is found
                $("#inList").css("display", "inline"); // show error
                $("#foodName").val(""); // clear user input
                $(addButton).prop("disabled", true); // disable addButton
                return;
            }
        }
        
        // Varify that the user"s input is neither null nor empty/filled with only whitespace
        if ((foodName !== null) && (foodName.replace(/\s/g, "").length)) {
            
            // make and send an XmlHttpRequest
            var x = new XMLHttpRequest();
            
            // Open XML/HTTP Request to the Nutritionix API
            // API Source: https://developer.nutritionix.com/
            x.open("GET", "https://api.nutritionix.com/v1_1/search/"+foodName+"?results=0%3A01&cal_min=0&cal_max=50000&fields=brand_name%2Citem_name%2Cbrand_id%2Citem_id%2Cnf_calories%2Cnf_calories_from_fat%2Cnf_total_fat%2Cnf_serving_size_qty%2Cnf_serving_size_unit&appId=292ceba0&appKey=7e655ebb06666510ffa38ccc8b95f9e0",true);
            x.send(); // send request to API

            // set up a listener for the response
            x.onreadystatechange=function() {
                if (this.readyState==4) { // verify ready state is 4
                    // parse the JSON response from the API
                    var response = JSON.parse(this.response);
                    
                    // verify the response status is 200 (OK) and that the API found match to user input
                    if (this.status==200 && response.total_hits > 0) {
                        
                        // do not display error
                        $("#error").css("display", "none");
                        
                        // get all the values for each field from the API response
                        var o = response.hits[0].fields;
                        
                        // render output to the screen for user to see nutritional information about the food they"ve added
                        $("#nutritionInfo").css("display", "inline-block");
                        document.getElementById("foodOutput").innerHTML = foodName;
                        document.getElementById("cal").innerHTML = ("Total Calories: " + o.nf_calories + " calories");
                        document.getElementById("fatCal").innerHTML = ("Calories from Fat: " + o.nf_calories_from_fat + " calories");
                        document.getElementById("fat").innerHTML = ("Total Fat: " + o.nf_total_fat + " grams");
                        document.getElementById("serving").innerHTML = ("Serving Size: " + o.nf_serving_size_qty + " " + o.nf_serving_size_unit);
                     
                        
                        var foodObj = new Food(foodName); // create new food object containing new food name                        
                        foodArray.push(foodObj); // add food object to array
                        addToLocalStorage("foodList", foodArray); // add updated food array to local storage
                        addCheckbox(foodName); // add checkbox with new food to page
                        
                        $("#foodName").val(""); // Clear user input
                        $(addButton).prop("disabled", true); // disable addButton
                    }
                    
                    // If the response status is not 200 (OK) or the API did not find a match to user input
                    else {
                        
                        $("#error").css("display", "inline"); // display error
                        $("#foodName").val(""); // clear user input
                        $(addButton).prop("disabled", true); // disable addButton
                    }
                }
            };
        }
        // If the user"s input is null or empty/filled with only whitespace
        else {
            $("#error").css("display", "inline"); // display error to user
            $("#foodName").val(""); // clear user input
            $(addButton).prop("disabled", true); // disable addButton
        }
    }
    
    // When select all box is checked, then select all the other boxes
    // Code source: http://stackoverflow.com/questions/18537609/jquery-checkbox-check-all
    // Why used: I researched ways to make a select all box actually select all the other boxes and found that this one worked best
    // What changed: I changed the html id object this is being called on and added the toggleDel() function call.
    $("#selectAll").change(function () {
        $("input:checkbox").not(this).prop("checked", this.checked);
        toggleDel(); // call toggle delete function
    });
    
    // When select all label is clicked, check the select all box and then check all the other boxes
    $("#selectLabel").click(function () {
        var selectAll = document.getElementById("selectAll");
        $("#selectAll").prop("checked", !selectAll.checked);
        $("input:checkbox").not($("#selectAll")).prop("checked", selectAll.checked);
        toggleDel(); // call toggle delete function
    });

    // Function for creating food
    function Food (name) {
        this.name = name;
    }
    
    // When delete button is clicked, call deleteFood function
    var delButton = $("#deleteFood");
    delButton.click(deleteFood);
    
    // deleteFood function is applied to click event for delButton
    function deleteFood() {
        // for each checkbox
        $("input:checkbox").each(function() {
            if (this.checked) { // if checked
                var foodArray = getFromLocalStorage("foodList"); // get foodList from local storage
                for (var i = 0; i < foodArray.length; i++) { // for each item in the array
                    if (foodArray[i].name === this.value) { // if the name of the food foodArray is the same as that of the checked box
                        foodArray.splice(i, 1); // delete that item from foodArray
                    }
                }
                // overwrite existing list in local storage
                addToLocalStorage("foodList", foodArray);
            }
        });
        // reload the page to reflect omission deleted items
        location.reload();
    }
    
    // Function to enable and disable the delete button based on whether or not any checkboxes are checked
    function toggleDel() {
        $("#deleteFood").attr("disabled", !($("input:checkbox").is(":checked")));
    }
    
    // function to overwrite array in local storage
    function addToLocalStorage(key, value) {
        var arrayString = JSON.stringify(value);
        window.localStorage.setItem(key, arrayString);
    }
    
    // function to get array from local storage
    function getFromLocalStorage(key) {
        var dataString = localStorage.getItem(key);
        return JSON.parse(dataString);
    }
    
    // checkBox function is applied to click event for any checkbox label
    function checkBox(v) {
        var listItems = document.getElementsByClassName("listItem"); // get each check box
        for (var i = 0; i < listItems.length; i++) { // for each checkbox
            if (v == listItems[i].value) { // if the the value of "this" is the same as the value of the listItem
                $(listItems[i]).prop("checked", !listItems[i].checked); // check the checkbox for "this" if it"s not already checked
                toggleDel(); // call toggle delete function
            }
        }
    }
    
});