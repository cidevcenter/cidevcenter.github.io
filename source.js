//Handles the multi-step form for referral form, 0 = first
var currentTab = 0;
var formID = document.getElementById("formID").innerText;

//this
if(formID != 'mainMenu') {
    showTab(currentTab);
}

function showTab(n) {
    var x = document.getElementsByClassName("tab");
    x[n].style.display = "block";
    // ... and fix the Previous/Next buttons:
    if (n == 0) {
        document.getElementById("prevBtn").style.display = "none";
    } else {
        document.getElementById("prevBtn").style.display = "inline";
    }
    if (n == (x.length - 1)) {
        document.getElementById("nextBtn").value = "Submit";

        switch(formID){
            case 'referralForm': {
                document.getElementById("nextBtn").setAttribute("onclick", "appendForm('referralForm')");
                break;
            }
            case 'medicalAssessmentForm': {
                document.getElementById("nextBtn").setAttribute("onclick", "appendForm('medicalAssessmentForm')");
                break;
            }
            case 'patientContinuationSheet': {
                document.getElementById("nextBtn").setAttribute("onclick", "appendForm('patientContinuationSheet')");
                break;
            }
            case 'referralRecord': {
                document.getElementById("nextBtn").value = "Edit";
                document.getElementById("nextBtn").setAttribute("onclick", "editRecord('Referral Form', toArray())");
                break;
            }
            case 'medicalAssessmentRecord': {
                document.getElementById("nextBtn").value = "Edit";
                document.getElementById("nextBtn").setAttribute("onclick", "editRecord('Medical & Nursing Assessment', toArray())");
                break;
            }
            case 'patientContinuationRecord': {
                document.getElementById("nextBtn").value = "Edit";
                document.getElementById("nextBtn").setAttribute("onclick", "editRecord('Patient Continuation Sheet', toArray())");
                break;
            }
        }
        
    } else {
        document.getElementById("nextBtn").value = "Next";
        document.getElementById("nextBtn").setAttribute("onclick", "nextPrev(1)");
    }
    // ... and run a function that displays the correct step indicator:
    fixStepIndicator(n);
};

function nextPrev(n) {
    // This function will figure out which tab to display
    var x = document.getElementsByClassName("tab");
    console.log(x);

    var pre = document.getElementById('content');
    pre.innerText = "";
    // Hide the current tab:
    x[currentTab].style.display = "none";
    // Increase or decrease the current tab by 1:
    currentTab = currentTab + n;
    console.log(currentTab);
    // if you have reached the end of the form... :
    if (currentTab >= x.length) {
        //...the form gets submitted:
        x[currentTab - 1].style.display = "block";
        currentTab = currentTab - 1;
        console.log("Submit");
        //document.getElementById("form").submit();
        return false;
    }
    // Otherwise, display the correct tab:
    showTab(currentTab);
}

function validateForm() {
    // This function deals with validation of the form fields
    var x, y, i, valid = true;
    x = document.getElementsByClassName("tab");
    y = x[currentTab].getElementsByTagName("input");
    // A loop that checks every input field in the current tab:
    for (i = 0; i < y.length; i++) {
        // If a field is empty...
        if (y[i].value == "") {
            // add an "invalid" class to the field:
            y[i].className += " invalid";
            // and set the current valid status to false:
            valid = false;
        }
    }
    // If the valid status is true, mark the step as finished and valid:
    if (valid) {
        document.getElementsByClassName("step")[currentTab].className += " finish";
    }
    return valid; // return the valid status
}

function fixStepIndicator(n) {
    // This function removes the "active" class of all steps...
    var i, x = document.getElementsByClassName("step");
    for (i = 0; i < x.length; i++) {
        x[i].className = x[i].className.replace(" active", "");
    }
    //... and adds the "active" class to the current step:
    x[n].className += " active";
}

