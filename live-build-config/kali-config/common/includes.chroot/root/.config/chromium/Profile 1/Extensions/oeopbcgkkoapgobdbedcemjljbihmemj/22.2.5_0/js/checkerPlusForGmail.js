// Copyright Jason Savard

var MAX_EMAILS_IN_ATOM_FEED = 20;
var MAX_EMAILS_TO_FETCH = 50;
var MAX_EMAILS_HISTORIES = 100;
var MAX_HISTORY_NEXT = 5;
var MAX_EMAILS_TO_INSTANTLY_ACTION = 10;
var MAX_EMAILS_TO_ACTION = 10;
var TEST_REDUCED_DONATION = false;
var TEST_SHOW_EXTRA_FEATURE = false;
var HTML_CSS_SANITIZER_REWRITE_IDS_PREFIX = "somePrefix-";
var ITEM_ID = "gmail";
var testGmailQuestion = false;
var SOUNDS_FOLDER = "sounds/";

/* MUST be synced with input value='???' in options.html */
var BROWSER_BUTTON_ACTION_CHECKER_PLUS = "checkerPlus";
var BROWSER_BUTTON_ACTION_CHECKER_PLUS_POPOUT = "checkerPlusPopout";
var BROWSER_BUTTON_ACTION_GMAIL_INBOX = "gmailInbox";
var BROWSER_BUTTON_ACTION_GMAIL_TAB = "gmailTab";
var BROWSER_BUTTON_ACTION_GMAIL_IN_NEW_TAB = "gmailInNewTab";
var BROWSER_BUTTON_ACTION_COMPOSE = "compose";

var SYSTEM_PREFIX = "JSYSTEM_";

var SYSTEM_INBOX = SYSTEM_PREFIX + "INBOX";
var SYSTEM_IMPORTANT = SYSTEM_PREFIX + "IMPORTANT";
var SYSTEM_IMPORTANT_IN_INBOX = SYSTEM_PREFIX + "IMPORTANT_IN_INBOX";
var SYSTEM_UNREAD = SYSTEM_PREFIX + "UNREAD";
var SYSTEM_ALL_MAIL = SYSTEM_PREFIX + "ALL_MAIL";
var SYSTEM_PRIMARY = SYSTEM_PREFIX + "PRIMARY";
var SYSTEM_SOCIAL = SYSTEM_PREFIX + "SOCIAL";
var SYSTEM_PROMOTIONS = SYSTEM_PREFIX + "PROMOTIONS";
var SYSTEM_UPDATES = SYSTEM_PREFIX + "UPDATES";
var SYSTEM_FORUMS = SYSTEM_PREFIX + "FORUMS";
var SYSTEM_PURCHASES = SYSTEM_PREFIX + "PURCHASES";
var SYSTEM_FINANCE = SYSTEM_PREFIX + "FINANCE";
var SYSTEM_STARRED = SYSTEM_PREFIX + "STARRED";

var TOTAL_GMAIL_TABS = 5;

var AtomFeed = {};
AtomFeed.INBOX = "";
AtomFeed.IMPORTANT = "important";
AtomFeed.IMPORTANT_IN_INBOX = "^iim";
AtomFeed.UNREAD = "unread"; // note that UNREAD equals "all mail" in reference to tablet view
AtomFeed.PRIMARY = "^smartlabel_personal";
AtomFeed.PURCHASES = "^smartlabel_receipt";
AtomFeed.FINANCE = "^smartlabel_finance";
AtomFeed.SOCIAL = "^smartlabel_social";
AtomFeed.PROMOTIONS = "^smartlabel_promo";
AtomFeed.UPDATES = "^smartlabel_notification";
AtomFeed.FORUMS = "^smartlabel_group";

const MUI = "checkerPlusForGmail";

var MailAction = {};
MailAction.DELETE = "deleteEmail";
MailAction.MARK_AS_READ = "markAsRead";
MailAction.MARK_AS_UNREAD = "markAsUnread";
MailAction.ARCHIVE = "archive";
MailAction.MARK_AS_SPAM = "markAsSpam";
MailAction.APPLY_LABEL = "applyLabel";
MailAction.REMOVE_LABEL = "removeLabel";
MailAction.STAR = "star";
MailAction.REMOVE_STAR = "removeStar";
MailAction.REPLY = "reply";
MailAction.SEND_EMAIL = "sendEmail";
MailAction.UNTRASH = "untrash";

const GmailAPI = {};

GmailAPI.DOMAIN = "https://www.googleapis.com";
GmailAPI.PATH = "/gmail/v1/users/me/";
GmailAPI.URL = GmailAPI.DOMAIN + GmailAPI.PATH;
GmailAPI.UPLOAD_URL = GmailAPI.DOMAIN + "/upload" + GmailAPI.PATH;

GmailAPI.labels = {};
GmailAPI.labels.INBOX = "INBOX";
GmailAPI.labels.CATEGORY_PERSONAL = "CATEGORY_PERSONAL";
GmailAPI.labels.CATEGORY_PURCHASES = "CATEGORY_PURCHASES";
GmailAPI.labels.CATEGORY_FINANCE = "CATEGORY_FINANCE";
GmailAPI.labels.CATEGORY_SOCIAL = "CATEGORY_SOCIAL";
GmailAPI.labels.CATEGORY_PROMOTIONS = "CATEGORY_PROMOTIONS";
GmailAPI.labels.CATEGORY_UPDATES = "CATEGORY_UPDATES";
GmailAPI.labels.CATEGORY_FORUMS = "CATEGORY_FORUMS";
GmailAPI.labels.STARRED = "STARRED";
GmailAPI.labels.SENT = "SENT";
GmailAPI.labels.SPAM = "SPAM";
GmailAPI.labels.UNREAD = "UNREAD";
GmailAPI.labels.IMPORTANT = "IMPORTANT";
GmailAPI.labels.DRAFT = "DRAFT";
GmailAPI.labels.TRASH = "TRASH";

const ErrorCodes = {
    BAD_REQUEST: 400, // invalid_grant, invalid_request, unsupported_grant_type
    UNAUTHORIZED: 401, // invalid_client, unauthorized
    RATE_LIMIT_EXCEEDED: 429,
}

var JError = {};
JError.HISTORY_INVALID_OR_OUT_OF_DATE = "HISTORY_INVALID_OR_OUT_OF_DATE";
JError.TOO_MANY_HISTORIES = "TOO_MANY_HISTORIES";
JError.EXCEEDED_MAXIMUM_CALLS_PER_BATCH = "EXCEEDED_MAXIMUM_CALLS_PER_BATCH";
JError.NETWORK_ERROR = "NETWORK_ERROR";
JError.RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED";
JError.ACCESS_REVOKED = "ACCESS_REVOKED";
JError.NO_TOKEN_FOR_EMAIL = "NO_TOKEN_FOR_EMAIL";
JError.MIGHT_BE_OFFLINE = "MIGHT_BE_OFFLINE";
JError.NOT_FOUND = "NOT_FOUND";
JError.NOT_SIGNED_IN = "NOT_SIGNED_IN";
JError.GOOGLE_ACCOUNT_WITHOUT_GMAIL = "GOOGLE_ACCOUNT_WITHOUT_GMAIL";
JError.GMAIL_NOT_ENABLED = "GMAIL_NOT_ENABLED";
JError.COOKIE_PROBLEMS = "COOKIE_PROBLEMS";
JError.GOOGLE_SERVICE_ACCOUNT = "GOOGLE_SERVICE_ACCOUNT";
JError.GMAIL_BACK_END = "GMAIL_BACK_END";
JError.CANNOT_ENSURE_MAIN_AND_INBOX_UNREAD = "CANNOT_ENSURE_MAIN_AND_INBOX_UNREAD";
JError.DID_NOT_CONTRIBUTE = "DID_NOT_CONTRIBUTE";
JError.DO_NOT_TRACK_MESSAGE = "Use Options > Accounts > Add Accounts or set the default Tracking Protection back to 'Only in private windows'";

var Origins = {};
Origins.CONTACT_PHOTOS = "https://www.google.com/*";

var Source = {};
Source.SIGN_IN = "SIGN_IN";
Source.STARTUP = "STARTUP";

var Icons = {};
Icons.NOTIFICATION_ICON_URL = "images/icons/icon_128.png";
Icons.APP_ICON_MASK_URL = "images/icons/notificationMiniIcon.png";

var ExtensionId = {};
if (DetectClient.isFirefox()) {
	ExtensionId.Gmail = "checkerplusforgmail@jasonsavard.com";
    ExtensionId.Calendar = "checkerplusforgooglecalendar@jasonsavard.com";
} else if (DetectClient.isEdge()) {
	ExtensionId.Gmail = "dkjkomkbjefdadfgbgdfgnpbmhmppiaa";
	ExtensionId.Calendar = "fbongfbliechkeaegkjfehhimpenoani";
	ExtensionId.LocalGmail = "nkcdjlofpfodhpjihpbicmledhecfldf";
	ExtensionId.LocalCalendar = "encfnanpmgmgnblfjgjfbleegminpphg";
} else {
	ExtensionId.Gmail = "oeopbcgkkoapgobdbedcemjljbihmemj";
	ExtensionId.Calendar = "hkhggnncdpfibdhinjiegagmopldibha";
	ExtensionId.LocalGmail = "nkcdjlofpfodhpjihpbicmledhecfldf";
	ExtensionId.LocalCalendar = "encfnanpmgmgnblfjgjfbleegminpphg";
}

const Scopes = {
    GMAIL_MODIFY:       "https://www.googleapis.com/auth/gmail.modify",
    CONTACTS_RECENT:    "https://www.google.com/m8/feeds",
    USERINFO_PROFILE:   "https://www.googleapis.com/auth/userinfo.profile"
}

var ContextMenu = {
    AllContextsExceptBrowserAction: ["page", "frame", "link", "selection", "editable", "image", "video", "audio"],
    OPEN_GMAIL: "openGmail",
    COMPOSE: "compose",
    REFRESH: "refresh",
    MARK_ALL_AS_READ: "markAllAsRead",
    DND_MENU: "dndMenu",
    DND_OFF: "dndOff",
    DND_30_MIN: "dnd30min",
    DND_1_HOUR: "dnd1hour",
    DND_2_HOURS: "dnd2hours",
    DND_4_HOURS: "dnd4hours",
    DND_8_HOURS: "dnd8hours",
    DND_TODAY: "dndToday",
    DND_INDEFINITELY: "dndIndefinitely",
    DND_OPTIONS: "dndOptions",
    EMAIL_PAGE_LINK: "emailPageLink",
    EMAIL_PAGE_LINK_TO_USER: "emailPageLinkToUser",
    QUICK_COMPOSE: "quickCompose", /* Use on button menu */
    SEND_PAGE_LINK: "sendPageLink",
    SEND_PAGE_LINK_TO_CONTACT: "sendPageLinkToContact",
    SEND_PAGE_LINK_TO_CONTACT_WITH_MESSAGE: "sendPageLinkToContactWithMessage",
};

// only pull images large enough - filter out small header logos etc
var PREVIEW_IMAGE_MIN_WITDH_HEIGHT = 140;
var PREVIEW_IMAGE_MIN_SIZE = 5000;
var PREVIEW_IMAGE_MAX_SIZE = 200000;

var DATA_URL_MAX_SIZE = 100000;
var FETCH_ATTACHMENT_MAX_SIZE = 10000000;

var FOOL_SANITIZER_CONTENT_ID_PREFIX = "http://cid:";

var MAIL_DOMAIN = "https://mail.google.com";
var MAIL_PATH = "/mail/";
var MAIL_DOMAIN_AND_PATH = MAIL_DOMAIN + MAIL_PATH;

var Urls = {};
Urls.SignOut = "https://accounts.google.com/Logout?continue=" + encodeURIComponent(MAIL_DOMAIN) + "&service=mail"; //"https://mail.google.com/mail/logout";
Urls.NotificationError = "https://jasonsavard.com/forum/categories/checker-plus-for-gmail-feedback?ref=errorNotification";
Urls.ExtensionConflict = "https://jasonsavard.com/wiki/Extension_Conflict";
Urls.CorruptProfile = "https://jasonsavard.com/wiki/Corrupt_browser_profile";

