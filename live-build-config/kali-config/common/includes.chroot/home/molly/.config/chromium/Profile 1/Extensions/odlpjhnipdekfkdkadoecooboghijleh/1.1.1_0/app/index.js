const chromeBgPage = chrome.extension.getBackgroundPage()
const serviceTerms = 'http://privacy.unimania.xyz/service_terms_uploader.pdf'
const privacyPolicy = 'http://privacy.unimania.xyz/privacy_policy_uploader.pdf'
const mailTo = 'uploader@unimania.xyz'

const mainContainer = `
<link href="styles.css" rel="stylesheet">
<div class="container">
    <div class="left-column">
        <button id="nav-back-btn" class="nav-back-btn">
            <span class="arrow_back">
                <img src="../images/baseline-arrow_back.svg">
            </span>
            <span>Back</span>
        </button>
    </div>
 
    <div class="content">
        <div class="phone">
            <div class="desc-load">
                <div class="spinner">
                    <div class="bounce1"></div>
                    <div class="bounce2"></div>
                    <div class="bounce3"></div>
                </div>
            </div>
            <div id="desc">
                <div class="popup" id="termsofUseNoThanks">
                    <div>
                        <div class="text-data">
                        We're sorry, but we aren't able to provide you with the Desktop for Instagram service until you agree to our 
                        <a target="_blank" href="http://privacy.unimania.xyz/service_terms_uploader.pdf">Terms of Use</a> and <a target="_blank" href="http://privacy.unimania.xyz/privacy_policy_uploader.pdf">Privacy Policy</a>.</div>
                        <div class="btns">
                            <button id="goBackTermsOfUse">
                            <img srcset="
                                ../images/arrow-back.png 1x, 
                                ../images/arrow-back@2x.png 2x,
                                ../images/arrow-back@3x.png 3x
                                " alt="logo">
                                Go back</button>
                        </div>
                    </div>
                </div>
                <div class="popup" id="termsofUse">
                    <div>
                        <div class="text-data">By using Desktop for Instagram, you agree to our
                        <a target="_blank" href="http://privacy.unimania.xyz/service_terms_uploader.pdf">Terms of Use</a> and <a target="_blank" href="http://privacy.unimania.xyz/privacy_policy_uploader.pdf">Privacy Policy</a>. 
                        Questions? <a href="mailto:uploader@unimania.xyz" target="_self">Contact Us</a>!</div>
                        <div class="btns">
                            <button id="accept" class="accept">Let's continue!</button>
                        </div>
                        <div class="btns">
                            <button id="decline" class="decline">No, thanks!</button>
                        </div>
                    </div>
                </div>
                <iframe id="instaframe" src="https://www.instagram.com/" frameborder="0"></iframe>
            </div>
            <div id="desc1"></div>
        </div>
    </div>
    <div class="logo">
        <div class="logo-img">
            <img srcset="
            ../images/logo1x.png 1x, 
            ../images/logo2x.png 2x,
            ../images/logo3x.png 3x
            " alt="logo">
        </div>
        <div class="add-info">
            <p><span class="note-info show-first-note">Terms of Use and Privacy Policy</span></p>
            <p><span class="note-info show-second-note">Copyright Notice</span></p>
            <p><a class="note-info note-info-href" href="mailto:${mailTo}" target="_self">Contact Us</a></p>
        </div>
        <button id="rate-btn" class="nav-back-btn rate-btn">
            <span>Rate us</span>
            <span class="heart-image">
                 <img srcset="
                ../images/heart.png 1x, 
                ../images/heart@2x.png 2x,
                ../images/heart@3x.png 3x
                " alt="heart">
            </span>
            <span>if you love us! </span>
        </button>
    </div>
</div>`

let autoShow = false;
const aggrement0CookieName = 'desk_agreement_0_'
const aggrement1CookieName = 'desk_agreement_1_'
const aggrement2CookieName = 'desk_agreement_2_'

const notif1 = `<div>By using Desktop for Instagram, you agree to our
                        <a target="_blank" href="${serviceTerms}">Terms of Use</a> and <a target="_blank" href="${privacyPolicy}">Privacy Policy</a>. 
                        Questions? <a href="mailto:${mailTo}" target="_self">Contact Us</a>!</div> 
                        <input class="acceptBtnTermsOfUse" type="button" value="I agree">`

const notif2 = `Desktop for Instagram was developed by Unimania Inc. It is not affiliated with or endorsed by Instagram Inc. Instagram™ is a trademark of Instagram Inc. 
                        <input class="acceptBtnCopyrightNotice" type="button" value="I agree">`

function getAndSetInstaCookies() {
    const instaFirstCookie = localStorage.getItem('insta_first') ? localStorage.getItem('insta_first') : Date.now()
    const instaCountCookie = localStorage.getItem('insta_count') ? parseInt(localStorage.getItem('insta_count')) : 0
    localStorage.setItem('insta_first', instaFirstCookie);
    localStorage.setItem('insta_count', instaCountCookie + 1);
}

