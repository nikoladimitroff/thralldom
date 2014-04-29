(function () {
    var window = self = this;
    navigator.sayswho = (function () {
        var ua = navigator.userAgent, tem,
        M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
        if (/trident/i.test(M[1])) {
            tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
            return 'IE ' + (tem[1] || '');
        }
        if (M[1] === 'Chrome') {
            tem = ua.match(/\bOPR\/(\d+)/)
            if (tem != null) return 'Opera ' + tem[1];
        }
        M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
        if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
        return M.join(' ');
    })() || "";

    var browsers = {
        chrome: "Chrome",
        ie: "IE",
        firefox: "Firefox",
        safari: "Safari",
        opera: "Opera",
    }

    var unsupportedPairs = [
        [browsers.chrome, 32],
        [browsers.firefox, 27],
        [browsers.ie, 10],
        [browsers.opera, Number.MAX_VALUE],
        [browsers.safari, Number.MAX_VALUE],
    ];


    var navigatorInfo = navigator.sayswho.split(" ");
    var browserInfo = {
        name: navigatorInfo[0],
        version: ~~navigatorInfo[1],
    }

    for (var i in unsupportedPairs) {
        var pair = unsupportedPairs[i];
        if (browserInfo.name.indexOf(pair[0]) != -1 && browserInfo.version <= pair[1]) {
            window.location = "outdated.html";
        }
    }

    var isModern = false;
    for (var browser in Object.keys(browsers)) {
        isModern = isModern || browser.indexOf(browserInfo.name);
    }
    if (!isModern) {
        window.location = "outdated.html";
    }


    if (navigator.sayswho.indexOf(browsers.ie) != -1) {
        // XHR Polyfill, original article http://www.codeproject.com/Articles/19282/Internet-Explorer-Will-Be-Stuck-When-Requests-Too
        // Slightly modified - added all properties of the browser XHR to the replacement. Check the code out in a js prettifier to understand it
        if (window.document) {
            if (!window.Global) { window.Global = {} } Global._ConnectionManager = function () { this._requestDelegateQueue = new Array; this._requestInProgress = 0; this._maxConcurrentRequest = 2 }; Global._ConnectionManager.prototype = { enqueueRequestDelegate: function (e) { this._requestDelegateQueue.push(e); this._request() }, next: function () { this._requestInProgress--; this._request() }, _request: function () { if (this._requestDelegateQueue.length <= 0) return; if (this._requestInProgress >= this._maxConcurrentRequest) return; this._requestInProgress++; var e = this._requestDelegateQueue.shift(); e.call(null) } }; Global.ConnectionManager = new Global._ConnectionManager; if (window.ActiveXObject) { window._originalActiveXObject = window.ActiveXObject; window.ActiveXObject = function (e) { e = e.toUpperCase(); for (var t = 0; t < window._progIDs.length; t++) { if (e === window._progIDs[t].toUpperCase()) { return new XMLHttpRequest } } return new _originaActiveXObject(e) } } window._originalXMLHttpRequest = window.XMLHttpRequest; window.XMLHttpRequest = function () { this._xmlHttpRequest = new _originalXMLHttpRequest; this.readyState = this._xmlHttpRequest.readyState; this._xmlHttpRequest.onreadystatechange = this._createDelegate(this, this._internalOnReadyStateChange) }; window.XMLHttpRequest.prototype = { open: function (e, t, n) { this._xmlHttpRequest.open(e, t, n); this.readyState = this._xmlHttpRequest.readyState }, setRequestHeader: function (e, t) { this._xmlHttpRequest.setRequestHeader(e, t) }, getResponseHeader: function (e) { return this._xmlHttpRequest.getResponseHeader(e) }, getAllResponseHeaders: function () { return this._xmlHttpRequest.getAllResponseHeaders() }, abort: function () { this._xmlHttpRequest.abort() }, _createDelegate: function (e, t) { return function () { return t.apply(e, arguments) } }, _internalOnReadyStateChange: function () { var e = this._xmlHttpRequest; try { this.readyState = e.readyState; this.responseText = e.responseText; this.responseXML = e.responseXML; this.statusText = e.statusText; this.status = e.status } catch (t) { } if (4 == this.readyState) { if (this.onload) { this.onload() } Global.ConnectionManager.next() } if (this.onreadystatechange) { this.onreadystatechange.call(null) } }, send: function (e) { var t = this._createDelegate(this, function () { if (this.responseType) { this._xmlHttpRequest.responseType = this.responseType; } this._xmlHttpRequest.send(e); this.readyState = this._xmlHttpRequest.readyState }); Global.ConnectionManager.enqueueRequestDelegate(t) } }; for (var property in window._originalXMLHttpRequest) { if (!window.XMLHttpRequest.prototype[property]) { window.XMLHttpRequest.prototype[property] = window._originalXMLHttpRequest.prototype[property] } }
        }

        // Worker Polyfill
        if (window.document) {
            Worker.prototype.pm = Worker.prototype.postMessage;
            Worker.prototype.postMessage = function (msg, targetOrigin, transferables) {
                this.pm(msg);
            }
        }
        else {
            self.pm = self.postMessage;
            self.postMessage = function (msg, targetOrigin, transferables) {
                console.log("post from worker");
                this.pm((msg));
            }
        }

        if (window.document) {
            // Set the cursor invisible
            document.getElementById("webGL").classList.add("cursor-hidden");
        }
    }
})();