var SESSION_EXPIRED_ISSUE_URL = "https://jasonsavard.com/wiki/Session_expired_issue";

var VOICE_MESSAGE_FILENAME_PREFIX = "voice-message";
var VIDEO_MESSAGE_FILENAME_PREFIX = "video-message";

var MAIL_ADDRESS_UNKNOWN = "unknown";

var GCM_SENDER_ID = "450788627700";

var UserNoticeSchedule = {};
UserNoticeSchedule.DAYS_BEFORE_SHOWING_EXTRA_FEATURE = 3;
UserNoticeSchedule.DURATION_FOR_SHOWING_EXTRA_FEATURE = 2;
UserNoticeSchedule.DAYS_BEFORE_SHOWING_FOLLOW_ME = 7;
UserNoticeSchedule.DURATION_FOR_SHOWING_FOLLOW_ME = 3;
UserNoticeSchedule.DAYS_BEFORE_ELIGIBLE_FOR_REDUCED_DONATION = 14;
UserNoticeSchedule.DAYS_BEFORE_ELIGIBLE_FOR_REDUCED_DONATION_AGAIN = 60; // 2 months
UserNoticeSchedule.DURATION_FOR_SHOWING_REDUCED_DONATION = 7;

// jsonp backup way...
const CONTACTS_API_URL_PARAMS = "?v=3.0";
// preferred way...
const CONTACTS_API_HEADER = {
	"GData-Version": "3.0"
};

var DEFAULT_SETTINGS = {
  "language": getPreferredLanguage(),
  "_newestMail": {},
  "gmailSettings": {},
  "animateButtonIcon": true,
  "autoCollapseConversations": true,
  "notificationSound": "chime.ogg",
  "desktopNotification": "rich",
  "notificationVoice": "",
  "showNotificationDuration": 7,
  "notificationClickAnywhere": "open",
  "notificationSoundVolume": 100,
  "voiceSoundVolume": 100,
  "pitch": 1.0,
  "rate": 1.0,
  "spokenWordsLimit": "summary",
  "voiceNotificationOnlyIfIdleInterval": 15,
  "voiceHear": "from|subject|message",
  "poll": seconds(30),
  "monitorLabelsForGmailClassic": [SYSTEM_INBOX],
  "monitorLabelsForGmailCategories": [SYSTEM_PRIMARY],
  "conversationView": true,
  "open_label": SYSTEM_INBOX,
  "icon_set": "default",
  "browserButtonAction": BROWSER_BUTTON_ACTION_CHECKER_PLUS,
  "checkerPlusBrowserButtonActionIfNoEmail": BROWSER_BUTTON_ACTION_CHECKER_PLUS,
  "gmailPopupBrowserButtonActionIfNoEmail": BROWSER_BUTTON_ACTION_GMAIL_INBOX,
  "hide_count": false,
  "showfull_read": true,
  "openComposeReplyAction": "popupWindow",
  "popupLeft": "100",
  "popupTop": "100",
  "popupWidth": "800",
  "popupHeight": "680",
  "archive_read": true,
  "showStar": true,
  "showArchive": true,
  "showSpam": true,
  "showDelete": true,
  "showMoveLabel": true,
  "showReply": false,
  "showOpen": true,
  "showMarkAsRead": true,
  "showMarkAllAsRead": true,
  "showMarkAsUnread": true,
  "replyingMarksAsRead": true,
  "deletingMarksAsRead": false,
  "24hourMode": function() {
        const region = new Intl.DateTimeFormat('default', {hour: "numeric"});
        const options = region.resolvedOptions();
        return !options.hour12;
  }(),
  "accountColor": "#888",
  "accountColorWithBackgroundImage": "#88888894",
  "voiceInput": false,
  "voiceInputDialect": getPreferredLanguage(),
  "voiceInputSuggestions": true,
  "emailPreview": true,
  "alwaysDisplayExternalContent": true,
  "showActionButtonsOnHover": true,      
  "keyboardException_R": "reply",
  "accountAddingMethod": "autoDetect",
  "notificationButton1": "markAsRead",
  "notificationButton2": "delete",
  "showNotificationsForOlderDateEmails": false,
  "doNotShowNotificationIfGmailTabOpen": false,
  "notificationDisplay": "from|subject|message",
  "notificationDisplayName": "firstAndLastName",
  "popupWindowView": "default",
  "extensionUpdates": "interesting",
  "maxEmailsToShowPerAccount": 20,
  "showCheckerPlusButtonsOnlyOnHover": true,
  "clickingCheckerPlusLogo": "openHelp",
  "autoAdvance": "newer",
  "showContextMenuItem": true,
  "displayDensity": "cozy",
  "skins": [],
  "customSkin": {id:"customSkin"},
  "skinsEnabled": true,
  "showButtonTooltip": true,
  "maxUnauthorizedAccount": 3,
  "displayAccountReceivingEmail": true,
  "showNotificationsOnStartup": true,
  "accountsShowSignature": true,
  "unreadCountBackgroundColor": "rgb(232, 76, 61)",
  "notificationButtonIcon": "white",
  "highlightDates": true,
  "_lastNotificationAccountDates": [],
  "_lastGmailAPIActionByExtension": new Date(1),
  "_subjectsSpoken": [],
  "_lastNotificationDate": new Date(1),
  "_lastNotificationDateWhileActive": new Date(1),
  "accounts": [],
  "ignoredAccounts": [],
  "_enablePushNotificationsRetries": {},
  "_watchRetries": {},
  "_lastAccountEmailPreviewDates": {},
  "popup-bg-color": "#f5f5f5"
};

var DEFAULT_SETTINGS_FOR_OAUTH = {
	"poll": supportsRealtime() ? "realtime" : seconds(30)
};

var DEFAULT_SETTINGS_ALLOWED_OFF = [
	"notificationSound",
	"sounds"
];
 
var SETTINGS_EXTRA_FEATURES = [
	"DND_schedule",
	"clickingCheckerPlusLogo",
	"setPositionAndSize",
	"alias",
	"accountColor",
	"buttons",
	"showStar",
	"showArchive",
	"showSpam",
	"showDelete",
	"showMoveLabel",
	"showMarkAsRead",
	"showMarkAllAsRead",
	"showMarkAsUnread",
	"removeShareLinks"
];

const CONTACTS_STORAGE_VERSION = "2";

const Alarms = {
    EVERY_MINUTE:                   "everyMinute",
    UPDATE_CONTACTS:                "updateContacts",
    UPDATE_SKINS:                   "updateSkins",
    SYNC_SIGN_IN_ORDER:             "syncSignInOrder",
    EXTENSION_UPDATED_SYNC:         "extensionUpdatedSync",
    SYNC_DATA:                      "syncData",
    UPDATE_UNINSTALL_URL:           "updateUninstallUrl",
    DETECT_SLEEP_MODE:              "detectSleepMode",
    CLEAR_SUBJECTS_SPOKEN:          "clearSubjectsSpoken",
    ENABLE_PUSH_NOTIFICATIONS_EMAIL_ALARM_PREFIX: "enablePushNotifications_",
    WATCH_EMAIL_ALARM_PREFIX: "watchEmail_",
    RESYNC_ALARM_PREFIX: "resync_",
    GET_EMAILS_FROM_FCM_UPDATE_PREFIX: "getEmailsFromFCMUpdate_",
    COLLECT_STATS: "COLLECT_STATS"
}

function isMainCategory(labelId) {
	var MAIN_CATEGORIES = [SYSTEM_PRIMARY, SYSTEM_PURCHASES, SYSTEM_FINANCE, SYSTEM_SOCIAL, SYSTEM_PROMOTIONS, SYSTEM_UPDATES, SYSTEM_FORUMS];
	if (MAIN_CATEGORIES.includes(labelId)) {
		return true;
	}
}

function hasMainCategories(labelIds) {
	if (labelIds) {
		return labelIds.some((labelId) => {
			return isMainCategory(labelId);
		});
	}
}

function getGmailAPILabelId(id) {
	var gmailAPILabelId;
	if (id == SYSTEM_INBOX) {
		gmailAPILabelId = GmailAPI.labels.INBOX;
	} else if (id == SYSTEM_UNREAD) {
		gmailAPILabelId = GmailAPI.labels.UNREAD;
	} else if (id == SYSTEM_IMPORTANT) {
		gmailAPILabelId = GmailAPI.labels.IMPORTANT;
	} else if (id == SYSTEM_IMPORTANT_IN_INBOX) {
		gmailAPILabelId = GmailAPI.labels.IMPORTANT;
	} else if (id == SYSTEM_PRIMARY) {
		gmailAPILabelId = GmailAPI.labels.CATEGORY_PERSONAL;
	} else if (id == SYSTEM_PURCHASES) {
		gmailAPILabelId = GmailAPI.labels.CATEGORY_PURCHASES;
	} else if (id == SYSTEM_FINANCE) {
		gmailAPILabelId = GmailAPI.labels.CATEGORY_FINANCE;
	} else if (id == SYSTEM_SOCIAL) {
		gmailAPILabelId = GmailAPI.labels.CATEGORY_SOCIAL;
	} else if (id == SYSTEM_UPDATES) {
		gmailAPILabelId = GmailAPI.labels.CATEGORY_UPDATES;
	} else if (id == SYSTEM_FORUMS) {
		gmailAPILabelId = GmailAPI.labels.CATEGORY_FORUMS;
	} else if (id == SYSTEM_PROMOTIONS) {
		gmailAPILabelId = GmailAPI.labels.CATEGORY_PROMOTIONS;
	} else if (id == SYSTEM_STARRED) {
		gmailAPILabelId = GmailAPI.labels.STARRED;
	} else {
		gmailAPILabelId = id;
	}
	return gmailAPILabelId;
}

function getJSystemLabelId(id, accountAddingMethod) {
	var jSystemId;
	if (accountAddingMethod == "autoDetect") {
		jSystemId = id;
	} else {
		if (id == GmailAPI.labels.INBOX) {
			jSystemId = SYSTEM_INBOX;
		} else if (id == GmailAPI.labels.UNREAD) {
			jSystemId = SYSTEM_UNREAD;
		} else if (id == GmailAPI.labels.IMPORTANT) {
			jSystemId = SYSTEM_IMPORTANT;
		} else if (id == GmailAPI.labels.IMPORTANT) {
			jSystemId = SYSTEM_IMPORTANT_IN_INBOX;
		} else if (id == GmailAPI.labels.CATEGORY_PERSONAL) {
			jSystemId = SYSTEM_PRIMARY;
		} else if (id == GmailAPI.labels.CATEGORY_PURCHASES) {
			jSystemId = SYSTEM_PURCHASES;
		} else if (id == GmailAPI.labels.CATEGORY_FINANCE) {
			jSystemId = SYSTEM_FINANCE;
		} else if (id == GmailAPI.labels.CATEGORY_SOCIAL) {
			jSystemId = SYSTEM_SOCIAL;
		} else if (id == GmailAPI.labels.CATEGORY_UPDATES) {
			jSystemId = SYSTEM_UPDATES;
		} else if (id == GmailAPI.labels.CATEGORY_FORUMS) {
			jSystemId = SYSTEM_FORUMS;
		} else if (id == GmailAPI.labels.CATEGORY_PROMOTIONS) {
			jSystemId = SYSTEM_PROMOTIONS;
		} else if (id == GmailAPI.labels.STARRED) {
			jSystemId = SYSTEM_STARRED;
		} else {
			jSystemId = id;
		}
	}
	return jSystemId;
}

function isSystemLabel(label) {
	if (label && label.indexOf(SYSTEM_PREFIX) == 0) {
		// it's jsystem label
		return true;
	} else if (label && (label == GmailAPI.labels.INBOX || label == GmailAPI.labels.CATEGORY_PERSONAL || label == GmailAPI.labels.CATEGORY_PURCHASES || label == GmailAPI.labels.CATEGORY_FINANCE || label == GmailAPI.labels.CATEGORY_SOCIAL || label == GmailAPI.labels.CATEGORY_PROMOTIONS || label == GmailAPI.labels.CATEGORY_UPDATES || label == GmailAPI.labels.STARRED || label == GmailAPI.labels.SENT || label == GmailAPI.labels.UNREAD || label == GmailAPI.labels.IMPORTANT)) {
		// it'a Gmail API system label
		return true;
	} else {
		return false;
	}
}