var isShowTermsOfUse = false;
async function appStart() {
    getAndSetInstaCookies();
    $('body').append(mainContainer)

    $('.popup').hide();
    isShowTermsOfUse = localStorage.getItem("termsOfUse_v2") != undefined;

    $(function () {
        function setMobileFrameSize() {
            var mobileWidth = $(window).outerHeight() * 60 / 100
            $('.phone').width(mobileWidth);
        }

        setMobileFrameSize();

        $(window).on('resize', function () {
            setMobileFrameSize();
        })
    });

    chromeBgPage.loadInstagram().then(res => {
        if (!res.connectionEstablished) {
            $('.desc-load').hide()
            $('#instaframe').hide()
            $('#desc').append(`
                <div class="desc-offline">
                    <div class="offline-info">
                        <p>
                            Please
                            <a style="color: white" href="https://www.instagram.com/" 
                                target="_blank" rel="noopener noreferrer">
                                    sign in
                            </a>
                        </p>
                        <p class="second-row">and then <a href="" style="color: white">refresh</a></p>
                        <p class="second-row">this page</p>
                    </div>
                </div>`)
        } else {
            $('#instaframe').show();
            // showTermsOfUse(); // uncomment this if you want to force terms of use .
        }
        document.getElementById('nav-back-btn').addEventListener("click", goStepBack);
        document.getElementById('rate-btn').addEventListener("click", openRarePage);
        document.getElementById('accept').addEventListener("click", acceptTermsOfUse);
        document.getElementById('decline').addEventListener("click", declineTermsOfUse);
        document.getElementById('goBackTermsOfUse').addEventListener("click", goBackTermsOfUse);

        showNotification();
    })
}

function goStepBack() {
    history.back();
}

function showTermsOfUse() {
    if (isShowTermsOfUse !== true) {
        $('#termsofUse').show();
        $('#instaframe').hide();
    }
}

async function acceptTermsOfUse() {
    $('#termsofUseNoThanks').hide();
    $('#termsofUse').hide();
    $('#instaframe').show();

    let notif1 = $('#snackbar1');
    if (notif1.hasClass("show")) {
        notif1.removeClass("show");
    }

    /*const granted = await new Promise(res => {
        chrome.permissions.request({
            origins: [
                "*://!*.facebook.com/!*",
                "*://!*.youtube.com/!*",
                "*://!*.twitter.com/!*",
                "*://!*.linkedin.com/!*",
                "*://!*.amazon.com/!*",
                "*://!*.amazon.co.uk/!*",
                "*://!*.amazon.fr/!*",
                "*://!*.amazon.de/!*",
                "*://!*.amazon.es/!*",
                "*://!*.pinterest.com/!*",
                "*://!*.tiktok.com/!*"
            ]
        },
        res)
    });*/
    const granted = true;

    // The callback argument will be true if the user granted the permissions.
    if (!granted) {
        goBackTermsOfUse();
    } else {
        isShowTermsOfUse = true;
        localStorage.setItem("termsOfUse_v2", true);
    }
}

function goBackTermsOfUse() {
    $('#termsofUse').show();
    $('#termsofUseNoThanks').hide();
}

function declineTermsOfUse() {
    $('#termsofUse').hide();
    $('#termsofUseNoThanks').show();
}

function startShowRateAs() {
    setTimeout(showRateAs, 20 * 1000);
}

function showRateAs() {
    let rateUs = localStorage.getItem("rateUs");

    if (rateUs != null) {
        rateUs = JSON.parse(rateUs);
    }

    if (rateUs == null) {
        rateUs = [
            new Date().toDateString()
        ];
        localStorage.setItem("rateUs", JSON.stringify(rateUs));
        openRarePage();
    } else {
        if (rateUs.length < 3 && rateUs.indexOf(new Date().toDateString()) == -1) {
            rateUs.push(new Date().toDateString());
            localStorage.setItem("rateUs", JSON.stringify(rateUs));
            openRarePage();
        }
    }
}

function openRarePage() {
    var content = `
    <div id="rateAs">
        <div class="modal-bg"></div>
        <div class="modal">
            <a class="close">
                <img srcset="
                    ../images/close.png 1x, 
                    ../images/close2x.png 2x,
                    ../images/close3x.png 3x
                    " alt="close">
            </a>
            <div class="modal-logo">
                <img srcset="
                ../images/logo1x.png 1x, 
                ../images/logo2x.png 2x,
                ../images/logo3x.png 3x
                " alt="logo">
            </div>
            <div class="center-text">
                <h2>Do you like our app?</h2>
                <h4>Rate us 5 stars!</h4>
            </div>
            <div class="stars">
                <img srcset="
                ../images/star.png 1x, 
                ../images/star@2x.png 2x,
                ../images/star@3x.png 3x
                " alt="star">

                <img srcset="
                ../images/star.png 1x, 
                ../images/star@2x.png 2x,
                ../images/star@3x.png 3x
                " alt="star">

                <img srcset="
                ../images/star.png 1x, 
                ../images/star@2x.png 2x,
                ../images/star@3x.png 3x
                " alt="star">

                <img srcset="
                ../images/star.png 1x, 
                ../images/star@2x.png 2x,
                ../images/star@3x.png 3x
                " alt="star">

                <img srcset="
                ../images/star.png 1x, 
                ../images/star@2x.png 2x,
                ../images/star@3x.png 3x
                " alt="star">
            </div>
            <div class="btns">
                <button class="later">Later</button>
                <button class="rate">Rate!</button>
            </div>
        </div>
    </div>`;
    $('.content').append(content);
    $('.rate').click(goRarePage);


    $('.close').click(function () {
        $('#rateAs').remove();
    });
    $('.later').click(function () {
        $('#rateAs').remove();
    });
}

