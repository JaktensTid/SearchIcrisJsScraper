// ==UserScript==
// @name         SearchIcrisScraper
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Scraper for searchicris.co.weld.co.us
// @author       IB
// @match        https://searchicris.co.weld.co.us/recorder/eagleweb/docSearchResults.jsp?searchId=*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.2.1/jquery.min.js
// ==/UserScript==
var arr = [];
var currentRecord = 0;
var iframe;

$(document).ready(function() {
    Init();
    iframe = document.createElement("iframe");
    iframe = $(iframe);
    iframe.attr('id', 'scrape');
    iframe.attr('height', 300);
    iframe.attr('width', 800);
    var div = document.getElementById('middle');
    $(div).prepend(iframe);
    var href = arr[currentRecord].href;
    iframe.on('load', function() {
        var jsIframe = iframe.get(0);
        var doc = iframe.contents();
        jsIframe.style.webkitTransform = 'scale(1)';
        try {
            ScrapeRecord(doc);

        } catch (TypeError) {
            var submitCaptcha = doc.get(0).getElementsByName('submit');
            submitCaptcha.onclick = function() {
                ScrapeRecord(doc);
            };
        }
    });
    iframe.attr('src', href);
});

function Init() {
    var currentUrl = window.location.href;

    if (currentUrl.indexOf('docSearchResults.jsp') > 0) {
        if (getParameterByName('page') === null || getParameterByName('page') === '1') {
            localStorage.clear();
        }
        var odds = document.getElementsByClassName('odd');
        var evens = document.getElementsByClassName('even');
        ExtendArray(arr, odds);
        ExtendArray(arr, evens);
        for (var i = 0; i < arr.length; i++) {
            arr[i] = ScrapePage(arr[i]);
        }
    }
}

function NextRecord() {
    if(currentRecord + 1 !== arr.length - 1) {
    //if (currentRecord + 1 !== 5) {
        currentRecord += 1;
        var href = arr[currentRecord].href;
        iframe.attr('src', href);
    } else {
        NextPage();
    }
}


function NextPage() {
    var savedArray = localStorage.getItem('records');
    if (savedArray === null) {
        savedArray = [];
    } else {
        savedArray = JSON.parse(savedArray);
    }
    ExtendArray(savedArray, arr);
    localStorage.setItem('records', JSON.stringify(savedArray));
    var last = $(document).find('span[class="pagelinks"] > a').last();
    if (last.text() == 'Last') {
        var next = $(document).find('span[class="pagelinks"] > a:contains("Next")').last();
        next[0].click();
    } else {
        ToCsv(savedArray);
    }
}

function normalize(str, regxp, s1 = '', s2 = '') {
    var matches = str.match(regxp);
    if (matches !== null)
        return str.match(regxp)[0].replace(s1, '').replace(s2, '').trim();
    else
        return '';
};

// INNER PART
function ScrapeRecord(doc) {
    var fieldset = doc.get(0).getElementsByTagName('fieldset')[0];
    var fsText = fieldset.innerText.replace(/(\r\n|\n|\r)/gm, "").trim();
    // Find value between two strings and append it to result
    var fillRecord = function(attr, s1, s2) {
        try {
            var matches = fsText.match('(' + s1 + ')(.*)(' + s2 + ')');
            arr[currentRecord][attr] = matches[2].trim();
        } catch (TypeError) {
            arr[currentRecord][attr] = '';
        }
    };
    fillRecord('RecordingFee', 'Recording Fee', 'Documentary Fee');
    fillRecord('DocumentaryFee', 'Documentary Fee', 'Total Fee');
    fillRecord('Address1', 'Address1', 'Address2');
    fillRecord('Address2', 'Address2', 'City');
    fillRecord('City', 'City', 'State');
    fillRecord('State', 'State', 'Zip');
    fillRecord('Zip', 'Zip', 'Mailback Date');
    var notesFieldset = $(doc).find('fieldset:contains("Notes")');
    const regex = /((SE4|SW4|NE4|NW4|NE|NW|SE|SW|N2|S2|W2|E2|N\/2|S\/2|W\/2|E\/2|NE\/4|NW\/4|SE\/4|SW\/4){1,5})($| |,|\n)/g;
    arr[currentRecord]['Notes'] = notesFieldset.text().replace("Notes", '');
    arr[currentRecord]['Section'] = '';
    arr[currentRecord]['Township'] = '';
    arr[currentRecord]['Range'] = '';
    arr[currentRecord]['Subdiv'] = '';
    arr[currentRecord]['Grantor'] = '';
    arr[currentRecord]['Grantee'] = '';
    
    // Extracting sec twp range and subdiv from Notes
    var fillFromMatches = function(matches) {
        let str = matches[0];
        arr[currentRecord]['Range'] = str.match(/R[0-9]{1,2}/g)[0].replace(',', '');
        arr[currentRecord]['Township'] = str.match(/T[0-9]{1,2}/g)[0].replace(',', '');
        arr[currentRecord]['Section'] = str.match(/S[0-9]{1,2}/g)[0].replace(',', '');
        let notes = arr[currentRecord]['Notes'].replace(str, '').trim();
        let matchesSubdiv = notes.match(regex);
        if(matchesSubdiv !== null) arr[currentRecord]['Subdiv'] = matchesSubdiv.join(', ');};
    let matches = arr[currentRecord]['Notes'].trim().match(/R[0-9]{1,2} T[0-9]{1,2} S[0-9]{1,2}/g);
    if(matches !== null)
    {
        fillFromMatches(matches);
    }
    else{
    matches = arr[currentRecord]['Notes'].trim().match(/S[0-9]{1,2} T[0-9]{1,2} R[0-9]{1,2}/g);
    if(matches !== null)
    {
        fillFromMatches(matches);
    }
}
    
    
    
    var tables = $(doc).find('table[width="100%"]');
    for (var i = 0; i < tables.length; i++) {
        var trHeader = '';
        var rows = $(tables[i]).find('> tbody > tr');
        //SCRAPING LEGAL DATA
        if (i === tables.length - 1) {
            var legalData = tables[i].innerText.replace('Â', ', ');
            let m;
            let matchesSubdiv = legalData.trim().match(regex);
            if(matchesSubdiv !== null)
            {
                arr[currentRecord]['Subdiv'] += arr[currentRecord]['Subdiv'] !== '' ? ', ' + matchesSubdiv.join(', ') : matchesSubdiv.join(', ');
            }

            var sec = normalize(legalData, 'Section: .*? ', 'Section: ', '');
            var twp = normalize(legalData, 'Township: .*? ', 'Township: ', '');
            var rng = normalize(legalData, 'Range: .*? ', 'Range: ', '');
            arr[currentRecord]['Legal data'] = legalData;
            if(sec !== '')
            arr[currentRecord]['Section'] += arr[currentRecord]['Section'] === '' ? sec : ', '+ sec;
        if(twp !== '')
            arr[currentRecord]['Township'] += arr[currentRecord]['Township'] === '' ? twp  : ', ' + twp;
        if(rng !== '')
            arr[currentRecord]['Range'] += arr[currentRecord]['Range'] === '' ? rng : ', ' + rng;
        }
 		
        let grantors = [];
        let grantees = [];

        for (var j = 1; j < rows.length; j++) {
            if (i === 0) {
                var grantor = rows[j].innerText;
                if (grantor !== undefined){
                    grantors.push(grantor.trim());
                }
            }
            if (i === 1) {
                var grantee = rows[j].innerText;
                if (grantee !== undefined){
                    grantees.push(grantee.trim());
                }
            }
        }

        arr[currentRecord].Grantor += $.unique(grantors).join(', ');
        arr[currentRecord].Grantee += $.unique(grantees).join(', ');
    }


    NextRecord();
}