//Hides and show an element
function showStuff(checkbox, id) {
    if($("#" + checkbox).is(":checked")) {
        document.getElementById(id).style.display = "block";
    }
    else {
        document.getElementById(id).style.display = "none";
    }
}

function showStuffTable(checkbox, id) {
    var array = toArray();
    //selectedList = array;

    if($("#" + checkbox).is(":checked")) {
        console.log(array.length);
        if(array.length > 0) {
            document.getElementById(id).style.display = "inline";
        }
        else {
            document.getElementById(id).style.display = "none";
        }
    }
    else {
        if(array.length > 0) {
            document.getElementById(id).style.display = "inline";
        }
        else {
            document.getElementById(id).style.display = "none";
        }
    }
}

function showPopUp(popUpId, buttonId, index) {
    var modal = document.getElementById(popUpId);

    var btn = document.getElementById(buttonId);

    var span = document.getElementsByClassName("close")[index];

    modal.style.display = "block";
    
    span.onclick = function() {
        modal.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
}

function changeLink(id, picNo) {
    var patientID = document.getElementsByName(id)[0].value;

    var slashLocation = patientID.indexOf("/");

    if(slashLocation == -1) {
        alert("Invalid KHC No.");
        return;
    }
    else {
        var newPatientID = patientID.substring(0, slashLocation) + "%2F" + patientID.substring(slashLocation + 1, patientID.length);
    }

    var link = "https://hospice-e4abb.web.app/#/home?id=" + newPatientID + "&img=" + picNo;
    return link;
}

function showRow() {
    document.getElementById("rowCount").innerText = "";
    for(var i = 0; i < document.getElementsByName("row").length; i++){
        var index = selectedList.indexOf(document.getElementsByName("row")[i].value);
        if(document.getElementsByName("row")[i].checked == true) {
            selectedList.push(document.getElementsByName("row")[i].value);
            var textNode = document.createTextNode(document.getElementsByName("row")[i].value + '\n');
            document.getElementById('rowCount').appendChild(textNode);
        } else if(document.getElementsByName("row")[i].checked == false && index > -1) {
            selectedList.splice(index, 1);
        }
    }

    selectedList = toArray();
    
}

//converts to set then converts back to array
function normalizeArray(array) {
    var set = new Set(array);

    var tempArr = [...set];

    return tempArr;
}

//For use with deleteRecord and editRecords, returns array of chosen records
function toArray() {
    var array = new Array();
    var number = "";

    for(var i = 0; i < document.getElementById('rowCount').innerText.length; i++) {
        if(document.getElementById('rowCount').innerText[i] != '\n') {
            number += document.getElementById('rowCount').innerText[i];
        }
        else {
            array.push(parseInt(number));
            number = "";
        }
    }

    return normalizeArray(selectedList);
}

//Makes it so the required inputs only show styles after user has clicked it
$(':required').on('blur keydown', function() {
    $(this).addClass('touched');
});

function showScrollButtons() {
    var btn = document.getElementById('scrollButtons');
    var toggle = document.getElementById('scrollButtonToggle');

    if (btn.className == "scrollButtonHide" || btn.className == "") {
        btn.className = "";
        toggle.className = "";
        btn.setAttribute('style', 'opacity: 0%; right: -40%');
        toggle.setAttribute('style', 'right: 0%;');
        toggle.innerHTML = "<i class='material-icons'>keyboard_arrow_right</i>";
        setTimeout(function() {
            btn.className = "scrollButtonShow";
            toggle.className = "scrollButtonToggleShow";
        }, 10);
    } else if (btn.className == "scrollButtonShow") {
        btn.className = "";
        toggle.className = "";
        btn.setAttribute('style', 'opacity: 100%; right: 4%');
        toggle.setAttribute('style', 'right: calc(4% + 56px + 30px);');
        toggle.innerHTML = "<i class='material-icons'>keyboard_arrow_left</i>";
        setTimeout(function() {
            btn.className = "scrollButtonHide";
            toggle.className = "scrollButtonToggleHide";
        }, 10);
    }
}