async function getAccountsSummary(accounts) {
    const accountAddingMethod = await storage.get("accountAddingMethod");

    let signedIntoAccounts = 0;
    let signedOutAccounts = 0;
    let allSignedOut = false;
    let firstNiceError;

    if (isOnline()) {
    	if (accounts.length == 0) {
            if (accountAddingMethod == "autoDetect") {
                const unauthorizedAccounts = await storage.get("unauthorizedAccounts");
                if (unauthorizedAccounts) {
                    firstNiceError = getMessage("notSignedIn");
                    allSignedOut = true;
                } else {
                    firstNiceError = "Problem detecting account.";
                }
            } else {
                firstNiceError = getMessage("addAccount");
                allSignedOut = true;
            }
        } else {
            accounts.forEach(account => {
                if (account.error) {
                    if (!firstNiceError) {
                        firstNiceError = account.getError().niceError;
                    }

                    if (accountAddingMethod == "autoDetect") {
                        if (account.errorCode == ErrorCodes.UNAUTHORIZED) {
                            signedOutAccounts++;
                        }
                    } else {
                        // for oauth
                    }
                } else {
                    signedIntoAccounts++;
                }
            });

            if (accounts.length == signedOutAccounts) {
                allSignedOut = true;
            }
        }
    } else {
        firstNiceError = getMessage("yourOffline");
    }
	
	return {
        signedIntoAccounts: signedIntoAccounts,
        firstNiceError: firstNiceError,
        allSignedOut: allSignedOut
    };
}

async function updateBadge(totalUnread) {
    await initMisc();

    const dndState = await getDNDState();
    
    if (totalUnread == null) {
        totalUnread = lsNumber("unreadCount");
    }
    
    const accountsSummary = await getAccountsSummary(accounts);
    if (accountsSummary.signedIntoAccounts == 0) {
        // don't change icon for realtime because it might be a while before next updatebade/gcm message
        if (await storage.get("poll") != "realtime") {
            buttonIcon.setIcon({signedOut:true});
        }
        if (accountsSummary.firstNiceError) {
            chrome.browserAction.setTitle({ title: accountsSummary.firstNiceError.toString() });
        }
    } else if (accounts.length) {
        
        if (dndState) {
            chrome.browserAction.setBadgeText({text: getMessage("DND")});
            chrome.browserAction.setTitle({ title: getMessage("doNotDisturb") });
            chrome.browserAction.setBadgeBackgroundColor({color:[0,0,0, 255]});
        } else {
            const hideCount = await storage.get("hide_count");
            if (hideCount || totalUnread < 1) {
                chrome.browserAction.setBadgeText({ text: "" });
            } else {
                chrome.browserAction.setBadgeText({ text: totalUnread.toString() });
            }
        }

        if (!totalUnread || totalUnread <= 0) {
            if (dndState) {
                if (await storage.get("showGrayIconInDND")) {
                    buttonIcon.setIcon({signedOut:true});
                } else {
                    buttonIcon.setIcon({noUnread:true});
                }
            } else {
                buttonIcon.setIcon({noUnread:true});
                chrome.browserAction.setBadgeBackgroundColor({ color: [110, 140, 180, 255] });
                chrome.browserAction.setTitle({ title: getMessage('noUnreadText') });
            }
        } else {
            if (dndState) {
                if (await storage.get("showGrayIconInDND")) {
                    buttonIcon.setIcon({signedOut:true});
                } else {
                    buttonIcon.setIcon({unread:true});
                }
            } else {
                buttonIcon.setIcon({unread:true});
                chrome.browserAction.setBadgeBackgroundColor({ color: await storage.get("unreadCountBackgroundColor") });
                
                if (await storage.get("showButtonTooltip")) {
                    var str = "";
                    var mails = getAllUnreadMail(accounts);
                    if (mails) {
                        mails.forEach(function(mail, mailIndex) {
                            str += mail.authorName.getFirstName() + ": " + mail.title + " - " + mail.getLastMessageText({maxSummaryLetters:20, htmlToText:true, EOM_Message:" [" + getMessage("EOM") + "]"}).replace(/\n/g, " ");
                            if (mailIndex < mails.length-1) {
                                str += "\n";
                            }
                        });
                    }
                    chrome.browserAction.setTitle({ title:str });
                } else {
                    chrome.browserAction.setTitle({ title:"" });
                }
            }
        }
    
    }

    try {
        chrome.contextMenus.update(ContextMenu.MARK_ALL_AS_READ, {visible:(totalUnread >= 1)});
    } catch (error) {
        // silently fail, "visible" might not be supported in ff
    }
}

async function initPopup() {
    const unreadCount = lsNumber("unreadCount");
	let popupUrl = getPopupFile("toolbar");
	
    const browserButtonAction = await storage.get("browserButtonAction");
    const checkerPlusBrowserButtonActionIfNoEmail = await storage.get("checkerPlusBrowserButtonActionIfNoEmail");
    const gmailPopupBrowserButtonActionIfNoEmail = await storage.get("gmailPopupBrowserButtonActionIfNoEmail");
	
	const checkerPlusElseCompose = browserButtonAction == BROWSER_BUTTON_ACTION_CHECKER_PLUS && checkerPlusBrowserButtonActionIfNoEmail == BROWSER_BUTTON_ACTION_COMPOSE && unreadCount === 0;
	const checkerPlusElseGmailTab = browserButtonAction == BROWSER_BUTTON_ACTION_CHECKER_PLUS && (checkerPlusBrowserButtonActionIfNoEmail == BROWSER_BUTTON_ACTION_GMAIL_TAB || checkerPlusBrowserButtonActionIfNoEmail == BROWSER_BUTTON_ACTION_GMAIL_IN_NEW_TAB) && unreadCount === 0;
	const gmailInboxElseCompose = browserButtonAction == BROWSER_BUTTON_ACTION_GMAIL_INBOX && gmailPopupBrowserButtonActionIfNoEmail == BROWSER_BUTTON_ACTION_COMPOSE && unreadCount === 0;
	const gmailInboxElseGmailTab = browserButtonAction == BROWSER_BUTTON_ACTION_GMAIL_INBOX && (checkerPlusBrowserButtonActionIfNoEmail == BROWSER_BUTTON_ACTION_GMAIL_TAB || checkerPlusBrowserButtonActionIfNoEmail == BROWSER_BUTTON_ACTION_GMAIL_IN_NEW_TAB) && unreadCount === 0;
	
	if (browserButtonAction == BROWSER_BUTTON_ACTION_CHECKER_PLUS_POPOUT) {
		popupUrl = "";
	} else {
		if (browserButtonAction == BROWSER_BUTTON_ACTION_GMAIL_TAB || browserButtonAction == BROWSER_BUTTON_ACTION_GMAIL_IN_NEW_TAB || browserButtonAction == BROWSER_BUTTON_ACTION_COMPOSE || checkerPlusElseCompose || checkerPlusElseGmailTab || gmailInboxElseCompose || gmailInboxElseGmailTab) {
			// if all accounts in error then display popup so users see errors
			const accountsSummary = await getAccountsSummary(accounts);
			if (accountsSummary.signedIntoAccounts == 0) {
				popupUrl = setUrlParam(popupUrl, "action", "noSignedInAccounts");
			} else {
				popupUrl = "";
			}
		}
    }

    chrome.browserAction.getPopup({}, result => {
        if (result && result.includes("setVia=manifest")) {
            console.log("Extension was disabled I think, let's reinit things...");
            sendMessageToBG("init");
            //restartCheckEmailTimer(true);
            //initContextMenus();
        }
        chrome.browserAction.setPopup({popup: popupUrl});
    });
}

function getPopupFile(source) {
	let url = "popup.html"

	if (DetectClient.isFirefox()) {
		url = chrome.runtime.getURL(url);
    }
    
    if (source) {
        url += "?source=" + source;
    }
	
	return url;
}

async function ensureContactsWrapper(accounts) {
    if (await storage.get("showContactPhoto")) {
        var accountsWithUnreadMail = getAccountsWithUnreadMail(accounts);
        
        const emailsWithUnreadMail = accountsWithUnreadMail.map(accountWithUnreadMail => accountWithUnreadMail.getEmail());

        try {
            // must add await to catch/ignore error here instead of in global catch all
            return await oAuthForContacts.ensureTokenForEmail(emailsWithUnreadMail);
        } catch (error) {
            // always resolve because we want showcontacts photo to proceed regardless
            console.warn(error);
        }
    }
}

function getBasicContactDetails(contact) {
	let newContact = {};
	newContact.id = contact.id["$t"];
	newContact.updatedDate = contact.updated["$t"];

	if (contact.title && contact.title["$t"]) {
		newContact.name = contact.title["$t"];
	}

	if (contact.gd$phoneNumber) {
		contact.hasPhoneNumber = "true";
	}

	contact.link.some(link => {
		if (link.rel && link.rel.includes("#photo")) {
			newContact.photoUrl = link.href;
			return true;
		}
	});

	if (contact.gd$email) {
		newContact.emails = [];
		contact.gd$email.forEach(contactEmail => {
            let newEmails = {
                address: contactEmail.address
            };

			if (contactEmail.primary) {
				newEmails.primary = contactEmail.primary;
			}
			newContact.emails.push(newEmails);
		});
	}
	return newContact;
}

async function fetchContacts(userEmail) {
    var contactsData = await storage.get("contactsData");
    if (!contactsData) {
        contactsData = [];
    }
    
    let contactDataItem = findContactDataItemByEmail(contactsData, userEmail);
    if (!contactDataItem) {
        contactDataItem = {
            version:	CONTACTS_STORAGE_VERSION,
            userEmail:	userEmail,
            contacts:	[]
        };
    }
    contactDataItem.lastFetch = new Date().toString();
    
    var entriesForThisFetch = [];
    var MAX_RECURSIONS = 5;
    var recursions = 0;
    var contactsHaveBeenUpdated = false;
    
    async function getContactsByStartIndex(startIndex) {
        const ENTRIES_PER_PAGE = 2000;
        
        let data = {
            alt: "json",
            "orderby": "lastmodified",
            "sortorder": "descending",
            "max-results": ENTRIES_PER_PAGE,
            "start-index": startIndex
        };
        
        if (contactDataItem.lastModified) {
            data["showdeleted"] = true;
            data["updated-min"] = contactDataItem.lastModified;
        }
        
        data = await oAuthForContacts.send({
            userEmail: userEmail,
            url: "https://www.google.com/m8/feeds/contacts/" + userEmail + "/thin" + CONTACTS_API_URL_PARAMS,
            appendAccessToken: true,
            headers: CONTACTS_API_HEADER,
            data: data
        });
        if (data && data.feed) {
            if (data.feed.entry) {
                contactsHaveBeenUpdated = true;
                
                entriesForThisFetch = entriesForThisFetch.concat(data.feed.entry);

                data.feed.entry.forEach(entry => {
                    let contact = getBasicContactDetails(entry);

                    if (contactDataItem.lastModified) {
                        var foundContactsIndex = -1;
                        contactDataItem.contacts.some(function (thisContact, index) {
                            if (contact.id == thisContact.id) {
                                foundContactsIndex = index;
                                return true;
                            }
                        });

                        // contact was deleted so find and remove it from array
                        if (entry["gd$deleted"]) {
                            if (foundContactsIndex != -1) {
                                console.log("removed: " + contact.id);
                                contactDataItem.contacts.splice(foundContactsIndex, 1);
                            }
                        } else {
                            if (foundContactsIndex != -1) {
                                // edited
                                console.log("editing: " + contact.name);
                                contactDataItem.contacts[foundContactsIndex] = contact;
                            } else {
                                // added
                                console.log("adding: " + contact.name);
                                contactDataItem.contacts.push(contact);
                            }
                        }
                    } else {
                        contactDataItem.contacts.push(contact);
                    }
                });
            }
            
            // while entries is smaller than total AND fail safe of 
            if (entriesForThisFetch.length < data.feed["openSearch$totalResults"]["$t"] && recursions++ < MAX_RECURSIONS) {
                return getContactsByStartIndex(startIndex + ENTRIES_PER_PAGE);
            } else {
                return data.feed;
            }
        } else {
            throw "contacts feed missing 'feed' node: " + data;
        }
    }
    
    const response = await getContactsByStartIndex(1);
    // update last modified date
    contactDataItem.lastModified = response.updated["$t"];
    
    contactDataItem.contacts.sort(function(a, b) {
        if (a.name && !b.name) {
            return -1;
        } else if (!a.name && b.name) {
            return 1;
        } else {
            if (a.updatedDate > b.updatedDate) {
                return -1;
            } else if (a.updatedDate < b.updatedDate) {
                return 1;
            } else {
                if (a.hasPhoneNumber && !b.hasPhoneNumber) {
                    return -1;
                } else if (!a.hasPhoneNumber && b.hasPhoneNumber) {
                    return 1;
                } else {
                    return 0;
                }
            }
        }
    });
    
    console.log("contacts fetched for account " + userEmail + ": " + contactDataItem.contacts.length);
    return {contactDataItem:contactDataItem, contactsHaveBeenUpdated:contactsHaveBeenUpdated};
}

