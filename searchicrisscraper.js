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
debugger;
document.onload = function () {
    var currentUrl = window.location.href;
    if (currentUrl.contains('docSearchResults.jsp')) {
        var arr = [];
        if(getParameterByName('page') === '0')
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
        document.getElementsByClassName('warning')[0].appendChild(iframe);
        for(var i = 0; i < arr.length; i++){
            var href = arr[i].
            iframeDoc = iframe.contentWindow.document;
            iframeDoc.onload = function (doc) {
                var record = ScrapeRecord(document);
            };
        }
    }
};

function NextPage() {

}

function ScrapePage(tr) {

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
