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

$( document ).ready(function () {
    //jQuery.noConflict();
    var currentUrl = window.location.href;
    if (currentUrl.indexOf('docSearchResults.jsp') > 0) {
        var arr = [];
        if(getParameterByName('page') === null || getParameterByName('page') === '1')
        {
            localStorage.clear();
            localStorage.setItem("records", arr);
        }
        else if(getParameterByName('page') !== undefined)
        {
            arr = localStorage.getItem("records");
        }
        var odds = document.getElementsByClassName('odd');
        var evens = document.getElementsByClassName('even');
        ExtendArray(arr ,odds);
        ExtendArray(arr, evens);
        var iframe = document.createElement("iframe");
        var iP = document.getElementsByClassName('iconic print');
        $( iP[0] ).append( $(iframe) );
        for(var i = 0; i < arr.length; i++){
            var href = $( arr[i] ).find('a').attr('href');
            var doc = iframe.contentWindow.document;
            var item = ScrapePage(arr[i]);
            doc.onload = function (doc) {
                var record = ScrapeRecord(doc);
            };
        }
    }
});

function NextPage() {

}

function ScrapePage(tr) {
var item = {};
    item.href = $(tr).find('a').attr('href');
    var text = $(tr).text();
    item.name = text.match('^.*');
    item.recDate = text.match('Rec\. Date:.*?Book Page')[0].replace('Rec. Date:','').replace('Book Page', '');
    item.rel
}

function ScrapeRecord(document) {

}

function ExtendArray(a, b){
    Array.prototype.push.apply(a,b);
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