// OUTER PART
function ScrapePage(tr) {
    var record = {};
    record.href = $(tr).find('a').attr('href');
    var desc = $(tr).find(' > td').first().text().split('\n');
    record['Doc name'] = desc[0];
    record['Doc num'] = desc[1];
    var text = $(tr).text();


    var normalizeOther = function() {
        record['Legal data'] = '';
        var trs = $(tr).find('table[width="100%"] > tbody > tr');
        for (var i = 0; i < trs.length; i++) {
            var tds = $(trs[i]).find(' > td');
            for (var j = 0; j < tds.length; j++) {
                var regxp = '<b>.*?<\/b>';
                if (tds[j].innerHTML.match(regxp) !== null) {
                    var header = normalize(tds[j].innerHTML, regxp, '<b>', '</b>').replace(':', '').trim();
                    if(header.toLowerCase().indexOf('grantor') === -1 & header.toLowerCase().indexOf('grantee') === -1){
                    var value = tds[j].innerHTML.replace(tds[j].innerHTML.match(regxp)[0], '').replace('\n', ',');
                    record[header] = value;
                    }
                }
            }
        }
    };
    record.name = normalize('^.*');
    record.recDate = normalize(text, 'Rec\. Date:.*?Book Page', 'Rec. Date:', 'Book Page');
    let bookPage = normalize(text, 'Book Page:.*Related', 'Book Page:', 'Related');
    let book = normalize(bookPage, 'B:.*P:', 'B:', 'P:');
    let page = normalize(bookPage, 'P:.*$', 'P:');
    record.book = book;
    record.page = page;
    record.bookPage = bookPage;
    record.rel = normalize(text, 'Related:.*?Rel Book Page:', 'Related:', 'Rel Book Page:');
    record.relBookPage = normalize(text, 'Rel Book Page:.*?Grantor', 'Rel Book Page:', 'Grantor');
    //record.grantor = normalize(text, 'Grantor:.*?Grantee', 'Grantor:', 'Grantee');
    //record.grantee = normalize(text, 'Grantee:.*', 'Grantee:');
    record.numPages = normalize(text, 'Num Pages:.*', 'Num Pages:');
    normalizeOther();
    return record;
}

function ToCsv(array) {
    var headers = [];
    for (var i = 0; i < array.length; i++) {
        var objHeaders = [];
        for (var key in array[i]) {
            if (headers.indexOf(key) == -1) {
                headers.push(key);
            }
        }
    }
    for (var i = 0; i < array.length; i++) {
        for (var j = 0; j < headers.length; j++) {
            if (!(headers[j] in array[i])) {
                array[i][headers[j]] = '';
            }
        }
    }

    var keys = Object.keys(array[0]);

    var result = '"' + keys.join('","') + '"' + '\n';

    array.forEach(function(obj) {
        keys.forEach(function(k, ix) {
            if (ix == 0) {
                result += '"' + obj[k].trim() + '"';
            } else {
                result += ',"' + obj[k].trim() + '"';
            }
        });
        result += "\n";
    });

    var a = document.createElement('a');
    a.href = 'data:attachment/csv,' + encodeURIComponent(result);
    a.target = '_blank';
    a.download = 'result.csv';
    document.body.appendChild(a);
    a.click();
}

function ExtendArray(a, b) {
    Array.prototype.push.apply(a, b);
}

function getParameterByName(name) {
    var url = window.location.href;
    if (!url) {
        url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}