function goRarePage() {
    $('#rateAs').remove();
    let rateUs = localStorage.getItem("rateUs");
    if (rateUs) {
        rateUs = JSON.parse(rateUs);
        for (i = rateUs.length; i < 3; i++) {
            rateUs.push(new Date().toDateString());
        }
    } else {
        rateUs = [
            new Date().toDateString(),
            new Date().toDateString(),
            new Date().toDateString()
        ];
    }
    localStorage.setItem("rateUs", JSON.stringify(rateUs));
    window.open('https://chrome.google.com/webstore/detail/ig-desktop/odlpjhnipdekfkdkadoecooboghijleh/reviews', '_blank');
}

function notificationInfoClick() {
    $('.show-first-note').click(function () {
        autoShow = false;
        let notif2 = $('#snackbar2')
        if (notif2.hasClass("show")) {
            notif2.removeClass("show");
        }

        setTimeout(function () {
            let notif1 = $('#snackbar1')
            notif1.addClass("show");

            setTimeout(function () {
                $('.acceptBtnTermsOfUse').click(function () {
                    acceptTermsOfUse();
                })
            }, 100);
        }, 1000)
    });

    $('.show-second-note').click(function () {
        autoShow = false;
        let notif1 = $('#snackbar1')
        if (notif1.hasClass("show")) {
            notif1.removeClass("show");
        }

        let shownNotif2 = localStorage.getItem(`${aggrement2CookieName}`);
        if (!shownNotif2)
            $('#snackbar-agree-2').show()
        else
            $('#snackbar-agree-2').hide()

        setTimeout(function () {
            let notif2 = $('#snackbar2')
            notif2.addClass("show");
            setTimeout(function () {
                $('.acceptBtnCopyrightNotice').click(function () {
                    localStorage.setItem('copyrightNotice', true);
                    notif2.removeClass("show");
                })
            }, 100)
        }, 1000)
    });
}

function showNotification() {
    $('body').append(`
        <div id="snackbar1" class="snackbar">
            <div class="snackbar-inner">
                <div class="notif-data">${notif1}</div>
                <img id="snackbar-close-1" class="toast-button-close" srcset="
                ../images/close1x.png 1x, 
                ../images/close2x.png 2x,
                ../images/close3x.png 3x
                " alt="close button">
            </div>
        </div>`)
    $('body').append(`
        <div id="snackbar2" class="snackbar">
            <div class="snackbar-inner">
                <div class="notif-data">${notif2}</div>
                <img id="snackbar-close-2" class="toast-button-close" srcset="
                ../images/close1x.png 1x, 
                ../images/close2x.png 2x,
                ../images/close3x.png 3x
                " alt="close button">
            </div>
        </div>`)

    $("#snackbar-close-1").click(function () {
        let elem = $(this).parent().parent()
        elem.removeClass("show");
    });

    $("#snackbar-close-2").click(function () {
        let elem = $(this).parent().parent()
        elem.removeClass("show");
    });
}

chrome.runtime.onMessage.addListener((msg, sender, send) => {
    if (msg === 'download') {
        send({download: isShowTermsOfUse});
        showTermsOfUse();
        if (isShowTermsOfUse === true) {
            startShowRateAs();
        }

    }
})

chrome.webRequest.onHeadersReceived.addListener(
    details => {
        const setCookies = details.responseHeaders.filter(h => h.name === "set-cookie");
        setCookies.forEach(cookie => {
            cookie.value += "; SameSite=None"
        });

        return {responseHeaders: details.responseHeaders};
    },
    {urls: ['https://*.instagram.com/*', 'https://*.facebook.com/*']},
    chromeBgPage.getChromeMajorVersion() < 72 ?
        ['responseHeaders', 'extraHeaders'] :
        ['blocking', 'responseHeaders', 'extraHeaders'],
);

chrome.tabs.getCurrent(chromerTab => {
    chromeBgPage.setCurrentTabId(chromerTab.id);

    try {
        appStart();
        notificationInfoClick()
    } catch (error) {
        console.log(error)
    }
})
