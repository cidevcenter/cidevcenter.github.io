//Seperate scripts just for the access database part of report generation
var validSearchField = [false, false];
var searchFieldIndex = [];
//var header = [];
const monthIndex = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const ethnicGroups = ['O', 'M', 'I', 'C'];
const diseaseTypes = ['1. Cancer', '2. End Stage Renal', '3. Non Cancer'];
var dataCount;
var dataCheck = [];
var rowTest;
var result;
var dataCountInitialized = false;
var yearIndex = 0;
var monthIndexReport = 0;
var ethnicIndex = 0;
var diseaseIndex = 0;
var dateDuration1, dateDuration2;
var differenceDay = [];
var iCodeIndex = 0;
var dataInsertIndex;
var oriDataIndex;
var searchHeader;
var tableGenerated = false;

/**
 * Generates reports
 * @param {string} range -the name of the sheet
 * @param {JSON} conditions - .searchField, .condition, .value, .mode
 * @param {string} conditions.searchField - the field to search
 * @param {string} conditions.condition - "equal", "more than", "less than", not equal"
 * @param {string} conditions.value - for date: the format is "YYYY/MM"
 * @param {string} conditions.mode - "month" if accessing the value that is in date format 
 * @param {Array} dataFieldOrder - determines how the column will be ordered
 * @param {string} andOr - determines if two conditions should be combined with 'and' or 'or'
 * @param {JSON} linkHeader - .oriHeader, .externalHeader
 * @param {string} linkHeader.oriHeader - original header from first sheet where external data from this header and original data from this header must match
 * @param {Array} linkHeader.externalHeader - header from external sheet (extra data to be inserted)
 * @param {string} headerFrom - the sheet where the external header are from 
 */
