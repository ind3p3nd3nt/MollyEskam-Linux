class Unseen {
    constructor() {
        this.onInstall();
        this.settings = {
            'block_chat_seen': true,
            'block_chat_receipts': true,
            'block_typing_indicator': true,
            'fbunseen_messenger': false,
            'block_chat_indicator': false,
            'show_mark_as_read': false,
            'dateInstall': (new Date().getTime())
        };
        chrome.storage.local.get(this.settings, function (items) {
            this.settings = items;
            this.init()
        }.bind(this));

        chrome.storage.onChanged.addListener(function (changes, namespace) {
            chrome.storage.local.get(null, function (items) {
                this.settings = items;
                this.init();
            }.bind(this));
        }.bind(this));

    }

    onInstall() {
        chrome.runtime.onInstalled.addListener(function (details) {
            if (details.reason == "install") {
                chrome.storage.local.set({
                    'uid': this.generateUid(),
                    'block_chat_seen': true,
                    'block_chat_receipts': true,
                    'block_typing_indicator': true,
                    'fbunseen_messenger': false,
                    'block_chat_indicator': false,
                    'show_mark_as_read': false,
                    'dateInstall': (new Date().getTime())
                });

            } else if (details.reason == "update") {
                if (this.settings == null) {
                    chrome.storage.local.set({
                        'uid': this.generateUid(),
                        'block_chat_seen': true,
                        'block_chat_receipts': true,
                        'block_typing_indicator': true,
                        'fbunseen_messenger': false,
                        'block_chat_indicator': false,
                        'show_mark_as_read': false,
                        'dateInstall': (new Date().getTime()),
                        'dateUpdate': (new Date().getTime())
                    });
                } else {
                    chrome.storage.local.set({
                        'dateUpdate': (new Date().getTime())
                    })
                }
            }
        }.bind(this));
    }

    init() {
         if (!this.settings.block_chat_seen) {
            chrome.browserAction.setIcon({path: 'assets/icon/128_off.png'});
        }

        chrome.webRequest.onBeforeRequest.addListener(function (details) {
            return {cancel: this.settings.block_chat_seen}
        }.bind(this), {
            urls: ['*://*.facebook.com/*change_read_status*',
                '*://*.messenger.com/*change_read_status*']
        }, ['blocking']);

        chrome.webRequest.onBeforeRequest.addListener(function (details) {
             return {cancel: this.settings.block_chat_receipts}
        }.bind(this), {
            urls: ['*://*.facebook.com/*delivery_receipts*',
                '*://*.messenger.com/*delivery_receipts*',
                '*://*.facebook.com/*unread_threads*',
                '*://*.messenger.com/*unread_threads*']
        }, ['blocking']);

        chrome.webRequest.onBeforeRequest.addListener(function (details) {
            return {cancel: this.settings.block_typing_indicator}
        }.bind(this), {
            urls: ['*://*.facebook.com/*typ.php*',
                '*://*.messenger.com/*typ.php*']
        }, ['blocking']);


        chrome.webRequest.onBeforeRequest.addListener(function (details) {
            return {cancel: this.settings.block_chat_indicator}
        }.bind(this), {
            urls: ['*://edge-chat.facebook.com/*', '*://0-edge-chat.facebook.com/*', '*://1-edge-chat.facebook.com/*',
                '*://2-edge-chat.facebook.com/*', '*://3-edge-chat.facebook.com/*', '*://4-edge-chat.facebook.com/*',
                '*://5-edge-chat.facebook.com/*', '*://6-edge-chat.facebook.com/*', '*://7-edge-chat.facebook.com/*',
                '*://8-edge-chat.facebook.com/*', '*://9-edge-chat.facebook.com/*', '*://www.facebook.com/ajax/chat/*',
                '*://www.facebook.com/chat/*', '*://www.facebook.com/ajax/presence/*', '*://edge-chat.messenger.com/*',
                '*://0-edge-chat.messenger.com/*', '*://1-edge-chat.messenger.com/*', '*://2-edge-chat.messenger.com/*',
                '*://3-edge-chat.messenger.com/*', '*://4-edge-chat.messenger.com/*', '*://5-edge-chat.messenger.com/*',
                '*://6-edge-chat.messenger.com/*', '*://7-edge-chat.messenger.com/*', '*://8-edge-chat.messenger.com/*',
                '*://9-edge-chat.messenger.com/*', '*://www.messenger.com/ajax/chat/*', '*://www.messenger.com/chat/*',
                '*://www.messenger.com/ajax/presence/*']
        }, ['blocking']);

        chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
            switch (message.action) {
                case "getUid":
                    sendResponse({uid: this.settings.uid});
                    break;
                case "getSettings":
                    sendResponse(this.settings);
                    break;
                case "getDisableButton":
                    sendResponse(localStorage['force_disable_button']);
                    break;
                case "quickDisable":
                    chrome.browserAction.setIcon({path: 'assets/icon/128_off.png'});
                    break;
                case "quickEnable":
                    chrome.browserAction.setIcon({path: 'assets/icon/128.png'});
                    break;
                case "addMessenger":
                    chrome.permissions.request({origins: ["*://*.messenger.com/*"]}, function (granted) {
                        if (!granted) {
                            chrome.storage.local.set({fbunseen_messenger: false})
                        }
                    }.bind(this));
                    break;
                default:
            }
        }.bind(this));
    }

    generateUid() {
        let buf = new Uint32Array(4),
            idx = -1;
        window.crypto.getRandomValues(buf);
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            idx++;
            let r = (buf[idx >> 3] >> ((idx % 8) * 4)) & 15,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        }.bind(this));
    }
}

(function () {
    let unseen = new Unseen();
})();