function getContactDataItemIndexByEmail(contactsData, email) {
    return contactsData.findIndex(contact => contact.userEmail == email);
}

function findContactDataItemByEmail(contactsData, email) {
    const index = getContactDataItemIndexByEmail(contactsData, email);
    if (index != -1) {
        return contactsData[index];
    }
}

function getPeopleDataIndexByEmail(peoplesData, email) {
	for (var a=0; a<peoplesData.length; a++) {
		if (peoplesData[a] && peoplesData[a].email == email) {
			return a;
		}
	}
	return -1;
}

async function getContacts(params) {
    const contactsData = window.contactsData || await storage.get("contactsData");
	if (contactsData) {
		// maybe update
		if (params.account) {
			const contactData = findContactDataItemByEmail(contactsData, params.account.getEmail());
            if (contactData) {
				return contactData.contacts;
			} else {
				console.log("not found")
			}
		} else {
			console.log("not found account")
		}
	} else {
		console.log("no contactsdata; might have not been given permission");
	}
}

async function getContact(params) {
	var emailToFind;
	if (params.email) {
		emailToFind = params.email;
	} else {
		emailToFind = params.mail.authorMail;
	}	
	
	let contactFound;
	var account;
	if (params.mail) {
		account = params.mail.account
	} else {
		account = params.account;
	}
	const contacts = await getContacts({account:account});
    if (contacts) {
        contacts.some(contact => {
            if (contact && contact.emails) {
                return contact.emails.some(contactEmail => {
                    if (contactEmail.address && emailToFind && contactEmail.address.toLowerCase() == emailToFind.toLowerCase()) {
                        contactFound = contact;
                        return true;
                    }
                });
            }
        });
    }

    return contactFound;
}

//set default icon images for certain emails etc.
function getPresetPhotoUrl(mail) {
	var url;
	if (mail && mail.authorMail) {
		if (mail.authorMail.includes("@jasonsavard.com")) { // from forum etc.
			url = "/images/jason.png";
		} else if (mail.authorMail.includes("@twitter.com")) {
			url = "/images/logos/twitter.png";
		} else if (mail.authorMail.includes("facebookmail.com")) {
			url = "/images/logos/facebook.svg";
		} else if (mail.authorMail.includes("@pinterest.com")) {
			url = "/images/logos/pinterest.png";
		} else if (mail.authorMail.includes("@linkedin.com")) {
			url = "/images/logos/linkedin.png";
		}
	}
	return url;
}

async function getContactPhoto(params) {
	if (await storage.get("showContactPhoto")) {
        const contact = await getContact(params);
        try {
			if (contact) {
				var account;
				if (params.mail) {
					account = params.mail.account;
				} else {
					account = params.account;
				}
				const response = await generateContactPhotoURL(contact, account);
                response.realContactPhoto = true;
				return response;
			} else {
				throw Error("No contact found");
			}
        } catch (error) {
            console.warn("getContactPhoto", error);
            // no generated url so let's set a preset photo
            return {
                photoUrl: getPresetPhotoUrl(params.mail)
            };
        }
	} else {
		return {};
	}
}

async function generateContactPhotoURL(contact, account) {
    if (contact.photoUrl) {
        const response = await oAuthForContacts.generateURL(account.getEmail(), contact.photoUrl);
        response.photoUrl = response.generatedURL;
        return response;
    } else {
        throw Error("photoNotFound");
    }
}

function convertGmailPrintHtmlToText(node) {
	// removing font tags because Gmail usuaully uses them for the footer/signature and/or the quoted text in the gmail print html 
	node.querySelectorAll("font[color]").forEach(thisNode => {
		thisNode.remove();
	});

	var html = node.innerHTML;
	
	// replace br with space
	html = html.replace(/<br\s*[\/]?>/gi, " ");
	
	// replace <p> and </p> with spaces
	html = html.replace(/<\/?p\s*[\/]?>/gi, " ");
	
	// add a space before <div>
	html = html.replace(/<\/?div\s*[\/]?>/gi, " ");
	
	// this is usually the greyed out footer/signature in gmail emails, so remove it :)
	//html = html.replace(/<font color=\"#888888\">.*<\/font>/gi, "");
	
	// this is apparently the quoted text
	//html = html.replace(/<font color=\"#550055\">.*<\/font>/gi, "");
	
	var text = html.htmlToText();
	
	// repace new lines with space
	text = text.replace(/\n/g, " ");
	
	// remove 2+ consecutive spaces
	text = text.replace(/\s\s+/g, " ");
	
	return text.trim();
}

// parse a string...
// english Wed, Jan 25, 2012 at 1:53 PM
// spanish 24 de septiembre de 2015, 3:28 p. m.
// danish 10. mar. 2012 13.00
// slovak 26. júna 2012 14:07
// english (UK) 22 July 2012 12:16
// Thu, Mar 8, 2012 at 12:58 AM
// Mon, Jan 30, 2017 at 8:05 PM
function parseGoogleDate(dateStr) {
	var pieces = dateStr.match(/(\d\d?).*(\d\d\d\d)/);
	if (pieces) {
		var year = pieces[2];
		var month;
		var dateOfMonth = pieces[1];
		
		// can't use setDate because the month could change if we are in feb and we try setting feb 31 which doesn't exist it will set date object to mar
		//d.setDate(dateOfMonth);
		
		// try to get month
		var monthFound = false;
		var pieces2 = dateStr.match(/([^ 0-9]{3}[^ 0-9]*) \d/); // atleast 3 non digits ie. letters or more ie. Feb OR  Feb. OR February
		if (!pieces2) { // try the spanish dates 24 de septiembre de 2015, 3:28 p. m.
			pieces2 = dateStr.match(/([^ 0-9]{3}[^ 0-9]*) /);
		}
		if (pieces2 && pieces2.length >= 2) {
			var shortMonthName = pieces2[1];
			shortMonthName = shortMonthName.replace(".", "").substring(0, 3).toLowerCase();
			
			for (var a=0; a<dateFormat.i18n.monthNamesShort.length; a++) {
				if (dateFormat.i18n.monthNamesShort[a].toLowerCase().substring(0, 3) == shortMonthName) {
					month = a;
					break;
				}
			}
		}
		
		if (month == null) {
			// since couldn't detect the month str we assume it's this month but if the date of the month is larger than today let's assume it's last month
			if (year == new Date().getFullYear() && dateOfMonth > new Date().getDate()) {
				month = new Date().getMonth()-1;
			} else {
				month = new Date().getMonth();
			}
		}

		var d = new Date(year, month, dateOfMonth);
		
		// now get the time
		var timeObj = dateStr.parseTime();
		if (timeObj) {		
			// merge date and time
			d.setHours(timeObj.getHours());
			d.setMinutes(timeObj.getMinutes());
			d.setSeconds(timeObj.getSeconds());
			return d;
		} else {
			// could not find time in str
			return null;
		}
	}	
	return null;
}

function setAccountGradient($node, colorStart, colorEnd) {
	$node.css("background-image", "-webkit-gradient( linear, left bottom, right bottom, color-stop(0.28, " + colorStart + "), color-stop(0.64, " + colorEnd + "))");
}

function sendMessageToCalendarExtension(message) {
	return new Promise(function(resolve, reject) {
		var recipientExtensionId;
		if (chrome.runtime.id == ExtensionId.LocalGmail) {
			recipientExtensionId = ExtensionId.LocalCalendar;
		} else {
			recipientExtensionId = ExtensionId.Calendar;
		}
		
		chrome.runtime.sendMessage(recipientExtensionId, message, function(response) {
			if (chrome.runtime.lastError) {
				console.error("sendMessageToCalendarExtension error: " + chrome.runtime.lastError.message);
				reject(chrome.runtime.lastError.message);
			} else {
				console.log("response", response);
				resolve(response);
			}
		});
	});
}

function isBetweenHours(date, startHour, endHour) {
	var betweenHours = false;

	if (startHour != endHour) {
		// Check is different depending on start/end time precedance
		if (startHour < endHour) { // this is for ie. 1am to 6am
			if (startHour <= date.getHours() && date.getHours() < endHour) {
				betweenHours = true;
			}
		} else {
			if (startHour <= date.getHours() || date.getHours() < endHour) {
				betweenHours = true;
			}
		}
	}

	return betweenHours;
}

async function setDNDEndTime(endTime, fromOtherExtension) {
	await storage.set("DND_endTime", endTime);
	sendMessageToBG("updateBadge");
	
	if (!fromOtherExtension && await storage.get("syncDND")) {
		sendMessageToCalendarExtension({action:"setDNDEndTime", endTime:endTime.toJSON()});
	}
}

async function setDND_off(fromOtherExtension) {
	if (await storage.get("DND_endTime")) {
		await storage.remove("DND_endTime");
	} else {
		await storage.remove("DND_schedule");
    }

    sendMessageToBG("updateBadge");
    
	if (!fromOtherExtension && await storage.get("syncDND")) {
		sendMessageToCalendarExtension({action:"turnOffDND"});
	}
}

function setDND_minutes(minutes) {
	const dateOffset = new Date();
	dateOffset.setMinutes(dateOffset.getMinutes() + parseInt(minutes));
	setDNDEndTime(dateOffset);
}

function setDND_today() {
	setDNDEndTime(tomorrow());
}

function openDNDScheduleOptions() {
	openUrl("options.html?highlight=DND_schedule#dnd");
}

function openDNDOptions() {
	openUrl("options.html#dnd");
}

function setDND_indefinitely() {
	var farOffDate = new Date();
	farOffDate.setYear(2999);
	setDNDEndTime(farOffDate);
}

function getDNDState() {
	return new Promise(async (resolve, reject) => {
		chrome.windows.getCurrent(async currentWindow => {
			var dndByFullscreen;
			if (!chrome.runtime.lastError) {
				dndByFullscreen = currentWindow && currentWindow.state == "fullscreen" && await storage.get("dndInFullscreen");
			}
			resolve(await isDNDbyDuration() || await isDNDbySchedule() || dndByFullscreen);
		});
	});
}

async function isDNDbyDuration() {
	var endTime = await storage.get("DND_endTime");
	return endTime && endTime.isAfter();
}

async function isDNDbySchedule() {
	if (await storage.get("DND_schedule")) {
		var today = new Date();
		let timetable = await storage.get("DND_timetable");
		if (timetable && timetable[today.getDay()][today.getHours()]) {
			return true;
		}
	}
}