function generateReport(range, conditions, dataFieldOrder, andOr, linkHeader, headerFrom) {
    var spinner = document.getElementsByClassName('loadingSpinner')[0];
    var formID = document.getElementById('formID').innerHTML;

    if(spinner){
        spinner.setAttribute('style', 'display: block;');
    }

    if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
        console.log(gapi.client.sheets);
        console.log(gapi.auth2.getAuthInstance().isSignedIn.get());
        alert("Please authorize before searching record(s).");
        document.getElementsByClassName('loadingSpinner')[0].setAttribute('style', 'display: none;');
        return;
    } else {
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: accessSpreadsheetId,
            range:  `'${range}'!A:ZZZ`,
        }).then(function (response) {
            console.log(`${response.result.values.length} rows.`);
            //Success, handles conditions
            //console.log(response);
            headerGenerated = false;
            searchHeader = response.result.values[0];
            header = searchHeader;
            var searchConditionString;

            //Add AND to statement
            if (conditions.length > 2) {
                alert("Error: More than two conditional statements.");
                console.log("Error: More than two conditional statements.");
                return;
            } else {
                for (var i = 0; i < conditions.length; i++) {
                    for (var j = 0; j < searchHeader.length; j++) {
                        if (searchHeader[j] == conditions[i].searchField) {
                            validSearchField[i] = true;
                            searchFieldIndex[i] = j;
                        }
                    }
                    if (!validSearchField[i]) {
                        alert("Invalid search parameters called.");
                        console.log("Invalid search parameters called.");
                        return;
                    } else {
                        //console.log(searchHeader);
                    }
                }

                //Setting the search condition strings
                searchConditionString = '';

                for (var i = 0; i < conditions.length; i++) {
                    switch (conditions[i].condition) {
                        case "equal":
                        case "==": {
                            searchConditionString += "(this.object[" + i + "].row[searchFieldIndex[" + i + "]] == this.object[" + i + "].value)";
                            break;
                        }
                        case "more than":
                        case ">": {
                            searchConditionString += "(this.object[" + i + "].row[searchFieldIndex[" + i + "]] > this.object[" + i + "].value)";
                            break;
                        }
                        case "less than":
                        case "<": {
                            searchConditionString += "(this.object[" + i + "].row[searchFieldIndex[" + i + "]] < this.object[" + i + "].value)";
                            break;
                        }
                        case "not equal":
                        case "!=": {
                            searchConditionString += "(this.object[" + i + "].row[searchFieldIndex[" + i + "]] != this.object[" + i + "].value)";
                            break;
                        }
                        case "after":
                        case "more than or equal":
                        case ">=": {
                            searchConditionString += "(this.object[" + i + "].row[searchFieldIndex[" + i + "]] >= this.object[" + i + "].value)";
                            break;
                        }
                        case "less than or equal":
                        case "<=": {
                            searchConditionString += "(this.object[" + i + "].row[searchFieldIndex[" + i + "]] <= this.object[" + i + "].value)";
                            break;
                        }
                        case "none":
                        case "": {
                            searchConditionString = "1 == 1";
                            break;
                        }
                        case "in": {
                            searchConditionString += "(this.object[" + i + "].row[searchFieldIndex[" + i + "]] >= this.object[" + i + "].value && this.object[" + i + "].row[searchFieldIndex[" + i + "]] < this.object[" + i + "].value)";
                            break;
                        }
                        case "contains": {
                            searchConditionString += "(this.object[" + i + "].row[searchFieldIndex[" + i + "]].toLowerCase().includes(this.object[" + i + "].value.toLowerCase()))";
                            break;
                        }
                        default: {
                            alert("Invalid conditions.");
                            console.log("Invalid conditions.");
                            return;
                        }
                    }

                    if (i != 1 && conditions.length == 2) {
                        if (andOr == 'and') {
                            searchConditionString += " && ";
                        } else if (andOr == 'or') {
                            searchConditionString += " || ";
                        }
                    }
                }
                oriSearchString = searchConditionString;
            }

            //Transfering date into the search string
            for (var i = 1; i < response.result.values.length; i++) {
                var row = response.result.values[i];
                var tempRow = [];
                header = [];
                for (var j = 0; j < conditions.length; j++) {
                    
                    if (conditions[j].mode.includes("month")) {
                        monthIndexReport = j;
                        if(row[searchFieldIndex[j]]) {
                            var date1 = toDate(row[searchFieldIndex[j]]);
                        } else {
                            continue;
                        }
                        
                        dateDuration1 = date1;
                        if (isNaN(date1) || date1 == undefined) {
                            //console.log("Oof");
                            continue;
                        } else {
                            if (conditions[j].condition == 'in') {
                                var date2 = toDateInput(conditions[j].value);
                                dateDuration2 = date2;
                                var newStr1 = searchConditionString.replace("this.object[" + j + "].row[searchFieldIndex[" + j + "]]", date1.valueOf());
                                var newSearchConditionString = newStr1;
                                var newStr2 = newSearchConditionString.replace("this.object[" + j + "].value", date2.valueOf());
                                //var newStr3 = newStr2.replace("this.object[" + j + "].value[" + j + "]", "this.object[" + j + "].value");
                                newSearchConditionString = newStr2;

                                var year = conditions[j].value.split('/')[0];
                                var month = conditions[j].value.split('/')[1];
                                month = parseInt(month) + 1;
                                var newDate = year + '/' + month;
    
                                var date3 = toDateInput(newDate);
                                var newStr4 = newSearchConditionString.replace("this.object[" + j + "].row[searchFieldIndex[" + j + "]]", date1.valueOf());
                                newSearchConditionString = newStr4;
                                var newStr5 = newSearchConditionString.replace("this.object[" + j + "].value", date3.valueOf());
                                var newStr6 = newStr5.replace("this.object[" + j + "].value", "this.object[" + j + "].value");
                                newSearchConditionString = newStr6;
                                //searchConditionString = newSearchConditionString;
                            } else {
                                var date2 = toDateInput(conditions[j].value);
                                dateDuration2 = date2;
                                var newStr1 = searchConditionString.replace("this.object[" + j + "].row[searchFieldIndex[" + j + "]]", date1.valueOf());
                                var newSearchConditionString = newStr1;
                                var newStr2 = newSearchConditionString.replace("this.object[" + j + "].value", date2.valueOf());
                                //var newStr3 = newStr2.replace("this.object[" + j + "].value", "this.object[" + j + "].value");
                                newSearchConditionString = newStr2;
                            }
                            
                        }

                    } 
                    else if (conditions[j].mode.includes('year')) {
                        yearIndex = j;
                        if(row[searchFieldIndex[j]]) {
                            var date1 = toDate(row[searchFieldIndex[j]]);
                        } else {
                            continue;
                        }
                        if (isNaN(date1) || date1 == undefined) {
                            //console.log("Oof");
                            continue;
                        } else {
                            if (conditions[j].condition == 'in') {
                                var date2 = toDateYear(conditions[j].value);
                                var newStr1 = searchConditionString.replace("this.object[" + j + "].row[searchFieldIndex[" + j + "]]", date1.valueOf());
                                var newSearchConditionString = newStr1;
                                var newStr2 = newSearchConditionString.replace("this.object[" + j + "].value", date2.valueOf());
                                //var newStr3 = newStr2.replace("this.object[" + j + "].value[" + j + "]", "this.object[" + j + "].value");
                                newSearchConditionString = newStr2;
    
                                var date3 = toDateYear(parseInt(conditions[j].value) + 1);
                                var newStr4 = newSearchConditionString.replace("this.object[" + j + "].row[searchFieldIndex[" + j + "]]", date1.valueOf());
                                newSearchConditionString = newStr4;
                                var newStr5 = newSearchConditionString.replace("this.object[" + j + "].value", date3.valueOf());
                                var newStr6 = newStr5.replace("this.object[" + j + "].value", "this.object[" + j + "].value");
                                newSearchConditionString = newStr6;
                            } else {
                                var date2 = toDateYear(conditions[j].value);
                                var newStr1 = searchConditionString.replace("this.object[" + j + "].row[searchFieldIndex[" + j + "]]", date1.valueOf());
                                var newSearchConditionString = newStr1;
                                var newStr2 = newSearchConditionString.replace("this.object[" + j + "].value", date2.valueOf());
                                var newStr3 = newStr2.replace("this.object[" + j + "].value", "this.object[" + j + "].value");
                                newSearchConditionString = newStr3;
                            }

                        }
                    }
                
                    
                    else {
                        newSearchConditionString = searchConditionString;
                    }
                }

                //runs the conditions
                if (conditions.length == 2) {
                    rowTest = new EvalNew(row, conditions[0].value, row, conditions[1].value);
                    result = rowTest.run(newSearchConditionString);
                    //Runs the statement and make sure no empty datas that's being tested because it can pass through the test
                    if ((result && andOr == 'or' && (rowTest.object[0].row[searchFieldIndex[0]] != "" || rowTest.object[1].row[searchFieldIndex[1]] != "")) || (result && rowTest.object[0].row[searchFieldIndex[0]] != "" && rowTest.object[1].row[searchFieldIndex[1]] != "")) {
                        count++;
                        for (var j = 0; j < dataFieldOrder.length; j++) {
                            var index = searchHeader.indexOf(dataFieldOrder[j]);

                            if (index > -1) {
                                tempRow.push(row[index]);
                                header.push(searchHeader[index]);
                            }
                        }
                        data.push(tempRow);
                        dataCheck.push(tempRow);
                        dataEdit.push(tempRow);
                        maxPageCount = Math.ceil(count / pageElementN) - 1;
                        indexNo.push(parseInt(i-1));
                    } else {
                        dataEdit.push([]);
                    }
                } else {
                    rowTest = new Eval(row, conditions[0].value);
                    result = rowTest.run(newSearchConditionString);
                    if (result && (rowTest.object[0].row[searchFieldIndex[0]] != "") || (newSearchConditionString == '1 == 1' && (rowTest.object[0].row[searchFieldIndex[0]] != ""))) {
                        count++;
                        for (var j = 0; j < dataFieldOrder.length; j++) {
                            var index = searchHeader.indexOf(dataFieldOrder[j]);

                            if (index > -1) {
                                tempRow.push(row[index]);
                                header.push(searchHeader[index]);
                            }
                        }
                        data.push(tempRow);
                        dataCheck.push(tempRow);
                        dataEdit.push(tempRow);
                        maxPageCount = Math.ceil(count / pageElementN) - 1;
                        indexNo.push(parseInt(i-1));
                    } else {
                        dataEdit.push([]);
                    }
                }

                if (linkHeader !== undefined || linkHeader !== '' && headerFrom !== '') {
                    for (const i in dataFieldOrder) {
                        if (dataFieldOrder[i] == linkHeader.oriHeader) {
                            oriDataIndex = i;
                        }
                    }
                }
                

                //Runs when the mode is counting
                for(var j = 0; j < conditions.length; j++){
                    if (dataCheck.length > 0 && conditions[j].mode.includes('count')) {
                        if (conditions[j].mode.includes('year')) {
                            if (!dataCountInitialized) {
                                dataCount = new Array(12).fill("");
                                dataCountInitialized = true;
                            }
                            var date = toDate(row[searchFieldIndex[j]]);
                            var month = date.getMonth();
                            for(const i in monthIndex) {
                                if (month == i) {
                                    ++dataCount[i];
                                    dataCheck = [];
                                } else {
                                    continue;
                                }
                            }
                            dataCheck = [];
                        }
                        else if (conditions[j].mode.includes('ethnics')) {
                            ethnicIndex = j;
                            if (!dataCountInitialized) {
                                dataCount = new Array(4).fill(0);
                                dataCountInitialized = true;
                            }
                            for(const i in ethnicGroups) {
                                if(dataCheck == ethnicGroups[i]) {
                                    ++dataCount[i];
                                    dataCheck = [];
                                } else {
                                    continue;
                                }
                            }
                            dataCheck = [];
                        }
                        else if (conditions[j].mode.includes('disease')) {
                            diseaseIndex = j;
                            if (!dataCountInitialized) {
                                dataCount = new Array(3).fill(0);
                                dataCountInitialized = true;
                            }
                            for(const i in diseaseTypes) {
                                if(dataCheck == diseaseTypes[i]) {
                                    ++dataCount[i];
                                    dataCheck = [];
                                } else {
                                    continue;
                                }
                            }
                            dataCheck = [];
                        }
                    }
                }
            }

            //If there are matching results, do these post processing on the datas then display the table
            if (count > 0) {
                console.log("Count: " + count);
                for (const j in data) {
                    for(const k in data[j]) {
                        if (data[j][k] == undefined) {
                            data[j][k] = " ";
                        }
                    }
                    
                }

                if (conditions[yearIndex].mode.includes('count') && conditions[yearIndex].mode.includes('year')) {
                    data = [];
                    count = 0;
                    for(var i = 0; i < 12; i++) {
                        data[i] = [conditions[yearIndex].value.slice(0, 4), (i + 1).toString(), dataCount[i].toString()];
                        count++;
                    }
                    maxPageCount = Math.ceil(count / pageElementN) - 1;
                } else if ((conditions[ethnicIndex].mode.includes('count') && conditions[ethnicIndex].mode.includes('ethnics')) && ((conditions[yearIndex].mode.includes('year')) || (conditions[monthIndexReport].mode.includes('month')))) {
                    data = [];
                    count = 0;
                    var year;
                    for(var i = 0; i < 4; i++) {
                        if (conditions[yearIndex].mode.includes('year')) {
                            year = conditions[yearIndex].value.slice(0, 4);
                        } else {
                            year = conditions[monthIndexReport].value.slice(0, 4);
                        }
                        data[i] = [year, ethnicGroups[i].toString(), dataCount[i].toString()];
                        count++;
                    }
                    maxPageCount = Math.ceil(count / pageElementN) - 1;
                } else if (conditions[diseaseIndex].mode.includes('count') && conditions[yearIndex].mode.includes('year')) {
                    data = [];
                    count = 0;
                    for(var i = 0; i < diseaseTypes.length; i++) {
                        data[i] = [conditions[yearIndex].value.slice(0, 4), diseaseTypes[i].toString(), dataCount[i].toString()];
                        count++;
                    }
                    maxPageCount = Math.ceil(count / pageElementN) - 1;
                } else if (conditions[diseaseIndex].mode.includes('duration')) {
                    for(var i = 0; i < data.length; i++) {
                        var dateIndex;
                        if(data[i][4]) {
                            var dateCalc1 = new Date(data[i][4]);
                            dateIndex = 4;
                        } else if(data[i][5]) {
                            var dateCalc1 = new Date(data[i][5]);
                            dateIndex = 5;
                        }
                        //var dateCalc1 = new Date(data[i][4]);
                        var dateCalc2 = toDateCalc(data[i][3]);
                        differenceDay.push((dateCalc1.getTime() - dateCalc2.getTime()) / (1000*3600*24));

                        if (!conditions[diseaseIndex].mode.includes('cumulative') && differenceDay[i] > 31) {
                            dateCalc2 = toDate(data[i][dateIndex]);
                            dateCalc2.setDate(1);
                            differenceDay[i] = (dateCalc1.getTime() - dateCalc2.getTime()) / (1000*3600*24) + 1;
                        }

                        if(!isNaN(differenceDay[i])) {
                            data[i].push((differenceDay[i]).toString());
                        } else {
                            data[i].push(" ");
                        }
                    }
                    
                }

                //IF linking is needed
                if (linkHeader !== undefined && linkHeader.oriHeader !== '' && linkHeader.externalHeader !== '' && headerFrom !== '') {
                    gapi.client.sheets.spreadsheets.values.get({
                        spreadsheetId: accessSpreadsheetId,
                        range: `'${headerFrom}'!A:ZZZ`,
                    }).then(function(response) {
                        var dataExtern = response.result.values;
                        var oriIndex;
                        var externIndex = [];
                        var externFieldIndex = [];
                        
                        //WIP matching data from external sheet
                        
                        for (const j in dataFieldOrder) {
                            if (dataExtern[0][j] == linkHeader.oriHeader) {
                                oriIndex = j;
                            } 
                            for (const k in linkHeader.externalHeader) {
                                if (dataExtern[0][j] == linkHeader.externalHeader[k]) {
                                    externIndex.push(j);
                                }
                                if (dataFieldOrder[j] == linkHeader.externalHeader[k]) {
                                    externFieldIndex.push(j);
                                }
                            }
                        }

                        for (const i in data) {
                            for (const j in dataExtern) {
                                var offset = 0;
                                if (data[i][oriDataIndex] == dataExtern[j][oriIndex]) {
                                    for (const k in linkHeader.externalHeader) {
                                        data[i].splice(parseInt(externFieldIndex[k]) + offset, 0, dataExtern[j][externIndex[k]]);
                                        offset++;
                                    }
                                    
                                } else {
                                    continue;
                                }
                            }
                        }

                        if (!tableGenerated) {
                            if (formID == 'generatePatientsDatabaseReport' || formID == 'patientsListReturnEquipment' || formID == 'equipmentRecord' || formID == 'borrowersRecord' || formID == 'patientsHomeVisitRecord') {
                                dataFieldOrder.splice(0, 0, " ");
                                for (var i = 0; i < data.length; i++) {
                                    data[i].splice(0, 0, " ");
                                }
                            }
                            showTable(pageIndex, pageElementN, maxPageCount, dataFieldOrder, data);
                            header = dataFieldOrder;
                            headerGenerated = false;
                            tableGenerated = true;
                            spinner.setAttribute('style', 'display: none;');

                            var hideBtn = document.getElementsByClassName('hideBtn');

                            for (var i = 0; i < hideBtn.length; i++) {
                                hideBtn[i].setAttribute('style', 'display: inline');
                            }
                        }
                        
                    })
                } else {
                    if (!tableGenerated) {
                        if (formID == 'generatePatientsDatabaseReport' || formID == 'patientsListReturnEquipment' || formID == 'equipmentRecord' || formID == 'borrowersRecord' || formID == 'patientsHomeVisitRecord') {
                            dataFieldOrder.splice(0, 0, " ");
                            for (var i = 0; i < data.length; i++) {
                                data[i].splice(0, 0, " ");
                            }
                        }
                        showTable(pageIndex, pageElementN, maxPageCount, dataFieldOrder, data);
                        header = dataFieldOrder;
                        headerGenerated = false;
                        tableGenerated = true;
                        spinner.setAttribute('style', 'display: none;');
                    }
                    var hideBtn = document.getElementsByClassName('hideBtn');

                    for (var i = 0; i < hideBtn.length; i++) {
                        hideBtn[i].setAttribute('style', 'display: inline');
                    }
                }
                
            } else {
                console.log("No records found.");
                var hideBtn = document.getElementsByClassName('hideBtn');

                for (var i = 0; i < hideBtn.length; i++) {
                    hideBtn[i].setAttribute('style', 'display: none');
                }
                spinner.setAttribute('style', 'display: none;');
                document.getElementById('error').setAttribute('style', 'display: block');
            }
        }, function (error) {
            //Fail, handles errors
            console.log(error);
        })
    }
}

