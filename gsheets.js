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
var spreadsheetId = '1IYtuDTAi1IjRFaQEC6_6L0I-xJt1XaKAV0p03yqk-_4';
var folderID = '1gS2LXwlGZCpzIVIFJXwnIBm82KkIy7Wr';
var fileDetail;
var linkGenogram = '', linkLung = '', linkLowerBody = '', linkFullBody = '';

var table = document.querySelector("table");
var header;
var headerGenerated = false;
var tableDelete = false;
var khcno;
var name;

var data = [];

var rangeForm;

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

//Searches the sheet for the record
function searchSheet(range) {
    data = [];
    var formID = document.getElementById("formID").innerText;

    //Obtains the search field values
    if(formID == 'searchForm' || formID == 'medicalAssessmentRecord' || formID == 'referralRecord' || formID == 'patientContinuationRecord'){
        var input = document.getElementById("patientNameSearch").value;
    }
    else{
        var input = document.getElementById("patientNameSearch").innerText;
    }

    //Checks if user is authorized first before doing anything
    if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
        alert("Please authorize before searching records.");
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
            if (range.values.length > 0) {
                removeTable();
                //i = 1 because we skip the header
                for (i = 1; i < range.values.length; i++) {
                    var row = range.values[i];
                    // Searches against which row, we control how we want user to search here
                    if (input === row[2] || (input === row[3] && formID == 'referralRecord') || (input === row[2] && formID == 'medicalAssessmentRecord') || (input === row[123] && formID == 'patientContinuationRecord')) {
                        khcno = row[2];
                        name = row[3];
                        //Show searched records
                        if (formID == 'extraNotesForm' || formID == 'medicationForm' || formID == 'medicationEquipmentForm' || formID == 'homeVisitForm' ||
                            formID == 'endOfLifeForm' || formID == 'referralRecord' || formID == 'medicalAssessmentRecord' || formID == 'patientContinuationRecord') {
                            if (!headerGenerated) {
                                generateTableHead(table, header);
                                
                                headerGenerated = true;
                            }
                            data.push(row);
                            generateTable(table, row, i);
                        }
    
                        count++;
                    }
                    //Shows all records
                    else if ((formID == 'medicalAssessmentRecord' || formID == 'referralRecord' || formID == 'patientContinuationRecord') && input === "") {
                        if (!headerGenerated) {
                            generateTableHead(table, header);
                            headerGenerated = true;
                        }
                        data.push(row);
                        generateTable(table, row, i);
                        count++;
                    }
                }
                if (count > 0) {
                    alert("We have found " + count + " record(s).");
                    document.getElementById("extraNotes").setAttribute("href", "extraNotes.html?khcno=" + khcno +"&name=" + name);
                    document.getElementById("medicationForm").setAttribute("href", "medicationForm.html?khcno=" + khcno +"&name=" + name);
                    document.getElementById("medicationEquipmentForm").setAttribute("href", "medicationEquipmentForm.html?khcno=" + khcno +"&name=" + name);
                    document.getElementById("homeVisitForm").setAttribute("href", "homeVisitForm.html?khcno=" + khcno +"&name=" + name);
                    document.getElementById("endOfLifeForm").setAttribute("href", "endOfLifeForm.html?khcno=" + khcno +"&name=" + name);
                    document.getElementById("links").setAttribute("style", "display: block");
                }
                else {
                    alert('No records found.');
                }
            } else {
                alert('Not initialized.');
            }
        }, function (response) {
            alert('Error: ' + response.result.error.message);
        });
    }

    
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
    var row = table.insertRow();
    var link = "https://drive.google.com/uc?export=view&id="
    for (var i = 0; i < data.length; i++) {
        var cell = row.insertCell();
        var text = document.createTextNode(data[i]);
        cell.appendChild(text);

        //Shows checkbox in the first column
        if(i == 0) {
            var id = 'checkbox' + count;
            var string2 = "showStuff(\'" + id + "\',\'" + 'buttons' + "\')";
            /*<label class="container" style="width: 25px;height: 10px;"><input type="checkbox" name="row" id="checkbox1" value="1" onclick="showRow();showStuff('checkbox1','buttons')">
                        <span class="checkBox"></span>
            </label>*/
            var string = "<label class='container' style='width: 25px; height: 10px; padding-right: 0;'><input type='checkbox' name='row' id='" + id + "' value = " + count + " onclick=showRow();" + string2 + "><span class='checkBox'></span></input></label>";
            cell.innerHTML = string;
        } 

        //Shows links as actual link
        if (data[i].includes(link)) {
            var string = "<a href='" + data[i] + "'>" + data[i] + "</a>";
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
    var valid = true;
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
                    linkLung,
                    $("input[name='abdominalWall']").val(),
                    $("input[name='ascites']").val(),
                    $("input[name='hepatomegaly']").val(),
                    $("input[name='splenomegaly']").val(),
                    $("input[name='bowelSounds']").val(),
                    $("input[name='perRectum']").val(),
                    $("input[name='perVagina']").val(),
                    linkLowerBody,
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
                    linkFullBody,
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
                    $("input[name='patientName']").val(),
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
                    linkLung,
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
                    linkLowerBody,
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
        if(gapi.auth2.getAuthInstance().isSignedIn.get()){
            gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: spreadsheetId,
                range: rangeForm,
                valueInputOption: "RAW",
                resource: body
            }).then((response) => {
                var result = response.result;
                console.log(`${result.updates.updatedCells} cells appended.`)
                appendPre("Submitted.");
            });
        }
        else{
            alert('Please authorize before submitting.');
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
        alert("Please authorize before deleting records.");
        return;
    } else {
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
                            "startIndex": parseInt(array[i]),
                            "endIndex": parseInt(array[i]) + 1,
                        }
                    }
                }
            )
    
            for(var j = 0; j < array.length; j++) {
                array[j]--;
            }
        }
        console.log(batchUpdateValuesRequestBody.requests);
        gapi.client.sheets.spreadsheets.batchUpdate(params, batchUpdateValuesRequestBody).then(function(response) {
            console.log(response.result);
            appendPre("Records deleted. Refresh the page to see the result.")
        })
    }
}

