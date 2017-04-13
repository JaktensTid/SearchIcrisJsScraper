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
var recursion = localStorage.getItem('rec');
if(recursion === null)
    recursion =

$(document).ready(function () {
    let form = document.getElementsByName('docSearch');
    function appendElement(name, text, attr)
    {
        let element = document.createElement(name);
        element = $(element);
        element.text(text);
        if(attr !== undefined)
        {
            element.attr(attr[0], attr[1]);
        }
        $(form).prepend(element);
        return element;
    }
    let button1 = appendElement('p', 'Click on me to go');
    let input1 = appendElement('input', '', ['type', 'text']);
    let fileSelect1 = appendElement('input', '', ['type', 'file']);
    appendElement('p', 'Pick .csv file with reception only and enter column name to download .pdfs');
    let csv1;
    fileSelect1[0].onchange = function (e) {
        var files = e.target.files;
        var file = files[0];
        var reader = new FileReader();
        reader.onload = function (evt) {
            csv1 = $.csv.toObjects(evt.target.result);
        };
        reader.readAsText(file);
    };
    button1[0].onclick = function (e) {
        let testObject = csv1[0];
        if (!(input1.val() in testObject)) {
            alert('Incorrect column name');
            return;
        }
        let propName = input1.val();
        iframe = document.createElement("iframe");
        iframe = $(iframe);
        iframe.attr('id', 'scrape');
        iframe.attr('height', 300);
        iframe.attr('width', 800);
        $(form).prepend(iframe);
        iframe.on('load', function () {
            var jsIframe = iframe.get(0);
            var doc = iframe.contents();
            jsIframe.style.webkitTransform = 'scale(1)';
            try {
                let submit = doc.getElementById('DocumentNumberID');
                if (submit.length > 0) {
                    submit = submit[0];
                    let input = doc.getElementById('DocumentNumberID');
                    $(input).text(csv[currentRecord][input1.text()]);
                    //Go to results page
                    submit.click();
                }
                else {
                    var odds = document.getElementsByClassName('odd');
                    if(odds.length === 0) return;
                    let tr = odds[0];
                    let href = $(tr).find('a').attr('href');
                    let reception = csv1[currentRecord][propName];
                    let urlToPdf = 'https://searchicris.co.weld.co.us/recorder/eagleweb/downloads/' + reception + '?id=' + href + '.A0&parent=' + href + '&preview=false&noredirect=true';
                    JSZipUtils.getBinaryContent(urlToPdf, function (err, data) {
                        if (err) {
                            throw err; // or handle the error
                        }
                        if (currentRecord == 3) {
                            zip.generateAsync({
                                type: "blob"
                            })
                                .then(function (content) {
                                    // see FileSaver.js
                                    saveAs(content, "Instruments.zip");
                                    localStorage.Clear();
                                });
                        } else {
                            zip.file(name, data, {
                                binary: true
                            });
                            console.log('Fetching ' + currentRecord);
                            indicator.text('Last fetched : ' + name);
                            Next();
                            iframe.attr('src', 'https://searchicris.co.weld.co.us/recorder/eagleweb/docSearch.jsp');
                        }
                    });
                }
            } catch (TypeError) {
                var submitCaptcha = doc.get(0).getElementsByName('submit');
                submitCaptcha.onclick = function () {
                    //
                };
            }
        });
        iframe.attr('src', 'https://searchicris.co.weld.co.us/recorder/eagleweb/docSearch.jsp');
    };

    let fileSelect2 = appendElement('input', '', ['type', 'file']);
    appendElement('p', 'Pick .csv file with reception and href to download .pdfs');
    fileSelect2.onclick = function () {
        this.value = null;
    };
    fileSelect2[0].onchange = function (e) {
        var files = e.target.files;
        var file = files[0];
        var reader = new FileReader();
        reader.onload = function (evt) {
            let csv = $.csv.toObjects(evt.target.result);
            GetPdfWithHref(csv);
        };
        reader.readAsText(file);

    };
});

async function Next() {
    await sleep(5000);
    currentRecord++;
}

// Recur adding to zip
function GetPdfWithHref(csv) {
    let href = csv[currentRecord]['href'].split('=')[1];
    let reception = csv[currentRecord]['RECEPTION NO'];
    let urlToPdf = 'https://searchicris.co.weld.co.us/recorder/eagleweb/downloads/' + reception + '?id=' + href + '.A0&parent=' + href + '&preview=false&noredirect=true';
    let name = 'Rec - ' + reception + ' & url - ' + href + '.pdf';
    JSZipUtils.getBinaryContent(urlToPdf, function (err, data) {
        if (err) {
            throw err; // or handle the error
        }
        if (currentRecord == 3) {
            zip.generateAsync({
                type: "blob"
            })
                .then(function (content) {
                    // see FileSaver.js
                    saveAs(content, "Instruments.zip");
                });
        } else {
            zip.file(name, data, {
                binary: true
            });
            console.log('Fetching ' + currentRecord);
            indicator.text('Last fetched : ' + name);
            Next();
            GetPdfWithHref(csv);
        }
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}