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
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.3/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.3/FileSaver.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip-utils/0.0.2/jszip-utils.min.js
// ==/UserScript==
var zip = new JSZip();
var currentRecord = 0;
var indicator = $('#middle h1:first-child');

$(document).ready(function() {
    let form = document.getElementsByName('docSearch');
    let fileSelect = document.createElement("input");
    fileSelect = $(fileSelect);
    fileSelect.attr('type', 'file');
    $(form).prepend(fileSelect);
    fileSelect.onclick = function() {
        this.value = null;
    };
    fileSelect[0].onchange = function(e) {
        var files = e.target.files;
        var file = files[0];
        var reader = new FileReader();
        reader.onload = function(evt) {
            var csv = $.csv.toObjects(evt.target.result);
            AddToZip(csv);
        };
        reader.readAsText(file);

    };
});

// Recur adding to zip
async function AddToZip(csv) {
    let href = csv[currentRecord]['href'].split('=')[1];
    let reception = csv[currentRecord]['RECEPTION NO'];
    let urlToPdf = 'https://searchicris.co.weld.co.us/recorder/eagleweb/downloads/' + reception + '?id=' + href + '.A0&parent=' + href + '&preview=false&noredirect=true';
    let name = reception + '.pdf';
    await sleep(5000);
    JSZipUtils.getBinaryContent(urlToPdf, function(err, data) {
        if (err) {
            throw err; // or handle the error
        }
        if (currentRecord == csv.length - 1) {
            zip.generateAsync({
                    type: "blob"
                })
                .then(function(content) {
                    // see FileSaver.js
                    saveAs(content, "Instruments.zip");
                });
        } else {
            zip.file(name, data, {
                binary: true
            });
            console.log('Fetching ' + currentRecord);
            indicator.text('Last fetched : ' + name);
            currentRecord++;
            AddToZip(csv);
        }
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}