async function getPopupWindowSpecs(params = {}) {
	if (!params.window) {
		params.window = window;
	}
	
    var left, top, width, height;
    
    const popupLeft = await storage.get("popupLeft");
    const popupTop = await storage.get("popupTop");
    const popupWidth = await storage.get("popupWidth");
    const popupHeight = await storage.get("popupHeight");
	
	if (await storage.get("setPositionAndSize") || params.testingOnly) {
		left = params.window.screen.availLeft+parseInt(popupLeft);
		top = params.window.screen.availTop+parseInt(popupTop);
		width = popupWidth;
		height = popupHeight;
	} else {
		if (!params.width) {
			params.width = popupWidth; 
		}
		if (!params.height) {
			params.height = popupHeight; 
		}
	   
		left = params.window.screen.availLeft+(params.window.screen.width/2)-(params.width/2);
		top = params.window.screen.availTop+(params.window.screen.height/2)-(params.height/2);
		width = params.width;
		height = params.height;
	}

	if (params.openPopupWithChromeAPI) {
		// muse use Math.round because .create doesn't accept decimals points
		return {url:params.url, width:Math.round(width), height:Math.round(height), left:Math.round(left), top:Math.round(top), type:"popup", state:"normal"};
	} else {
		var specs = "";
		specs += "left=" + (params.window.screen.availLeft+parseInt(popupLeft)) + ",";
		specs += "top=" + (params.window.screen.availTop+parseInt(popupTop)) + ",";
		specs += "width=" + popupWidth + ",";
		specs += "height=" + popupHeight + ",";
		return specs;
	}
}

async function generateComposeUrl(params) {

	var url;
	
	function generateRecipients(recipientsArray) {
	   var str = "";
	   for (var a=0; a<recipientsArray.length; a++) {
		   str += recipientsArray[a].email;
		   if (a < recipientsArray.length-1) {
			   str += ",";
		   }
	   }
	   return str;
	}
   
	if (await storage.get("useBasicHTMLView")) {
		url = params.account.getMailUrl({urlParams:"v=b&pv=tl&cs=b&f=1"});
	} else {
		// using /u/1 etc. defaults to /u/0 always, so must use authuser
		url = params.account.getMailUrl({urlParams:"view=cm&fs=1&tf=1&authuser=" + encodeURIComponent(params.account.getEmail())});
	}
   
	if (params.to) {
		params.tos = [params.to];
	}
   
	if (params.generateReplyAll && params.replyAll) {
		if (params.replyAll.tos) {
			url += "&to=" + encodeURIComponent(generateRecipients(params.replyAll.tos));
		}
		if (params.replyAll.ccs) {
			url += "&cc=" + encodeURIComponent(generateRecipients(params.replyAll.ccs));
		}
	} else {
		if (params.tos) {
			url += "&to=" + encodeURIComponent(params.tos.first().email);
		}
	}
	if (params.subject) {
		url += "&su=" + encodeURIComponent(params.subject);
	}
	if (params.message) {
		url += "&body=" + encodeURIComponent(params.message);
	}
   
	return url;
}

async function openTabOrPopup(params) {
	if (params.account && params.account.mustResync) {
		openUrl(params.url);
	} else {
		var url;
		if (params.showReplyAllOption) {
			url = "compose.html";
		} else {
			url = params.url;
		}
		if (await storage.get("openComposeReplyAction") == "tab") {
			openUrl(url);
		} else {
			params.url = url;
			params.openPopupWithChromeAPI = true;
			const createWindowParams = await getPopupWindowSpecs(params);
			chrome.windows.create(createWindowParams);
		}
	}
} 

async function ensureUserHasUnreadEmails() {
    if (!lsNumber("unreadCount")) {
        await pollAccounts();
    }
    return {hasUnreadEmails: lsNumber("unreadCount")};
}

function insertSpeechRecognition(tabId) {
	chrome.tabs.insertCSS(tabId, {file:"/css/speechRecognition.css"}, function() {
		chrome.tabs.executeScript(tabId, {file:"/js/jquery.js"}, function() {
			if (chrome.runtime.lastError) {
				console.warn(chrome.runtime.lastError.message);
			} else {
				chrome.tabs.executeScript(tabId, {file:"/js/speechRecognition.js", allFrames:false});
			}
		});
	});
}

async function daysElapsedSinceFirstInstalled() {
	var installDate = await storage.get("installDate");
	if (installDate) {
		try {
			installDate = new Date(installDate);
		} catch (e) {}
		if (installDate) {
			return Math.abs(Math.round(installDate.diffInDays()));
		}
	}
	return -1;
}

var IGNORE_DATES = false;

async function isEligibleForReducedDonation(mightBeShown) {
	if (TEST_REDUCED_DONATION) {
		return true;
	}
	
    if (!await storage.get("donationClicked")) {
        if (IGNORE_DATES || await daysElapsedSinceFirstInstalled() >= UserNoticeSchedule.DAYS_BEFORE_ELIGIBLE_FOR_REDUCED_DONATION) { // 14 days
            
            // when called from shouldShowReducedDonationMsg then we can assume we are going to show the ad so let's initialize the daysElapsedSinceEligible
            if (mightBeShown) {
                // stamp this is as first time eligibility shown
                var daysElapsedSinceEligible = await storage.get("daysElapsedSinceEligible");
                if (!daysElapsedSinceEligible) {
                    await storage.setDate("daysElapsedSinceEligible");
                }
            }
            
            return true;
        } else {
            return false;
        }
	}
}

// only display eligible special for 1 week after initially being eligiable (but continue the special)
async function isEligibleForReducedDonationAdExpired(mightBeShown) {

	if (TEST_REDUCED_DONATION) {
		return false;
	}
	
	if (await storage.get("reducedDonationAdClicked")) {
		return true;
	} else {
		var daysElapsedSinceEligible = await storage.get("daysElapsedSinceEligible");
		if (daysElapsedSinceEligible) {
			daysElapsedSinceEligible = new Date(daysElapsedSinceEligible);
			if (IGNORE_DATES || Math.abs(daysElapsedSinceEligible.diffInDays()) <= UserNoticeSchedule.DURATION_FOR_SHOWING_REDUCED_DONATION) {
				return false;
            } else if (Math.abs(daysElapsedSinceEligible.diffInDays()) >= UserNoticeSchedule.DAYS_BEFORE_ELIGIBLE_FOR_REDUCED_DONATION_AGAIN) {
                let daysElapsedSinceReducedDonationAgain = await storage.get("daysElapsedSinceReducedDonationAgain");
                if (daysElapsedSinceReducedDonationAgain) {
                    if (Math.abs(daysElapsedSinceReducedDonationAgain.diffInDays()) <= UserNoticeSchedule.DURATION_FOR_SHOWING_REDUCED_DONATION) {
                        return false;
                    } else {
                        return true;
                    }
                } else {
                    await storage.setDate("daysElapsedSinceReducedDonationAgain");
                    return false;
                }
			} else {
				return true;
			}
		}
		return false;
	}
}

async function shouldShowExtraFeature() {
	
	if (TEST_SHOW_EXTRA_FEATURE) {
		return true;
	}
    
    if (!await storage.get("donationClicked")) {
        const skins = await storage.get("skins");
        if (skins && skins.length) {
            return false;
        } else {
            if (await daysElapsedSinceFirstInstalled() >= UserNoticeSchedule.DAYS_BEFORE_SHOWING_EXTRA_FEATURE) {
                let daysElapsedSinceFirstShownExtraFeature = await storage.get("daysElapsedSinceFirstShownExtraFeature");
                if (daysElapsedSinceFirstShownExtraFeature) {
                    if (daysElapsedSinceFirstShownExtraFeature.diffInDays() <= -UserNoticeSchedule.DURATION_FOR_SHOWING_EXTRA_FEATURE) {
                        return false;
                    } else {
                        return true;
                    }
                } else {
                    await storage.setDate("daysElapsedSinceFirstShownExtraFeature");
                    return true;
                }
            } else {
                return false;
            }
        }    
    }
}

async function shouldShowReducedDonationMsg(ignoreExpired) {
	if (await isEligibleForReducedDonation(true)) {
		if (ignoreExpired) {
			return true;
		} else {
			return !await isEligibleForReducedDonationAdExpired();
		}
	}
}

function verifyPayment(accounts) {
    const emails = accounts.map(account => account.getEmail());
	return Controller.verifyPayment(ITEM_ID, emails);
}

function hasUTFChars(str) {
    var rforeign = /[^\u0000-\u007f]/;
    return !!rforeign.test(str);
};

function encodePartialMimeWord(str, encoding, maxlen) {
	var charset = "utf-8";
	
    return str.replace(/[^\s]*[^\s\w\?!*=+-]+[^\s]*(\s+[^\s]*[^\s\w\?!*=+-]+[^\s]*)*/g, (function(str) {
        if (!str.length) {
            return '';
        }

        return mimelib.encodeMimeWord(str, encoding, charset, maxlen)
            .replace(/[^\w\s\?!*=+-]/g, function(chr) {
                var code = chr.charCodeAt(0);
                return "=" + (code < 0x10 ? "0" : "") + code.toString(16).toUpperCase();
            });
    }).bind(this));
};

function convertAddress(address, doNotEncode) {
	var mustEncode = !doNotEncode;
	
	// set them to variables because we don't want to modify the address obj
	var name = address.name;
	var email = address.email;
	email = email.toLowerCase();
	
    // if user part of the address contains foreign symbols
    // make a mime word of it
	if (mustEncode) {
		email = email.replace(/^.*?(?=\@)/, (function(user) {
			if (hasUTFChars(user)) {
				return mimelib.encodeMimeWord(user, "Q", charset);
			} else {
				return user;
			}
		}).bind(this));
	}

    // If there's still foreign symbols, then punycode convert it
    if (mustEncode && hasUTFChars(email)) {
    	// commented because i forget where i got toPunycode ??
        //email = toPunycode(email);
    }

    if (!name) {
        return email;
    } else if (name) {
    	name = name.trim();
    	// if name contains a comma ie. Savard, Jason    AND it is not already quoted then let's wrap quotes around it or else we get invalid to header
    	if (name.indexOf("\"") != 0 && name.includes(",")) {
    		name = "\"" + name + "\"";
    	}
        if (mustEncode && hasUTFChars(name)) {
            name = encodePartialMimeWord(name, "Q", 52);
        }
        return name + ' <' + email + '>';
    }
};

function pretifyRecipientDisplay(recipientObj, meEmailAddress, includeEmail) {
	var str = "";
	
	// it's this account's email so put 'me' instead
	if (!includeEmail && recipientObj.email && recipientObj.email.equalsIgnoreCase(meEmailAddress)) {
		str += getMessage("me");
	} else {
		if (recipientObj.name) {
			str += recipientObj.name.getFirstName();
			// it's possible gmail print include name with @ so let's spit it here ALSO
			str = str.split("@")[0];
		}
	}

	if (includeEmail) {
		str += " ";
	}

	str = str.replace(/</g, "");
	str = str.replace(/>/g, "");

	if (!str && !includeEmail) {
		if (recipientObj.email) {
			str += recipientObj.email.split("@")[0];
		}
	} else if (includeEmail) {
		str += "<" + recipientObj.email + ">";
	}
	
	return $("<span/>", {title: recipientObj.email}).text(str);
}

async function generateNotificationDisplayName(mail) {
	var fromName = mail.authorName;
	if (await storage.get("notificationDisplayName") == "firstNameOnly") {		
		var firstName = fromName.getFirstName();
		if (firstName.endsWith("'s")) { // ie. Jason's App forum
			// don't just use (Jason's)
			// instead use the whole name in this case
		} else {
			fromName = firstName;
		}
	}
	return fromName;
}

// point relative links ONLY to gmail.com
function fixRelativeLinks(node, mail) {
	node.querySelectorAll("a, img, imghidden").forEach(elem => {
		
		var href = elem.getAttribute("href");
		var src = elem.getAttribute("src");

		if (/^\/\//.test(href)) { // starts with //
			elem.setAttribute("href", "https:" + href);
		} else if (/^\/\//.test(src)) { // starts with //
			elem.setAttribute("src", "https:" + src);
		} else if (/^\/|^\?/.test(href)) { // starts with / or ?
			elem.setAttribute("href", mail.account.getMailUrl({useStandardGmailUrl:true}) + href);
		} else if (/^\/|^\?/.test(src)) { // starts with / or ?
            elem.setAttribute("src", mail.account.getMailUrl({useStandardGmailUrl:true}) + src);
		}
	});
}

