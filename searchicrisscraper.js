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

$(document).ready(function () {
    Init();
    iframe = document.createElement("iframe");
    iframe = $(iframe);
    iframe.attr('id', 'scrape');
    iframe.attr('height', 300);
    iframe.attr('width', 800);
    var div = document.getElementById('middle');
    $(div).prepend(iframe);
    var href = arr[currentRecord].href;
    iframe.on('load', function () {
        var jsIframe = iframe.get(0);
        var doc = iframe.contents();
        jsIframe.style.webkitTransform = 'scale(1)';
        try{
        ScrapeRecord(doc);
            
        }
        catch(TypeError)
    {
        var submitCaptcha = doc.get(0).getElementsByName('submit');
        submitCaptcha.onclick = function () {
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
    //if(currentRecord + 1 !== arr.length)
    if(currentRecord + 1 !== 5)
    {
currentRecord += 1;
    var href = arr[currentRecord].href;
    iframe.attr('src', href);
    }
    else
    {
        NextPage();
    }
}


function NextPage() {
    var savedArray = localStorage.getItem('records');
    if(savedArray === null)
    {
        savedArray = [];
    }
    else
    {
        savedArray = JSON.parse(savedArray);
    }
    ExtendArray(savedArray, arr);
    localStorage.setItem('records', JSON.stringify(savedArray));
var last = $(document).find('span[class="pagelinks"] > a').last();
    if(last.text() == 'Last')
    {
        var next = $(document).find('span[class="pagelinks"] > a:contains("Next")').last();
        next[0].click();
    }
        else
        {
            ToCsv(savedArray);
        }
}

function ScrapeRecord(doc) {
    var fieldset = doc.get(0).getElementsByTagName('fieldset')[0];
    var fsText = fieldset.innerText.replace(/(\r\n|\n|\r)/gm,"").trim();
     var fillRecord = function(attr, s1, s2){
        try{
        var matches = fsText.match('(' + s1 + ')(.*)(' + s2 + ')');
        arr[currentRecord][attr] = matches[2].trim();
        }
         catch(TypeError)
         {
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
    
    var tables = $(doc).find('table[width="100%"]');
    for(var i = 0; i < tables.length; i++){
        var trHeader = '';
        var rows = $(tables[i]).find('> tbody > tr');
        for(var j = 0; j < rows.length; j++)
        {
            if(j === 0)
            {
                trHeader = rows[0].innerText.trim();
                if(trHeader === '') break;
                arr[currentRecord][trHeader] = '';
            }
            else
            {
                arr[currentRecord][trHeader] += rows[j].innerText.trim();
            }
        }
    }
    
    
    NextRecord();
}

function ScrapePage(tr) {
    var record = {};
    record.href = $(tr).find('a').attr('href');
    var text = $(tr).text();
    var normalize = function (regxp, s1 = '', s2 = '') {
        var matches = text.match(regxp);
        if (matches !== null)
            return text.match(regxp)[0].replace(s1, '').replace(s2, '').trim();
        else
            return '';
    };
    record.name = normalize('^.*');
    record.recDate = normalize('Rec\. Date:.*?Book Page', 'Rec. Date:', 'Book Page');
    record.bookPage = normalize('Book Page:.*Related', 'Book Page:', 'Related');
    record.rel = normalize('Related:.*?Rel Book Page:', 'Related:', 'Rel Book Page:');
    record.relBookPage = normalize('Rel Book Page:.*?Grantor', 'Rel Book Page:', 'Grantor');
    record.grantor = normalize('Grantor:.*?Grantee', 'Grantor:', 'Grantee');
    record.grantee = normalize('Grantee:.*', 'Grantee:');
    record.numPages = normalize('Num Pages:.*', 'Num Pages:');
    return record;
}
    
    function ToCsv(array)
    {
        var headers = [];
        for(var i = 0; i < array.length; i++)
        {
            var objHeaders = [];
            for(var key in array[i])
            {
                if(headers.indexOf(key) == -1)
                {
                    headers.push(key);
                }
            }
        }
        for(var i = 0; i < array.length; i++)
        {
            for(var j = 0; j < headers.length; j++)
            {
                if(!(headers[j] in array[i]))
                {
                    array[i][headers[j]] = '';
                }
            }
        }
        
        var keys = Object.keys(array[0]);
 
    var result = '"' + keys.join('","') + '"' + '\n';
 
    array.forEach(function(obj){
        keys.forEach(function(k, ix){
            if (ix == 0){
            result += '"' + obj[k] + '"';
        }
        else
        {
            result += ',"' + obj[k] + '"';
        }
        });
        result += "\n";
    });

          var a = document.createElement('a');
          a.href  = 'data:attachment/csv,' +  encodeURIComponent(result);
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
