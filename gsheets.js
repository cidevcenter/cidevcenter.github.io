// Client ID and API key from the Developer Console
var CLIENT_ID = '932651169905-s46uqrcjcb4ttq2jl18m9vcgtim1ller.apps.googleusercontent.com';
var API_KEY = 'AIzaSyCHseUgij1b5PJ6XpVGRHFKHy8y8NA7HpE';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4", "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/drive";

var authorizeButton = document.getElementById('authorize_button');
var signoutButton = document.getElementById('signout_button');
var spreadsheetId = '1wEa0JVm0NQMPePxh8DLBgaUV1hVz4RMM6q0GaWRu05Q';
var folderID = '1KLZ6NzFh60oYAtY8dImWTkzaWVyyuygH';
var fileDetail;
var linkGenogram = '', linkLung = '', linkLowerBody = '', linkFullBody = '';

var table = document.querySelector("table");
var header;
var headerGenerated = false;
var tableDelete = false;
var khcno;
var name;

var indexNo = [];
var data = [];
var dataEdit = [];

var rangeForm;

var elementN;
var pageIndex = 0;
var pageElementN = 100;
var maxPageCount;
var count = 0;
var selectedList = [];

var deleted = false;
var submitted = false;
var edited = false;

var continuationID;

function handleClientLoad() {
    gapi.load('client:auth2', initClient);
    
}

function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(function () {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        authorizeButton.onclick = handleAuthClick;
        signoutButton.onclick = handleSignoutClick;
    }, function (error) {
        appendPre(JSON.stringify(error, null, 2));
    });
}

function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        if (document.getElementById("formID").innerText == 'mainMenu') {
            document.getElementById('warning').style.display = 'none';
            document.getElementById('links').style.display = 'block';
        }
        authorizeButton.style.display = 'none'; //none
        signoutButton.style.display = 'block';
    } else {
        if (document.getElementById("formID").innerText == 'mainMenu') {
            document.getElementById('warning').style.display = 'block';
            document.getElementById('links').style.display = 'none';
        }
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none'; //none
    }
}

function handleAuthClick(event) {
    gapi.auth2.getAuthInstance().signIn();
}

function handleSignoutClick(event) {
    gapi.auth2.getAuthInstance().signOut();
}

function checkSheetLoaded() {
    if (gapi.client.sheets) {
        console.log("Found.\n");
        return true;
    } else {
        console.log("Looping..\n");
        return false;
    }
}

function appendPre(message) {
    var pre = document.getElementById('content');
    var textContent = document.createTextNode(message + '\n');
    pre.setAttribute('style', 'white-space: pre-wrap;');
    pre.innerText = "";
    pre.appendChild(textContent);
}

function sendStuff(fileID, buttonID) {
    var fileContent = document.getElementById(fileID).files[0];
    var fileName = fileContent.name;
    fileName = fileName.slice(0, -4); // Removes the '.png' at the end of the file name.
    var file = new Blob([fileContent], {
        type: 'image/png'
    });
    var metadata = {
        'name': fileName, // Filename at Google Drive
        'mimeType': 'image/png', // mimeType at Google Drive
        'parents': [folderID], // Folder ID at Google Drive
    };

    var accessToken = gapi.auth.getToken().access_token; // Here gapi is used for retrieving the access token.
    var form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], {
        type: 'application/json'
    }));
    form.append('file', file);
    console.log(form);

    fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
        method: 'POST',
        headers: new Headers({
            'Authorization': 'Bearer ' + accessToken
        }),
        body: form,
    }).then((res) => {
        fileDetail = res.json();
        console.log(fileDetail);
        fileDetail.then(function (res) {
            var id = res.id;

            if(!id) {
                alert("Error " + err.error.errors.code + " " + err.error.errors.message);
                return;
            } else {
                var link = "https://drive.google.com/uc?export=view&id=" +  id;
                alert("Image uploaded.");
                console.log("Image uploaded. Check https://drive.google.com/drive/u/0/folders/1KLZ6NzFh60oYAtY8dImWTkzaWVyyuygH");
                console.log(link);

                switch (buttonID) {
                    case 'genoImage': {
                        linkGenogram = link;
                        break;
                    }
                    case 'lungBtn': {
                        linkLung = link;
                        break;
                    }
                    case 'lowerBodyBtn': {
                        linkLowerBody = link;
                        break;
                    }
                    case 'fullBodyBtn': {
                        linkFullBody = link;
                        break;
                    }
                }
            }

            
        }, function(err) {
            alert("Error " + err.error.errors.code + " " + err.error.errors.message);
        })
    }, function (val) {
        console.log(val);
    });
}

function listStuff() {
    var name = document.getElementById('fileName').value;

    var string = "name contains '" + name + "'";

    gapi.client.drive.files.list(
        {
            'q': string
        }
    ).then(function(res) {
        console.log(res);
    }, function(err) {
        console.log(err);
    })
}

function deleteStuff(formID, array) {
    var spinner = document.getElementById('loadingSpinnerBottom');

    for(var i = 0; i < array.length; i++){        
        var khcNo = dataEdit[array[i]][1];

        if (khcNo == '' || khcNo == undefined || !(/\S/.test(khcNo)) || khcNo.includes(' ')) {
            console.log("Breaking to prevent accidental deletion of all Drive files...");
            spinner.setAttribute('style', 'display: none;');
            return;
        }
        
        var string = "name contains '" + khcNo + "' and mimeType = 'application/vnd.google-apps.folder'";

        console.log(string);

        gapi.client.drive.files.list(
            {
                'q': string
            }
        ).then(function(res) {
            console.log("Files found" + "\nID: " + res.result.files[0].id + "\nName: " + res.result.files[0].name + "\nMime Type: " + res.result.files[0].mimeType + "\n");
            if(res.result.files.length < 1) {
                console.log("Cannot find files. Breaking..");
                spinner.setAttribute('style', 'display: none;');
            } 
            else {
                for(var j = 0; j < res.result.files.length; j++) {
                    gapi.client.drive.files.update({
                        'fileId': res.result.files[j].id,
                        'trashed': true
                    }).then(function(res) {
                        console.log("Files trashed: " + "\nID: " + res.result.id + "\nName: " + res.result.name + "\nMime Type: " + res.result.mimeType + "\n");
                    }, function(err) {
                        console.log(err);
                    })
                }
            }
            
        }, function(err) {
            console.log(err);
        })
    }
}

//Searches the sheet for the record
function searchSheet(range) {
    data = [];
    indexNo = [];
    var formID = document.getElementById("formID").innerText;
    if (formID != 'searchForm' && formID != 'patientContinuationSheet' && formID != 'medicalAssessmentForm') {
        document.getElementById('pageText').innerText = '';
    }

    //Obtains the search field values
    if(formID == 'searchForm' || formID == 'medicalAssessmentRecord' || formID == 'referralRecord' || formID == 'patientContinuationRecord'){
        var input = document.getElementById("patientNameSearch").value;
    }
    else if(formID == 'patientContinuationSheet' || formID == 'medicalAssessmentForm') {
        var input = '';
    }
    else{
        var input = document.getElementById("patientNameSearch").innerText;
    }

    removeTable();
    var spinner = document.getElementsByClassName('loadingSpinner')[0];

    if(spinner){
        spinner.setAttribute('style', 'display: block;');
    }

    var element = document.getElementById("prevBtnTable");
    if (element !== null) {
         element.parentNode.removeChild(element);
    }
    var element2 = document.getElementById("nextBtnTable");
    if (element2 !== null) {
        element2.parentNode.removeChild(element2);
    }

    //Checks if user is authorized first before doing anything
    if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
        console.log(gapi.client.sheets);
        console.log(gapi.auth2.getAuthInstance().isSignedIn.get());
        alert("Please authorize before searching record(s).");
        document.getElementsByClassName('loadingSpinner')[0].setAttribute('style', 'display: none;');
        return;
    } else {
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: range,
        }).then(function (response) {
            headerGenerated = false;
            var range = response.result;
            var count = 0;
            header = range.values[0];

            elementN = range.values.length;
            
            if (elementN > 0) {
                data = [];
                dataEdit = [];
                //i = 1 because we skip the header
                for (i = 1; i < elementN; i++) {
                    var row = range.values[i];
                    //Shows all records
                    if ((formID == 'medicalAssessmentRecord' || formID == 'referralRecord' || formID == 'patientContinuationRecord' || formID == 'patientContinuationSheet' || formID == 'medicalAssessmentForm') && input === "") {
                        data.push(row);
                        dataEdit.push(row);
                        maxPageCount = Math.ceil(elementN / pageElementN) - 1;
                        //generateTable(table, row, i);
                        count++;
                        indexNo.push(parseInt(i-1));
                    }
                    // Searches against which row, we control how we want user to search here
                    else if (input === row[2] || (input === row[3] && formID == 'referralRecord') || (input === row[3] && formID == 'medicalAssessmentRecord') || ((input === row[127] || input === row[3]) && formID == 'patientContinuationRecord')) {
                        khcno = row[2];
                        name = row[3];
                        //Show searched records
                        if (formID == 'extraNotesForm' || formID == 'medicationForm' || formID == 'medicationEquipmentForm' || formID == 'homeVisitForm' ||
                            formID == 'endOfLifeForm' || formID == 'referralRecord' || formID == 'medicalAssessmentRecord' || formID == 'patientContinuationRecord') {
                            data.push(row);
                            dataEdit.push(row);
                            indexNo.push(parseInt(i-1));
                            //generateTable(table, row, i);
                        }
                        count++;
                        pageIndex = 0;
                        maxPageCount = Math.ceil(count / pageElementN) - 1;
                    }
                    else {
                        dataEdit.push([]);
                    }
                    
                }
                if (count > 0) {
                    //alert("We have found " + count + " record(s).");
                    if (formID == 'searchForm') {
                        window.location.href = 'searchResult.html?khcno=' + khcno + "&name=" + name;
                    }

                    if (formID != 'patientContinuationSheet' && formID != 'medicalAssessmentForm') {
                        showTable(pageIndex, pageElementN, maxPageCount, header, data);
                    }

                    if (formID == 'patientContinuationSheet') {
                        continuationID = "patientContForm" + parseInt(parseInt(data[data.length-1][1].substring(15)) + 1);
                    } else if (formID == 'medicalAssessmentForm') {
                        continuationID = "medAssessForm" + parseInt(parseInt(data[data.length-1][1].substring(13)) + 1);
                    }
                    
                    
                }
                else {
                    alert('No record(s) found.');

                    if (formID == 'searchForm') {
                        document.getElementById("extraNotes").setAttribute("href", "extraNotes.html");
                        document.getElementById("medicationForm").setAttribute("href", "medicationForm.html");
                        document.getElementById("medicationEquipmentForm").setAttribute("href", "medicationEquipmentForm.html");
                        document.getElementById("homeVisitForm").setAttribute("href", "homeVisitForm.html");
                        document.getElementById("endOfLifeForm").setAttribute("href", "endOfLifeForm.html");
                        document.getElementById("links").setAttribute("style", "display: none");
                    }

                    if (formID == 'patientContinuationSheet') {
                        continuationID = "patientContForm1";
                    } else if (formID == 'medicalAssessmentForm') {
                        continuationID = "medAssessForm1";
                    }
                }
                document.getElementsByClassName('loadingSpinner')[0].setAttribute('style', 'display: none;');
            } else {
                alert('Not initialized.');
            }
        }, function (response) {
            alert('Error: ' + response.result.error.message);
        });
    }
}

function showTable(currentPageIndex, pageElementN, maxPageCount, header, data) {
    var prevValid = false;
    var nextValid = false;

    count = currentPageIndex * pageElementN;

    if (!headerGenerated) {
        generateTableHead(table, header);
        
        headerGenerated = true;
    }
    for (var i = (currentPageIndex) * pageElementN; i < (currentPageIndex + 1) * pageElementN; i++) {
        if(data[i] && data[i].length != 0) {
            generateTable(table, data[i], indexNo[count]);
            count++;
        }
        else if (i < data.length) {

        }
        else {
            break;
        }
    }

    document.getElementById('pageText').innerHTML = "";
    document.getElementById('pageText').innerHTML = "<p>Page " + parseInt(currentPageIndex + 1) + " of " + parseInt(maxPageCount + 1) + " pages</p>";
    
    if (currentPageIndex == 0 && maxPageCount > 0) {
        prevValid = false;
        nextValid = true;
        var element = document.getElementById("prevBtnTable");
        if (element !== null) {
            element.parentNode.removeChild(element);
        }
    }
    else if (currentPageIndex < maxPageCount && maxPageCount > 0) {
        prevValid = true;
        nextValid = true;
    }
    else if (currentPageIndex == maxPageCount && maxPageCount > 0) {
        prevValid = true;
        nextValid = false;
        var element = document.getElementById("nextBtnTable");
        if (element !== null) {
            element.parentNode.removeChild(element);
        }
    }
    else if (currentPageIndex == 0 && maxPageCount == 0) {
        prevValid = false;
        nextValid = false;
        var element = document.getElementById("prevBtnTable");
        if (element !== null) {
            element.parentNode.removeChild(element);
        }
        var element2 = document.getElementById("nextBtnTable");
        if (element2 !== null) {
            element2.parentNode.removeChild(element2);
        }
    }

    if(prevValid && document.getElementById('prevBtnTable') === null) {
        var btn = document.createElement("button");
        btn.innerHTML = "<i class='material-icons'>keyboard_arrow_left</i>";
        btn.setAttribute("id", "prevBtnTable");
        btn.setAttribute("onclick", "removeTable(); pageIndex--; document.getElementById('rowCount').innerText = ''; showTable(pageIndex, pageElementN, maxPageCount, header, data);")
        document.getElementById("buttonsTable").appendChild(btn);
    }
    
    if(nextValid && document.getElementById('nextBtnTable') === null) {
        var btn = document.createElement("button");
        btn.innerHTML = "<i class='material-icons'>keyboard_arrow_right</i>";
        btn.setAttribute("id", "nextBtnTable");
        btn.setAttribute("onclick", "removeTable(); pageIndex++; document.getElementById('rowCount').innerText = ''; showTable(pageIndex, pageElementN, maxPageCount, header, data);")
        document.getElementById("buttonsTable").appendChild(btn);
    }

    var array = toArray();

    for (var i = 0; i < array.length; i++) {
        if(array[i] === undefined || isNaN(array[i])) {
            break;
        }
        else {
            if(array[i] < ((pageIndex + 1) * pageElementN) && array[i] >= (pageIndex * pageElementN)) {
                var id = 'checkbox' + array[i];

                document.getElementById(id).checked = true;
            }
        }
    }
    
    //Debugging
    console.log("page index = " + pageIndex);
    console.log("max page count = " + maxPageCount);
}