function getAllUnreadMail(accounts) {
	let allUnreadMails = [];
	accounts.forEach(account => {
		allUnreadMails = allUnreadMails.concat(account.getMails());
	});
	return allUnreadMails;
}

function formatEmailNotificationTitle(fromName, subject) {
	let title = fromName;
	if (subject) {
		title += " - " + subject;
	}
	return title;
}

function loadImage(image) {
    return new Promise((resolve, reject) => {
        image.onload = () => {
            resolve();
        }
        image.onerror = event => {
            reject(event);
        }
    });
}

function getAccountByEmail(email) {
    const allAccounts = accounts.concat(ignoredAccounts);
	for (let a=0; a<allAccounts.length; a++) {
		if (allAccounts[a].getEmail().equalsIgnoreCase(email)) {
			return allAccounts[a];
		}
	}
}

function getAccountById(id) {
    return accounts.find(account => account.id == id);
}

function getFirstEmail(accounts) {
	if (accounts.length) {
		return accounts[0].getEmail();
	}
}

function getAccountsWithErrors(accounts) {
	return accounts.filter(account => account.error);
}

function getAccountsWithoutErrors(accounts) {
	return accounts.filter(function(account, index, ary) {
		return !account.error;
	});
}

function getAnyUnreadMail() {
	let unreadMail;
	accounts.some(account => {
		if (!account.error) {
			if (account.getUnreadCount() > 0) {
				unreadMail = account.getMails().first();
				// exit loop
				return true;
			}
		}
	});
	return unreadMail;
}

function getAccountsWithUnreadMail(accounts) {
	return accounts.filter(account => !account.error && account.getUnreadCount() > 0);
}

// extracts message id from offline url, ex. https://mail.google.com/mail/mu/mp/166/#cv/Inbox/145994dc0db175a4
function extractMessageIdFromOfflineUrl(url) {
	const matches = url.match(/\/([^\/]+$)/);
	if (matches && matches.length >= 2) {
		return isHex(matches[1]);
	}
}

function getSignInUrl() {
	return MAIL_DOMAIN;
}

function ButtonIcon() {
	var self = this;

	var canvas;
	var canvasContext;
	var rotation = 1;
	var factor = 1;
	var animTimer;
	var animDelay = 40;
	var animActive;
    var lastSetIconParams = {};
    ls.removeItem("lastSetIconParams");

	var customButtonIconCanvas;
	var customButtonIconRetinaCanvas

	if (typeof OffscreenCanvas != "undefined") {
		customButtonIconCanvas = new OffscreenCanvas(19, 19);
		customButtonIconRetinaCanvas = new OffscreenCanvas(38, 38);
	} else if (typeof document != "undefined") {
		customButtonIconCanvas = document.createElement("canvas");
		customButtonIconRetinaCanvas = document.createElement("canvas");
	}

	function getImageData(img, imageDataCanvas, width, height) {
		var context = imageDataCanvas.getContext("2d");
		context.clearRect(0, 0, imageDataCanvas.width, imageDataCanvas.height);
		context.drawImage(img, 0, 0, width, height);
		var imageData = context.getImageData(0, 0, width, height);
		return imageData;
	}

	this.setIcon = async function(params) {
        //console.log("setIcon", params);

        if (ls["lastSetIconParams"]) {
            lastSetIconParams = ls["lastSetIconParams"];
            lastSetIconParams = JSON.parse(lastSetIconParams);
        }

		if (!params) {
			params = lastSetIconParams;
		} else if (params.force) {
			params = lastSetIconParams;
			params.force = true; // required because it's reset above
		}

		//console.log("params: " + JSON.stringify(params));
		//console.log("last  : " + JSON.stringify(lastSetIconParams));
		if (!params.force && JSON.stringify(params) == JSON.stringify(lastSetIconParams)) {
			//console.log("setIcons cached");
			return;
		}

		var iconSet = await storage.get("icon_set");
		
		if (iconSet == "custom" && customButtonIconCanvas) {
			var src = await self.generateButtonIconPath(params);
			
			var img = new Image();
			if (src) {
				img.src = src;
			} else {
				img.src = "images/browserButtons/default/no_new.png";
			}
			console.log("img src: " + img.src);
			
			// use only the 1st 100 characters of the dataurl to identify this icon (because want to save stinrigying on every seticon call)
			var lastSrcId = img.src.substring(0, 100) + "JCutShort";
			if (lastSrcId != lastSetIconParams.src || params.force) {
				lastSetIconParams.src = lastSrcId;

				loadImage(img).then(function() {
					var imageData19 = getImageData(img, customButtonIconCanvas, 19, 19);
					var imageData38 = getImageData(img, customButtonIconRetinaCanvas, 38, 38);
					
					chrome.browserAction.setIcon({imageData: {'19':imageData19, '38':imageData38} });
				});
			} else {
				console.log("cached src");
			}
			
		} else {
			if (iconSet == "default") {
				var retinaParams = shallowClone(params);
				retinaParams.retina = true;
				// supports retina
				chrome.browserAction.setIcon({ path: {
						"19": await self.generateButtonIconPath(params),
						"38": await self.generateButtonIconPath(retinaParams)
					}
				});
			} else {
				chrome.browserAction.setIcon({ path: await self.generateButtonIconPath(params) });
			}
		}
		lastSetIconParams = shallowClone(params); // had to clone or else caused dead object errors in FF
        delete lastSetIconParams.force;
        ls["lastSetIconParams"] = JSON.stringify(lastSetIconParams);
	}
	
	this.startAnimation = async function(params = {}) {
		try {
			if (typeof OffscreenCanvas != "undefined" || typeof document != "undefined") {
				console.log("start animation")
				params.unread = true;
				
				if (await storage.get("animateButtonIcon") === true || params.testAnimation) {
					self.stopAnimation();
	
					var image = new Image();
					
					if (await storage.get("icon_set") == "custom") {
						var src = await storage.get("customButtonIconUnread");
						if (!src) {
							src = await storage.get("customButtonIconNoUnread");
						}
						if (!src) {
							src = "images/browserButtons/default/new.png";
						}
						image.src = src;
					} else {
						image.src = await self.generateButtonIconPath(params);
					}
					
					await loadImage(image);
						
                    if (await storage.get("icon_set") == "custom") {
                        // use 19px image for rotating
                        getImageData(image, customButtonIconCanvas, 19, 19);
                        image.src = await getDataUrl(customButtonIconCanvas);
                    }

                    if (!self.canvas) {
                        if (typeof OffscreenCanvas != "undefined") {
                            canvas = new OffscreenCanvas(19, 19);
                        } else {
                            canvas = document.createElement('canvas');
                        }
                        canvas.width = canvas.height = 19;
                        canvasContext = canvas.getContext('2d');
                    }
                    
                    animActive = true;
                    
                    if (animTimer) {
                        // fix for constantly animating icon: because of the synchronous loadImage above we must make sure to cancel the previous interval. note: calling startAnimate twice in a rows created the bug ie. buttonIcon.startAnimation(); buttonIcon.startAnimation() 
                        clearInterval(animTimer);
                    }
                    animTimer = setInterval(function() {
                        canvasContext.save();
                        canvasContext.clearRect(0, 0, canvas.width, canvas.height);
                        canvasContext.translate(Math.ceil(canvas.width / 2), Math.ceil(canvas.height / 2));
                        canvasContext.rotate(rotation * 2 * Math.PI);
                        canvasContext.drawImage(image, -Math.ceil(canvas.width / 2), -Math.ceil(canvas.height / 2));
                        canvasContext.restore();
                    
                        rotation += 0.03 * factor;
                        
                        if (rotation <= 0.9 && factor < 0) {
                            factor = 1;
                        } else if (rotation >= 1.1 && factor > 0) {
                            factor = -1;
                        }
                        
                        try {
                            chrome.browserAction.setIcon({imageData: canvasContext.getImageData(0, 0, canvas.width, canvas.height)});
                        } catch (error) {
                            //console.error(error);
                        }
                    }, animDelay);
                    
                    setTimeout(function() {
                        self.stopAnimation(params);
                    }, seconds(2));
				}
			} else {
				throw new Error("Missing API to animate icon!");
			}
		} catch (error) {
			console.error(error);
			self.stopAnimation(params);
		}
	}

	this.stopAnimation = function(params = {}) {
		//console.log("stopAnimation");
		
		if (animTimer != null) {
			//console.log("stopAnimation - clearinterface");
			clearInterval(animTimer);
		}
		
		if (animActive) {
			lastSetIconParams.force = true;
			self.setIcon(lastSetIconParams);
		}

		rotation = 1;
		factor = 1;
		
		animActive = false;
	}

	this.generateButtonIconPath = async function(params = {}) {
		var src;

		if (await storage.get("icon_set") == "custom") {
			if (params.signedOut) {
				src = await storage.get("customButtonIconSignedOut");
				if (!src) {
					src = await storage.get("customButtonIconNoUnread");
				}
			} else if (params.unread) {
				var src = await storage.get("customButtonIconUnread")
				if (!src) {
					src = await storage.get("customButtonIconNoUnread");
				}
			} else {
				src = await storage.get("customButtonIconNoUnread");
			}
		} else {
			src = "images/browserButtons/" + await storage.get("icon_set") + "/";
			if (params.signedOut) {
				src += "not_logged_in";
			} else if (params.unread) {
				src += "new";
			} else {
				src += "no_new";
			}
			if (params.retina) {
				src += "_retina";
			}
			src += ".png";
		}

		return src;
	}
	
}

async function resetSettings(accounts) {
	let emailSettings = await storage.get("emailSettings");
	if (!emailSettings) {
		emailSettings = {};
	}

	accounts.forEach(account => {
		// Must reset these values because the label names are different from the ids that are being used in oauth
		let emailSetting = emailSettings[account.getEmail()];
		if (!emailSetting) {
			emailSetting = {};
		}
		emailSetting.ignore = false;
		emailSetting.monitorLabel = null;
		emailSetting.openLabel = null;
		emailSetting.notifications = {};
		emailSetting.sounds = {};
		emailSetting.voices = {};
		emailSetting.tabs = {};
	});
	
	return await storage.set("emailSettings", emailSettings);
}

async function openGmail() {
    await initMisc();

	if (accounts.length) {
		accounts[0].openInbox();
	} else {
		openUrl(MAIL_DOMAIN);
	}
}

async function openQuickCompose() {
    await initMisc();

    const quickComposeEmail = await storage.get("quickComposeEmail");
	if (quickComposeEmail) {
		const params = {
            to: {
                email: quickComposeEmail
            }
        };
        await executeAccountAction(accounts[0], "openCompose", {actionParams: params});
	} else {
		openUrl("options.html?highlight=quickContact#general");
	}
}

async function sendPageLinkToContact(info, tab, email) {
    const quickComposeEmail = await storage.get("quickComposeEmail");
	if (quickComposeEmail) {
		var params = generateSendPageParams(info, tab);
        params.to = {email:quickComposeEmail};
		accounts[0].openCompose(params);
	} else {
		openUrl("options.html?highlight=quickContact#general");
	}
}

function removeContextMenu(id) {
	if (id) {
		console.log("remove context: " + id);
		chrome.contextMenus.remove(id);
	}
}