//Edits a record
function editRecord(formID, row) {
    //Checking for invalid row selections first
    if(row.length > 1) {
        console.log("More than one records selected. Breaking..");
        return;
    } else if (isNaN(row)) {
        console.log("No records selected. Breaking..");
        return;
    }

    var range = "'" + formID + "'!" + parseInt(parseInt(row) + 1) + ":" + parseInt(parseInt(row) + 1);
    var form = document.getElementById('formID').innerText;

    console.log(range);

    var params = {
        spreadsheetId: spreadsheetId,  
        range: range,  
        valueInputOption: 'RAW',  
    };

    switch (form) {
        case "referralRecord": {
            var valuesReferral = [
                [
                    generateTime(),
                    ($("input[name='patientName']").val()              === "" ? data[row-1][1] : $("input[name='patientName']").val()),
                    ($("input[name='ic']").val()                       === "" ? data[row-1][2] : $("input[name='ic']").val()),
                    ($("input[name='rn']").val()                       === "" ? data[row-1][3] : $("input[name='rn']").val()),
                    ($("select[name='sex']").val()                     === "" ? data[row-1][4] : $("input[name='sex']").val()),
                    ($("input[name='age']").val()                      === "" ? data[row-1][5] : $("input[name='age']").val()),
                    ($("textarea[name='addressBox']").val()            === "" ? data[row-1][6] : $("textarea[name='addressBox']").val()),
                    ($("input[name='homeTelephoneNo']").val()          === "" ? data[row-1][7] : $("input[name='homeTelephoneNo']").val()),
                    ($("input[name='handphoneNo']").val()              === "" ? data[row-1][8] : $("input[name='handphoneNo']").val()),
                    ($("input[name='contactPerson']").val()            === "" ? data[row-1][9] : $("input[name='contactPerson']").val()),
                    ($("input[name='relationship']").val()             === "" ? data[row-1][10] : $("input[name='relationship']").val()),
                    ($("input[name='telephoneNo']").val()              === "" ? data[row-1][11] : $("input[name='telephoneNo']").val()),
                    ($("input[name='languageSpoken']").val()           === "" ? data[row-1][12] : $("input[name='languageSpoken']").val()),
                    ($("textarea[name='history']").val()               === "" ? data[row-1][13] : $("textarea[name='history']").val()),
                    ($("input[name='diagnosisDate']").val()            === "" ? data[row-1][14] : $("input[name='diagnosisDate']").val()),
                    ($("input[name='prognosis']:checked").val()        === "" ? data[row-1][15] : $("input[name='prognosis']:checked").val()),
                    ($("input[name='diagnosisInform']:checked").val()  === "" ? data[row-1][16] : $("input[name='diagnosisInform']:checked").val()),
                    ($("input[name='prognosisInform']:checked").val()  === "" ? data[row-1][17] : $("input[name='prognosisInform']:checked").val()),
                    ($("textarea[name='treatment']").val()             === "" ? data[row-1][18] : $("textarea[name='treatment']").val()),
                    ($("input[name='currentMedication']").val()        === "" ? data[row-1][19] : $("input[name='currentMedication']").val()),
                    ($("textarea[name='investRes']").val()             === "" ? data[row-1][20] : $("textarea[name='investRes']").val()),
                    ($("input[name='referringDoctor']").val()          === "" ? data[row-1][21] : $("input[name='referringDoctor']").val()),
                    ($("input[name='speciality']").val()               === "" ? data[row-1][22] : $("input[name='speciality']").val()),
                    ($("input[name='hospital']").val()                 === "" ? data[row-1][23] : $("input[name='hospital']").val()),
                    ($("input[name='officePhoneNo']").val()            === "" ? data[row-1][24] : $("input[name='officePhoneNo']").val()),
                    ($("input[name='faxNo']").val()                    === "" ? data[row-1][25] : $("input[name='faxNo']").val()),
                    ($("input[name='date']").val()                     === "" ? data[row-1][26] : $("input[name='date']").val()),
                    ($("input[name='patientInformed']:checked").val()  === "" ? data[row-1][27] : $("input[name='patientInformed']:checked").val()),
                    ($("input[name='relativeInformed']:checked").val() === "" ? data[row-1][28] : $("input[name='relativeInformed']:checked").val()),
                    ($("input[name='allFilled']:checked").val()        === "" ? data[row-1][29] : $("input[name='allFilled']:checked").val()),
                ]
            ];
            var body = {
                values: valuesReferral
            };
            break;
        }
        case "medicalAssessmentRecord": {
            var valuesMedicalAssessment = [
                [
                    generateTime(),
                    ($("input[name='allergies']").val()                         === "" ? data[row-1][1] : $("input[name='allergies']").val()),
                    ($("input[name='khcNo']").val()                             === "" ? data[row-1][2] : $("input[name='khcNo']").val()),
                    ($("input[name='name']").val()                              === "" ? data[row-1][3] : $("input[name='name']").val()),
                    ($("input[name='ic']").val()                                === "" ? data[row-1][4] : $("input[name='ic']").val()),
                    ($("textarea[name='address']").val()                        === "" ? data[row-1][5] : $("textarea[name='address']").val()),
                    ($("input[name='dob']").val()                               === "" ? data[row-1][6] : $("input[name='dob']").val()),
                    ($("input[name='sexAge']").val()                            === "" ? data[row-1][7] : $("input[name='sexAge']").val()),
                    ($("input[name='dateReferral']").val()                      === "" ? data[row-1][8] : $("input[name='dateReferral']").val()),
                    ($("textarea[name='phoneNo']").val()                        === "" ? data[row-1][9] : $("textarea[name='phoneNo']").val()),
                    ($("input[name='initialContact']").val()                    === "" ? data[row-1][10] : $("input[name='initialContact']").val()),
                    ($("input[name='dateAssessment']").val()                    === "" ? data[row-1][11] : $("input[name='dateAssessment']").val()),
                    ($("input[name='assessedBy']").val()                        === "" ? data[row-1][12] : $("input[name='assessedBy']").val()),
                    ($("input[name='languageSpokenPatient']").val()             === "" ? data[row-1][13] : $("input[name='languageSpokenPatient']").val()),
                    ($("input[name='languageSpokenCaregiver']").val()           === "" ? data[row-1][14] : $("input[name='languageSpokenCaregiver']").val()),
                    ($("input[name='diagnosis']").val()                         === "" ? data[row-1][15] : $("input[name='diagnosis']").val()),
                    ($("input[name='dateOfNextAppointment']").val()             === "" ? data[row-1][16] : $("input[name='dateOfNextAppointment']").val()),
                    ($("textarea[name='historyIllness']").val()                 === "" ? data[row-1][17] : $("textarea[name='historyIllness']").val()),
                    ($("textarea[name='pastMedicalIllness']").val()             === "" ? data[row-1][18] : $("textarea[name='pastMedicalIllness']").val()),
                    ($("input[name='historySurgery']").val()                    === "" ? data[row-1][19] : $("input[name='historySurgery']").val()),
                    ($("input[name='historyRadiotherapy']").val()               === "" ? data[row-1][20] : $("input[name='historyRadiotherapy']").val()),
                    ($("input[name='historyChemotherapy']").val()               === "" ? data[row-1][21] : $("input[name='historyChemotherapy']").val()),
                    ($("select[name='maritalStatus']").val()                    === "" ? data[row-1][22] : $("select[name='maritalStatus']").val()),
                    ($("input[name='occupation']").val()                        === "" ? data[row-1][23] : $("input[name='occupation']").val()),
                    ($("input[name='interests']").val()                         === "" ? data[row-1][24] : $("input[name='interests']").val()),
                    ($("input[name='patientReligion']").val()                   === "" ? data[row-1][25] : $("input[name='patientReligion']").val()),
                    ($("input[name='familyReligion']").val()                    === "" ? data[row-1][26] : $("input[name='familyReligion']").val()),
                    ($("input[name='primaryCaregiver']").val()                  === "" ? data[row-1][27] : $("input[name='primaryCaregiver']").val()),
                    ($("input[name='emotionalStatusSupportive']:checked").val() === "" ? data[row-1][28] : $("input[name='emotionalStatusSupportive']:checked").val()),
                    ($("input[name='emotionalStatusCaring']:checked").val()     === "" ? data[row-1][29] : $("input[name='emotionalStatusCaring']:checked").val()),
                    ($("input[name='emotionalStatusConcerned']:checked").val()  === "" ? data[row-1][30] : $("input[name='emotionalStatusConcerned']:checked").val()),
                    ($("input[name='emotionalStatusAnxious']:checked").val()    === "" ? data[row-1][31] : $("input[name='emotionalStatusAnxious']:checked").val()),
                    ($("input[name='emotionalStatusWeary']:checked").val()      === "" ? data[row-1][32] : $("input[name='emotionalStatusWeary']:checked").val()),
                    ($("input[name='emotionalStatusExhausted']:checked").val()  === "" ? data[row-1][33] : $("input[name='emotionalStatusExhausted']:checked").val()),
                    ($("input[name='emotionalStatusDefensive']:checked").val()  === "" ? data[row-1][34] : $("input[name='emotionalStatusDefensive']:checked").val()),
                    ($("input[name='emotionalStatusControlling']:checked").val()=== "" ? data[row-1][35] : $("input[name='emotionalStatusControlling']:checked").val()),
                    ($("select[name='financialStatus']").val()                  === "" ? data[row-1][36] : $("select[name='financialStatus']").val()),
                    (linkGenogram                                               === "" ? data[row-1][37] : linkGenogram),
                    ($("input[name='emotionalAssess1']:checked").val()          === "" ? data[row-1][38] : $("input[name='emotionalAssess1']:checked").val()),
                    ($("input[name='emotionalAssess2']:checked").val()          === "" ? data[row-1][39] : $("input[name='emotionalAssess2']:checked").val()),
                    ($("input[name='emotionalAssess3']:checked").val()          === "" ? data[row-1][40] : $("input[name='emotionalAssess3']:checked").val()),
                    ($("input[name='emotionalAssess4']:checked").val()          === "" ? data[row-1][41] : $("input[name='emotionalAssess4']:checked").val()),
                    ($("input[name='emotionalAssess5']:checked").val()          === "" ? data[row-1][42] : $("input[name='emotionalAssess5']:checked").val()),
                    ($("input[name='emotionalAssess6']:checked").val()          === "" ? data[row-1][43] : $("input[name='emotionalAssess6']:checked").val()),
                    ($("input[name='emotionalAssess7']:checked").val()          === "" ? data[row-1][44] : $("input[name='emotionalAssess7']:checked").val()),
                    ($("input[name='emotionalAssess8']:checked").val()          === "" ? data[row-1][45] : $("input[name='emotionalAssess8']:checked").val()),
                    ($("input[name='emotionalAssess9']:checked").val()          === "" ? data[row-1][46] : $("input[name='emotionalAssess9']:checked").val()),
                    ($("input[name='emotionalAssess10']:checked").val()         === "" ? data[row-1][47] : $("input[name='emotionalAssess10']:checked").val()),
                    ($("input[name='generalAppearance']").val()                 === "" ? data[row-1][48] : $("input[name='generalAppearance']").val()),
                    ($("input[name='speech']").val()                            === "" ? data[row-1][49] : $("input[name='speech']").val()),
                    ($("input[name='hearing']").val()                           === "" ? data[row-1][50] : $("input[name='hearing']").val()),
                    ($("input[name='hydration']").val()                         === "" ? data[row-1][51] : $("input[name='hydration']").val()),
                    ($("select[name='ecog']").val()                             === "" ? data[row-1][52] : $("select[name='ecog']").val()),
                    ($("input[name='cachexia']:checked").val()                  === "" ? data[row-1][53] : $("input[name='cachexia']:checked").val()),
                    ($("input[name='pallor']:checked").val()                    === "" ? data[row-1][54] : $("input[name='pallor']:checked").val()),
                    ($("input[name='jaundice']:checked").val()                  === "" ? data[row-1][55] : $("input[name='jaundice']:checked").val()),
                    ($("input[name='cyanosis']:checked").val()                  === "" ? data[row-1][56] : $("input[name='cyanosis']:checked").val()),
                    ($("input[name='bp']").val()                                === "" ? data[row-1][57] : $("input[name='bp']").val()),
                    ($("input[name='pulse']").val()                             === "" ? data[row-1][58] : $("input[name='pulse']").val()),
                    ($("input[name='pulseMin']").val()                          === "" ? data[row-1][59] : $("input[name='pulseMin']").val()),
                    ($("input[name='respiratory']").val()                       === "" ? data[row-1][60] : $("input[name='respiratory']").val()),
                    ($("input[name='spO2roomAirPercent']").val()                === "" ? data[row-1][61] : $("input[name='spO2roomAirPercent']").val()),
                    ($("input[name='spO2L%']").val()                            === "" ? data[row-1][62] : $("input[name='spO2L%']").val()),
                    ($("input[name='spO2L']").val()                             === "" ? data[row-1][63] : $("input[name='spO2L']").val()),
                    ($("input[name='glucose']").val()                           === "" ? data[row-1][64] : $("input[name='glucose']").val()),
                    ($("input[name='glucoseMMOL']").val()                       === "" ? data[row-1][65] : $("input[name='glucoseMMOL']").val()),
                    ($("input[name='temperature']").val()                       === "" ? data[row-1][66] : $("input[name='temperature']").val()),
                    ($("input[name='oralCavity']").val()                        === "" ? data[row-1][67] : $("input[name='oralCavity']").val()),
                    ($("input[name='lymphoedema']").val()                       === "" ? data[row-1][68] : $("input[name='lymphoedema']").val()),
                    ($("input[name='pressureSores']").val()                     === "" ? data[row-1][69] : $("input[name='pressureSores']").val()),
                    ($("input[name='chestWall']").val()                         === "" ? data[row-1][70] : $("input[name='chestWall']").val()),
                    ($("select[name='breathSound']").val()                      === "" ? data[row-1][71] : $("select[name='breathSound']").val()),
                    ($("input[name='crepitationDetail']").val()                 === "" ? data[row-1][72] : $("input[name='crepitationDetail']").val())
                    ($("input[name='rt']").val()                                === "" ? data[row-1][73] : $("input[name='rt']").val()),
                    ($("input[name='lt']").val()                                === "" ? data[row-1][74] : $("input[name='lt']").val()),
                    ($("input[name='rtAir']").val()                             === "" ? data[row-1][75] : $("input[name='rtAir']").val()),
                    ($("input[name='ltAir']").val()                             === "" ? data[row-1][76] : $("input[name='ltAir']").val()),
                    ($("input[name='heartSounds']").val()                       === "" ? data[row-1][77] : $("input[name='heartSounds']").val()),
                    ($("input[name='jvp']").val()                               === "" ? data[row-1][78] : $("input[name='jvp']").val()),
                    (linkLung                                                   === "" ? data[row-1][79] : linkLung),
                    ($("input[name='abdominalWall']").val()                     === "" ? data[row-1][80] : $("input[name='abdominalWall']").val()),
                    ($("input[name='ascites']").val()                           === "" ? data[row-1][81] : $("input[name='ascites']").val()),
                    ($("input[name='hepatomegaly']").val()                      === "" ? data[row-1][82] : $("input[name='hepatomegaly']").val()),
                    ($("input[name='splenomegaly']").val()                      === "" ? data[row-1][83] : $("input[name='splenomegaly']").val()),
                    ($("input[name='bowelSounds']").val()                       === "" ? data[row-1][84] : $("input[name='bowelSounds']").val()),
                    ($("input[name='perRectum']").val()                         === "" ? data[row-1][85] : $("input[name='perRectum']").val()),
                    ($("input[name='perVagina']").val()                         === "" ? data[row-1][86] : $("input[name='perVagina']").val()),
                    (linkLowerBody                                              === "" ? data[row-1][87] : linkLowerBody),
                    ($("input[name='rightUL']").val()                           === "" ? data[row-1][88] : $("input[name='rightUL']").val()),
                    ($("input[name='leftUL']").val()                            === "" ? data[row-1][89] : $("input[name='leftUL']").val()),
                    ($("input[name='rightLL']").val()                           === "" ? data[row-1][90] : $("input[name='rightLL']").val()),
                    ($("input[name='leftLL']").val()                            === "" ? data[row-1][91] : $("input[name='leftLL']").val()),
                    ($("input[name='muscleWasting']").val()                     === "" ? data[row-1][92] : $("input[name='muscleWasting']").val()),
                    ($("input[name='bodyTenderness']").val()                    === "" ? data[row-1][93] : $("input[name='bodyTenderness']").val()),
                    ($("select[name='conciousness']").val()                     === "" ? data[row-1][94] : $("select[name='conciousness']").val()),
                    ($("input[name='time']:checked").val()                      === "" ? data[row-1][95] : $("input[name='time']:checked").val()),
                    ($("input[name='place']:checked").val()                     === "" ? data[row-1][96] : $("input[name='place']:checked").val()),
                    ($("input[name='people']:checked").val()                    === "" ? data[row-1][97] : $("input[name='people']:checked").val()),
                    ($("input[name='voice']:checked").val()                     === "" ? data[row-1][98] : $("input[name='voice']:checked").val()),
                    ($("input[name='pain']:checked").val()                      === "" ? data[row-1][99] : $("input[name='pain']:checked").val()),
                    ($("input[name='unresponsiveness']:checked").val()          === "" ? data[row-1][100] : $("input[name='unresponsiveness']:checked").val()),
                    ($("input[name='sensoryLoss']").val()                       === "" ? data[row-1][101] : $("input[name='sensoryLoss']").val()),
                    (linkFullBody                                               === "" ? data[row-1][102] : linkFullBody),
                    ($("input[name='smell']").val()                             === "" ? data[row-1][103] : $("input[name='smell']").val()),
                    ($("input[name='vision']").val()                            === "" ? data[row-1][104] : $("input[name='vision']").val()),
                    ($("input[name='lightDetection']").val()                    === "" ? data[row-1][105] : $("input[name='lightDetection']").val()),
                    ($("input[name='eyeMovement']").val()                       === "" ? data[row-1][106] : $("input[name='eyeMovement']").val()),
                    ($("input[name='raiseEyelid']").val()                       === "" ? data[row-1][107] : $("input[name='raiseEyelid']").val()),
                    ($("input[name='eyeMovement2']").val()                      === "" ? data[row-1][108] : $("input[name='eyeMovement2']").val()),
                    ($("input[name='facialSensation']").val()                   === "" ? data[row-1][109] : $("input[name='facialSensation']").val()),
                    ($("input[name='eyeMovement3']").val()                      === "" ? data[row-1][110] : $("input[name='eyeMovement3']").val()),
                    ($("input[name='facialExpression']").val()                  === "" ? data[row-1][111] : $("input[name='facialExpression']").val()),
                    ($("input[name='taste']").val()                             === "" ? data[row-1][112] : $("input[name='taste']").val()),
                    ($("input[name='productionTears']").val()                   === "" ? data[row-1][113] : $("input[name='productionTears']").val()),
                    ($("input[name='hearingBalance']").val()                    === "" ? data[row-1][114] : $("input[name='hearingBalance']").val()),
                    ($("input[name='swallowing']").val()                        === "" ? data[row-1][115] : $("input[name='swallowing']").val()),
                    ($("input[name='gagReflex']").val()                         === "" ? data[row-1][116] : $("input[name='gagReflex']").val()),
                    ($("input[name='speechNerve']").val()                       === "" ? data[row-1][117] : $("input[name='speechNerve']").val()),
                    ($("input[name='shrugging']").val()                         === "" ? data[row-1][118] : $("input[name='shrugging']").val()),
                    ($("input[name='tongueMovement']").val()                    === "" ? data[row-1][119] : $("input[name='tongueMovement']").val()),
                    ($("textarea[name='extNotes']").val()                       === "" ? data[row-1][120] : $("textarea[name='extNotes']").val()),
                ]
            ];
            var body = {
                values: valuesMedicalAssessment
            };
            break;
        }
        case "patientContinuationRecord": {
            var valuesPatientContinuationSheet = [
                [
                    generateTime(),
                    ($("input[name='patientName']").val() === "" ? data[row-1][1] : $("input[name='patientName']").val()),
                    ($("input[name='date']").val() === "" ? data[row-1][2] : $("input[name='date']").val()),
                    ($("input[name='assessedBy']").val() === "" ? data[row-1][3] : $("input[name='assessedBy']").val()),
                    ($("input[name='pain']:checked").val() === "" ? data[row-1][4] : $("input[name='pain']:checked").val()),
                    ($("input[name='sitePain1']").val() === "" ? data[row-1][5] : $("input[name='sitePain1']").val()),
                    ($("input[name='sitePain2']").val() === "" ? data[row-1][6] : $("input[name='sitePain2']").val()),
                    ($("input[name='sitePain3']").val() === "" ? data[row-1][7] : $("input[name='sitePain3']").val()),
                    ($("input[name='duration1']").val() === "" ? data[row-1][8] : $("input[name='duration1']").val()),
                    ($("select[name='durationDayWeekMonth1']").val() === "" ? data[row-1][9] : $("select[name='durationDayWeekMonth1']").val()),
                    ($("input[name='duration2']").val() === "" ? data[row-1][10] : $("input[name='duration2']").val()),
                    ($("select[name='durationDayWeekMonth2']").val() === "" ? data[row-1][11] : $("select[name='durationDayWeekMonth2']").val()),
                    ($("input[name='duration3']").val() === "" ? data[row-1][12] : $("input[name='duration3']").val()),
                    ($("select[name='durationDayWeekMonth3']").val() === "" ? data[row-1][13] : $("select[name='durationDayWeekMonth3']").val()),
                    ($("input[name='radiationPain']:checked").val() === "" ? data[row-1][14] : $("input[name='radiationPain']:checked").val()),
                    ($("input[name='placeOfPain']").val() === "" ? data[row-1][15] : $("input[name='placeOfPain']").val()),
                    ($("input[name='painInterval']:checked").val() === "" ? data[row-1][16] : $("input[name='painInterval']:checked").val()),
                    ($("input[name='painThrobbing']:checked").val() === "" ? data[row-1][17] : $("input[name='painThrobbing']:checked").val()),
                    ($("input[name='painPricking']:checked").val() === "" ? data[row-1][18] : $("input[name='painPricking']:checked").val()),
                    ($("input[name='painSlicing']:checked").val() === "" ? data[row-1][19] : $("input[name='painSlicing']:checked").val()),
                    ($("input[name='painAching']:checked").val() === "" ? data[row-1][20] : $("input[name='painAching']:checked").val()),
                    ($("input[name='painShooting']:checked").val() === "" ? data[row-1][21] : $("input[name='painShooting']:checked").val()),
                    ($("input[name='painPulling']:checked").val() === "" ? data[row-1][22] : $("input[name='painPulling']:checked").val()),
                    ($("input[name='painBurning']:checked").val() === "" ? data[row-1][23] : $("input[name='painBurning']:checked").val()),
                    ($("input[name='painShock']:checked").val() === "" ? data[row-1][24] : $("input[name='painShock']:checked").val()),
                    ($("input[name='painDull']:checked").val() === "" ? data[row-1][25] : $("input[name='painDull']:checked").val()),
                    ($("input[name='painN/A']:checked").val() === "" ? data[row-1][26] : $("input[name='painN/A']:checked").val()),
                    ($("input[name='natureOfPainOthers']").val() === "" ? data[row-1][27] : $("input[name='natureOfPainOthers']").val()),
                    ($("input[name='painAggravatedBy']").val() === "" ? data[row-1][28] : $("input[name='painAggravatedBy']").val()),
                    ($("input[name='numericalScale']").val() === "" ? data[row-1][29] : $("input[name='numericalScale']").val()),
                    ($("select[name='verbalScore']").val() === "" ? data[row-1][30] : $("select[name='verbalScore']").val()),
                    ($("input[name='painRelievedByMassaging']:checked").val() === "" ? data[row-1][31] : $("input[name='painRelievedByMassaging']:checked").val()),
                    ($("input[name='painRelievedByRepositioning']:checked").val() === "" ? data[row-1][32] : $("input[name='painRelievedByRepositioning']:checked").val()),
                    ($("input[name='painRelievedByMedication']:checked").val() === "" ? data[row-1][33] : $("input[name='painRelievedByMedication']:checked").val()),
                    ($("input[name='backgroundPainMedication']").val() === "" ? data[row-1][34] : $("input[name='backgroundPainMedication']").val()),
                    ($("input[name='breakthroughMedication']").val() === "" ? data[row-1][35] : $("input[name='breakthroughMedication']").val()),
                    ($("input[name='painRelievedAfterValue']").val() === "" ? data[row-1][36] : $("input[name='painRelievedAfterValue']").val()),
                    ($("select[name='painRelievedAfterMinHr']").val() === "" ? data[row-1][37] : $("select[name='painRelievedAfterMinHr']").val()),
                    ($("input[name='numericalScaleAfter']").val() === "" ? data[row-1][38] : $("input[name='numericalScaleAfter']").val()),
                    ($("select[name='verbalScoreAfter']").val() === "" ? data[row-1][39] : $("select[name='verbalScoreAfter']").val()),
                    ($("input[name='shortnessBreath']:checked").val() === "" ? data[row-1][40] : $("input[name='shortnessBreath']:checked").val()),
                    ($("input[name='durationShortnessBreath']").val() === "" ? data[row-1][41] : $("input[name='durationShortnessBreath']").val()),
                    ($("select[name='durationShortnessBreathDayWeekMonth']").val() === "" ? data[row-1][42] : $("select[name='durationShortnessBreathDayWeekMonth']").val()),
                    ($("input[name='shortnessBreathAt']:checked").val() === "" ? data[row-1][43] : $("input[name='shortnessBreathAt']:checked").val()),
                    ($("input[name='whatExertion']").val() === "" ? data[row-1][44] : $("input[name='whatExertion']").val()),
                    ($("input[name='shortnessBreathRelievedByResting']:checked").val() === "" ? data[row-1][45] : $("input[name='shortnessBreathRelievedByResting']:checked").val()),
                    ($("input[name='durationResting']").val() === "" ? data[row-1][46] : $("input[name='durationResting']").val()),
                    ($("select[name='durationRestingDayWeekMonth']").val() === "" ? data[row-1][47] : $("select[name='durationRestingDayWeekMonth']").val()),
                    ($("input[name='shortnessBreathRelievedByOxygen']:checked").val() === "" ? data[row-1][48] : $("input[name='shortnessBreathRelievedByOxygen']:checked").val()),
                    ($("input[name='oxygenLevel']").val() === "" ? data[row-1][49] : $("input[name='oxygenLevel']").val()),
                    ($("input[name='shortnessBreathRelievedByMedication']:checked").val() === "" ? data[row-1][50] : $("input[name='shortnessBreathRelievedByMedication']:checked").val()),
                    ($("input[name='medicationsWithin']").val() === "" ? data[row-1][51] : $("input[name='medicationsWithin']").val()),
                    ($("select[name='medicationsWithinMinHrs']").val() === "" ? data[row-1][52] : $("select[name='medicationsWithinMinHrs']").val()),
                    ($("input[name='medicationsDosageFrequency']").val() === "" ? data[row-1][53] : $("input[name='medicationsDosageFrequency']").val()),       
                    ($("input[name='cough']:checked").val() === "" ? data[row-1][54] : $("input[name='cough']:checked").val()),
                    ($("input[name='durationCough']").val() === "" ? data[row-1][55] : $("input[name='durationCough']").val()),
                    ($("select[name='durationCoughDuration']").val() === "" ? data[row-1][56] : $("select[name='durationCoughDuration']").val()),
                    ($("input[name='productivity']:checked").val() === "" ? data[row-1][57] : $("input[name='productivity']:checked").val()),
                    ($("input[name='sputum']:checked").val() === "" ? data[row-1][58] : $("input[name='sputum']:checked").val()),
                    ($("input[name='sputumOtr']").val() === "" ? data[row-1][59] : $("input[name='sputumOtr']").val()),
                    ($("input[name='expectoration']:checked").val() === "" ? data[row-1][60] : $("input[name='expectoration']:checked").val()),
                    ($("select[name='coughConsistency']").val() === "" ? data[row-1][61] : $("select[name='coughConsistency']").val()),
                    ($("input[name='coughMedication']").val() === "" ? data[row-1][62] : $("input[name='coughMedication']").val()),
                    ($("input[name='appetite']:checked").val() === "" ? data[row-1][63] : $("input[name='appetite']:checked").val()),
                    ($("input[name='durationAppetite']").val() === "" ? data[row-1][64] : $("input[name='durationAppetite']").val()),
                    ($("select[name='durationAppetiteDayWeekMonth']").val() === "" ? data[row-1][65] : $("select[name='durationAppetiteDayWeekMonth']").val()),
                    ($("input[name='oral']:checked").val() === "" ? data[row-1][66] : $("input[name='oral']:checked").val()),
                    ($("input[name='oralInput']").val() === "" ? data[row-1][67] : $("input[name='oralInput']").val()),
                    ($("input[name='ngTube']:checked").val() === "" ? data[row-1][68] : $("input[name='ngTube']:checked").val()),
                    ($("input[name='ngScoops']").val() === "" ? data[row-1][69] : $("input[name='ngScoops']").val()),
                    ($("input[name='ngWater']").val() === "" ? data[row-1][70] : $("input[name='ngWater']").val()),
                    ($("input[name='ngFrequency']").val() === "" ? data[row-1][71] : $("input[name='ngFrequency']").val()),
                    ($("input[name='ngAspiration']").val() === "" ? data[row-1][72] : $("input[name='ngAspiration']").val()),
                    ($("input[name='ngFormula']").val() === "" ? data[row-1][73] : $("input[name='ngFormula']").val()),
                    ($("input[name='pegTube']:checked").val() === "" ? data[row-1][74] : $("input[name='pegTube']:checked").val()),
                    ($("input[name='pegScoops']").val() === "" ? data[row-1][75] : $("input[name='pegScoops']").val()),
                    ($("input[name='pegWater']").val() === "" ? data[row-1][76] : $("input[name='pegWater']").val()),
                    ($("input[name='pegFrequency']").val() === "" ? data[row-1][77] : $("input[name='pegFrequency']").val()),
                    ($("input[name='pegFormula']").val() === "" ? data[row-1][78] : $("input[name='pegFormula']").val()),
                    ($("input[name='dysphagia']:checked").val() === "" ? data[row-1][79] : $("input[name='dysphagia']:checked").val()),
                    ($("input[name='dysphagiaType']:checked").val() === "" ? data[row-1][80] : $("input[name='dysphagiaType']:checked").val()),
                    ($("input[name='swallow']:checked").val() === "" ? data[row-1][81] : $("input[name='swallow']:checked").val()),
                    ($("input[name='nauseaVomit']:checked").val() === "" ? data[row-1][82] : $("input[name='nauseaVomit']:checked").val()),
                    ($("input[name='durationNV']").val() === "" ? data[row-1][83] : $("input[name='durationNV']").val()),
                    ($("select[name='durationNVDayWeekMonth']").val() === "" ? data[row-1][84] : $("select[name='durationNVDayWeekMonth']").val()),
                    ($("input[name='nauseaOrVomiting']:checked").val() === "" ? data[row-1][85] : $("input[name='nauseaOrVomiting']:checked").val()),
                    ($("input[name='causeOfNV']:checked").val() === "" ? data[row-1][86] : $("input[name='causeOfNV']:checked").val()),
                    ($("input[name='hrsOfFood']").val() === "" ? data[row-1][87] : $("input[name='hrsOfFood']").val()),
                    ($("input[name='timeOfNV']:checked").val() === "" ? data[row-1][88] : $("input[name='timeOfNV']:checked").val()),
                    ($("input[name='nvFrequency']").val() === "" ? data[row-1][89] : $("input[name='nvFrequency']").val()),
                    ($("input[name='giddiness']:checked").val() === "" ? data[row-1][90] : $("input[name='giddiness']:checked").val()),
                    ($("input[name='vomitConsistency']:checked").val() === "" ? data[row-1][91] : $("input[name='vomitConsistency']:checked").val()),
                    ($("input[name='vomitConsistencyOtr']").val() === "" ? data[row-1][92] : $("input[name='vomitConsistencyOtr']").val()),
                    ($("input[name='bmAnus']:checked").val() === "" ? data[row-1][93] : $("input[name='bmAnus']:checked").val()),
                    ($("input[name='bmColostomy']:checked").val() === "" ? data[row-1][94] : $("input[name='bmColostomy']:checked").val()),
                    ($("input[name='bmIleostomy']:checked").val() === "" ? data[row-1][95] : $("input[name='bmIleostomy']:checked").val()),
                    ($("input[name='bmFrequency']").val() === "" ? data[row-1][96] : $("input[name='bmFrequency']").val()),
                    ($("select[name='durationBMFrequncy']").val() === "" ? data[row-1][97] : $("select[name='durationBMFrequncy']").val()),
                    ($("input[name='bmNBO']").val() === "" ? data[row-1][98] : $("input[name='bmNBO']").val()),
                    ($("input[name='stoolConsistency']:checked").val() === "" ? data[row-1][99] : $("input[name='stoolConsistency']:checked").val()),
                    ($("input[name='stoolNature']:checked").val() === "" ? data[row-1][100] : $("input[name='stoolNature']:checked").val()),
                    ($("input[name='freshBloodStainDetail']:checked").val() === "" ? data[row-1][101] : $("input[name='freshBloodStainDetail']:checked").val()),
                    ($("input[name='waterStoolDay']").val() === "" ? data[row-1][102] : $("input[name='waterStoolDay']").val()),
                    ($("input[name='bmIncontinence']:checked").val() === "" ? data[row-1][103] : $("input[name='bmIncontinence']:checked").val()),
                    ($("input[name='urineNormal']:checked").val() === "" ? data[row-1][104] : $("input[name='urineNormal']:checked").val()),
                    ($("input[name='urineCBD']:checked").val() === "" ? data[row-1][105] : $("input[name='urineCBD']:checked").val()),
                    ($("input[name='urineSPC']:checked").val() === "" ? data[row-1][106] : $("input[name='urineSPC']:checked").val()),
                    ($("input[name='urineNep']:checked").val() === "" ? data[row-1][107] : $("input[name='urineNep']:checked").val()),
                    ($("input[name='nephrostomyRL']:checked").val() === "" ? data[row-1][108] : $("input[name='nephrostomyRL']:checked").val()),
                    ($("input[name='urineColour']:checked").val() === "" ? data[row-1][109] : $("input[name='urineColour']:checked").val()),
                    ($("input[name='urineColourSta']").val() === "" ? data[row-1][110] : $("input[name='urineColourSta']").val()),
                    ($("input[name='urineNature']:checked").val() === "" ? data[row-1][111] : $("input[name='urineNature']:checked").val()),
                    ($("input[name='dysuria']:checked").val() === "" ? data[row-1][112] : $("input[name='dysuria']:checked").val()),
                    ($("input[name='dysuria/7']").val() === "" ? data[row-1][113] : $("input[name='dysuria/7']").val()),
                    ($("input[name='dysuria/52']").val() === "" ? data[row-1][114] : $("input[name='dysuria/52']").val()),
                    ($("input[name='dysuria/12']").val() === "" ? data[row-1][115] : $("input[name='dysuria/12']").val()), 
                    ($("input[name='delayInitiation']:checked").val() === "" ? data[row-1][116] : $("input[name='delayInitiation']:checked").val()),
                    ($("input[name='urineRetention']:checked").val() === "" ? data[row-1][117] : $("input[name='urineRetention']:checked").val()),
                    ($("input[name='urineIncontinence']:checked").val() === "" ? data[row-1][118] : $("input[name='urineIncontinence']:checked").val()),
                    ($("input[name='sleepPattern']:checked").val() === "" ? data[row-1][119] : $("input[name='sleepPattern']:checked").val()),
                    ($("input[name='sleepHrs']").val() === "" ? data[row-1][120] : $("input[name='sleepHrs']").val()),
                    ($("input[name='sleepAlt']").val() === "" ? data[row-1][121] : $("input[name='sleepAlt']").val()),
                    ($("input[name='sleepMedication']").val() === "" ? data[row-1][122] : $("input[name='sleepMedication']").val()),
                    ($("textarea[name='otrPhychological']").val() === "" ? data[row-1][123] : $("textarea[name='otrPhychological']").val()),
                    ($("input[name='examPatientName']").val() === "" ? data[row-1][124] : $("input[name='examPatientName']").val()),
                    ($("input[name='examKhcNo']").val() === "" ? data[row-1][125] : $("input[name='examKhcNo']").val()),
                    ($("input[name='examDate']").val() === "" ? data[row-1][126] : $("input[name='examDate']").val()),
                    ($("input[name='examAssessedBy']").val() === "" ? data[row-1][127] :$("input[name='examAssessedBy']").val()),
                    ($("select[name='examECOG']").val() === "" ? data[row-1][128] : $("select[name='examECOG']").val()),
                    ($("input[name='alert']:checked").val() === "" ? data[row-1][129] : $("input[name='alert']:checked").val()),
                    ($("input[name='drowsy']:checked").val() === "" ? data[row-1][130] : $("input[name='drowsy']:checked").val()),
                    ($("select[name='arousal']").val() === "" ? data[row-1][131] : $("select[name='arousal']").val()),
                    ($("input[name='confused']:checked").val() === "" ? data[row-1][132] : $("input[name='confused']:checked").val()),
                    ($("input[name='confusedTxt']").val() === "" ? data[row-1][133] : $("input[name='confusedTxt']").val()),
                    ($("input[name='conscious']:checked").val() === "" ? data[row-1][134] : $("input[name='conscious']:checked").val()),
                    ($("input[name='unconscious']:checked").val() === "" ? data[row-1][135] : $("input[name='unconscious']:checked").val()),
                    ($("input[name='semi']:checked").val() === "" ? data[row-1][136] : $("input[name='semi']:checked").val()),
                    ($("input[name='pallor']:checked").val() === "" ? data[row-1][137] : $("input[name='pallor']:checked").val()),
                    ($("input[name='jaundice']:checked").val() === "" ? data[row-1][138] : $("input[name='jaundice']:checked").val()),
                    ($("input[name='cyanosis']:checked").val() === "" ? data[row-1][139] : $("input[name='cyanosis']:checked").val()),
                    ($("input[name='hydration']:checked").val() === "" ? data[row-1][140] : $("input[name='hydration']:checked").val()),
                    ($("input[name='clubbing']:checked").val() === "" ? data[row-1][141] : $("input[name='clubbing']:checked").val()),
                    ($("input[name='lymphedema']:checked").val() === "" ? data[row-1][142] : $("input[name='lymphedema']:checked").val()),
                    ($("select[name='pitting1']").val() === "" ? data[row-1][143] : $("select[name='pitting1']").val()),
                    ($("input[name='pittingState1']").val() === "" ? data[row-1][144] : $("input[name='pittingState1']").val()),             
                    ($("select[name='pitting2']").val() === "" ? data[row-1][145] : $("select[name='pitting2']").val()),
                    ($("input[name='pittingState2']").val() === "" ? data[row-1][146] : $("input[name='pittingState2']").val()),
                    ($("input[name='pressureSore']:checked").val() === "" ? data[row-1][147] : $("input[name='pressureSore']:checked").val()),
                    ($("select[name='soreGrade1']").val() === "" ? data[row-1][148] : $("select[name='soreGrade1']").val()),
                    ($("input[name='soreGradeState1']").val() === "" ? data[row-1][149] : $("input[name='soreGradeState1']").val()),
                    ($("select[name='soreGrade2']").val() === "" ? data[row-1][150] : $("select[name='soreGrade2']").val()),
                    ($("input[name='soreGradeState2']").val() === "" ? data[row-1][151] : $("input[name='soreGradeState2']").val()),
                    ($("input[name='ocClean']:checked").val() === "" ? data[row-1][152] : $("input[name='ocClean']:checked").val()),
                    ($("input[name='ocDry']:checked").val() === "" ? data[row-1][153] : $("input[name='ocDry']:checked").val()),
                    ($("input[name='ocDirty']:checked").val() === "" ? data[row-1][154] : $("input[name='ocDirty']:checked").val()),
                    ($("input[name='ocFungalInfection']:checked").val() === "" ? data[row-1][155] : $("input[name='ocFungalInfection']:checked").val()),
                    ($("input[name='ocOther']:checked").val() === "" ? data[row-1][156] : $("input[name='ocOther']:checked").val()),
                    ($("input[name='ocOtherTxt']").val() === "" ? data[row-1][157] : $("input[name='ocOtherTxt']").val()),
                    ($("input[name='skinPetechiae']:checked").val() === "" ? data[row-1][158] : $("input[name='skinPetechiae']:checked").val()),
                    ($("input[name='skinEcchymosis']:checked").val() === "" ? data[row-1][159] : $("input[name='skinEcchymosis']:checked").val()),
                    ($("input[name='skinScar']:checked").val() === "" ? data[row-1][160] : $("input[name='skinScar']:checked").val()),
                    ($("input[name='skinRash']:checked").val() === "" ? data[row-1][161] : $("input[name='skinRash']:checked").val()),
                    ($("input[name='skinOthers']:checked").val() === "" ? data[row-1][162] : $("input[name='skinOthers']:checked").val()),
                    ($("input[name='skinOtr']").val() === "" ? data[row-1][163] : $("input[name='skinOtr']").val()),
                    ($("input[name='bp']").val() === "" ? data[row-1][164] : $("input[name='bp']").val()),
                    ($("select[name='brState']").val() === "" ? data[row-1][165] : $("select[name='brState']").val()),
                    ($("input[name='pulse']").val() === "" ? data[row-1][166] : $("input[name='pulse']").val()),
                    ($("input[name='pulseMin']").val() === "" ? data[row-1][167] : $("input[name='pulseMin']").val()),
                    ($("select[name='prState']").val() === "" ? data[row-1][168] : $("select[name='prState']").val()),
                    ($("input[name='spO2roomAirPercent']").val() === "" ? data[row-1][169] : $("input[name='spO2roomAirPercent']").val()),
                    ($("input[name='spO2L%']").val() === "" ? data[row-1][170] : $("input[name='spO2L%']").val()),
                    ($("input[name='spO2L']").val() === "" ? data[row-1][171] : $("input[name='spO2L']").val()),
                    ($("input[name='respiratory']").val() === "" ? data[row-1][172] : $("input[name='respiratory']").val()),
                    ($("select[name='rrState']").val() === "" ? data[row-1][173] : $("select[name='rrState']").val()),
                    ($("input[name='temperature']").val() === "" ? data[row-1][174] : $("input[name='temperature']").val()),
                    ($("select[name='tempState']").val() === "" ? data[row-1][175] : $("select[name='tempState']").val()),
                    ($("input[name='glucose']").val() === "" ? data[row-1][176] : $("input[name='glucose']").val()),
                    ($("input[name='glucoseMMOL']").val() === "" ? data[row-1][177] : $("input[name='glucoseMMOL']").val()),
                    ($("input[name='chestWall']").val() === "" ? data[row-1][178] : $("input[name='chestWall']").val()),
                    ($("select[name='rlCon']").val() === "" ? data[row-1][179] : $("select[name='rlCon']").val()),
                    ($("input[name='rlConTxt']").val() === "" ? data[row-1][180] : $("input[name='rlConTxt']").val()),
                    ($("input[name='rlSound']").val() === "" ? data[row-1][181] : $("input[name='rlSound']").val()),
                    ($("input[name='rlFineCrep']").val() === "" ? data[row-1][182] : $("input[name='rlFineCrep']").val()),
                    ($("input[name='rlCoarseCrep']").val() === "" ? data[row-1][183] : $("input[name='rlCoarseCrep']").val()),
                    ($("input[name='rlAir']:checked").val() === "" ? data[row-1][184] : $("input[name='rlAir']:checked").val()),
                    ($("input[name='rlAirDecreasedTxt']").val() === "" ? data[row-1][185] : $("input[name='rlAirDecreasedTxt']").val()),
                    ($("select[name='llCon']").val() === "" ? data[row-1][186] : $("select[name='llCon']").val()),
                    ($("input[name='llConTxt']").val() === "" ? data[row-1][187] : $("input[name='llConTxt']").val()),
                    ($("input[name='llSound']").val() === "" ? data[row-1][188] : $("input[name='llSound']").val()),
                    ($("input[name='llFineCrep']").val() === "" ? data[row-1][189] : $("input[name='llFineCrep']").val()),
                    ($("input[name='llCoarseCrep']").val() === "" ? data[row-1][190] : $("input[name='llCoarseCrep']").val()),
                    ($("input[name='llAir']:checked").val() === "" ? data[row-1][191] : $("input[name='llAir']:checked").val()),
                    ($("input[name='llAirDecreasedTxt']").val() === "" ? data[row-1][192] : $("input[name='llAirDecreasedTxt']").val()),
                    (linkLung === "" ? data[row-1][193] : linkLung),
                    ($("input[name='heartSound']:checked").val() === "" ? data[row-1][194] : $("input[name='heartSound']:checked").val()),
                    ($("input[name='heartMurmurTxt']").val() === "" ? data[row-1][195] : $("input[name='heartMurmurTxt']").val()),
                    ($("input[name='abdominalWall']:checked").val() === "" ? data[row-1][196] : $("input[name='abdominalWall']:checked").val()),
                    ($("input[name='abdomWallLoc']").val() === "" ? data[row-1][197] : $("input[name='abdomWallLoc']").val()),
                    ($("input[name='abdomen']:checked").val() === "" ? data[row-1][198] : $("input[name='abdomen']:checked").val()),
                    ($("input[name='abdoTenderTxt']").val() === "" ? data[row-1][199] : $("input[name='abdoTenderTxt']").val()),
                    ($("input[name='abdomenLoc']").val() === "" ? data[row-1][200] : $("input[name='abdomenLoc']").val()),
                    ($("select[name='massTenderness']").val() === "" ? data[row-1][201] : $("select[name='massTenderness']").val()),
                    ($("select[name='massMobility']").val() === "" ? data[row-1][202] : $("select[name='massMobility']").val()),
                    ($("select[name='massState']").val() === "" ? data[row-1][203] : $("select[name='massState']").val()),
                    ($("input[name='massStateQuad']").val() === "" ? data[row-1][204] : $("input[name='massStateQuad']").val()),
                    ($("input[name='massStateSize']").val() === "" ? data[row-1][205] : $("input[name='massStateSize']").val()),
                    ($("input[name='shiftDull']:checked").val() === "" ? data[row-1][206] : $("input[name='shiftDull']:checked").val()),
                    ($("input[name='hepatomegaly']:checked").val() === "" ? data[row-1][207] : $("input[name='hepatomegaly']:checked").val()),
                    ($("input[name='hepNegativeTxt']").val() === "" ? data[row-1][208] : $("input[name='hepNegativeTxt']").val()),
                    ($("input[name='splenomegaly']:checked").val() === "" ? data[row-1][209] : $("input[name='splenomegaly']:checked").val()),
                    ($("input[name='splNegativeTxt']").val() === "" ? data[row-1][210] : $("input[name='splNegativeTxt']").val()),
                    ($("select[name='bowelSound']").val() === "" ? data[row-1][211] : $("select[name='bowelSound']").val()),
                    ($("select[name='perRectum']").val() === "" ? data[row-1][212] : $("select[name='perRectum']").val()),
                    (linkLowerBody === "" ? data[row-1][213] : linkLowerBody),
                    ($("input[name='gastroOtr']").val() === "" ? data[row-1][214] : $("input[name='gastroOtr']").val()),
                    ($("input[name='muscleRightUL']").val() === "" ? data[row-1][215] : $("input[name='muscleRightUL']").val()),
                    ($("input[name='muscleLeftUL']").val() === "" ? data[row-1][216] : $("input[name='muscleLeftUL']").val()),
                    ($("input[name='muscleRightLL']").val() === "" ? data[row-1][217] : $("input[name='muscleRightLL']").val()),
                    ($("input[name='muscleLeftLL']").val() === "" ? data[row-1][218] : $("input[name='muscleLeftLL']").val()),
                    ($("input[name='senseRightUL']:checked").val() === "" ? data[row-1][219] : $("input[name='senseRightUL']:checked").val()),
                    ($("input[name='senseleftUL']:checked").val() === "" ? data[row-1][220] : $("input[name='senseleftUL']:checked").val()),
                    ($("input[name='senserightLL']:checked").val() === "" ? data[row-1][221] : $("input[name='senserightLL']:checked").val()),
                    ($("input[name='senseleftLL']:checked").val() === "" ? data[row-1][222] : $("input[name='senseleftLL']:checked").val()),
                    ($("textarea[name='otrManage']").val() === "" ? data[row-1][223] : $("textarea[name='otrManage']").val()),
                ]
            ]

            var body = {
                values: valuesPatientContinuationSheet
            };
            break;
        }
        case "extraNotesForm": {
            var valuesExtraNotes = [
                [
                    generateTime(),
                    document.getElementsByName("patientName")[0].innerHTML,
                    document.getElementsByName("patientNameSearch")[0].innerHTML,
                    ($("textarea[name='extraNotes']").val() === "" ? data[row-1][3] : $("textarea[name='extraNotes']").val()),
                ]
            ]

            var body = {
                values: valuesExtraNotes
            };
            break;
        }
        case "medicationForm": {
            var valuesMedication = [
                [
                    generateTime(),
                    document.getElementsByName("patientName")[0].innerHTML,
                    document.getElementsByName("patientNameSearch")[0].innerHTML,
                    ($("input[name='date']").val()        === "" ? data[row-1][3] : $("input[name='date']").val()),
                    ($("input[name='medication']").val()  === "" ? data[row-1][4] : $("input[name='medication']").val()),
                    ($("input[name='dosage']").val()      === "" ? data[row-1][5] : $("input[name='dosage']").val()),
                    ($("input[name='frequency']").val()   === "" ? data[row-1][6] : $("input[name='frequency']").val()),
                    ($("input[name='dateStarted']").val() === "" ? data[row-1][7] : $("input[name='dateStarted']").val()),
                    ($("input[name='dateCeased']").val()  === "" ? data[row-1][8] : $("input[name='dateCeased']").val()),
                    ($("input[name='hospital']").val()    === "" ? data[row-1][9] : $("input[name='hospital']").val())
                ]
            ]

            var body = {
                values: valuesMedication
            };
            break;
        }
        case "medicationEquipmentForm": {
            var valuesMedicationEquipment = [
                [
                    generateTime(),
                    document.getElementsByName("patientName")[0].innerHTML,
                    document.getElementsByName("patientNameSearch")[0].innerHTML,
                    ($("input[name='date']").val()               === "" ? data[row-2][3] : $("input[name='date']").val()),
                    ($("input[name='medicationName']").val()     === "" ? data[row-2][4] : $("input[name='medicationName']").val()),
                    ($("input[name='medicationQuantity']").val() === "" ? data[row-2][5] : $("input[name='medicationQuantity']").val()),
                    ($("input[name='nursingItemName']").val()    === "" ? data[row-2][6] : $("input[name='nursingItemName']").val()),
                    ($("input[name='nursingItemNo']").val()      === "" ? data[row-2][7] : $("input[name='nursingItemNo']").val())
                ]
            ]

            var body = {
                values: valuesMedicationEquipment
            };
            break;
        }
        case "homeVisitForm": {
            var valuesHomeVisit = [
                [
                    generateTime(),
                    document.getElementsByName("patientName")[0].innerHTML,
                    document.getElementsByName("patientNameSearch")[0].innerHTML,
                    ($("input[name='no']").val()        === "" ? data[row-1][3] : $("input[name='no']").val()),
                    ($("input[name='date']").val()      === "" ? data[row-1][4] : $("input[name='date']").val()),
                    ($("input[name='visitedBy']").val() === "" ? data[row-1][5] : $("input[name='visitedBy']").val()),
                    ($("input[name='place']").val()     === "" ? data[row-1][6] : $("input[name='place']").val())
                ]
            ]

            var body = {
                values: valuesHomeVisit
            };
            break;
        }
        case "endOfLifeForm": {
            var valuesEndOfLife = [
                [
                    generateTime(),
                    document.getElementsByName("patientName")[0].innerHTML,
                    document.getElementsByName("patientNameSearch")[0].innerHTML,
                    ($("input[name='date']").val()                    === "" ? data[row-1][3] : $("input[name='date']").val()),
                    ($("input[name='lifeSustainingTreatment']").val() === "" ? data[row-1][4] : $("input[name='lifeSustainingTreatment']").val()),
                    ($("input[name='cpr']").val()                     === "" ? data[row-1][5] : $("input[name='cpr']").val()),
                    ($("input[name='intubation']").val()              === "" ? data[row-1][6] : $("input[name='intubation']").val()),
                    ($("input[name='artificialHydration']").val()     === "" ? data[row-1][7] : $("input[name='artificialHydration']").val()),
                    ($("input[name='antibiotics']").val()             === "" ? data[row-1][8] : $("input[name='antibiotics']").val()),
                    ($("input[name='dialysis']").val()                === "" ? data[row-1][9] : $("input[name='dialysis']").val()),
                    ($("input[name='proxyDecision']").val()           === "" ? data[row-1][10] : $("input[name='proxyDecision']").val()),
                    ($("input[name='placeOfCare']").val()             === "" ? data[row-1][11] : $("input[name='placeOfCare']").val()),
                    ($("input[name='typeOfFuneral']").val()           === "" ? data[row-1][12] : $("input[name='typeOfFuneral']").val()),
                    ($("input[name='specialWishes']").val()           === "" ? data[row-1][13] : $("input[name='specialWishes']").val())
                ]
            ]

            var body = {
                values: valuesEndOfLife
            };
            break;
        }

    }

    if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
        alert("Please authorize before editing records.");
        return;
    } else {
        var request = gapi.client.sheets.spreadsheets.values.update(params, body);
        request.then(function(response) {
            console.log(response.result);
            appendPre("Records edited. Refresh the page to see the result.")
        }, function(reason) {
            console.log(reason);
            console.log('error: ' + reason.result.error.message);
        });
    }
}