//Removes the generated tables
function removeTable() {
    if ($("thead").length) {
        $("thead").remove();
    }

    if ($("tbody").length) {
        $("tbody").remove();
    }

    headerGenerated = false;
}

//Generates header bar for the table
function generateTableHead(table, header) {
    var thead = table.createTHead();
    var trow = thead.insertRow();

    //Header
    for (var key in header) {
        var th = document.createElement("th");
        if (key == 0) {
            var text = document.createTextNode(" ");
        } else {
            var text = document.createTextNode(header[key]);
        }
        th.appendChild(text);
        trow.appendChild(th);
    }
}

//Generates table rows
function generateTable(table, data, count) {
    var formID = document.getElementById("formID").innerText;
    var row = table.insertRow();
    var link = "https://hospice-e4abb.web.app"
    for (var i = 0; i < data.length; i++) {
        var cell = row.insertCell();
        var text = document.createTextNode(data[i]);
        cell.appendChild(text);

        //Shows checkbox in the first column
        if(i == 0) {
            var id = 'checkbox' + count;

            if (formID == 'extraNotesForm' || formID == 'medicationForm' || formID == 'medicationEquipmentForm' || formID == 'homeVisitForm' ||
                formID == 'endOfLifeForm') {
                var string2 = "showStuffTable(\'" + id + "\',\'" + 'edit' + "\');showStuffTable(\'" + id + "\',\'" + 'delete' + "\')";
            } else {
                var string2 = "showStuffTable(\'" + id + "\',\'" + 'buttons' + "\')";
            }
            /*<label class="container" style="width: 25px;height: 10px;"><input type="checkbox" name="row" id="checkbox1" value="1" onclick="showRow();showStuff('checkbox1','buttons')">
                        <span class="checkBox"></span>
            </label>*/
            var string = "<label class='container' style='width: 25px; height: 10px; padding-right: 0;'><input type='checkbox' name='row' id='" + id + "' value = " + count + " onclick=showRow();" + string2 + "><span class='checkBox'></span></input></label>";
            cell.innerHTML = string;
        } 

        //Shows links as actual link
        if (data[i].includes(link)) {
            var string = "<a href='" + data[i] + "' target='_blank'>" + data[i] + "</a>";
            cell.innerHTML = string;
        }
    }
}

function generateTime() {
    var date = new Date();
    var day = date.getDay();

    switch (day) {
        case 0: {
            day = "Sunday";
            break;
        }
        case 1: {
            day = "Monday";
            break;
        }
        case 2: {
            day = "Tuesday";
            break;
        }
        case 3: {
            day = "Wednesday";
            break;
        }
        case 4: {
            day = "Thursday";
            break;
        }
        case 5: {
            day = "Friday";
            break;
        }
        case 6: {
            day = "Saturday";
            break;
        }

    }

    //DD/MM/YYYY DAY HH:MM:SS
    return (date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear() + " " + day + " " + (date.getHours() < 10 ? '0' : '') + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes() + ":" + (date.getSeconds() < 10 ? '0' : '') + date.getSeconds());
}