function resetTable() {
    tableGenerated = false;
    data=[];
    dataEdit=[];
    count = 0;
}

function EvalNew(row1, value1, row2, value2) {
    this.object = [{
        row: row1,
        value: value1
    }, {
        row: row2,
        value: value2
    }];
}

function Eval(row1, value1) {
    this.object = [{
        row: row1,
        value: value1
    }];
}

EvalNew.prototype.run = function (str) {
    var func = new Function("return " + str);
    if (func.call(this)) {
        return true;
    } else {
        return false;
    }
};

Eval.prototype.run = function (str) {
    var func = new Function("return " + str);
    if (func.call(this)) {
        return true;
    } else {
        return false;
    }
};

function toDate(dateStr) {
    var date;
    if(dateStr.includes('/')) {
        var parts = dateStr.split("/");
        date = new Date(parts[2] + "-" + (parts[1]));
        date.setHours(0,0,0,0);
        return date;
    } else {
        date = new Date(dateStr);
        date.setHours(0,0,0,0);
        return date;
    }
    
}

function toDateInput(dateStr) {
    var parts = dateStr.split("/");
    var string = parts[0] + "-" + parts[1];
    var date = new Date(string);
    date.setHours(0,0,0,0);
    return date;
}

function toDateYear(dataStr) {
    var newYear = parseInt(dataStr);
    var date = new Date(newYear.toString());
    date.setHours(0,0,0,0);
    return date;
}

function toDateCalc(dateStr) {
    var date;
    if(dateStr.includes('/')) {
        var parts = dateStr.split("/");
        date = new Date(parts[2] + "-" + (parts[1]) + "-" + parts[0]);
        date.setHours(0,0,0,0);
        return date;
    } else {
        date = new Date(dateStr);
        date.setHours(0,0,0,0);
        return date;
    }
}

