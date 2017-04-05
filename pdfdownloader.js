// ==UserScript==
// @name         PdfDownloader
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  PdfDownloader for searchicris.co.weld.co.us
// @author       IB
// @match        https://searchicris.co.weld.co.us/recorder/eagleweb/docSearch.jsp
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery-csv/0.8.2/jquery.csv.js
// ==/UserScript==

$(document).ready(function() {
    let form = document.getElementsByName('docSearch');
    let fileSelect = document.createElement("input");
    fileSelect = $(fileSelect);
    fileSelect.attr('type', 'file');
    $(form).prepend(fileSelect);
    fileSelect.onclick = function() {this.value = null;};
    fileSelect[0].onchange = function(e) {
    	var files = e.target.files;
        var file = files[0];           
        var reader = new FileReader();
        reader.onload = function(evt) {
            var csv = $.csv.toObjects(evt.target.result);
        };
        reader.readAsText(file);
    };
});

function Download(csv)
{
	let pattern = 
	for(let i = 0; i < csv.length; i++)
	{
		let href = csv[i]['href'];
		let reception = csv[i]['RECEPTION NO'];
		let str = 'https://searchicris.co.weld.co.us/recorder/eagleweb/downloads/${reception}?id=${href}.A0&parent=${href}preview=false&noredirect=true'
	}
}