async function initQuickContactContextMenu(params = {}) {
	var quickComposeEmail = await storage.get("quickComposeEmail");
	var quickComposeEmailAlias = await storage.get("quickComposeEmailAlias");

	var quickComposeEmailContextMenuLabel;
	var emailPageLinkToContactLabel;
	var emailPageLinkToContactWithMessageLabel;
	
	if (quickComposeEmailAlias) {
		quickComposeEmailContextMenuLabel = getMessage("email") + " " + quickComposeEmailAlias;
		emailPageLinkToContactLabel = getMessage("sendPageLinkTitle") + " " + getMessage("to") + " " + quickComposeEmailAlias;
		emailPageLinkToContactWithMessageLabel = getMessage("sendPageLinkTitle") + " " + getMessage("to") + " " + quickComposeEmailAlias + " with message...";
	} else if (quickComposeEmail) {
		quickComposeEmailContextMenuLabel = getMessage("email") + " " + quickComposeEmail;
		emailPageLinkToContactLabel = getMessage("sendPageLinkTitle") + " " + getMessage("to") + " " + quickComposeEmail;
		emailPageLinkToContactWithMessageLabel = getMessage("sendPageLinkTitle") + " " + getMessage("to") + " " + quickComposeEmail + " with message...";
	} else {
		quickComposeEmailContextMenuLabel = getMessage("quickComposeEmail");
	}

    // remove them all and just re-add them
	if (params.update) {
		removeContextMenu(ContextMenu.QUICK_COMPOSE);
		removeContextMenu(ContextMenu.SEND_PAGE_LINK);
		removeContextMenu(ContextMenu.SEND_PAGE_LINK_TO_CONTACT);
		removeContextMenu(ContextMenu.SEND_PAGE_LINK_TO_CONTACT_WITH_MESSAGE);
	}

	// Email [user] ...
	createContextMenu(ContextMenu.QUICK_COMPOSE, quickComposeEmailContextMenuLabel + "...");

	if (await storage.get("showContextMenuItem")) {
		// Send page link
        createContextMenu(ContextMenu.SEND_PAGE_LINK, getMessage("sendPageLinkTitle") + "...", {contexts: ContextMenu.AllContextsExceptBrowserAction});
        
        if (quickComposeEmail) {
            // Send page link to [user]
            createContextMenu(ContextMenu.SEND_PAGE_LINK_TO_CONTACT, emailPageLinkToContactLabel, {contexts: ContextMenu.AllContextsExceptBrowserAction});
        
            if (await storage.get("accountAddingMethod") == "oauth") {
                // Send page link to [user] with message
                createContextMenu(ContextMenu.SEND_PAGE_LINK_TO_CONTACT_WITH_MESSAGE, emailPageLinkToContactWithMessageLabel, {contexts: ContextMenu.AllContextsExceptBrowserAction});
            }
        }
	}
}

function generateSendPageParams(info, tab) {
	console.log("info", info, tab);
	var subject;
	var message;
	
	if (info) {
		// user right clicked on on a link within the page
		if (info.linkUrl) {
			// since we can't fetch the title of that linked page, let's construct a title from the link domain and path
			subject = info.linkUrl.parseUrl().hostname.replace("www.", "") + info.linkUrl.parseUrl().pathname.summarize(70);
			message = info.linkUrl;
		}
		
		if (!message) {
			message = info.pageUrl;
		}
	}
	
	if (!message) {
		message = tab.url;
	}
	
	// quote the text and append url (ie. message) after for news clippings etc.
	if (info && info.selectionText) {
		message = "\"" + info.selectionText + "\"\n\n" + message;
	}
	
	if (!subject) {
		subject = tab.title;
	}
	
	return {
		subject: decodeURIComponent(subject),
		message: message
	};
}

function sendPageLink(info, tab, account) {
	const params = generateSendPageParams(info, tab);
    // removed next line because created problem loading compose window with russian text ie. "Как мы создали бизнес: Вячеслав Климов о создании «Новой Почты» - AIN.UA"
    //subject = subject.replace('%AB', '%2D'); // Special case: escape for %AB
    
	account.openCompose(params);
}

async function updateContacts() {
    var contactsData = await storage.get("contactsData");
    if (contactsData) {
        const fetchContactPromises = contactsData.map(contactData => {
            console.log("updating contacts for account: " + contactData.userEmail);
            return fetchContacts(contactData.userEmail);
        });
        
        const responses = await Promise.all(fetchContactPromises);
        var someContactsHaveBeenUpdated = false;
        
        responses.forEach(function(response, index) {
            contactsData[index] = response.contactDataItem;
            if (response.contactsHaveBeenUpdated) {
                someContactsHaveBeenUpdated = true;
            }
        });
        
        if (someContactsHaveBeenUpdated) {
            await storage.set("contactsData", contactsData);
        }
    }
}

// change long ugly links like https://api.yahoo.com?abc=def to https://api.yahoo.com...
function shortenUrls(str) {
	return Autolinker.link(str, {
		truncate: {length: 30},
		email: false,
		twitter: false,
		phone: false,
		hashtag: false,
	    replaceFn : function( autolinker, match ) {
	        switch( match.getType() ) {
	            case 'url' :
	                var tag = autolinker.getTagBuilder().build( match ); 
	        		return tag.innerHtml;
	        }
		}
	});
}

async function ajaxBasicHTMLGmail(url, options, secondAttempt) {
    const response = await fetchWrapper(url, options);
    if (response.ok) {
        const data = await response.text();
		if (testGmailQuestion || (response.url && response.url.includes("v=lui"))) {
            if (secondAttempt) {
                throw "could not by pass html question";
            }
			testGmailQuestion = false;
			
            console.log("Detected Basic HTML Gmail question");
            
			let matches = data.match(/action\=\"([^\"\&]*)/);
			const actionUrl = matches[1];
			   
			matches = data.match(/value\=\"([^\"\&]*)/);
			const thisGmailAT = matches[1];
            
            try {
                const formData = new FormData();
                formData.append("at", thisGmailAT);

                await fetch(actionUrl, {
                    method: "POST",
                    body: formData
                });
                // run original ajax again
                return ajaxBasicHTMLGmail(url, options, true);
            } catch (error) {
                throw "failed to post to html Gmail version: " + error;
            }
		} else {
			return data;
		}
    } else {
        const error = Error(response.statusText);
        error.errorCode = response.status;
        throw error;
    }
}

async function calculatePollingInterval(accounts) {
	var pollIntervalTime = await storage.get("poll");
	
	if (await storage.get("accountAddingMethod") == "oauth") {

        const promises = accounts.map(async account => await account.isBeingWatched());
        const accountsBeingWatched = await Promise.all(promises);
        const allBeingWatched = accountsBeingWatched.every(beingWatchedFlag => beingWatchedFlag);
		
		// revert to default if issue with some accounts
		if (pollIntervalTime == "realtime" && !allBeingWatched) {
			pollIntervalTime = DEFAULT_SETTINGS["poll"];
		}
	}
	
	return pollIntervalTime;
}

function getURLOrRedirectURL($node) {
	var url = $node.attr("href");

	// remove google redirection
	// ex. "http://www.google.com/url?q=http%3A%2F%2Fjasonsavard.com%2Fwiki"
	if (url) {
		if (/^https?:\/\/www\.google\.com\/url\\?q=(.*)/.test(url)) {
			// only pull the q param because google redirect adds other params
			url = getUrlValue(url, "q");
			url = decodeURIComponent(url);
		}
	}
	return url;
}

async function interceptClicks($node, mail) {
    console.log("intercept redirects");
    const accountAddingMethod = await storage.get("accountAddingMethod");
    let ctrlClickGuide = await storage.get("ctrlClickGuide");

	// add tooltip for links
	$node.each(function () {
		if (!$(this).attr("title")) { // !$(this).hasClass("DTH") && 
			var url = getURLOrRedirectURL($(this));
			if (url) {
				$(this).attr("title", url.summarize(50));
			}
		}
	});

	// change links if necessary
	$node.off("click").on("click", { mail: mail }, function (event) {
		var url = getURLOrRedirectURL($(this));

		// it's possible some <a> are for scroll position <a name="paragraphstart"></a>
		if (url) {
			// if anchor link just skip every and process it
			if (accountAddingMethod == "oauth" && url.startsWith("#")) {
				// because we sanitized the 'name' attributes of the target anchor we must match it with the subsituted prefix
				$(this).attr("href", "#" + HTML_CSS_SANITIZER_REWRITE_IDS_PREFIX + url.substring(1));
				return true;
			}

			// found relative link which used to be a mailto ex. ?&v=b&cs=wh&to=ebottini@gmail.com
			if (/^\\?.*&to=(.*)/.test(url)) {
				// Getting this value from Gmail (notice the 2 question marks! : ?&v=b&cs=wh&to=unsubscribe@salesforce.com?Subject=Opt+Out
				// let's replace all question mark
				url = url.replaceAll("?", "&");

				var params = {};
				params.to = { email: getUrlValue(url, "to") };
				params.subject = getUrlValue(url, "subject", true);
				params.message = getUrlValue(url, "body", true);
				// https://mail.google.com/mail/u/0/?ui=2&view=btop&ver=1pxvtfa3uo81z#to%253Dunsubscribe%252540salesforce.com%2526cmid%253D8
				// ?&v=b&cs=wh&to=unsubscribe@salesforce.com?Subject=Opt+Out

				event.data.mail.account.openCompose(params);

				event.preventDefault();
				event.stopPropagation();
			}

			// v3: seems not working everyone :( v2 commented because seems chrome does it by default now    v1: if user holds ctrl or middle click then open link in a tab while keeping popup window open
			if (isCtrlPressed(event) || event.which == 2) {
				console.log("ctrl or middleclick", event);
				chrome.tabs.create({ url: url, active: false });
				event.preventDefault();
				event.stopPropagation();
			} else {
				if (!ctrlClickGuide) {
					var keyStr;
					if (DetectClient.isMac()) {
						keyStr = "⌘";
					} else {
						keyStr = "Ctrl";
					}

					var $dialog = initTemplate("ctrlClickDialogTemplate");
					$dialog.find(".dialogDescription").html(getMessage("pressCtrlToOpenInBackground", "<b>" + keyStr + "</b>"));
					openDialog($dialog);

					event.preventDefault();
                    event.stopPropagation();
                    ctrlClickGuide = new Date();
                    storage.set("ctrlClickGuide", ctrlClickGuide);
				} else {
					openUrl(url);
					return false;
				}
			}
		}
	});

	// middle click
	$node.off("auxclick").on("auxclick", { mail: mail }, function (event) {
		if (event.which == 2) {
			// firefox patch refer to https://jasonsavard.com/forum/discussion/4077/ff-quantum-middle-click-email-link-issue
			if (!DetectClient.isFirefox()) {
				var url = getURLOrRedirectURL($(this));
				chrome.tabs.create({ url: url, active: false });
				event.preventDefault();
				event.stopPropagation();
			}
		}
	});
}

function requestPermission(params = {}) {
	return new Promise((resolve, reject) => {
		showLoading();

		if (params.useGoogleAccountsSignIn) {
			chrome.windows.getCurrent(windowResponse => {
				// temp
				console.log("windowResponse", windowResponse);
				localStorage._currentWindowId = windowResponse.id;

				params.oAuthForDevices.openPermissionWindow().then(permissionWindow => {
					localStorage._permissionWindowId = permissionWindow.id;
					window.permissionWindow = permissionWindow;
					window.userResponsedToPermissionWindow = false;

					// detect when window is closed to remove loading message
					var pollTimer = setInterval(function () {
						if (!window.permissionWindow) {
							clearInterval(pollTimer);
							console.log("userResponsedToPermissionWindow: " + window.userResponsedToPermissionWindow);
							// check if the user just closed window without accepting permission, if so just hide the loading
							if (!window.userResponsedToPermissionWindow) {
								hideLoading();
							}
						}
					}, seconds(4));
				});
			});
		} else {
			// Chrome sign-in
			params.oAuthForDevices.getAccessToken({ refetch: true }).then(tokenResponse => {
				resolve(tokenResponse);
			}).catch(error => {
				hideLoading();
				reject(error);
			});
		}
	});
}

function openPermissionsDialog(params = {}) {
	return new Promise((resolve, reject) => {
		var $dialog = initTemplate("permissionDialogTemplate");
        sendGA("permissions", "openPermissionsDialog");
        
        if (supportsChromeSignIn()) {
            if (params.secondAttempt) {
                $dialog.find("#tryGoogleAccountsSignInMessage").unhide();
                $dialog.find(".chromeSignIn").removeClass("colored");
                $dialog.find(".googleAccountsSignIn")
                    .addClass("colored")
                    //.attr("raised", true)
                    ;
            } else {
                $dialog.find("#tryGoogleAccountsSignInMessage").hidden();
                $dialog.find(".chromeSignIn").addClass("colored");
                $dialog.find(".googleAccountsSignIn")
                    .removeClass("colored")
                    //.removeAttr("raised")
                    ;
            }
        } else {
            $dialog.find(".chromeSignIn").remove();
            $dialog.find("[msg='or']").remove();
            $dialog.find(".googleAccountsSignIn").addClass("colored");
        }

		if (params.googlePhotos) {
			$dialog.find("#googlePhotosHeader").unhide();
			$dialog.find(".cancel").unhide();
		} else {
			$dialog.find("#googlePhotosHeader").hidden();
			$dialog.find(".cancel").hidden();
		}
		$dialog.find(".chromeSignIn").off().click(() => {
			hideError();
			sendGA("permissions", "grantAccess", "start");
			requestPermission(params).then(tokenResponse => {
				sendGA("permissions", "grantAccess", "success");
				setTimeout(() => {
					resolve(tokenResponse);
				}, 200);
			}).catch(error => {
				console.error(error);
				sendGA("permissions", "grantAccess", "error: " + error);
				params.secondAttempt = true;
				openPermissionsDialog(params);
			});
		});
		$dialog.find(".googleAccountsSignIn")
			.off().click(() => {
				sendGA("permissions", "otherAccounts");
				hideError();
				showLoading();
				$dialog[0].close();
				params.useGoogleAccountsSignIn = true;
				requestPermission(params).then(() => {
					resolve({ useGoogleAccountsSignIn: true });
				}).catch(error => {
					params.secondAttempt = true;
					openPermissionsDialog(params);
				});
			})
			;
		$dialog.find(".moreInfo").off().click(() => {
			openUrl("https://jasonsavard.com/wiki/Granting_access?ref=gmailChecker");
		});

		openDialog($dialog);
	});
}

async function syncSignInOrderForAllAccounts() {
    await initAllAccounts();
	const promises = accounts.map(account => account.syncSignInId());
    await Promise.all(promises);
    await serializeAccounts(accounts);
}

function requiresCalendarExtension(source) {
	openGenericDialog({
		title: "Extension required",
		content: "This function requires my other extension Checker Plus for Google Calendar",
		showCancel: true,
		okLabel: "Get extension"
	}).then(response => {
		if (response == "ok") {
			openUrl("https://jasonsavard.com/Checker-Plus-for-Google-Calendar?ref=" + source);
		}
	});
}

function initOauthAPIs() {
    oAuthForEmails = new OAuthForDevices({
        scope:              Scopes.GMAIL_MODIFY,
        storageKey:        "tokenResponsesEmails",
        securityTokenKey: "_emailSecurityToken"
    });

    // Contacts
    oAuthForContacts = new OAuthForDevices({
        scope:          Scopes.CONTACTS_RECENT,
        storageKey:    "tokenResponsesContacts",
        securityTokenKey: "_contactsSecurityToken",
        getUserEmail: function(tokenResponse, sendOAuthRequest) {
            return new Promise((resolve, reject) => {
                // were using the contacts url because it's the only one we request permission to and it will give us the email id (so only fetch 1 result)
                // send token response since we don't have the userEmail
                sendOAuthRequest({
                    tokenResponse: tokenResponse,
                    url: "https://www.google.com/m8/feeds/contacts/default/thin" + CONTACTS_API_URL_PARAMS,
                    appendAccessToken: true,
                    headers: CONTACTS_API_HEADER,
                    data: {
                        alt: "json",
                        "max-results": "1"
                    }
                }).then(data => {
                    const response = {
                        userEmail: data.feed.id.$t
                    }
                    resolve(response);
                }).catch(error => {
                    error = new Error("failed: you might by re-trying to fetch the userEmail for the non default account");
                    error.warning = "failed: you might by re-trying to fetch the userEmail for the non default account";
                    reject(error);
                });
            });
        }
    });

    // Profile
    oAuthForProfiles = new OAuthForDevices({
        scope:              Scopes.USERINFO_PROFILE,
        storageKey:        "tokenResponsesProfiles",
        securityTokenKey: "_profilesSecurityToken",
        getUserEmail: function(tokenResponse, sendOAuthRequest) {
            return Promise.resolve({userEmail:ls["emailAccountRequestingOauth"]});
        }
    });
    
    // People (At the time it seems the API would only pull contacts that were added by the user) but I liked that the Contacts API could pull recently communicated with contacts so I decided to continue using the Conctacts API
    /*
    oAuthForPeople = new OAuthForDevices({
        tokenResponses:storage.get("tokenResponsesPeople"),
        scope:"https://www.googleapis.com/auth/contacts.readonly",
        getUserEmail: function(tokenResponse, sendOAuthRequest) {
            return Promise.resolve({userEmail:ls["emailAccountRequestingOauth"]});
        }
    });
    oAuthForPeople.setOnTokenChange(async (params, allTokens) => {
        if (params && params.tokenResponse) {
            await storage.set("tokenResponsesPeople", allTokens);
        }
    });
    */
}

function sendMessageToBG(command, params, stringifyParams = false) {
    if (!DetectClient.isFirefox()) {
        stringifyParams = false;
    }

    if (window.inBackground) { // if running in same context
        if (command.includes(".")) { // ie. forgottenReminder.start
            const commands = command.split(".");
            return window[commands[0]][commands[1]](params);
        } else {
            return window[command](params);
        }
    } else {
        return new Promise((resolve, reject) => {
            if (stringifyParams) {
                params = JSON.stringify(params);
            }
            chrome.runtime.sendMessage({command: command, params: params, stringifyParams: stringifyParams}, response => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError.message);
                } else {
                    response = initUndefinedObject(response);
                    if (response && response.error) {
                        console.log("error2", response);
                        if (response.error.message) { // recreate errorobj
                            const errorObj = Error(response.error.message);
                            copyObj(response.error, errorObj);
                            console.error("recreate error obj", errorObj)
                            reject(errorObj);
                        } else {
                            reject(response.error);
                        }
                    } else {
                        resolve(response);
                    }
                }
            });
        });
    }
}

