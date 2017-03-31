// ==UserScript==
// @name         SearchIcrisScraper
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://searchicris.co.weld.co.us/recorder/eagleweb/docSearchResults.jsp?searchId=*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.2.1/jquery.min.js
// ==/UserScript==

var arr = [];
var currentRecord = 0;

$(document).ready(function () {
    Init();
    var iframe = document.createElement("iframe");
    iframe = $(iframe);
    iframe.attr('id', 'scrape');
    iframe.attr('height', 300);
    iframe.attr('width', 800);
    var div = document.getElementById('middle');
    $(div).prepend(iframe);
    var href = arr[currentRecord].href;
    iframe.on('load', function () {
        var jsIframe = iframe.get(0);
        jsIframe.style.webkitTransform = 'scale(1)';
        ScrapeRecord(jsIframe.contentWindow.document);
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
        $(window).bind('beforeunload', function () {
            var nextArr = localStorage.getItem('records');
            if (nextArr !== null) {
                ExtendArray(nextArr, arr);
                localStorage.setItem('records', nextArr);
            }
        });
    }
}

function NextRecord() {

}


function NextPage() {

}

function ScrapeRecord(doc) {
    var tables = $(doc).find('table[width="100%"]');
    for(var i = 0; i < tables.length; i++){
        var trHeader = $(tables[i]).children('tr:first').text();
        
        console.log(trHeader);
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
    record.rel = normalize('Related:.*?Rel Book Page:', 'Related:', 'Rel Book Page');
    record.relBookPage = normalize('Rel Book Page:.*?Grantor', 'Rel Book Page:', 'Grantor');
    record.grantor = normalize('Grantor:.*?Grantee', 'Grantor:', 'Grantee');
    record.grantee = normalize('Grantee:.*', 'Grantee:');
    record.numPages = normalize('Num Pages:.*', 'Num Pages:');
    return record;
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
