//Handles the multi-step form for referral form, 0 = first
var currentTab = 0;
var formID = document.getElementById("formID").innerText;
var btnClick0 = false;
var btnClick1 = false;
var btnClick2 = false;
var btnClick3 = false;

//this
if(formID != 'mainMenu' || formID != 'searchForm' || formID != 'searchResult') {
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
            case 'patientsDatabase': {
                document.getElementById("nextBtn").setAttribute("onclick", "appendForm('patientsDatabase')");
                break;
            }
            case 'generatePatientsDatabaseReport': {
                document.getElementById("nextBtn").value = "Edit";
                document.getElementById("nextBtn").setAttribute("onclick", "editRecord('Patients', toArray())");
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
            case "patientsListReturnEquipment": {
                document.getElementById("nextBtn").value = "Edit";
                document.getElementById("nextBtn").setAttribute("onclick", "editRecord('Borrowers Record', toArray())");
                break;
            }
            case 'patientsHomeVisitRecord': {
                if (toArray().length >= 1) {
                    document.getElementById("nextBtn").value = "Edit";
                    document.getElementById("nextBtn").setAttribute("onclick", "editRecord('Visits', toArray())");
                } else {
                    document.getElementById("nextBtn").value = "Submit";
                    document.getElementById("nextBtn").setAttribute("onclick", "appendForm('patientsHomeVisitRecord')");
                }
                
                break;
            }
            case 'equipmentRecord':{
                document.getElementById("nextBtn").value = "Edit";
                document.getElementById("nextBtn").setAttribute("onclick", "editRecord('Equipment Register', toArray())");
                break;
            }
            case 'addBorrower':{
                document.getElementById("nextBtn").value = "Submit";
                document.getElementById("nextBtn").setAttribute("onclick", "appendForm('addBorrower')");
                break;
            }
            case 'equipmentBorrowers':{
                document.getElementById("nextBtn").value = "Edit";
                document.getElementById("nextBtn").setAttribute("onclick", "editRecord('Borrowers Record', toArray())");
                break;
            }
        }
        
    } else if (formID == 'medicalAssessmentRecord' || formID == 'patientContinuationRecord') {
        document.getElementById("nextBtn").value = "Next";
        document.getElementById("nextBtn").setAttribute("onclick", "nextPrev(1); continuationID = dataEdit[parseInt(toArray()[0])][1];");
    }
    else {
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

function changeLink(id, picNo, continuationID) {
    var patientID = document.getElementsByName(id)[0].value;

    var slashLocation = patientID.indexOf("/");

    if(slashLocation == -1 && (btnClick1 == true || btnClick2 == true || btnClick3 == true)) {
        alert("Invalid KHC No.");
        return;
    }
    else if (btnClick1 == true || btnClick2 == true || btnClick3 == true) {
        var newPatientID = patientID.substring(0, slashLocation) + "%2F" + patientID.substring(slashLocation + 1, patientID.length);
    }
    else {
        return;
    }

    var link = "https://hospice-e4abb.web.app/#/home?id=" + newPatientID + "&img=" + picNo + "&form=" + continuationID;
    return link;
}

function changeLinkGenogram(id, continuationID) {
    var patientID = document.getElementsByName(id)[0].value;

    var slashLocation = patientID.indexOf("/");

    if(slashLocation == -1 && (btnClick0 == true)) {
        alert("Invalid KHC No.");
        return;
    }
    else if (btnClick0 == true) {
        var newPatientID = patientID.substring(0, slashLocation) + "%2F" + patientID.substring(slashLocation + 1, patientID.length);
    }
    else {
        return;
    }

    var link = "https://hospice-family-tree.firebaseapp.com/#/home?id=" + newPatientID + "&form=" + continuationID;
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

function hideLoadIcon() {
    var spinner = document.getElementsByClassName('loadingSpinner')[0];

    if(spinner) {
        spinner.setAttribute('style', 'display: none;');
    }
    else {
        return;
    }
}

function changeDateInLink() {
    var links = document.getElementsByClassName('changeDate');
    var year = document.getElementById('dataYear').value;
    var month = document.getElementById('dataMonth').value;

    for (var index = 0; index < links.length; index++) {
        var string = links[index].href;
        var newString = string.replace(/[\d]{4}\/[\d]{1,2}/, `${year}/${month}`);
        links[index].setAttribute('href', newString);
    }
}

function changeYearMonthInLink() {
    var links = document.getElementsByClassName('changeDate');
    var year = document.getElementById('dataYear').value;
    var month = document.getElementById('dataMonth').value;

    for (var index = 0; index < links.length; index++) {
        var string = links[index].href;
        var newString = string.replace(/value=[\d]{4}/, `value=${year}`);
        string = newString;
        var newString2 = string.replace(/value2=[\d]{1,2}/, `value2=${month}`);
        links[index].setAttribute('href', newString2);
    }
}

function changeEquipmentCodeInLink() {
    var links = document.getElementsByClassName('changeItemCode');
    var itemCode = document.getElementById('equipmentList').value;

    for (var index = 0; index < links.length; index++) {
        var string = links[index].href;
        var newString = string.replace(/value=[\D]{2}/, `value=${itemCode}`);
        string = newString;
        console.log(newString);
        links[index].setAttribute('href', newString);
    }
}

function changeItemCodeInLink() {
    var links = document.getElementsByClassName('changeItemCode');
    var itemCode = document.getElementById('itemCodeSelect').value;

    for (var index = 0; index < links.length; index++) {
        var string = links[index].href;
        var newString = string.replace(/value=[\w]{5,6}/, `value=${itemCode}`);
        string = newString;
        links[index].setAttribute('href', newString);
    }
}

function changeSearchLink() { 
    var links = document.getElementsByClassName('changeLink');
    var radioBoxes = document.getElementsByName('searchBy');
    var choice;
    var input = document.getElementById('searchFieldInput').value;

    for (const i in radioBoxes) {
        if (radioBoxes[i].checked) {
            choice = radioBoxes[i].value;
            break;
        }
    }

    for (var i = 0; i < links.length; i++) {
        var string = links[i].href;
        var newString = string.replace(/searchField=[\w]{0,}&/, `searchField=${choice}&`);
        var newString2 = newString.replace(/value=[\w]{0,}&/, `value=${input}&`)
        string = newString2;
        links[i].setAttribute('href', newString2);
    }

}

function changeItemCodeInButton() {
    var links = document.getElementsByClassName('changeItemCode');
    var itemCode = document.getElementById('itemCodeSelect').value;

    for (var index = 0; index < links.length; index++) {
        var string = links[index].getAttribute('onclick');
        var newString = string.replace(/'value': '[\w]{0,}',/, `'value': '${itemCode}',`);
        string = newString;
        links[index].setAttribute('onclick', newString);
    }
}