async function serializeMails(obj) {
    return Encryption.encryptObj(obj, accountsReplacer);
}

function accountsReplacer(key, value) {
    if (key == "account") {
        return value.id;
    } else {
        return value;
    }
}

function accountsReviver(key, value) {
    if (key == "account") {
        return getAccountById(value);
    } else {
        return value;
    }
}

function convertMailToObject(mail, account) {
    const mailObject = new Mail();
    copyObj(mail, mailObject);
    if (account) {
        mailObject.account = account;
    }
    return mailObject;
}

function convertMailsToObjects(ary, account) {
    return ary.map(mail => convertMailToObject(mail, account));
}

function parseXML(xml) {
    return (new DOMParser()).parseFromString(xml, "text/xml");
}

async function minimizeAndSerialize(mails, maxMails) {
    const minimizedMails = mails.map((mail, index) => {
        if (index >= maxMails) {
            mail.messages = []; // remove messages, they will be loaded dynamically when user previews
        }
        return mail;
    });
    return serializeMails(minimizedMails);
}

async function serializeAccounts(accounts, params = {}) {
    console.log("serializeAccounts", accounts);

    if (!params.storageKey) {
        params.storageKey = "accounts";
    }

    const doNotSerializeMails = await storage.get("doNotSerializeMails");
    const ABSOLUTE_MAX_EMAILS = 10;
    const THRESHOLD_OF_DAYS_TO_BE_CONSIDERED_NON_EMAIL_PREVIEW_USER = 3;
    const lastAccountEmailPreviewDates = await storage.get("_lastAccountEmailPreviewDates");
    const maxEmailsToShowPerAccount = await storage.get("maxEmailsToShowPerAccount");

    const allAccountsToSerializePromises = accounts.map(async account => {
        const accountToSerialize = JSON.parse(JSON.stringify(account), dateReviver);

        accountToSerialize.email = account.getEmail();
        accountToSerialize.historyId = account.getHistoryId();

        const lastEmailPreviewDate = lastAccountEmailPreviewDates[account.getEmail()] || new Date(1);
        let MAX_EMAILS;
        if (doNotSerializeMails || lastEmailPreviewDate.diffInDays() <= -THRESHOLD_OF_DAYS_TO_BE_CONSIDERED_NON_EMAIL_PREVIEW_USER) {
            MAX_EMAILS = 0;
        } else {
            MAX_EMAILS = params.maxEmailsToShowPerAccount || Math.min(maxEmailsToShowPerAccount, ABSOLUTE_MAX_EMAILS);
        }

        accountToSerialize.mails = await minimizeAndSerialize(account.getMails(), MAX_EMAILS);
        accountToSerialize.unsnoozedEmails = await minimizeAndSerialize(account.getUnsnoozedEmails(), MAX_EMAILS);

        const labels = account.getLabelsForSerialization();
        if (labels) {
            accountToSerialize.labels = JSON.stringify(labels);
        }

        delete accountToSerialize.emailsInAllLabels;

        if (account.error) {
            if (account.error.message) {
                accountToSerialize.error = account.error.message;
            } else {
                accountToSerialize.error = account.error.toString();
            }
        }

        return accountToSerialize;
    });

    const allAccountsToSerialize = await Promise.all(allAccountsToSerializePromises);

    try {
        await storage.set(params.storageKey, allAccountsToSerialize);
    } catch (error) {
        if (!params.retries) {
            params.retries = 1;
            params.maxEmailsToShowPerAccount = 5;
        } else {
            params.retries++;
            if (params.retries == 2) {
                params.maxEmailsToShowPerAccount = 0;
            } else {
                console.error("Error serializing, stopping.", error);
                throw error;
            }
        }

        console.error("Error serializing, trying again with less: " + params.maxEmailsToShowPerAccount, error);
        await serializeAccounts(accounts, params);
    }
}

async function retrieveAccounts(storageKey = "accounts") {
    let accounts = await storage.get(storageKey);
    // copy array (remove reference to storage.get) acocunts could be modified and since they were references they would also modify the storage.get > cache[]  So if we called storage.get on the same variable it would return the modified cached variables instead of what is in actual storage
	accounts = accounts.slice();

    console.log("retrieveAccounts " + storageKey, accounts);
    const promises = accounts.map(async account => {
        const accountObj = new Account();
        copyObj(account, accountObj);

        accountObj.init({
            accountNumber:  account.id,
            email:          account.email
        });
    
        accountObj.setHistoryId(account.historyId);

        if (account.mails) {
            try {
                account.mails = await Encryption.decryptObj(account.mails, dateReviver);
                accountObj.setMail(convertMailsToObjects(account.mails, accountObj));
            } catch (error) {
                console.warn("ignore decrypt error", error);
            }
        } else {
            accountObj.setMail([]);
        }

        if (account.unsnoozedEmails) {
            try {
                account.unsnoozedEmails = await Encryption.decryptObj(account.unsnoozedEmails, dateReviver);
                accountObj.setUnsnoozedEmails(convertMailsToObjects(account.unsnoozedEmails, accountObj));
            } catch (error) {
                console.warn("ignore decrypt error2", error, account.unsnoozedEmails);
            }
        } else {
            accountObj.setUnsnoozedEmails([]);
        }

        if (account.labels) {
            accountObj.setLabels(JSON.parse(account.labels, dateReviver));
            delete accountObj.labels; // delete this public attribute because setLabels above places it in the private attribute - to avoid confusion
        }

        return accountObj;
    });

    return Promise.all(promises);
}

function findMailById(id) {
	let foundMail;
	accounts.some(account => {
		return account.getMails().some(mail => {
			if (mail.id == id) {
				foundMail = mail;
				return true;
			}
		});
	});
	return foundMail;
}

function openChangelog(ref) {
    const url = new URL("https://jasonsavard.com/wiki/Checker_Plus_for_Gmail_changelog");
    url.searchParams.set("cUrl", chrome.runtime.getURL("contribute.html"));
    if (ref) {
        url.searchParams.set("ref", ref);
    }
    openUrl(url.href);
}