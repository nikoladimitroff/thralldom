/*
 * This code is a modified version of a part of the Bubbles.js library available here: http://bubbles.childnodes.com/
 *
*/

var Subs = {};

Subs.timer = {
    currentTime: 0,
}

Subs.updateInterval = 100;

Subs.Subtitles = function (domElement, text) {
    this.subCont = domElement;
    this.text = text;


    this.showing = false;
    this.active = 0;
    this.currTime = 0;
}

Subs.fixDomElement = function (domElement) {
    Subs.FixedSubtitles = Subs.Subtitles.bind(undefined, domElement);
}
Subs.FixedSubtitles = function () {
    throw new Error("You must call Subs.fixdomElement before using fixed subtitles!");
}

Subs.playSubtitles = function (subtitles) {
    Subs.activeSubtitles = subtitles;
    Subs.timer.currentTime = 0;
}

/**********************
* SRT time to seconds
**********************/
Subs.toSecs = function (t) {
    var s = 0.0,
        p;
    if (t) {
        p = [];
        p = t.split(':');

        for (var i = 0, pLen = p.length; i < pLen; i++)
            s = s * 60 + parseFloat(p[i].replace(',', '.'));
    }
    return s;
};

/**********************
* SRT JS Parser
**********************/
Subs.parse = function (obj) {
    var fileLines = obj.split('\n'),
        len = fileLines.length - 1,
        ret = [],
        old_int = 0,
        j = 0,
        tmp,
        c,
        str = "";

    for (var i = 0; i < len; i++) {
        var string = fileLines[i].replace(/^\s+|\s+$/g, "");

        if (!isNaN(string) && parseInt(fileLines[i]) === (old_int + 1)) {
            ++j;

            old_int = parseInt(fileLines[i]);
            ret[j] = [];

            tmp = [];
            tmp = fileLines[++i].split("-->");

            ret[j]["start"] = Subs.toSecs(tmp[0]);
            ret[j]["end"] = Subs.toSecs(tmp[1]);
            ret[j]["text"] = "";

            c = 0;

            while (fileLines[i + ++c].replace(/^\s+|\s+$/g, "") !== "")
                ret[j]["text"] += fileLines[i + c].replace(/\n\r|\r\n|\n|\r/g, "<br />"); //str_replace("'", '"',  ); in php
        }
    }

    //printing the array
    tmp = ret.length;
    str = [];
    for (var i = 1; i < tmp; i++) {
        str[i - 1] = {
            start: ret[i]["start"],
            end: ret[i]["end"],
            text: ret[i]["text"]
        };
    }
    return str;
};

Subs.loop = function () {
    //subtitles iteration

    var subsObj = Subs.activeSubtitles;
    Subs.timer.currentTime += Subs.updateInterval / 1000;

    if (subsObj) {
        var subLen = subsObj.text.length,
            elem = subsObj.subCont,
            recordedTime = subsObj.curTime,
            currentTime = Subs.timer.currentTime,
            i;

        if (currentTime !== recordedTime) {
            i = subsObj.active;
            subsObj.curTime = currentTime;

            if (recordedTime < currentTime) {
                if (!(subsObj.text[i].end > currentTime && subsObj.showing)) {

                    for (var dd = i; dd < subLen; dd++)
                        if (!Subs.subtitleLoop(subsObj, currentTime, dd, elem)) break;

                    for (var dd = 0; dd < i; dd++)
                        if (!Subs.subtitleLoop(subsObj, currentTime, dd, elem)) break;
                }
            }
            else if (recordedTime > currentTime)
                for (i = i; i >= 0; i--)
                    if (!Subs.subtitleLoop(subsObj, currentTime, i, elem)) break;
        }
    }
    setTimeout(Subs.loop, Subs.updateInterval);
};

//iterates through all subtitles objects
Subs.subtitleLoop = function (subsObj, currentTime, i, elem) {
    var tmp = subsObj.text[i],
        timeStart = tmp.start,
        timeEnd = tmp.end;

    //mark subtitle as active
    if (currentTime > timeStart && currentTime < timeEnd) {
        if (subsObj.active !== i || subsObj.showing === false) {
            subsObj.active = i;
            Subs.subtitleSHOW(elem, tmp.text, true); //on
            subsObj.showing = true;
        }
        return false;
    }
    else {
        if (subsObj.active === i) {
            Subs.subtitleSHOW(elem, tmp.text, false); //off
            subsObj.showing = false;
        }
    }
    return true;
};


/**********************************
 * elem - (node) subtitle's div 
 * test - (string) subtitle text/data 
 * bool - (bool) if true, subtitle is display, if false subtitle's text is cleared
 * 
 * wraps the video in a vanila div container
 * and returns a refference to it
 * also initializes the Subs for Subs specific video
 *********************************/
Subs.subtitleSHOW = function (elem, text, bool) {
    if (bool)
        elem.innerHTML = text;
    else
        elem.innerHTML = "";
};

// Begin looping after the page loads
Subs.loop();