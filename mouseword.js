// ==UserScript==
// @name         Mousetranslate
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Hover over foreign words to translate them
// @author       FranX1024
// @match        *://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant         GM.xmlHttpRequest
// @connect       wordreference.com
// @run-at        document-end
// ==/UserScript==

(function() {
    'use strict';

    function inIframe () {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    }

    if(inIframe()) return;

    /*** configuration ***/

    var languages = 'esen';
    var state = false;

    /*** *** ***** *** ***/

    const LETTER = /(?!\^|\[|\])[a-zA-Záéíóúüñ]/;
    const NUMBERS = /.*?(\d+)/;

    function getTextPos(node, x, y) {
        let lo = 0, hi = node.textContent.length - 1, sol = -1;
        while(lo <= hi) {
            let mid = (lo + hi) >> 1;
            let range = document.createRange();
            range.setStart(node, 0);
            range.setEnd(node, mid + 1);
            let rects = range.getClientRects();
            let hasmouse = false;
            for(let i = 0; i < rects.length; i++) {
                if(
                    rects[i].top <= y &&
                    rects[i].bottom > y &&
                    rects[i].left <= x &&
                    rects[i].right > x
                ) {
                    hasmouse = true;
                    break;
                }
            }
            if(hasmouse) {
                hi = mid - 1;
                sol = mid;
            } else lo = mid + 1;
        }
        return sol;
    }

    function getWordAt(x, y) {
        let element = document.elementFromPoint(x, y);
        let tnode = -1, tpos = -1;
        for(let i = 0; i < element.childNodes.length; i++) {
            let nodei = element.childNodes[i];
            if(nodei instanceof Text) {
                let posi = getTextPos(nodei, x, y);
                if(posi != -1) {
                    tnode = nodei;
                    tpos = posi;
                    break;
                }
            }
        }
        if(tnode == -1) return null;
        let text = tnode.textContent;
        if(!LETTER.test(text[tpos])) return null;

        let left = tpos, right = tpos;
        while(left >= 0 && LETTER.test(text[left])) left--;
        while(right < text.length && LETTER.test(text[right])) right++;
        left++; right--;

        return text.substring(left, right + 1);
    }

    const defbox = document.createElement('div');
    Object.assign(defbox.style, {
        'border': '1px solid #ff8400',
        'background-color': '#ffc566',
        'color': 'black',
        'border-radius': '5px',
        'font-family': "'Brush Script MT', cursive",
        'font-size': '16px',
        'box-shadow': '5px 5px rgba(0, 0, 0, .25)',
        'padding': '5px',
        'position': 'fixed',
        'display': 'none',
        'z-index': '2001'
    });
    defbox.innerHTML = 'akmkfmd fkmgdkgmdfkgv fdkmgdfkmgf';

    function positionDefbox(x, y) {
        let width = document.documentElement.clientWidth;
        let height = document.documentElement.clientHeight;

        let cs2 = getComputedStyle(defbox);
        let mywidth = cs2.width.length > 0 ? Number(cs2.width.match(NUMBERS)[0]) : 0;
        let myheight = cs2.height.length > 0 ? Number(cs2.height.match(NUMBERS)[0]) : 0;

        if(y - myheight - 20 > 0)
            defbox.style.top = y - myheight - 20 + 'px';
        else
            defbox.style.top = y + 10 + 'px';

        if(width > x + 10 + mywidth)
            defbox.style.left = x + 10 + 'px';
        else
            defbox.style.left = x - mywidth - 10 + 'px';
    }

    var lastword = null, lastshow = null, oldx = null, oldy = null;

    function fetchTranslation(word) {
        setTimeout(function() {
            if(lastword != word) return;
            lastshow = defbox.innerText = '...';
            positionDefbox(oldx, oldy);
            let url = 'https://www.wordreference.com/redirect/translation.aspx?w=' + encodeURIComponent(word) + '&dict=' + encodeURIComponent(languages);
            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if (xhr.readyState == XMLHttpRequest.DONE && lastword == word) {
                    let rawdata = xhr.responseText.split('<body>')[1].split('</body>')[0];
                    let wroom = document.createElement('div');
                    wroom.innerHTML = rawdata;
                    let table = wroom.querySelector('table.WRD');
                    if(table) {
                        let output = [];
                        table.querySelectorAll('td.ToWrd').forEach(el => output.push(el.innerText));
                        lastshow = defbox.innerText = output.join('\n');
                    } else lastshow = defbox.innerText = 'No translation';
                    positionDefbox(oldx, oldy);
                }
            }
            xhr.open('GET', url, true);
            xhr.send(null);
        }, 800);
    }

    document.addEventListener('mousemove', function(ev) {
        if(state == false) return;

        let element = document.elementFromPoint(ev.clientX, ev.clientY);
        if(element == defbox) {
            defbox.style.display = 'none';
            return;
        }

        let word = getWordAt(ev.clientX, ev.clientY);
        if(word == null) {
            defbox.style.display = 'none';
            return;
        }
        defbox.style.display = 'block';
        if(word == lastword) {
            defbox.innerText = lastshow;
        } else {
            lastword = word;
            lastshow = defbox.innerText = '?';
            fetchTranslation(word);
        }
        positionDefbox(ev.clientX, ev.clientY);
        oldx = ev.clientX, oldy = ev.clientY;
    });

    /*** conf window UI ***/

    function switchbutton(cb) {
        let green = '#009900', red = '#cc0000';
        let el1 = document.createElement('div');
        let el2 = document.createElement('div');
        Object.assign(el1.style, {
            'border-radius': '10px',
            'width': '40px',
            'height': '20px',
            'background-color': red,
            'margin': '4px',
            'display': 'inline-block',
            'vertical-align': 'middle',
            'padding': '0px'
        });
        Object.assign(el2.style, {
            //'border': '1px solid',
            'border-color': red,
            'background-color': 'white',
            'border-radius': '10px',
            'width': '20px',
            'height': 'calc(100% - 2px)',
            'float': 'left',
            'margin': '1px'
        });
        let state = false;
        function handler() {
            if(state) {
                el1.style['background-color'] = red;
                el2.style['float'] = 'left';
                el2.style['border-color'] = red;
            } else {
                el1.style['background-color'] = green;
                el2.style['float'] = 'right';
                el2.style['border-color'] = green;
            }
            state = !state;
            if(cb) cb(state);
        }
        el1.onclick = handler;
        el1.appendChild(el2);
        return el1;
    }

    const langselector = document.createElement('select');
    langselector.setAttribute('size', '1');
    langselector.style.backgroundColor = 'white';
    langselector.style.display = 'inline-block';
    langselector.innerHTML = `
	<optgroup label="Spanish">
	<option id="enes" value="enes" selected="selected">English-Spanish</option>
	<option id="esen" value="esen">Spanish-English</option>
	<option id="esfr" value="esfr">Spanish-French</option>
	<option id="espt" value="espt">Spanish-Portuguese</option>
	<option id="esit" value="esit">Spanish-Italian</option>
	<option id="esde" value="esde">Spanish-German</option>
	<option id="esca" value="esca">Spanish-Catalan</option>
    <option id="eses" value="eses">Spanish: definition</option>
	<option id="essin" value="essin">Spanish: synonyms</option>
	<option id="esconj" value="esconj">Spanish: conjugations</option>
	</optgroup>
	<optgroup label="French">
	<option id="enfr" value="enfr">English-French</option>
	<option id="fren" value="fren">French-English</option>
	<option id="fres" value="fres">French-Spanish</option>
	<option id="frconj" value="frconj">French: conjugations</option>
	</optgroup>
	<optgroup label="Italian">
	<option id="enit" value="enit">English-Italian</option>
	<option id="iten" value="iten">Italian-English</option>
	<option id="ites" value="ites">Italian-Spanish</option>
	<option id="itit" value="itit">Italian definition</option>
	<option id="itconj" value="itconj">Italian: conjugations</option>
	</optgroup>
	<optgroup label="Catalan">
	<option id="caca" value="caca">Català: definició</option>
	</optgroup>
	<optgroup label="German">
	<option id="ende" value="ende">English-German</option>
	<option id="deen" value="deen">German-English</option>
	<option id="dees" value="dees">German-Spanish</option>
	</optgroup>
	<optgroup label="Dutch">
	<option id="ennl" value="ennl">English-Dutch</option>
	<option id="nlen" value="nlen">Dutch-English</option>
	</optgroup>
	<optgroup label="Swedish">
	<option id="ensv" value="ensv">English-Swedish</option>
	<option id="sven" value="sven">Swedish-English</option>
	</optgroup>
	<optgroup label="Icelandic">
	<option id="enis" value="enis">English-Icelandic</option>
	</optgroup>
	<optgroup label="Russian">
	<option id="enru" value="enru">English-Russian</option>
	<option id="ruen" value="ruen">Russian-English</option>
	</optgroup>
	<optgroup label="Portuguese">
	<option id="enpt" value="enpt">English-Portuguese</option>
	<option id="pten" value="pten">Portuguese-English</option>
	<option id="ptes" value="ptes">Portuguese-Spanish</option>
	</optgroup>
	<optgroup label="Polish">
	<option id="enpl" value="enpl">English-Polish</option>
	<option id="plen" value="plen">Polish-English</option>
	</optgroup>
	<optgroup label="Romanian">
	<option id="enro" value="enro">English-Romanian</option>
	<option id="roen" value="roen">Romanian-English</option>
	</optgroup>
	<optgroup label="Czech">
	<option id="encz" value="encz">English-Czech</option>
	<option id="czen" value="czen">Czech-English</option>
	</optgroup>
	<optgroup label="Greek">
	<option id="engr" value="engr">English-Greek</option>
	<option id="gren" value="gren">Greek-English</option>
	</optgroup>
	<optgroup label="Turkish">
	<option id="entr" value="entr">English-Turkish</option>
	<option id="tren" value="tren">Turkish-English</option>
	</optgroup>
	<optgroup label="Chinese">
	<option id="enzh" value="enzh">English-Chinese</option>
	<option id="zhen" value="zhen">Chinese-English</option>
	</optgroup>
	<optgroup label="Japanese">
	<option id="enja" value="enja">English-Japanese</option>
	<option id="jaen" value="jaen">Japanese-English</option>
	</optgroup>
	<optgroup label="Korean">
	<option id="enko" value="enko">English-Korean</option>
	<option id="koen" value="koen">Korean-English</option>
	</optgroup>
	<optgroup label="Arabic">
	<option id="enar" value="enar">English-Arabic</option>
	<option id="aren" value="aren">Arabic-English</option>
	</optgroup>
	<optgroup label="English monolingual">
	<option id="enen" value="enen">English definition</option>
	<option id="enthe" value="enthe">English synonyms</option>
    <option id="enusg" value="enusg">English usage</option>
    <option id="encol" value="encol">English collocations</option>
    <option id="enconj" value="enconj">English: conjugations</option>
	</optgroup>
`;
    langselector.onchange = function() { languages = langselector.value };

    function createConfWindow() {
        const win = document.createElement('div');
        Object.assign(win.style, {
            'border': '1px solid #848484',
            'background-color': '#d5d5b6',
            'color': 'black',
            'border-radius': '5px',
            'font-family': "'Brush Script MT', cursive",
            'font-size': '16px',
            //'box-shadow': '5px 5px rgba(0, 0, 0, .25)',
            'padding-left': '5px',
            'padding-right': '5px',
            'padding-top': '5px',
            'padding-bottom': '0px',
            'position': 'fixed',
            'top': '-40px',
            'right': '10px',
            'z-index': '2000'
        });
        const dbtn = document.createElement('div');
        Object.assign(dbtn.style, {
            'color': '#444',
            'text-align': 'center',
            'cursor': 'pointer',
            'height': '15px'
        });
        dbtn.innerHTML = '';
        var dbtns = true;
        dbtn.onclick = function() {
            if(dbtns) {
                win.style.top = '-40px';
            } else {
                win.style.top = '5px';
            }
            dbtns = !dbtns;
        }
        win.appendChild(switchbutton((s) => state = s));
        win.appendChild(langselector);
        win.appendChild(dbtn);
        return win;
    }

    /*** INIT FUNCTION ***/

    function init_addon() {
        document.body.appendChild(defbox);
        document.body.appendChild(createConfWindow());
    }

    if(document.body) init_addon();
    else window.addEventListener('load', init_addon);
})();