//Appends the input to google sheets once user press submit
function appendForm(formID) {
    var spinner = document.getElementsByClassName('loadingSpinner')[0];

    if(spinner){
        spinner.setAttribute('style', 'display: block;');
    }

    switch (formID) {
        case "referralForm": {
            var valuesReferral = [
                [
                    generateTime(),
                    $("input[name='patientName']").val(),
                    $("input[name='ic']").val(),
                    $("input[name='rn']").val(),
                    $("select[name='sex']").val(),
                    $("input[name='age']").val(),
                    $("textarea[name='addressBox']").val(),
                    $("input[name='homeTelephoneNo']").val(),
                    $("input[name='handphoneNo']").val(),
                    $("input[name='contactPerson']").val(),
                    $("input[name='relationship']").val(),
                    $("input[name='telephoneNo']").val(),
                    $("input[name='languageSpoken']").val(),
                    $("textarea[name='history']").val(),
                    $("input[name='diagnosisDate']").val(),
                    $("input[name='prognosis']:checked").val(),
                    $("input[name='diagnosisInform']:checked").val(),
                    $("input[name='prognosisInform']:checked").val(),
                    $("textarea[name='treatment']").val(),
                    $("input[name='currentMedication']").val(),
                    $("textarea[name='investRes']").val(),
                    $("input[name='referringDoctor']").val(),
                    $("input[name='speciality']").val(),
                    $("input[name='hospital']").val(),
                    $("input[name='officePhoneNo']").val(),
                    $("input[name='faxNo']").val(),
                    $("input[name='date']").val(),
                    $("input[name='patientInformed']:checked").val(),
                    $("input[name='relativeInformed']:checked").val(),
                    $("input[name='allFilled']:checked").val(),
                ]
            ];
            var body = {
                values: valuesReferral
            };
            rangeForm = "Referral Form";
            break;
        }
        case "medicalAssessmentForm": {
            var valuesMedicalAssessment = [
                [
                    generateTime(),
                    continuationID,
                    $("input[name='allergies']").val(),
                    $("input[name='khcNo']").val(),
                    $("input[name='name']").val(),
                    $("input[name='ic']").val(),
                    $("textarea[name='address']").val(),
                    $("input[name='dob']").val(),
                    $("input[name='sexAge']").val(),
                    $("input[name='dateReferral']").val(),
                    $("textarea[name='phoneNo']").val(),
                    $("input[name='initialContact']").val(),
                    $("input[name='dateAssessment']").val(),
                    $("input[name='assessedBy']").val(),
                    $("input[name='languageSpokenPatient']").val(),
                    $("input[name='languageSpokenCaregiver']").val(),
                    $("input[name='diagnosis']").val(),
                    $("input[name='dateOfNextAppointment']").val(),
                    $("textarea[name='historyIllness']").val(),
                    $("textarea[name='pastMedicalIllness']").val(),
                    $("input[name='historySurgery']").val(),
                    $("input[name='historyRadiotherapy']").val(),
                    $("input[name='historyChemotherapy']").val(),
                    $("select[name='maritalStatus']").val(),
                    $("input[name='occupation']").val(),
                    $("input[name='interests']").val(),
                    $("input[name='patientReligion']").val(),
                    $("input[name='familyReligion']").val(),
                    $("input[name='primaryCaregiver']").val(),
                    $("input[name='emotionalStatusSupportive']:checked").val(),
                    $("input[name='emotionalStatusCaring']:checked").val(),
                    $("input[name='emotionalStatusConcerned']:checked").val(),
                    $("input[name='emotionalStatusAnxious']:checked").val(),
                    $("input[name='emotionalStatusWeary']:checked").val(),
                    $("input[name='emotionalStatusExhausted']:checked").val(),
                    $("input[name='emotionalStatusDefensive']:checked").val(),
                    $("input[name='emotionalStatusControlling']:checked").val(),
                    $("select[name='financialStatus']").val(),
                    linkGenogram,
                    $("input[name='emotionalAssess1']:checked").val(),
                    $("input[name='emotionalAssess2']:checked").val(),
                    $("input[name='emotionalAssess3']:checked").val(),
                    $("input[name='emotionalAssess4']:checked").val(),
                    $("input[name='emotionalAssess5']:checked").val(),
                    $("input[name='emotionalAssess6']:checked").val(),
                    $("input[name='emotionalAssess7']:checked").val(),
                    $("input[name='emotionalAssess8']:checked").val(),
                    $("input[name='emotionalAssess9']:checked").val(),
                    $("input[name='emotionalAssess10']:checked").val(),
                    $("input[name='generalAppearance']").val(),
                    $("input[name='speech']").val(),
                    $("input[name='hearing']").val(),
                    $("input[name='hydration']").val(),
                    $("select[name='ecog']").val(),
                    $("input[name='cachexia']:checked").val(),
                    $("input[name='pallor']:checked").val(),
                    $("input[name='jaundice']:checked").val(),
                    $("input[name='cyanosis']:checked").val(),
                    $("input[name='bp']").val(),
                    $("input[name='pulse']").val(),
                    $("input[name='pulseMin']").val(),
                    $("input[name='respiratory']").val(),
                    $("input[name='spO2roomAirPercent']").val(),
                    $("input[name='spO2L%']").val(),
                    $("input[name='spO2L']").val(),
                    $("input[name='glucose']").val(),
                    $("input[name='glucoseMMOL']").val(),
                    $("input[name='temperature']").val(),
                    $("input[name='oralCavity']").val(),
                    $("input[name='lymphoedema']").val(),
                    $("input[name='pressureSores']").val(),
                    $("input[name='chestWall']").val(),
                    $("select[name='breathSound']").val(),
                    $("input[name='crepitationDetail']").val(),
                    $("input[name='rt']").val(),
                    $("input[name='lt']").val(),
                    $("input[name='rtAir']").val(),
                    $("input[name='ltAir']").val(),
                    $("input[name='heartSounds']").val(),
                    $("input[name='jvp']").val(),
                    (changeLink('khcNo', 'Lungs', continuationID) === undefined ? '' : changeLink('khcNo', 'Lungs', continuationID)),
                    $("input[name='abdominalWall']").val(),
                    $("input[name='ascites']").val(),
                    $("input[name='hepatomegaly']").val(),
                    $("input[name='splenomegaly']").val(),
                    $("input[name='bowelSounds']").val(),
                    $("input[name='perRectum']").val(),
                    $("input[name='perVagina']").val(),
                    (changeLink('khcNo', 'LowerBody', continuationID) === undefined ? '' : changeLink('khcNo', 'LowerBody', continuationID)),
                    $("input[name='rightUL']").val(),
                    $("input[name='leftUL']").val(),
                    $("input[name='rightLL']").val(),
                    $("input[name='leftLL']").val(),
                    $("input[name='muscleWasting']").val(),
                    $("input[name='bodyTenderness']").val(),
                    $("select[name='consciousness']").val(),
                    $("input[name='time']:checked").val(),
                    $("input[name='place']:checked").val(),
                    $("input[name='people']:checked").val(),
                    $("input[name='voice']:checked").val(),
                    $("input[name='pain']:checked").val(),
                    $("input[name='unresponsiveness']:checked").val(),
                    $("input[name='sensoryLoss']").val(),
                    (changeLink('khcNo', 'FullBody', continuationID) === undefined ? '' : changeLink('khcNo', 'FullBody', continuationID)),
                    $("input[name='smell']").val(),
                    $("input[name='vision']").val(),
                    $("input[name='lightDetection']").val(),
                    $("input[name='eyeMovement']").val(),
                    $("input[name='raiseEyelid']").val(),
                    $("input[name='eyeMovement2']").val(),
                    $("input[name='facialSensation']").val(),
                    $("input[name='eyeMovement3']").val(),
                    $("input[name='facialExpression']").val(),
                    $("input[name='taste']").val(),
                    $("input[name='productionTears']").val(),
                    $("input[name='hearingBalance']").val(),
                    $("input[name='swallowing']").val(),
                    $("input[name='gagReflex']").val(),
                    $("input[name='speechNerve']").val(),
                    $("input[name='shrugging']").val(),
                    $("input[name='tongueMovement']").val(),
                    $("textarea[name='extNotes']").val(),
                ]
            ];
            var body = {
                values: valuesMedicalAssessment
            };
            rangeForm = "Medical & Nursing Assessment";
            break;
        }
        case "extraNotesForm": {
            var valuesExtraNotes = [
                [
                    generateTime(),
                    document.getElementsByName("patientName")[0].innerHTML,
                    document.getElementsByName("patientNameSearch")[0].innerHTML,
                    $("textarea[name='extraNotes']").val(),
                ]
            ]

            var body = {
                values: valuesExtraNotes
            };
            rangeForm = "Extra Notes";
            break;
        }
        case "medicationForm": {
            var valuesMedication = [
                [
                    generateTime(),
                    document.getElementsByName("patientName")[0].innerHTML,
                    document.getElementsByName("patientNameSearch")[0].innerHTML,
                    $("input[name='date']").val(),
                    $("input[name='medication']").val(),
                    $("input[name='dosage']").val(),
                    $("input[name='frequency']").val(),
                    $("input[name='dateStarted']").val(),
                    $("input[name='dateCeased']").val(),
                    $("input[name='hospital']").val()
                ]
            ]

            var body = {
                values: valuesMedication
            };
            rangeForm = "Medication Given";
            break;
        }
        case "medicationEquipmentForm": {
            var valuesMedicationEquipment = [
                [
                    generateTime(),
                    document.getElementsByName("patientName")[0].innerHTML,
                    document.getElementsByName("patientNameSearch")[0].innerHTML,
                    $("input[name='date']").val(),
                    $("input[name='medicationName']").val(),
                    $("input[name='medicationQuantity']").val(),
                    $("input[name='nursingItemName']").val(),
                    $("input[name='nursingItemNo']").val()
                ]
            ]

            var body = {
                values: valuesMedicationEquipment
            };
            rangeForm = "Medication Supplied and Equipments Loaned";
            break;
        }
        case "homeVisitForm": {
            var valuesHomeVisit = [
                [
                    generateTime(),
                    document.getElementsByName("patientName")[0].innerHTML,
                    document.getElementsByName("patientNameSearch")[0].innerHTML,
                    $("input[name='no']").val(),
                    $("input[name='date']").val(),
                    $("input[name='visitedBy']").val(),
                    $("input[name='place']").val()
                ]
            ]

            var body = {
                values: valuesHomeVisit
            };
            rangeForm = "Home Visit Record";
            break;
        }
        case "endOfLifeForm": {
            var valuesEndOfLife = [
                [
                    generateTime(),
                    document.getElementsByName("patientName")[0].innerHTML,
                    document.getElementsByName("patientNameSearch")[0].innerHTML,
                    $("input[name='date']").val(),
                    $("input[name='lifeSustainingTreatment']").val(),
                    $("input[name='cpr']").val(),
                    $("input[name='intubation']").val(),
                    $("input[name='artificialHydration']").val(),
                    $("input[name='antibiotics']").val(),
                    $("input[name='dialysis']").val(),
                    $("input[name='proxyDecision']").val(),
                    $("input[name='placeOfCare']").val(),
                    $("input[name='typeOfFuneral']").val(),
                    $("input[name='specialWishes']").val()
                ]
            ]

            var body = {
                values: valuesEndOfLife
            };
            rangeForm = "End of Life Issue";
            break;
        }
        case "patientContinuationSheet": {
            var valuesPatientContinuationSheet = [
                [
                    generateTime(),
                    continuationID,
                    $("input[name='patientName']").val(),
                    $("input[name='khcNo']").val(),
                    $("input[name='date']").val(),
                    $("input[name='assessedBy']").val(),
                    $("input[name='pain']:checked").val(),
                    $("input[name='sitePain1']").val(),
                    $("input[name='sitePain2']").val(),
                    $("input[name='sitePain3']").val(),
                    $("input[name='duration1']").val(),
                    $("select[name='durationDayWeekMonth1']").val(),
                    $("input[name='duration2']").val(),
                    $("select[name='durationDayWeekMonth2']").val(),
                    $("input[name='duration3']").val(),
                    $("select[name='durationDayWeekMonth3']").val(),
                    $("input[name='radiationPain']:checked").val(),
                    $("input[name='placeOfPain']").val(),
                    $("input[name='painInterval']:checked").val(),
                    $("input[name='painThrobbing']:checked").val(),
                    $("input[name='painPricking']:checked").val(),
                    $("input[name='painSlicing']:checked").val(),
                    $("input[name='painAching']:checked").val(),
                    $("input[name='painShooting']:checked").val(),
                    $("input[name='painPulling']:checked").val(),
                    $("input[name='painBurning']:checked").val(),
                    $("input[name='painShock']:checked").val(),
                    $("input[name='painDull']:checked").val(),
                    $("input[name='painN/A']:checked").val(),
                    $("input[name='natureOfPainOthers']").val(),
                    $("input[name='painAggravatedBy']").val(),
                    $("input[name='numericalScale']").val(),
                    $("select[name='verbalScore']").val(),
                    $("input[name='painRelievedByMassaging']:checked").val(),
                    $("input[name='painRelievedByRepositioning']:checked").val(),
                    $("input[name='painRelievedByMedication']:checked").val(),
                    $("input[name='backgroundPainMedication']").val(),
                    $("input[name='breakthroughMedication']").val(),
                    $("input[name='painRelievedAfterValue']").val(),
                    $("select[name='painRelievedAfterMinHr']").val(),
                    $("input[name='numericalScaleAfter']").val(),
                    $("select[name='verbalScoreAfter']").val(),
                    $("input[name='shortnessBreath']:checked").val(),
                    $("input[name='durationShortnessBreath']").val(),
                    $("select[name='durationShortnessBreathDayWeekMonth']").val(),
                    $("input[name='shortnessBreathAt']:checked").val(),
                    $("input[name='whatExertion']").val(),
                    $("input[name='shortnessBreathRelievedByResting']:checked").val(),
                    $("input[name='durationResting']").val(),
                    $("select[name='durationRestingDayWeekMonth']").val(),
                    $("input[name='shortnessBreathRelievedByOxygen']:checked").val(),
                    $("input[name='oxygenLevel']").val(),
                    $("input[name='shortnessBreathRelievedByMedication']:checked").val(),
                    $("input[name='medicationsWithin']").val(),
                    $("select[name='medicationsWithinMinHrs']").val(),
                    $("input[name='medicationsDosageFrequency']").val(),       
                    $("input[name='cough']:checked").val(),
                    $("input[name='durationCough']").val(),
                    $("select[name='durationCoughDuration']").val(),
                    $("input[name='productivity']:checked").val(),
                    $("input[name='sputum']:checked").val(),
                    $("input[name='sputumOtr']").val(),
                    $("input[name='expectoration']:checked").val(),
                    $("select[name='coughConsistency']").val(),
                    $("input[name='coughMedication']").val(),
                    $("input[name='appetite']:checked").val(),
                    $("input[name='durationAppetite']").val(),
                    $("select[name='durationAppetiteDayWeekMonth']").val(),
                    $("input[name='oral']:checked").val(),
                    $("input[name='oralInput']").val(),
                    $("input[name='ngTube']:checked").val(),
                    $("input[name='ngScoops']").val(),
                    $("input[name='ngWater']").val(),
                    $("input[name='ngFrequency']").val(),
                    $("input[name='ngAspiration']").val(),
                    $("input[name='ngFormula']").val(),
                    $("input[name='pegTube']:checked").val(),
                    $("input[name='pegScoops']").val(),
                    $("input[name='pegWater']").val(),
                    $("input[name='pegFrequency']").val(),
                    $("input[name='pegFormula']").val(),
                    $("input[name='dysphagia']:checked").val(),
                    $("input[name='dysphagiaType']:checked").val(),
                    $("input[name='swallow']:checked").val(),
                    $("input[name='nauseaVomit']:checked").val(),
                    $("input[name='durationNV']").val(),
                    $("select[name='durationNVDayWeekMonth']").val(),
                    $("input[name='nauseaOrVomiting']:checked").val(),
                    $("input[name='causeOfNV']:checked").val(),
                    $("input[name='hrsOfFood']").val(),
                    $("input[name='timeOfNV']:checked").val(),
                    $("input[name='nvFrequency']").val(),
                    $("input[name='giddiness']:checked").val(),
                    $("input[name='vomitConsistency']:checked").val(),
                    $("input[name='vomitConsistencyOtr']").val(),
                    $("input[name='bmAnus']:checked").val(),
                    $("input[name='bmColostomy']:checked").val(),
                    $("input[name='bmIleostomy']:checked").val(),
                    $("input[name='bmFrequency']").val(),
                    $("select[name='durationBMFrequncy']").val(),
                    $("input[name='bmNBO']").val(),
                    $("input[name='stoolConsistency']:checked").val(),
                    $("input[name='stoolNature']:checked").val(),
                    $("input[name='freshBloodStainDetail']:checked").val(),
                    $("input[name='waterStoolDay']").val(),
                    $("input[name='bmIncontinence']:checked").val(),
                    $("input[name='urineNormal']:checked").val(),
                    $("input[name='urineCBD']:checked").val(),
                    $("input[name='urineSPC']:checked").val(),
                    $("input[name='urineNep']:checked").val(),
                    $("input[name='nephrostomyRL']:checked").val(),
                    $("input[name='urineColour']:checked").val(),
                    $("input[name='urineColourSta']").val(),
                    $("input[name='urineNature']:checked").val(),
                    $("input[name='dysuria']:checked").val(),
                    $("input[name='dysuria/7']").val(),
                    $("input[name='dysuria/52']").val(),
                    $("input[name='dysuria/12']").val(), 
                    $("input[name='delayInitiation']:checked").val(),
                    $("input[name='urineRetention']:checked").val(),
                    $("input[name='urineIncontinence']:checked").val(),
                    $("input[name='sleepPattern']:checked").val(),
                    $("input[name='sleepHrs']").val(),
                    $("input[name='sleepAlt']").val(),
                    $("input[name='sleepMedication']").val(),
                    $("textarea[name='otrPhychological']").val(),
                    $("input[name='examPatientName']").val(),
                    $("input[name='examKhcNo']").val(),
                    $("input[name='examDate']").val(),
                    $("input[name='examAssessedBy']").val(),
                    $("select[name='examECOG']").val(),
                    $("input[name='alert']:checked").val(),
                    $("input[name='drowsy']:checked").val(),
                    $("select[name='arousal']").val(),
                    $("input[name='confused']:checked").val(),
                    $("input[name='confusedTxt']").val(),
                    $("input[name='conscious']:checked").val(),
                    $("input[name='unconscious']:checked").val(),
                    $("input[name='semi']:checked").val(),
                    $("input[name='pallor']:checked").val(),
                    $("input[name='jaundice']:checked").val(),
                    $("input[name='cyanosis']:checked").val(),
                    $("input[name='hydration']:checked").val(),
                    $("input[name='clubbing']:checked").val(),
                    $("input[name='lymphedema']:checked").val(),
                    $("select[name='pitting1']").val(),
                    $("input[name='pittingState1']").val(),             
                    $("select[name='pitting2']").val(),
                    $("input[name='pittingState2']").val(),
                    $("input[name='pressureSore']:checked").val(),
                    $("select[name='soreGrade1']").val(),
                    $("input[name='soreGradeState1']").val(),
                    $("select[name='soreGrade2']").val(),
                    $("input[name='soreGradeState2']").val(),
                    $("input[name='ocClean']:checked").val(),
                    $("input[name='ocDry']:checked").val(),
                    $("input[name='ocDirty']:checked").val(),
                    $("input[name='ocFungalInfection']:checked").val(),
                    $("input[name='ocOther']:checked").val(),
                    $("input[name='ocOtherTxt']").val(),
                    $("input[name='skinPetechiae']:checked").val(),
                    $("input[name='skinEcchymosis']:checked").val(),
                    $("input[name='skinScar']:checked").val(),
                    $("input[name='skinRash']:checked").val(),
                    $("input[name='skinOthers']:checked").val(),
                    $("input[name='skinOtr']").val(),
                    $("input[name='bp']").val(),
                    $("select[name='brState']").val(),
                    $("input[name='pulse']").val(),
                    $("input[name='pulseMin']").val(),
                    $("select[name='prState']").val(),
                    $("input[name='spO2roomAirPercent']").val(),
                    $("input[name='spO2L%']").val(),
                    $("input[name='spO2L']").val(),
                    $("input[name='respiratory']").val(),
                    $("select[name='rrState']").val(),
                    $("input[name='temperature']").val(),
                    $("select[name='tempState']").val(),
                    $("input[name='glucose']").val(),
                    $("input[name='glucoseMMOL']").val(),
                    $("input[name='chestWall']").val(),
                    $("select[name='rlCon']").val(),
                    $("input[name='rlConTxt']").val(),
                    $("input[name='rlSound']").val(),
                    $("input[name='rlFineCrep']").val(),
                    $("input[name='rlCoarseCrep']").val(),
                    $("input[name='rlAir']:checked").val(),
                    $("input[name='rlAirDecreasedTxt']").val(),
                    $("select[name='llCon']").val(),
                    $("input[name='llConTxt']").val(),
                    $("input[name='llSound']").val(),
                    $("input[name='llFineCrep']").val(),
                    $("input[name='llCoarseCrep']").val(),
                    $("input[name='llAir']:checked").val(),
                    $("input[name='llAirDecreasedTxt']").val(),
                    (changeLink('khcNo', 'Lungs', continuationID) === undefined ? '' : changeLink('khcNo', 'Lungs', continuationID)),
                    $("input[name='heartSound']:checked").val(),
                    $("input[name='heartMurmurTxt']").val(),
                    $("input[name='abdominalWall']:checked").val(),
                    $("input[name='abdomWallLoc']").val(),
                    $("input[name='abdomen']:checked").val(),
                    $("input[name='abdoTenderTxt']").val(),
                    $("input[name='abdomenLoc']").val(),
                    $("select[name='massTenderness']").val(),
                    $("select[name='massMobility']").val(),
                    $("select[name='massState']").val(),
                    $("input[name='massStateQuad']").val(),
                    $("input[name='massStateSize']").val(),
                    $("input[name='shiftDull']:checked").val(),
                    $("input[name='hepatomegaly']:checked").val(),
                    $("input[name='hepNegativeTxt']").val(),
                    $("input[name='splenomegaly']:checked").val(),
                    $("input[name='splNegativeTxt']").val(),
                    $("select[name='bowelSound']").val(),
                    $("select[name='perRectum']").val(),
                    (changeLink('khcNo', 'LowerBody', continuationID) === undefined ? '' : changeLink('khcNo', 'LowerBody', continuationID)),
                    $("input[name='gastroOtr']").val(),
                    $("input[name='muscleRightUL']").val(),
                    $("input[name='muscleLeftUL']").val(),
                    $("input[name='muscleRightLL']").val(),
                    $("input[name='muscleLeftLL']").val(),
                    $("input[name='senseRightUL']:checked").val(),
                    $("input[name='senseleftUL']:checked").val(),
                    $("input[name='senserightLL']:checked").val(),
                    $("input[name='senseleftLL']:checked").val(),
                    $("textarea[name='otrManage']").val(),
                ]
            ]

            var body = {
                values: valuesPatientContinuationSheet
            };
            rangeForm = "Patient Continuation Sheet";
            break;
        }

    }

    if(checkRequired()){
        if(!submitted){
            submitted = true;
            gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: spreadsheetId,
                range: rangeForm,
                valueInputOption: "RAW",
                resource: body
            }).then((response) => {
                var result = response.result;
                console.log(`${result.updates.updatedCells} cells appended.`);
                spinner.setAttribute('style', 'display: none;');
                appendPre("Entry submitted.");
            }, (reason) => {
                console.log(reason.result);
                spinner.setAttribute('style', 'display: none;');
                appendPre("Error: " + reason.result.error.message);
            });
        }
        else {
            spinner.setAttribute('style', 'display: none;');
            appendPre("Please refresh the page to avoid submitting duplicate records.")
        }
    }
    
}

