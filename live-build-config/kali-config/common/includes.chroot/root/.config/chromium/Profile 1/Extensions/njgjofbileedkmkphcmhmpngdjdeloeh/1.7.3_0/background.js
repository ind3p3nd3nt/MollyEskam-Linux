class Background {
    constructor() {
        this.storage = {darkTheme: false};
        this.appTabId = null;
        this.appWindowId = null;

        chrome.runtime.onInstalled.addListener(function (details) {
            if (details.reason == 'install') {
                chrome.storage.local.set({"userData": {userId: this.generateUid(), installDate: (new Date()).getTime(), events: []}, darkTheme: false, active: 0});
            } else {
                chrome.storage.local.set({"userData": {userId: this.generateUid(), installDate: (new Date()).getTime(), events: []}, active: 0, darkTheme: false,});
            }
        }.bind(this));

        chrome.tabs.query({url: `https://www.instagram.com/`, windowType: "popup"}, function (tabs) {
            if (tabs && tabs[0]) {
                this.appTabId = tabs[0].id;
                this.appWindowId = tabs[0].windowId;
            }
        }.bind(this));
        chrome.browserAction.onClicked.addListener(function () {
            if (this.appWindowId) {
                chrome.windows.update(this.appWindowId, {focused: !0})
            } else {
                chrome.windows.create({type: "popup", url: `https://www.instagram.com/`, width: 400, height: screen.height, left: screen.width - 400}, function (window) {this.appWindowId = window.id;this.appTabId = window.tabs[0].id}.bind(this));
            }
        }.bind(this));

        chrome.tabs.onUpdated.addListener(function (tab) {
            if (tab === this.appTabId) {
                chrome.tabs.executeScript(this.appTabId, {runAt: "document_start", file: "/js/replace.js"});
            }
        }.bind(this));

        chrome.windows.onRemoved.addListener(function (window) {
            if (window === this.appWindowId) {
                this.appTabId = null;
                this.appWindowId = null
            }
        }.bind(this));

        chrome.runtime.onMessage.addListener(function (a) {
            if (a.action == "download") {
                chrome.downloads.download({url: a.url});
            }
            if (a.action == 'open_insta_link') {
                if (this.appTabId) {
                    chrome.tabs.update(this.appTabId, { url: a.url });
                } else {
                    chrome.windows.create({
                        type: 'popup',
                        url: a.url,
                        width: 400,
                        height: screen.height,
                        left: screen.width - 400,
                    }, window => {
                        this.appWindowId = window.id;
                        this.appTabId = window.tabs[0].id;
                    });
                }
            }
        }.bind(this));

        chrome.webRequest.onBeforeSendHeaders.addListener(function (a) {
            if (null != this.appTabId && a.tabId === this.appTabId) {
                let b = a.requestHeaders,
                    c = {};
                for (let i = 0; i < b.length; i++)
                    if ("User-Agent" === b[i].name) {
                        b[i].value = "Mozilla/5.0 (Linux; Android 6.0.1; SM-G920V Build/MMB29K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.98 Mobile Safari/537.36";
                        break
                    }
                c.requestHeaders = b;
                return c;
            }
        }.bind(this), {
            urls: ["*://*.instagram.com/*"],
            types: ["main_frame", "sub_frame"]
        }, ["blocking", "requestHeaders"]);


        chrome.storage.local.get(this.storage, function (items) {
            this.storage = items;
        }.bind(this))


    }

    generateUid() {
        let buf = new Uint32Array(4);
        window.crypto.getRandomValues(buf);
        let idx = -1;
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            idx++;
            let r = (buf[idx >> 3] >> ((idx % 8) * 4)) & 15,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        }.bind(this));
    }
}

var b = new Background();