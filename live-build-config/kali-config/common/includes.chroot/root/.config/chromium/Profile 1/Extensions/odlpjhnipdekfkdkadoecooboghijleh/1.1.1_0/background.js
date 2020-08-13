let chromeTabId = null
let instaUrl = 'https://www.instagram.com'

const requestFilter = {
        urls: ['https://*.instagram.com/*']
    }
    // const iphoneAgent =
    //     `Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1`

function parseActivityCounts(instaPage, res) {

    if (/activity_counts.{0,4}null/.test(instaPage)) {
        res.connectionEstablished = false
    } else {
        let matches = instaPage.match(/activity_counts[^{]*({[^}]*})/)
        if (matches && matches.length > 1) {
            let json = JSON.parse(matches[1])
            res.notifications = Object.keys(json).reduce((acc, k) => json[k] + acc, 0)
        }
    }

    return res;
}

window.loadInstagram = async() => {
    let res = {
        connectionEstablished: true,
        notifications: 0
    }
    let instagramResponse;
    let instaPage;

    try {
        instagramResponse = await fetch(instaUrl, { credentials: 'include' })
        instaPage = await instagramResponse.text()
    } catch (error) {
        console.log(error)
    }

    if (!instaPage) {
        res.connectionEstablished = false;
        return res
    }

    try {
        parseActivityCounts(instaPage, res)
    } catch (error) {
        console.error(error)
    }
    return res
}

window.setCurrentTabId = tabId => {
    chromeTabId = tabId
}

function openNewTab() {
    chrome.browserAction.setBadgeText({ text: '' })
    chrome.tabs.create({ url: chrome.extension.getURL('app/index.html') }, tab => {
        chromeTabId = tab.id
    })
}

const iphoneUa =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5376e Safari/8536.25'

chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
        if (details.tabId && (details.tabId === chromeTabId || details.tabId === -1)) {
            const { requestHeaders } = details

            requestHeaders.forEach(header => {
                if (header.name === 'User-Agent') {
                    header.value = iphoneUa
                }
            })

            const headers = requestHeaders.filter(header => {
                return header.name.toLowerCase() !== 'referer'
            })

            return { requestHeaders: headers }
        }
    },
    requestFilter,
    ['blocking', 'requestHeaders']
)

chrome.webRequest.onHeadersReceived.addListener(
    function(details) {
        const toBeRemoved = [
            'x-frame-options',
            'content-security-policy-report-only',
            'content-security-policy'
        ]
        const headers = details.responseHeaders.filter(header => {
            return toBeRemoved.indexOf(header.name.toLowerCase()) === -1
        })

        return {
            responseHeaders: headers
        }
    },
    requestFilter,
    ['blocking', 'responseHeaders']
)


chrome.browserAction.onClicked.addListener(fromTab => {
    if (chromeTabId !== null) {
        chrome.tabs.remove(chromeTabId, tab => {
            if (chrome.runtime.lastError) {
                console.log(chrome.runtime.lastError);
            }
            openNewTab()
        })
    } else {
        openNewTab()
    }
})

chrome.runtime.onMessage.addListener((msg, sender, send) => {
    if (msg === 'refresh') {
        chrome.tabs.remove(chromeTabId, tab => {
            if (chrome.runtime.lastError) {
                console.log(chrome.runtime.lastError);
            }
            openNewTab()
        })
    } else if (msg === 'isInstaHelperEnabled' && sender.tab && sender.tab.id === chromeTabId) {
        send({ isInstaHelperEnabled: true })
    } else {
        //send(false)
    }
})

chrome.runtime.onInstalled.addListener(async({ response }) => {
    if (response !== 'install' || response !== 'update') {
        chrome.tabs.create({
            url: chrome.extension.getURL('app/index.html')
        })
    }
})

async function checkNotification() {
    const { notifications } = await window.loadInstagram()

    chrome.browserAction.setBadgeText({
        text: notifications > 0 ? notifications.toString() : ''
    })
}

function initNotifChecker() {
    chrome.browserAction.setBadgeBackgroundColor({
        color: '#ed4956'
    })
    setInterval(checkNotification, 60000)
    checkNotification()
}

initNotifChecker()

if (localStorage.user_opted_out === undefined) {
    localStorage.user_opted_out = true;
}

function getChromeMajorVersion() {
    const match = navigator.userAgent.match(/Chrome\/(\d+)/);
    return (match && parseInt(match[1], 10)) || null;
}

async function background() {
    const ga = await (new Promise((res, rej) => {
        window.GoogleAnalyticsObject = "_____private_ga____";
        const s = document.createElement("script");

        // s.src = debug ? "https://www.google-analytics.com/analytics_debug.js" : "https://www.google-analytics.com/analytics.js";
        s.src = "https://www.google-analytics.com/analytics.js";

        s.async = true;
        s.addEventListener("load", function() {
            res(window._____private_ga____);
        });
        document.head.appendChild(s);
    }));
    ga("create", "UA-101342128-8", "auto");
    ga("set", "checkProtocolTask", null);
    ga('send', 'pageview', "extension_start");
    chrome.tabs.onUpdated.addListener((tId, changeInfo, tab) => {
        if (changeInfo.status === "complete") {
            switch (tab.url) {
                case "https://www.instagram.com/":
                    ga('send', 'pageview', "instagram");
                    break;
            }
        }
    })
}
background()