//Checks the input for validations before submitting
function checkRequired() {
    var fields = $(".itemRequired").find("select, input, textarea").serializeArray();
    var valid = true;
    var validRegEx = true;
    var errorList = [];

    $.each(fields, function(i, field) {
        if (!field.value) {
            errorList.push(field.name);
            valid = false;
        }
        else if (document.getElementsByName(field.name)[0].getAttribute('pattern')) {
            var regEx = new RegExp(document.getElementsByName(field.name)[0].getAttribute('pattern'), );
            validRegEx = regEx.test(field.value);

            if (!validRegEx) {
                appendPre(field.name + " does not match requested format.");
            }
        }
    })

    if(errorList.length > 0) {
        alert(errorList + " is required.");
    }

    if(valid == false || validRegEx == false) {
        return false;
    } else {
        return true;
    }
}

//Deletes a record
function deleteRecord(formID, array) {
    if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
        alert("Please authorize before deleting record(s).");
        return;
    } else {
        var spinner = document.getElementById('loadingSpinnerBottom');

        if(spinner){
            spinner.setAttribute('style', 'display: block;');
        }

        deleteStuff(formID, array);

        var params = {
            spreadsheetId: spreadsheetId,
        }
    
        var batchUpdateValuesRequestBody = {
            requests: []
        };
    
        for(var i = 0; i < array.length; i++) {
            batchUpdateValuesRequestBody.requests.push(
                {
                    "deleteDimension":{
                        "range": {
                            "sheetId": formID,
                            "dimension": "ROWS",
                            "startIndex": parseInt(array[i]) + 1,
                            "endIndex": parseInt(array[i]) + 2,
                        }
                    }
                }
            )
    
            for(var j = 0; j < array.length; j++) {
                array[j]--;
            }
        }
        if(!deleted) {
            gapi.client.sheets.spreadsheets.batchUpdate(params, batchUpdateValuesRequestBody).then(function(response) {
                console.log(response.result);
                spinner.setAttribute('style', 'display: none;');
                appendPre("Record(s) deleted. Refresh the page to see the result.");
                deleted = true;
            }, function(error) {
                console.log(error.result);
                spinner.setAttribute('style', 'display: none;');
                appendPre("Error:" + error.result.error.message);
            })
        } else {
            spinner.setAttribute('style', 'display: none;');
            appendPre("Please select another record(s) to delete.")
        }

    }
}

//Edits a record
function editRecord(formID, row) {
    var form = document.getElementById('formID').innerText;

    var spinner = document.getElementById('loadingSpinnerBottom');

    if(spinner){
        spinner.setAttribute('style', 'display: block;');
    }

    var params = {
        spreadsheetId: spreadsheetId, 
    };

    var batchUpdateBody = {
        valueInputOption: 'RAW',
        data: [],
    }

    for (var i = 0; i < row.length; i++) {
        continuationID = dataEdit[row[i]][1];
        console.log(changeLink('khcNo', 'Lungs', continuationID));
        switch (form) {
            case "referralRecord": {
                var valuesReferral = [
                    [
                        generateTime(),
                        ($("input[name='patientName']").val()              === "" ? dataEdit[row[i]][1] : $("input[name='patientName']").val()),
                        ($("input[name='ic']").val()                       === "" ? dataEdit[row[i]][2] : $("input[name='ic']").val()),
                        ($("input[name='rn']").val()                       === "" ? dataEdit[row[i]][3] : $("input[name='rn']").val()),
                        ($("select[name='sex']").val()                     === "" ? dataEdit[row[i]][4] : $("input[name='sex']").val()),
                        ($("input[name='age']").val()                      === "0" ? dataEdit[row[i]][5] : $("input[name='age']").val()),
                        ($("textarea[name='addressBox']").val()            === "" ? dataEdit[row[i]][6] : $("textarea[name='addressBox']").val()),
                        ($("input[name='homeTelephoneNo']").val()          === "" ? dataEdit[row[i]][7] : $("input[name='homeTelephoneNo']").val()),
                        ($("input[name='handphoneNo']").val()              === "" ? dataEdit[row[i]][8] : $("input[name='handphoneNo']").val()),
                        ($("input[name='contactPerson']").val()            === "" ? dataEdit[row[i]][9] : $("input[name='contactPerson']").val()),
                        ($("input[name='relationship']").val()             === "" ? dataEdit[row[i]][10] : $("input[name='relationship']").val()),
                        ($("input[name='telephoneNo']").val()              === "" ? dataEdit[row[i]][11] : $("input[name='telephoneNo']").val()),
                        ($("input[name='languageSpoken']").val()           === "" ? dataEdit[row[i]][12] : $("input[name='languageSpoken']").val()),
                        ($("textarea[name='history']").val()               === "" ? dataEdit[row[i]][13] : $("textarea[name='history']").val()),
                        ($("input[name='diagnosisDate']").val()            === "" ? dataEdit[row[i]][14] : $("input[name='diagnosisDate']").val()),
                        ($("input[name='prognosis']:checked").val()        === "" ? dataEdit[row[i]][15] : $("input[name='prognosis']:checked").val()),
                        ($("input[name='diagnosisInform']:checked").val()  === "" ? dataEdit[row[i]][16] : $("input[name='diagnosisInform']:checked").val()),
                        ($("input[name='prognosisInform']:checked").val()  === "" ? dataEdit[row[i]][17] : $("input[name='prognosisInform']:checked").val()),
                        ($("textarea[name='treatment']").val()             === "" ? dataEdit[row[i]][18] : $("textarea[name='treatment']").val()),
                        ($("input[name='currentMedication']").val()        === "" ? dataEdit[row[i]][19] : $("input[name='currentMedication']").val()),
                        ($("textarea[name='investRes']").val()             === "" ? dataEdit[row[i]][20] : $("textarea[name='investRes']").val()),
                        ($("input[name='referringDoctor']").val()          === "" ? dataEdit[row[i]][21] : $("input[name='referringDoctor']").val()),
                        ($("input[name='speciality']").val()               === "" ? dataEdit[row[i]][22] : $("input[name='speciality']").val()),
                        ($("input[name='hospital']").val()                 === "" ? dataEdit[row[i]][23] : $("input[name='hospital']").val()),
                        ($("input[name='officePhoneNo']").val()            === "" ? dataEdit[row[i]][24] : $("input[name='officePhoneNo']").val()),
                        ($("input[name='faxNo']").val()                    === "" ? dataEdit[row[i]][25] : $("input[name='faxNo']").val()),
                        ($("input[name='date']").val()                     === "" ? dataEdit[row[i]][26] : $("input[name='date']").val()),
                        ($("input[name='patientInformed']:checked").val()  === "" ? dataEdit[row[i]][27] : $("input[name='patientInformed']:checked").val()),
                        ($("input[name='relativeInformed']:checked").val() === "" ? dataEdit[row[i]][28] : $("input[name='relativeInformed']:checked").val()),
                        ($("input[name='allFilled']:checked").val()        === "" ? dataEdit[row[i]][29] : $("input[name='allFilled']:checked").val()),
                    ]
                ];
                var body = {
                    range: "'" + formID + "'!" + parseInt(parseInt(row[i]) + 2) + ":" + parseInt(parseInt(row[i]) + 2),
                    values: valuesReferral,
                };

                batchUpdateBody.data.push(body);

                break;
            }
            case "medicalAssessmentRecord": {
                var valuesMedicalAssessment = [
                    [
                        generateTime(),
                        dataEdit[row[i]][1],
                        ($("input[name='allergies']").val()                         === "" ? dataEdit[row[i]][2] : $("input[name='allergies']").val()),
                        ($("input[name='khcNo']").val()                             === "" ? dataEdit[row[i]][3] : $("input[name='khcNo']").val()),
                        ($("input[name='name']").val()                              === "" ? dataEdit[row[i]][4] : $("input[name='name']").val()),
                        ($("input[name='ic']").val()                                === "" ? dataEdit[row[i]][5] : $("input[name='ic']").val()),
                        ($("textarea[name='address']").val()                        === "" ? dataEdit[row[i]][6] : $("textarea[name='address']").val()),
                        ($("input[name='dob']").val()                               === "" ? dataEdit[row[i]][7] : $("input[name='dob']").val()),
                        ($("input[name='sexAge']").val()                            === "" ? dataEdit[row[i]][8] : $("input[name='sexAge']").val()),
                        ($("input[name='dateReferral']").val()                      === "" ? dataEdit[row[i]][9] : $("input[name='dateReferral']").val()),
                        ($("textarea[name='phoneNo']").val()                        === "" ? dataEdit[row[i]][10] : $("textarea[name='phoneNo']").val()),
                        ($("input[name='initialContact']").val()                    === "" ? dataEdit[row[i]][11] : $("input[name='initialContact']").val()),
                        ($("input[name='dateAssessment']").val()                    === "" ? dataEdit[row[i]][12] : $("input[name='dateAssessment']").val()),
                        ($("input[name='assessedBy']").val()                        === "" ? dataEdit[row[i]][13] : $("input[name='assessedBy']").val()),
                        ($("input[name='languageSpokenPatient']").val()             === "" ? dataEdit[row[i]][14] : $("input[name='languageSpokenPatient']").val()),
                        ($("input[name='languageSpokenCaregiver']").val()           === "" ? dataEdit[row[i]][15] : $("input[name='languageSpokenCaregiver']").val()),
                        ($("input[name='diagnosis']").val()                         === "" ? dataEdit[row[i]][16] : $("input[name='diagnosis']").val()),
                        ($("input[name='dateOfNextAppointment']").val()             === "" ? dataEdit[row[i]][17] : $("input[name='dateOfNextAppointment']").val()),
                        ($("textarea[name='historyIllness']").val()                 === "" ? dataEdit[row[i]][18] : $("textarea[name='historyIllness']").val()),
                        ($("textarea[name='pastMedicalIllness']").val()             === "" ? dataEdit[row[i]][19] : $("textarea[name='pastMedicalIllness']").val()),
                        ($("input[name='historySurgery']").val()                    === "" ? dataEdit[row[i]][20] : $("input[name='historySurgery']").val()),
                        ($("input[name='historyRadiotherapy']").val()               === "" ? dataEdit[row[i]][21] : $("input[name='historyRadiotherapy']").val()),
                        ($("input[name='historyChemotherapy']").val()               === "" ? dataEdit[row[i]][22] : $("input[name='historyChemotherapy']").val()),
                        ($("select[name='maritalStatus']").val()                    === "" ? dataEdit[row[i]][23] : $("select[name='maritalStatus']").val()),
                        ($("input[name='occupation']").val()                        === "" ? dataEdit[row[i]][24] : $("input[name='occupation']").val()),
                        ($("input[name='interests']").val()                         === "" ? dataEdit[row[i]][25] : $("input[name='interests']").val()),
                        ($("input[name='patientReligion']").val()                   === "" ? dataEdit[row[i]][26] : $("input[name='patientReligion']").val()),
                        ($("input[name='familyReligion']").val()                    === "" ? dataEdit[row[i]][27] : $("input[name='familyReligion']").val()),
                        ($("input[name='primaryCaregiver']").val()                  === "" ? dataEdit[row[i]][28] : $("input[name='primaryCaregiver']").val()),
                        ($("input[name='emotionalStatusSupportive']:checked").val() === "" ? dataEdit[row[i]][29] : $("input[name='emotionalStatusSupportive']:checked").val()),
                        ($("input[name='emotionalStatusCaring']:checked").val()     === "" ? dataEdit[row[i]][30] : $("input[name='emotionalStatusCaring']:checked").val()),
                        ($("input[name='emotionalStatusConcerned']:checked").val()  === "" ? dataEdit[row[i]][31] : $("input[name='emotionalStatusConcerned']:checked").val()),
                        ($("input[name='emotionalStatusAnxious']:checked").val()    === "" ? dataEdit[row[i]][32] : $("input[name='emotionalStatusAnxious']:checked").val()),
                        ($("input[name='emotionalStatusWeary']:checked").val()      === "" ? dataEdit[row[i]][33] : $("input[name='emotionalStatusWeary']:checked").val()),
                        ($("input[name='emotionalStatusExhausted']:checked").val()  === "" ? dataEdit[row[i]][34] : $("input[name='emotionalStatusExhausted']:checked").val()),
                        ($("input[name='emotionalStatusDefensive']:checked").val()  === "" ? dataEdit[row[i]][35] : $("input[name='emotionalStatusDefensive']:checked").val()),
                        ($("input[name='emotionalStatusControlling']:checked").val()=== "" ? dataEdit[row[i]][36] : $("input[name='emotionalStatusControlling']:checked").val()),
                        ($("select[name='financialStatus']").val()                  === "" ? dataEdit[row[i]][37] : $("select[name='financialStatus']").val()),
                        (linkGenogram                                               === "" ? dataEdit[row[i]][38] : linkGenogram),
                        ($("input[name='emotionalAssess1']:checked").val()          === "" ? dataEdit[row[i]][39] : $("input[name='emotionalAssess1']:checked").val()),
                        ($("input[name='emotionalAssess2']:checked").val()          === "" ? dataEdit[row[i]][40] : $("input[name='emotionalAssess2']:checked").val()),
                        ($("input[name='emotionalAssess3']:checked").val()          === "" ? dataEdit[row[i]][41] : $("input[name='emotionalAssess3']:checked").val()),
                        ($("input[name='emotionalAssess4']:checked").val()          === "" ? dataEdit[row[i]][42] : $("input[name='emotionalAssess4']:checked").val()),
                        ($("input[name='emotionalAssess5']:checked").val()          === "" ? dataEdit[row[i]][43] : $("input[name='emotionalAssess5']:checked").val()),
                        ($("input[name='emotionalAssess6']:checked").val()          === "" ? dataEdit[row[i]][44] : $("input[name='emotionalAssess6']:checked").val()),
                        ($("input[name='emotionalAssess7']:checked").val()          === "" ? dataEdit[row[i]][45] : $("input[name='emotionalAssess7']:checked").val()),
                        ($("input[name='emotionalAssess8']:checked").val()          === "" ? dataEdit[row[i]][46] : $("input[name='emotionalAssess8']:checked").val()),
                        ($("input[name='emotionalAssess9']:checked").val()          === "" ? dataEdit[row[i]][47] : $("input[name='emotionalAssess9']:checked").val()),
                        ($("input[name='emotionalAssess10']:checked").val()         === "" ? dataEdit[row[i]][48] : $("input[name='emotionalAssess10']:checked").val()),
                        ($("input[name='generalAppearance']").val()                 === "" ? dataEdit[row[i]][49] : $("input[name='generalAppearance']").val()),
                        ($("input[name='speech']").val()                            === "" ? dataEdit[row[i]][50] : $("input[name='speech']").val()),
                        ($("input[name='hearing']").val()                           === "" ? dataEdit[row[i]][51] : $("input[name='hearing']").val()),
                        ($("input[name='hydration']").val()                         === "" ? dataEdit[row[i]][52] : $("input[name='hydration']").val()),
                        ($("select[name='ecog']").val()                             === "" ? dataEdit[row[i]][53] : $("select[name='ecog']").val()),
                        ($("input[name='cachexia']:checked").val()                  === "" ? dataEdit[row[i]][54] : $("input[name='cachexia']:checked").val()),
                        ($("input[name='pallor']:checked").val()                    === "" ? dataEdit[row[i]][55] : $("input[name='pallor']:checked").val()),
                        ($("input[name='jaundice']:checked").val()                  === "" ? dataEdit[row[i]][56] : $("input[name='jaundice']:checked").val()),
                        ($("input[name='cyanosis']:checked").val()                  === "" ? dataEdit[row[i]][57] : $("input[name='cyanosis']:checked").val()),
                        ($("input[name='bp']").val()                                === "" ? dataEdit[row[i]][58] : $("input[name='bp']").val()),
                        ($("input[name='pulse']").val()                             === "" ? dataEdit[row[i]][59] : $("input[name='pulse']").val()),
                        ($("input[name='pulseMin']").val()                          === "" ? dataEdit[row[i]][60] : $("input[name='pulseMin']").val()),
                        ($("input[name='respiratory']").val()                       === "" ? dataEdit[row[i]][61] : $("input[name='respiratory']").val()),
                        ($("input[name='spO2roomAirPercent']").val()                === "" ? dataEdit[row[i]][62] : $("input[name='spO2roomAirPercent']").val()),
                        ($("input[name='spO2L%']").val()                            === "" ? dataEdit[row[i]][63] : $("input[name='spO2L%']").val()),
                        ($("input[name='spO2L']").val()                             === "" ? dataEdit[row[i]][64] : $("input[name='spO2L']").val()),
                        ($("input[name='glucose']").val()                           === "" ? dataEdit[row[i]][65] : $("input[name='glucose']").val()),
                        ($("input[name='glucoseMMOL']").val()                       === "" ? dataEdit[row[i]][66] : $("input[name='glucoseMMOL']").val()),
                        ($("input[name='temperature']").val()                       === "" ? dataEdit[row[i]][67] : $("input[name='temperature']").val()),
                        ($("input[name='oralCavity']").val()                        === "" ? dataEdit[row[i]][68] : $("input[name='oralCavity']").val()),
                        ($("input[name='lymphoedema']").val()                       === "" ? dataEdit[row[i]][69] : $("input[name='lymphoedema']").val()),
                        ($("input[name='pressureSores']").val()                     === "" ? dataEdit[row[i]][70] : $("input[name='pressureSores']").val()),
                        ($("input[name='chestWall']").val()                         === "" ? dataEdit[row[i]][71] : $("input[name='chestWall']").val()),
                        ($("select[name='breathSound']").val()                      === "" ? dataEdit[row[i]][72] : $("select[name='breathSound']").val()),
                        ($("input[name='crepitationDetail']").val()                 === "" ? dataEdit[row[i]][73] : $("input[name='crepitationDetail']").val()),
                        ($("input[name='rt']").val()                                === "" ? dataEdit[row[i]][74] : $("input[name='rt']").val()),
                        ($("input[name='lt']").val()                                === "" ? dataEdit[row[i]][75] : $("input[name='lt']").val()),
                        ($("input[name='rtAir']").val()                             === "" ? dataEdit[row[i]][76] : $("input[name='rtAir']").val()),
                        ($("input[name='ltAir']").val()                             === "" ? dataEdit[row[i]][77] : $("input[name='ltAir']").val()),
                        ($("input[name='heartSounds']").val()                       === "" ? dataEdit[row[i]][78] : $("input[name='heartSounds']").val()),
                        ($("input[name='jvp']").val()                               === "" ? dataEdit[row[i]][79] : $("input[name='jvp']").val()),
                        (changeLink('khcNo', 'Lungs', continuationID)                               === undefined ? dataEdit[row[i]][80] : changeLink('khcNo', 'Lungs', continuationID)),
                        ($("input[name='abdominalWall']").val()                     === "" ? dataEdit[row[i]][81] : $("input[name='abdominalWall']").val()),
                        ($("input[name='ascites']").val()                           === "" ? dataEdit[row[i]][82] : $("input[name='ascites']").val()),
                        ($("input[name='hepatomegaly']").val()                      === "" ? dataEdit[row[i]][83] : $("input[name='hepatomegaly']").val()),
                        ($("input[name='splenomegaly']").val()                      === "" ? dataEdit[row[i]][84] : $("input[name='splenomegaly']").val()),
                        ($("input[name='bowelSounds']").val()                       === "" ? dataEdit[row[i]][85] : $("input[name='bowelSounds']").val()),
                        ($("input[name='perRectum']").val()                         === "" ? dataEdit[row[i]][86] : $("input[name='perRectum']").val()),
                        ($("input[name='perVagina']").val()                         === "" ? dataEdit[row[i]][87] : $("input[name='perVagina']").val()),
                        (changeLink('khcNo', 'LowerBody', continuationID)                           === undefined ? dataEdit[row[i]][88] : changeLink('khcNo', 'LowerBody', continuationID)),
                        ($("input[name='rightUL']").val()                           === "" ? dataEdit[row[i]][89] : $("input[name='rightUL']").val()),
                        ($("input[name='leftUL']").val()                            === "" ? dataEdit[row[i]][90] : $("input[name='leftUL']").val()),
                        ($("input[name='rightLL']").val()                           === "" ? dataEdit[row[i]][91] : $("input[name='rightLL']").val()),
                        ($("input[name='leftLL']").val()                            === "" ? dataEdit[row[i]][92] : $("input[name='leftLL']").val()),
                        ($("input[name='muscleWasting']").val()                     === "" ? dataEdit[row[i]][93] : $("input[name='muscleWasting']").val()),
                        ($("input[name='bodyTenderness']").val()                    === "" ? dataEdit[row[i]][94] : $("input[name='bodyTenderness']").val()),
                        ($("select[name='conciousness']").val()                     === "" ? dataEdit[row[i]][95] : $("select[name='conciousness']").val()),
                        ($("input[name='time']:checked").val()                      === "" ? dataEdit[row[i]][96] : $("input[name='time']:checked").val()),
                        ($("input[name='place']:checked").val()                     === "" ? dataEdit[row[i]][97] : $("input[name='place']:checked").val()),
                        ($("input[name='people']:checked").val()                    === "" ? dataEdit[row[i]][98] : $("input[name='people']:checked").val()),
                        ($("input[name='voice']:checked").val()                     === "" ? dataEdit[row[i]][99] : $("input[name='voice']:checked").val()),
                        ($("input[name='pain']:checked").val()                      === "" ? dataEdit[row[i]][100] : $("input[name='pain']:checked").val()),
                        ($("input[name='unresponsiveness']:checked").val()          === "" ? dataEdit[row[i]][101] : $("input[name='unresponsiveness']:checked").val()),
                        ($("input[name='sensoryLoss']").val()                       === "" ? dataEdit[row[i]][102] : $("input[name='sensoryLoss']").val()),
                        (changeLink('khcNo', 'FullBody', continuationID)                            === undefined ? dataEdit[row[i]][103] : changeLink('khcNo', 'FullBody', continuationID)),
                        ($("input[name='smell']").val()                             === "" ? dataEdit[row[i]][104] : $("input[name='smell']").val()),
                        ($("input[name='vision']").val()                            === "" ? dataEdit[row[i]][105] : $("input[name='vision']").val()),
                        ($("input[name='lightDetection']").val()                    === "" ? dataEdit[row[i]][106] : $("input[name='lightDetection']").val()),
                        ($("input[name='eyeMovement']").val()                       === "" ? dataEdit[row[i]][107] : $("input[name='eyeMovement']").val()),
                        ($("input[name='raiseEyelid']").val()                       === "" ? dataEdit[row[i]][108] : $("input[name='raiseEyelid']").val()),
                        ($("input[name='eyeMovement2']").val()                      === "" ? dataEdit[row[i]][109] : $("input[name='eyeMovement2']").val()),
                        ($("input[name='facialSensation']").val()                   === "" ? dataEdit[row[i]][110] : $("input[name='facialSensation']").val()),
                        ($("input[name='eyeMovement3']").val()                      === "" ? dataEdit[row[i]][111] : $("input[name='eyeMovement3']").val()),
                        ($("input[name='facialExpression']").val()                  === "" ? dataEdit[row[i]][112] : $("input[name='facialExpression']").val()),
                        ($("input[name='taste']").val()                             === "" ? dataEdit[row[i]][113] : $("input[name='taste']").val()),
                        ($("input[name='productionTears']").val()                   === "" ? dataEdit[row[i]][114] : $("input[name='productionTears']").val()),
                        ($("input[name='hearingBalance']").val()                    === "" ? dataEdit[row[i]][115] : $("input[name='hearingBalance']").val()),
                        ($("input[name='swallowing']").val()                        === "" ? dataEdit[row[i]][116] : $("input[name='swallowing']").val()),
                        ($("input[name='gagReflex']").val()                         === "" ? dataEdit[row[i]][117] : $("input[name='gagReflex']").val()),
                        ($("input[name='speechNerve']").val()                       === "" ? dataEdit[row[i]][118] : $("input[name='speechNerve']").val()),
                        ($("input[name='shrugging']").val()                         === "" ? dataEdit[row[i]][119] : $("input[name='shrugging']").val()),
                        ($("input[name='tongueMovement']").val()                    === "" ? dataEdit[row[i]][120] : $("input[name='tongueMovement']").val()),
                        ($("textarea[name='extNotes']").val()                       === "" ? dataEdit[row[i]][121] : $("textarea[name='extNotes']").val()),
                    ]
                ];
                var body = {
                    range: "'" + formID + "'!" + parseInt(parseInt(row[i]) + 2) + ":" + parseInt(parseInt(row[i]) + 2),
                    values: valuesMedicalAssessment,
                };

                batchUpdateBody.data.push(body);

                break;
            }
            case "patientContinuationRecord": {
                var valuesPatientContinuationSheet = [
                    [
                        generateTime(),
                        dataEdit[row[i]][1],
                        ($("input[name='patientName']").val() === "" ? dataEdit[row[i]][2] : $("input[name='patientName']").val()),
                        ($("input[name='khcNo']").val() === "" ? dataEdit[row[i]][3] : $("input[name='khcNo']").val()),
                        ($("input[name='date']").val() === "" ? dataEdit[row[i]][4] : $("input[name='date']").val()),
                        ($("input[name='assessedBy']").val() === "" ? dataEdit[row[i]][5] : $("input[name='assessedBy']").val()),
                        ($("input[name='pain']:checked").val() === "" ? dataEdit[row[i]][6] : $("input[name='pain']:checked").val()),
                        ($("input[name='sitePain1']").val() === "" ? dataEdit[row[i]][7] : $("input[name='sitePain1']").val()),
                        ($("input[name='sitePain2']").val() === "" ? dataEdit[row[i]][8] : $("input[name='sitePain2']").val()),
                        ($("input[name='sitePain3']").val() === "" ? dataEdit[row[i]][9] : $("input[name='sitePain3']").val()),
                        ($("input[name='duration1']").val() === "" ? dataEdit[row[i]][10] : $("input[name='duration1']").val()),
                        ($("select[name='durationDayWeekMonth1']").val() === "" ? dataEdit[row[i]][11] : $("select[name='durationDayWeekMonth1']").val()),
                        ($("input[name='duration2']").val() === "" ? dataEdit[row[i]][12] : $("input[name='duration2']").val()),
                        ($("select[name='durationDayWeekMonth2']").val() === "" ? dataEdit[row[i]][13] : $("select[name='durationDayWeekMonth2']").val()),
                        ($("input[name='duration3']").val() === "" ? dataEdit[row[i]][14] : $("input[name='duration3']").val()),
                        ($("select[name='durationDayWeekMonth3']").val() === "" ? dataEdit[row[i]][15] : $("select[name='durationDayWeekMonth3']").val()),
                        ($("input[name='radiationPain']:checked").val() === "" ? dataEdit[row[i]][16] : $("input[name='radiationPain']:checked").val()),
                        ($("input[name='placeOfPain']").val() === "" ? dataEdit[row[i]][17] : $("input[name='placeOfPain']").val()),
                        ($("input[name='painInterval']:checked").val() === "" ? dataEdit[row[i]][18] : $("input[name='painInterval']:checked").val()),
                        ($("input[name='painThrobbing']:checked").val() === "" ? dataEdit[row[i]][19] : $("input[name='painThrobbing']:checked").val()),
                        ($("input[name='painPricking']:checked").val() === "" ? dataEdit[row[i]][20] : $("input[name='painPricking']:checked").val()),
                        ($("input[name='painSlicing']:checked").val() === "" ? dataEdit[row[i]][21] : $("input[name='painSlicing']:checked").val()),
                        ($("input[name='painAching']:checked").val() === "" ? dataEdit[row[i]][22] : $("input[name='painAching']:checked").val()),
                        ($("input[name='painShooting']:checked").val() === "" ? dataEdit[row[i]][23] : $("input[name='painShooting']:checked").val()),
                        ($("input[name='painPulling']:checked").val() === "" ? dataEdit[row[i]][24] : $("input[name='painPulling']:checked").val()),
                        ($("input[name='painBurning']:checked").val() === "" ? dataEdit[row[i]][25] : $("input[name='painBurning']:checked").val()),
                        ($("input[name='painShock']:checked").val() === "" ? dataEdit[row[i]][26] : $("input[name='painShock']:checked").val()),
                        ($("input[name='painDull']:checked").val() === "" ? dataEdit[row[i]][27] : $("input[name='painDull']:checked").val()),
                        ($("input[name='painN/A']:checked").val() === "" ? dataEdit[row[i]][28] : $("input[name='painN/A']:checked").val()),
                        ($("input[name='natureOfPainOthers']").val() === "" ? dataEdit[row[i]][29] : $("input[name='natureOfPainOthers']").val()),
                        ($("input[name='painAggravatedBy']").val() === "" ? dataEdit[row[i]][30] : $("input[name='painAggravatedBy']").val()),
                        ($("input[name='numericalScale']").val() === "" ? dataEdit[row[i]][31] : $("input[name='numericalScale']").val()),
                        ($("select[name='verbalScore']").val() === "" ? dataEdit[row[i]][32] : $("select[name='verbalScore']").val()),
                        ($("input[name='painRelievedByMassaging']:checked").val() === "" ? dataEdit[row[i]][33] : $("input[name='painRelievedByMassaging']:checked").val()),
                        ($("input[name='painRelievedByRepositioning']:checked").val() === "" ? dataEdit[row[i]][34] : $("input[name='painRelievedByRepositioning']:checked").val()),
                        ($("input[name='painRelievedByMedication']:checked").val() === "" ? dataEdit[row[i]][35] : $("input[name='painRelievedByMedication']:checked").val()),
                        ($("input[name='backgroundPainMedication']").val() === "" ? dataEdit[row[i]][36] : $("input[name='backgroundPainMedication']").val()),
                        ($("input[name='breakthroughMedication']").val() === "" ? dataEdit[row[i]][37] : $("input[name='breakthroughMedication']").val()),
                        ($("input[name='painRelievedAfterValue']").val() === "" ? dataEdit[row[i]][38] : $("input[name='painRelievedAfterValue']").val()),
                        ($("select[name='painRelievedAfterMinHr']").val() === "" ? dataEdit[row[i]][39] : $("select[name='painRelievedAfterMinHr']").val()),
                        ($("input[name='numericalScaleAfter']").val() === "" ? dataEdit[row[i]][40] : $("input[name='numericalScaleAfter']").val()),
                        ($("select[name='verbalScoreAfter']").val() === "" ? dataEdit[row[i]][41] : $("select[name='verbalScoreAfter']").val()),
                        ($("input[name='shortnessBreath']:checked").val() === "" ? dataEdit[row[i]][42] : $("input[name='shortnessBreath']:checked").val()),
                        ($("input[name='durationShortnessBreath']").val() === "" ? dataEdit[row[i]][43] : $("input[name='durationShortnessBreath']").val()),
                        ($("select[name='durationShortnessBreathDayWeekMonth']").val() === "" ? dataEdit[row[i]][44] : $("select[name='durationShortnessBreathDayWeekMonth']").val()),
                        ($("input[name='shortnessBreathAt']:checked").val() === "" ? dataEdit[row[i]][45] : $("input[name='shortnessBreathAt']:checked").val()),
                        ($("input[name='whatExertion']").val() === "" ? dataEdit[row[i]][46] : $("input[name='whatExertion']").val()),
                        ($("input[name='shortnessBreathRelievedByResting']:checked").val() === "" ? dataEdit[row[i]][47] : $("input[name='shortnessBreathRelievedByResting']:checked").val()),
                        ($("input[name='durationResting']").val() === "" ? dataEdit[row[i]][48] : $("input[name='durationResting']").val()),
                        ($("select[name='durationRestingDayWeekMonth']").val() === "" ? dataEdit[row[i]][49] : $("select[name='durationRestingDayWeekMonth']").val()),
                        ($("input[name='shortnessBreathRelievedByOxygen']:checked").val() === "" ? dataEdit[row[i]][50] : $("input[name='shortnessBreathRelievedByOxygen']:checked").val()),
                        ($("input[name='oxygenLevel']").val() === "" ? dataEdit[row[i]][51] : $("input[name='oxygenLevel']").val()),
                        ($("input[name='shortnessBreathRelievedByMedication']:checked").val() === "" ? dataEdit[row[i]][52] : $("input[name='shortnessBreathRelievedByMedication']:checked").val()),
                        ($("input[name='medicationsWithin']").val() === "" ? dataEdit[row[i]][53] : $("input[name='medicationsWithin']").val()),
                        ($("select[name='medicationsWithinMinHrs']").val() === "" ? dataEdit[row[i]][54] : $("select[name='medicationsWithinMinHrs']").val()),
                        ($("input[name='medicationsDosageFrequency']").val() === "" ? dataEdit[row[i]][55] : $("input[name='medicationsDosageFrequency']").val()),       
                        ($("input[name='cough']:checked").val() === "" ? dataEdit[row[i]][56] : $("input[name='cough']:checked").val()),
                        ($("input[name='durationCough']").val() === "" ? dataEdit[row[i]][57] : $("input[name='durationCough']").val()),
                        ($("select[name='durationCoughDuration']").val() === "" ? dataEdit[row[i]][58] : $("select[name='durationCoughDuration']").val()),
                        ($("input[name='productivity']:checked").val() === "" ? dataEdit[row[i]][59] : $("input[name='productivity']:checked").val()),
                        ($("input[name='sputum']:checked").val() === "" ? dataEdit[row[i]][60] : $("input[name='sputum']:checked").val()),
                        ($("input[name='sputumOtr']").val() === "" ? dataEdit[row[i]][61] : $("input[name='sputumOtr']").val()),
                        ($("input[name='expectoration']:checked").val() === "" ? dataEdit[row[i]][62] : $("input[name='expectoration']:checked").val()),
                        ($("select[name='coughConsistency']").val() === "" ? dataEdit[row[i]][63] : $("select[name='coughConsistency']").val()),
                        ($("input[name='coughMedication']").val() === "" ? dataEdit[row[i]][64] : $("input[name='coughMedication']").val()),
                        ($("input[name='appetite']:checked").val() === "" ? dataEdit[row[i]][65] : $("input[name='appetite']:checked").val()),
                        ($("input[name='durationAppetite']").val() === "" ? dataEdit[row[i]][66] : $("input[name='durationAppetite']").val()),
                        ($("select[name='durationAppetiteDayWeekMonth']").val() === "" ? dataEdit[row[i]][67] : $("select[name='durationAppetiteDayWeekMonth']").val()),
                        ($("input[name='oral']:checked").val() === "" ? dataEdit[row[i]][68] : $("input[name='oral']:checked").val()),
                        ($("input[name='oralInput']").val() === "" ? dataEdit[row[i]][69] : $("input[name='oralInput']").val()),
                        ($("input[name='ngTube']:checked").val() === "" ? dataEdit[row[i]][70] : $("input[name='ngTube']:checked").val()),
                        ($("input[name='ngScoops']").val() === "" ? dataEdit[row[i]][71] : $("input[name='ngScoops']").val()),
                        ($("input[name='ngWater']").val() === "" ? dataEdit[row[i]][72] : $("input[name='ngWater']").val()),
                        ($("input[name='ngFrequency']").val() === "" ? dataEdit[row[i]][73] : $("input[name='ngFrequency']").val()),
                        ($("input[name='ngAspiration']").val() === "" ? dataEdit[row[i]][74] : $("input[name='ngAspiration']").val()),
                        ($("input[name='ngFormula']").val() === "" ? dataEdit[row[i]][75] : $("input[name='ngFormula']").val()),
                        ($("input[name='pegTube']:checked").val() === "" ? dataEdit[row[i]][76] : $("input[name='pegTube']:checked").val()),
                        ($("input[name='pegScoops']").val() === "" ? dataEdit[row[i]][77] : $("input[name='pegScoops']").val()),
                        ($("input[name='pegWater']").val() === "" ? dataEdit[row[i]][78] : $("input[name='pegWater']").val()),
                        ($("input[name='pegFrequency']").val() === "" ? dataEdit[row[i]][78] : $("input[name='pegFrequency']").val()),
                        ($("input[name='pegFormula']").val() === "" ? dataEdit[row[i]][80] : $("input[name='pegFormula']").val()),
                        ($("input[name='dysphagia']:checked").val() === "" ? dataEdit[row[i]][81] : $("input[name='dysphagia']:checked").val()),
                        ($("input[name='dysphagiaType']:checked").val() === "" ? dataEdit[row[i]][82] : $("input[name='dysphagiaType']:checked").val()),
                        ($("input[name='swallow']:checked").val() === "" ? dataEdit[row[i]][83] : $("input[name='swallow']:checked").val()),
                        ($("input[name='nauseaVomit']:checked").val() === "" ? dataEdit[row[i]][84] : $("input[name='nauseaVomit']:checked").val()),
                        ($("input[name='durationNV']").val() === "" ? dataEdit[row[i]][85] : $("input[name='durationNV']").val()),
                        ($("select[name='durationNVDayWeekMonth']").val() === "" ? dataEdit[row[i]][86] : $("select[name='durationNVDayWeekMonth']").val()),
                        ($("input[name='nauseaOrVomiting']:checked").val() === "" ? dataEdit[row[i]][87] : $("input[name='nauseaOrVomiting']:checked").val()),
                        ($("input[name='causeOfNV']:checked").val() === "" ? dataEdit[row[i]][88] : $("input[name='causeOfNV']:checked").val()),
                        ($("input[name='hrsOfFood']").val() === "" ? dataEdit[row[i]][89] : $("input[name='hrsOfFood']").val()),
                        ($("input[name='timeOfNV']:checked").val() === "" ? dataEdit[row[i]][90] : $("input[name='timeOfNV']:checked").val()),
                        ($("input[name='nvFrequency']").val() === "" ? dataEdit[row[i]][91] : $("input[name='nvFrequency']").val()),
                        ($("input[name='giddiness']:checked").val() === "" ? dataEdit[row[i]][92] : $("input[name='giddiness']:checked").val()),
                        ($("input[name='vomitConsistency']:checked").val() === "" ? dataEdit[row[i]][93] : $("input[name='vomitConsistency']:checked").val()),
                        ($("input[name='vomitConsistencyOtr']").val() === "" ? dataEdit[row[i]][94] : $("input[name='vomitConsistencyOtr']").val()),
                        ($("input[name='bmAnus']:checked").val() === "" ? dataEdit[row[i]][95] : $("input[name='bmAnus']:checked").val()),
                        ($("input[name='bmColostomy']:checked").val() === "" ? dataEdit[row[i]][96] : $("input[name='bmColostomy']:checked").val()),
                        ($("input[name='bmIleostomy']:checked").val() === "" ? dataEdit[row[i]][97] : $("input[name='bmIleostomy']:checked").val()),
                        ($("input[name='bmFrequency']").val() === "" ? dataEdit[row[i]][98] : $("input[name='bmFrequency']").val()),
                        ($("select[name='durationBMFrequncy']").val() === "" ? dataEdit[row[i]][99] : $("select[name='durationBMFrequncy']").val()),
                        ($("input[name='bmNBO']").val() === "" ? dataEdit[row[i]][100] : $("input[name='bmNBO']").val()),
                        ($("input[name='stoolConsistency']:checked").val() === "" ? dataEdit[row[i]][101] : $("input[name='stoolConsistency']:checked").val()),
                        ($("input[name='stoolNature']:checked").val() === "" ? dataEdit[row[i]][102] : $("input[name='stoolNature']:checked").val()),
                        ($("input[name='freshBloodStainDetail']:checked").val() === "" ? dataEdit[row[i]][103] : $("input[name='freshBloodStainDetail']:checked").val()),
                        ($("input[name='waterStoolDay']").val() === "" ? dataEdit[row[i]][104] : $("input[name='waterStoolDay']").val()),
                        ($("input[name='bmIncontinence']:checked").val() === "" ? dataEdit[row[i]][105] : $("input[name='bmIncontinence']:checked").val()),
                        ($("input[name='urineNormal']:checked").val() === "" ? dataEdit[row[i]][106] : $("input[name='urineNormal']:checked").val()),
                        ($("input[name='urineCBD']:checked").val() === "" ? dataEdit[row[i]][107] : $("input[name='urineCBD']:checked").val()),
                        ($("input[name='urineSPC']:checked").val() === "" ? dataEdit[row[i]][108] : $("input[name='urineSPC']:checked").val()),
                        ($("input[name='urineNep']:checked").val() === "" ? dataEdit[row[i]][109] : $("input[name='urineNep']:checked").val()),
                        ($("input[name='nephrostomyRL']:checked").val() === "" ? dataEdit[row[i]][110] : $("input[name='nephrostomyRL']:checked").val()),
                        ($("input[name='urineColour']:checked").val() === "" ? dataEdit[row[i]][111] : $("input[name='urineColour']:checked").val()),
                        ($("input[name='urineColourSta']").val() === "" ? dataEdit[row[i]][112] : $("input[name='urineColourSta']").val()),
                        ($("input[name='urineNature']:checked").val() === "" ? dataEdit[row[i]][113] : $("input[name='urineNature']:checked").val()),
                        ($("input[name='dysuria']:checked").val() === "" ? dataEdit[row[i]][114] : $("input[name='dysuria']:checked").val()),
                        ($("input[name='dysuria/7']").val() === "" ? dataEdit[row[i]][115] : $("input[name='dysuria/7']").val()),
                        ($("input[name='dysuria/52']").val() === "" ? dataEdit[row[i]][116] : $("input[name='dysuria/52']").val()),
                        ($("input[name='dysuria/12']").val() === "" ? dataEdit[row[i]][117] : $("input[name='dysuria/12']").val()), 
                        ($("input[name='delayInitiation']:checked").val() === "" ? dataEdit[row[i]][118] : $("input[name='delayInitiation']:checked").val()),
                        ($("input[name='urineRetention']:checked").val() === "" ? dataEdit[row[i]][119] : $("input[name='urineRetention']:checked").val()),
                        ($("input[name='urineIncontinence']:checked").val() === "" ? dataEdit[row[i]][120] : $("input[name='urineIncontinence']:checked").val()),
                        ($("input[name='sleepPattern']:checked").val() === "" ? dataEdit[row[i]][121] : $("input[name='sleepPattern']:checked").val()),
                        ($("input[name='sleepHrs']").val() === "" ? dataEdit[row[i]][122] : $("input[name='sleepHrs']").val()),
                        ($("input[name='sleepAlt']").val() === "" ? dataEdit[row[i]][123] : $("input[name='sleepAlt']").val()),
                        ($("input[name='sleepMedication']").val() === "" ? dataEdit[row[i]][124] : $("input[name='sleepMedication']").val()),
                        ($("textarea[name='otrPhychological']").val() === "" ? dataEdit[row[i]][125] : $("textarea[name='otrPhychological']").val()),
                        ($("input[name='examPatientName']").val() === "" ? dataEdit[row[i]][126] : $("input[name='examPatientName']").val()),
                        ($("input[name='examKhcNo']").val() === "" ? dataEdit[row[i]][127] : $("input[name='examKhcNo']").val()),
                        ($("input[name='examDate']").val() === "" ? dataEdit[row[i]][128] : $("input[name='examDate']").val()),
                        ($("input[name='examAssessedBy']").val() === "" ? dataEdit[row[i]][129] :$("input[name='examAssessedBy']").val()),
                        ($("select[name='examECOG']").val() === "" ? dataEdit[row[i]][130] : $("select[name='examECOG']").val()),
                        ($("input[name='alert']:checked").val() === "" ? dataEdit[row[i]][131] : $("input[name='alert']:checked").val()),
                        ($("input[name='drowsy']:checked").val() === "" ? dataEdit[row[i]][132] : $("input[name='drowsy']:checked").val()),
                        ($("select[name='arousal']").val() === "" ? dataEdit[row[i]][133] : $("select[name='arousal']").val()),
                        ($("input[name='confused']:checked").val() === "" ? dataEdit[row[i]][134] : $("input[name='confused']:checked").val()),
                        ($("input[name='confusedTxt']").val() === "" ? dataEdit[row[i]][135] : $("input[name='confusedTxt']").val()),
                        ($("input[name='conscious']:checked").val() === "" ? dataEdit[row[i]][136] : $("input[name='conscious']:checked").val()),
                        ($("input[name='unconscious']:checked").val() === "" ? dataEdit[row[i]][137] : $("input[name='unconscious']:checked").val()),
                        ($("input[name='semi']:checked").val() === "" ? dataEdit[row[i]][138] : $("input[name='semi']:checked").val()),
                        ($("input[name='pallor']:checked").val() === "" ? dataEdit[row[i]][139] : $("input[name='pallor']:checked").val()),
                        ($("input[name='jaundice']:checked").val() === "" ? dataEdit[row[i]][140] : $("input[name='jaundice']:checked").val()),
                        ($("input[name='cyanosis']:checked").val() === "" ? dataEdit[row[i]][141] : $("input[name='cyanosis']:checked").val()),
                        ($("input[name='hydration']:checked").val() === "" ? dataEdit[row[i]][142] : $("input[name='hydration']:checked").val()),
                        ($("input[name='clubbing']:checked").val() === "" ? dataEdit[row[i]][143] : $("input[name='clubbing']:checked").val()),
                        ($("input[name='lymphedema']:checked").val() === "" ? dataEdit[row[i]][144] : $("input[name='lymphedema']:checked").val()),
                        ($("select[name='pitting1']").val() === "" ? dataEdit[row[i]][145] : $("select[name='pitting1']").val()),
                        ($("input[name='pittingState1']").val() === "" ? dataEdit[row[i]][146] : $("input[name='pittingState1']").val()),             
                        ($("select[name='pitting2']").val() === "" ? dataEdit[row[i]][147] : $("select[name='pitting2']").val()),
                        ($("input[name='pittingState2']").val() === "" ? dataEdit[row[i]][148] : $("input[name='pittingState2']").val()),
                        ($("input[name='pressureSore']:checked").val() === "" ? dataEdit[row[i]][149] : $("input[name='pressureSore']:checked").val()),
                        ($("select[name='soreGrade1']").val() === "" ? dataEdit[row[i]][150] : $("select[name='soreGrade1']").val()),
                        ($("input[name='soreGradeState1']").val() === "" ? dataEdit[row[i]][151] : $("input[name='soreGradeState1']").val()),
                        ($("select[name='soreGrade2']").val() === "" ? dataEdit[row[i]][152] : $("select[name='soreGrade2']").val()),
                        ($("input[name='soreGradeState2']").val() === "" ? dataEdit[row[i]][153] : $("input[name='soreGradeState2']").val()),
                        ($("input[name='ocClean']:checked").val() === "" ? dataEdit[row[i]][154] : $("input[name='ocClean']:checked").val()),
                        ($("input[name='ocDry']:checked").val() === "" ? dataEdit[row[i]][155] : $("input[name='ocDry']:checked").val()),
                        ($("input[name='ocDirty']:checked").val() === "" ? dataEdit[row[i]][156] : $("input[name='ocDirty']:checked").val()),
                        ($("input[name='ocFungalInfection']:checked").val() === "" ? dataEdit[row[i]][157] : $("input[name='ocFungalInfection']:checked").val()),
                        ($("input[name='ocOther']:checked").val() === "" ? dataEdit[row[i]][158] : $("input[name='ocOther']:checked").val()),
                        ($("input[name='ocOtherTxt']").val() === "" ? dataEdit[row[i]][159] : $("input[name='ocOtherTxt']").val()),
                        ($("input[name='skinPetechiae']:checked").val() === "" ? dataEdit[row[i]][160] : $("input[name='skinPetechiae']:checked").val()),
                        ($("input[name='skinEcchymosis']:checked").val() === "" ? dataEdit[row[i]][161] : $("input[name='skinEcchymosis']:checked").val()),
                        ($("input[name='skinScar']:checked").val() === "" ? dataEdit[row[i]][162] : $("input[name='skinScar']:checked").val()),
                        ($("input[name='skinRash']:checked").val() === "" ? dataEdit[row[i]][163] : $("input[name='skinRash']:checked").val()),
                        ($("input[name='skinOthers']:checked").val() === "" ? dataEdit[row[i]][164] : $("input[name='skinOthers']:checked").val()),
                        ($("input[name='skinOtr']").val() === "" ? dataEdit[row[i]][165] : $("input[name='skinOtr']").val()),
                        ($("input[name='bp']").val() === "" ? dataEdit[row[i]][166] : $("input[name='bp']").val()),
                        ($("select[name='brState']").val() === "" ? dataEdit[row[i]][167] : $("select[name='brState']").val()),
                        ($("input[name='pulse']").val() === "" ? dataEdit[row[i]][168] : $("input[name='pulse']").val()),
                        ($("input[name='pulseMin']").val() === "" ? dataEdit[row[i]][169] : $("input[name='pulseMin']").val()),
                        ($("select[name='prState']").val() === "" ? dataEdit[row[i]][170] : $("select[name='prState']").val()),
                        ($("input[name='spO2roomAirPercent']").val() === "" ? dataEdit[row[i]][171] : $("input[name='spO2roomAirPercent']").val()),
                        ($("input[name='spO2L%']").val() === "" ? dataEdit[row[i]][172] : $("input[name='spO2L%']").val()),
                        ($("input[name='spO2L']").val() === "" ? dataEdit[row[i]][173] : $("input[name='spO2L']").val()),
                        ($("input[name='respiratory']").val() === "" ? dataEdit[row[i]][174] : $("input[name='respiratory']").val()),
                        ($("select[name='rrState']").val() === "" ? dataEdit[row[i]][175] : $("select[name='rrState']").val()),
                        ($("input[name='temperature']").val() === "" ? dataEdit[row[i]][176] : $("input[name='temperature']").val()),
                        ($("select[name='tempState']").val() === "" ? dataEdit[row[i]][177] : $("select[name='tempState']").val()),
                        ($("input[name='glucose']").val() === "" ? dataEdit[row[i]][178] : $("input[name='glucose']").val()),
                        ($("input[name='glucoseMMOL']").val() === "" ? dataEdit[row[i]][179] : $("input[name='glucoseMMOL']").val()),
                        ($("input[name='chestWall']").val() === "" ? dataEdit[row[i]][180] : $("input[name='chestWall']").val()),
                        ($("select[name='rlCon']").val() === "" ? dataEdit[row[i]][181] : $("select[name='rlCon']").val()),
                        ($("input[name='rlConTxt']").val() === "" ? dataEdit[row[i]][182] : $("input[name='rlConTxt']").val()),
                        ($("input[name='rlSound']").val() === "" ? dataEdit[row[i]][183] : $("input[name='rlSound']").val()),
                        ($("input[name='rlFineCrep']").val() === "" ? dataEdit[row[i]][184] : $("input[name='rlFineCrep']").val()),
                        ($("input[name='rlCoarseCrep']").val() === "" ? dataEdit[row[i]][185] : $("input[name='rlCoarseCrep']").val()),
                        ($("input[name='rlAir']:checked").val() === "" ? dataEdit[row[i]][186] : $("input[name='rlAir']:checked").val()),
                        ($("input[name='rlAirDecreasedTxt']").val() === "" ? dataEdit[row[i]][187] : $("input[name='rlAirDecreasedTxt']").val()),
                        ($("select[name='llCon']").val() === "" ? dataEdit[row[i]][188] : $("select[name='llCon']").val()),
                        ($("input[name='llConTxt']").val() === "" ? dataEdit[row[i]][189] : $("input[name='llConTxt']").val()),
                        ($("input[name='llSound']").val() === "" ? dataEdit[row[i]][190] : $("input[name='llSound']").val()),
                        ($("input[name='llFineCrep']").val() === "" ? dataEdit[row[i]][191] : $("input[name='llFineCrep']").val()),
                        ($("input[name='llCoarseCrep']").val() === "" ? dataEdit[row[i]][192] : $("input[name='llCoarseCrep']").val()),
                        ($("input[name='llAir']:checked").val() === "" ? dataEdit[row[i]][193] : $("input[name='llAir']:checked").val()),
                        ($("input[name='llAirDecreasedTxt']").val() === "" ? dataEdit[row[i]][194] : $("input[name='llAirDecreasedTxt']").val()),
                        (changeLink('khcNo', 'Lungs', continuationID) === undefined ? dataEdit[row[i]][195] : changeLink('khcNo', 'Lungs', continuationID)),
                        ($("input[name='heartSound']:checked").val() === "" ? dataEdit[row[i]][196] : $("input[name='heartSound']:checked").val()),
                        ($("input[name='heartMurmurTxt']").val() === "" ? dataEdit[row[i]][197] : $("input[name='heartMurmurTxt']").val()),
                        ($("input[name='abdominalWall']:checked").val() === "" ? dataEdit[row[i]][198] : $("input[name='abdominalWall']:checked").val()),
                        ($("input[name='abdomWallLoc']").val() === "" ? dataEdit[row[i]][199] : $("input[name='abdomWallLoc']").val()),
                        ($("input[name='abdomen']:checked").val() === "" ? dataEdit[row[i]][200] : $("input[name='abdomen']:checked").val()),
                        ($("input[name='abdoTenderTxt']").val() === "" ? dataEdit[row[i]][201] : $("input[name='abdoTenderTxt']").val()),
                        ($("input[name='abdomenLoc']").val() === "" ? dataEdit[row[i]][202] : $("input[name='abdomenLoc']").val()),
                        ($("select[name='massTenderness']").val() === "" ? dataEdit[row[i]][203] : $("select[name='massTenderness']").val()),
                        ($("select[name='massMobility']").val() === "" ? dataEdit[row[i]][204] : $("select[name='massMobility']").val()),
                        ($("select[name='massState']").val() === "" ? dataEdit[row[i]][205] : $("select[name='massState']").val()),
                        ($("input[name='massStateQuad']").val() === "" ? dataEdit[row[i]][206] : $("input[name='massStateQuad']").val()),
                        ($("input[name='massStateSize']").val() === "" ? dataEdit[row[i]][207] : $("input[name='massStateSize']").val()),
                        ($("input[name='shiftDull']:checked").val() === "" ? dataEdit[row[i]][208] : $("input[name='shiftDull']:checked").val()),
                        ($("input[name='hepatomegaly']:checked").val() === "" ? dataEdit[row[i]][209] : $("input[name='hepatomegaly']:checked").val()),
                        ($("input[name='hepNegativeTxt']").val() === "" ? dataEdit[row[i]][210] : $("input[name='hepNegativeTxt']").val()),
                        ($("input[name='splenomegaly']:checked").val() === "" ? dataEdit[row[i]][211] : $("input[name='splenomegaly']:checked").val()),
                        ($("input[name='splNegativeTxt']").val() === "" ? dataEdit[row[i]][212] : $("input[name='splNegativeTxt']").val()),
                        ($("select[name='bowelSound']").val() === "" ? dataEdit[row[i]][213] : $("select[name='bowelSound']").val()),
                        ($("select[name='perRectum']").val() === "" ? dataEdit[row[i]][214] : $("select[name='perRectum']").val()),
                        (changeLink('khcNo', 'LowerBody', continuationID) === undefined ? dataEdit[row[i]][215] : changeLink('khcNo', 'LowerBody', continuationID)),
                        ($("input[name='gastroOtr']").val() === "" ? dataEdit[row[i]][216] : $("input[name='gastroOtr']").val()),
                        ($("input[name='muscleRightUL']").val() === "" ? dataEdit[row[i]][217] : $("input[name='muscleRightUL']").val()),
                        ($("input[name='muscleLeftUL']").val() === "" ? dataEdit[row[i]][218] : $("input[name='muscleLeftUL']").val()),
                        ($("input[name='muscleRightLL']").val() === "" ? dataEdit[row[i]][219] : $("input[name='muscleRightLL']").val()),
                        ($("input[name='muscleLeftLL']").val() === "" ? dataEdit[row[i]][220] : $("input[name='muscleLeftLL']").val()),
                        ($("input[name='senseRightUL']:checked").val() === "" ? dataEdit[row[i]][221] : $("input[name='senseRightUL']:checked").val()),
                        ($("input[name='senseleftUL']:checked").val() === "" ? dataEdit[row[i]][222] : $("input[name='senseleftUL']:checked").val()),
                        ($("input[name='senserightLL']:checked").val() === "" ? dataEdit[row[i]][223] : $("input[name='senserightLL']:checked").val()),
                        ($("input[name='senseleftLL']:checked").val() === "" ? dataEdit[row[i]][224] : $("input[name='senseleftLL']:checked").val()),
                        ($("textarea[name='otrManage']").val() === "" ? dataEdit[row[i]][225] : $("textarea[name='otrManage']").val()),
                    ]
                ]
                var body = {
                    range: "'" + formID + "'!" + parseInt(parseInt(row[i]) + 2) + ":" + parseInt(parseInt(row[i]) + 2),
                    values: valuesPatientContinuationSheet,
                };

                batchUpdateBody.data.push(body);

                break;
            }
            case "extraNotesForm": {
                var valuesExtraNotes = [
                    [
                        generateTime(),
                        document.getElementsByName("patientName")[0].innerHTML,
                        document.getElementsByName("patientNameSearch")[0].innerHTML,
                        ($("textarea[name='extraNotes']").val() === "" ? dataEdit[row[i]][3] : $("textarea[name='extraNotes']").val()),
                    ]
                ]
                var body = {
                    range: "'" + formID + "'!" + parseInt(parseInt(row[i]) + 2) + ":" + parseInt(parseInt(row[i]) + 2),
                    values: valuesExtraNotes,
                };

                batchUpdateBody.data.push(body);

                break;
            }
            case "medicationForm": {
                var valuesMedication = [
                    [
                        generateTime(),
                        document.getElementsByName("patientName")[0].innerHTML,
                        document.getElementsByName("patientNameSearch")[0].innerHTML,
                        ($("input[name='date']").val()        === "" ? dataEdit[row[i]][3] : $("input[name='date']").val()),
                        ($("input[name='medication']").val()  === "" ? dataEdit[row[i]][4] : $("input[name='medication']").val()),
                        ($("input[name='dosage']").val()      === "" ? dataEdit[row[i]][5] : $("input[name='dosage']").val()),
                        ($("input[name='frequency']").val()   === "" ? dataEdit[row[i]][6] : $("input[name='frequency']").val()),
                        ($("input[name='dateStarted']").val() === "" ? dataEdit[row[i]][7] : $("input[name='dateStarted']").val()),
                        ($("input[name='dateCeased']").val()  === "" ? dataEdit[row[i]][8] : $("input[name='dateCeased']").val()),
                        ($("input[name='hospital']").val()    === "" ? dataEdit[row[i]][9] : $("input[name='hospital']").val())
                    ]
                ]
                var body = {
                    range: "'" + formID + "'!" + parseInt(parseInt(row[i]) + 2) + ":" + parseInt(parseInt(row[i]) + 2),
                    values: valuesMedication,
                };

                batchUpdateBody.data.push(body);

                break;
            }
            case "medicationEquipmentForm": {
                var valuesMedicationEquipment = [
                    [
                        generateTime(),
                        document.getElementsByName("patientName")[0].innerHTML,
                        document.getElementsByName("patientNameSearch")[0].innerHTML,
                        ($("input[name='date']").val()               === "" ? dataEdit[row[i]][3] : $("input[name='date']").val()),
                        ($("input[name='medicationName']").val()     === "" ? dataEdit[row[i]][4] : $("input[name='medicationName']").val()),
                        ($("input[name='medicationQuantity']").val() === "" ? dataEdit[row[i]][5] : $("input[name='medicationQuantity']").val()),
                        ($("input[name='nursingItemName']").val()    === "" ? dataEdit[row[i]][6] : $("input[name='nursingItemName']").val()),
                        ($("input[name='nursingItemNo']").val()      === "" ? dataEdit[row[i]][7] : $("input[name='nursingItemNo']").val())
                    ]
                ]
                var body = {
                    range: "'" + formID + "'!" + parseInt(parseInt(row[i]) + 2) + ":" + parseInt(parseInt(row[i]) + 2),
                    values: valuesMedicationEquipment
                };

                batchUpdateBody.data.push(body);

                break;
            }
            case "homeVisitForm": {
                var valuesHomeVisit = [
                    [
                        generateTime(),
                        document.getElementsByName("patientName")[0].innerHTML,
                        document.getElementsByName("patientNameSearch")[0].innerHTML,
                        ($("input[name='no']").val()        === "" ? dataEdit[row[i]][3] : $("input[name='no']").val()),
                        ($("input[name='date']").val()      === "" ? dataEdit[row[i]][4] : $("input[name='date']").val()),
                        ($("input[name='visitedBy']").val() === "" ? dataEdit[row[i]][5] : $("input[name='visitedBy']").val()),
                        ($("input[name='place']").val()     === "" ? dataEdit[row[i]][6] : $("input[name='place']").val())
                    ]
                ]
                var body = {
                    range: "'" + formID + "'!" + parseInt(parseInt(row[i]) + 2) + ":" + parseInt(parseInt(row[i]) + 2),
                    values: valuesHomeVisit
                };

                batchUpdateBody.data.push(body);

                break;
            }
            case "endOfLifeForm": {
                var valuesEndOfLife = [
                    [
                        generateTime(),
                        document.getElementsByName("patientName")[0].innerHTML,
                        document.getElementsByName("patientNameSearch")[0].innerHTML,
                        ($("input[name='date']").val()                    === "" ? dataEdit[row[i]][3] : $("input[name='date']").val()),
                        ($("input[name='lifeSustainingTreatment']").val() === "" ? dataEdit[row[i]][4] : $("input[name='lifeSustainingTreatment']").val()),
                        ($("input[name='cpr']").val()                     === "" ? dataEdit[row[i]][5] : $("input[name='cpr']").val()),
                        ($("input[name='intubation']").val()              === "" ? dataEdit[row[i]][6] : $("input[name='intubation']").val()),
                        ($("input[name='artificialHydration']").val()     === "" ? dataEdit[row[i]][7] : $("input[name='artificialHydration']").val()),
                        ($("input[name='antibiotics']").val()             === "" ? dataEdit[row[i]][8] : $("input[name='antibiotics']").val()),
                        ($("input[name='dialysis']").val()                === "" ? dataEdit[row[i]][9] : $("input[name='dialysis']").val()),
                        ($("input[name='proxyDecision']").val()           === "" ? dataEdit[row[i]][10] : $("input[name='proxyDecision']").val()),
                        ($("input[name='placeOfCare']").val()             === "" ? dataEdit[row[i]][11] : $("input[name='placeOfCare']").val()),
                        ($("input[name='typeOfFuneral']").val()           === "" ? dataEdit[row[i]][12] : $("input[name='typeOfFuneral']").val()),
                        ($("input[name='specialWishes']").val()           === "" ? dataEdit[row[i]][13] : $("input[name='specialWishes']").val())
                    ]
                ]
                var body = {
                    range: "'" + formID + "'!" + parseInt(parseInt(row[i]) + 2) + ":" + parseInt(parseInt(row[i]) + 2),
                    values: valuesEndOfLife,
                };

                batchUpdateBody.data.push(body);

                break;
            }
        }
    }
    
    if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
        if (!edited){
            var request = gapi.client.sheets.spreadsheets.values.batchUpdate(params, batchUpdateBody);
            request.then(function(response) {
                console.log(response.result);
                spinner.setAttribute('style', 'display: none;');
                appendPre("Record(s) edited. Refresh the page to see the result.");
                edited = true;
            }, function(reason) {
                console.log(reason);
                spinner.setAttribute('style', 'display: none;');
                appendPre('error: ' + reason.result.error.message);
            });
        }
        else {
            spinner.setAttribute('style', 'display: none;');
            appendPre("Please select another record(s) to edit.");
        }

    }
}