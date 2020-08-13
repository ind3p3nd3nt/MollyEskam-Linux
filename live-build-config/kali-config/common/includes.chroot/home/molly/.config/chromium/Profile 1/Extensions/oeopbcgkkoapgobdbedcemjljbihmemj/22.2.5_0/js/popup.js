var inWidget;
var autoSaveInterval;
var replyingToMail;
var currentTabletFrameEmail;
var mouseInPopup = false;
var mouseHasEnteredPopupAtleastOnce = false;
var POPUP_VIEW_TABLET = "tabletView";
var POPUP_VIEW_CHECKER_PLUS = "checkerPlus";
var popupView;
var fromToolbar;
var isDetached;
var isTemporaryPopup;
var renderAccountsInterval;
var windowOpenTime = new Date();
var initOpenEmailEventListenersLoaded;
var hiddenMails = [];
var drawerIsVisible;
var skinsSettings;
var closeWindowTimeout;
var contactsData;

var MAX_POPUP_HEIGHT = DetectClient.isFirefox() ? 550 : 600; /* must match height hardcoded in css */
var HEADER_HEIGHT = 64;
var ACCOUNT_HEADER_HEIGHT = 30;
var FAB_HEIGHT = 80; // 140

var accounts;
var totalUnreadCount = lsNumber("unreadCount");
var zoomFactor;
var bgObjectsReady;
var accountAddingMethod;
var highlightDates;
var maxEmailsToShowPerAccount;
var emailPreview;
var keyboardException_R;

console.time("zoomfactor");
var zoomPromise = getZoomFactor().then(function(thisZoomFactor) {
	console.timeEnd("zoomfactor");
	zoomFactor = thisZoomFactor;
})

if (location.href.includes("source=widget")) {
	inWidget = true;
} else if (location.href.includes("source=toolbar")) {
	fromToolbar = true;
} else {
	isDetached = true;
}

if (location.href.includes("source=notification")) {
	isTemporaryPopup = true;
}

// check if opening popup from notification and thus directly opening message
var previewMailId = getUrlValue(location.href, "previewMailId");

// 25% CPU issue caused when calling window.close "before" the following execution stopped - inside previewing an email view and then trying to close it to show inbox view (which animates)
function closeWindow(params = {}) {
	console.log("closeWindow: " + params.source);
	
	if (fromToolbar || isTemporaryPopup) {
		if (params.delay) {
			closeWindowTimeout = setTimeout(() => {
				window.close();
			}, params.delay);
		} else {
			window.close();
		}
	} else {
		if (!isInboxView()) {
			openInbox();
		}
	}
}

function isInboxView() {
	if ($("#inboxSection").hasClass("active")) {
		return true;
	}
}

function isEmailView() {
	if ($("#openEmailSection").hasClass("active")) {
		return true;
	}
}

function isComposeView() {
	if ($("#composeSection").hasClass("active")) {
		return true;
	}
}

function showSelectedTab(url) {
	if (url) {
		$(".tab").removeClass("selected");
		
		if (url.endsWith("/%5Ei") || url.endsWith("/Inbox") || url.includes("/Inbox/")) {
			$("#tabInbox").addClass("selected");
		} else if (url.endsWith("/Important") || url.includes("/Important/")) {
			$("#tabImportant").addClass("selected");
		} else if (url.endsWith("/All%20Mail") || url.includes("/All%20Mail/")) {
			$("#tabAllMail").addClass("selected");
		} else if (url.includes("smartlabel_personal")) {
			$("#tabPrimary").addClass("selected");
		} else if (url.includes("smartlabel_receipt")) {
			$("#tabPurchases").addClass("selected");
		} else if (url.includes("smartlabel_finance")) {
			$("#tabFinance").addClass("selected");
		} else if (url.includes("smartlabel_social")) {
			$("#tabSocial").addClass("selected");
		} else if (url.includes("smartlabel_promo")) {
			$("#tabPromotions").addClass("selected");
		} else if (url.includes("smartlabel_notification")) {
			$("#tabUpdates").addClass("selected");
		} else if (url.includes("smartlabel_group")) {
			$("#tabForums").addClass("selected");
		} else {
			// viewing a label: #tl/apps
			// viewing an email inside a label: #cv/apps/47120957120498
			var label = url.match(/#tl\/(.*)/);
			if (!label) {
				label = url.match(/#cv\/(.*)\//);
			}
			if (label) {
				try {
					$("#label_" + label[1]).addClass("selected");
				} catch (e) {
					console.error("error with #label_ : " + label[1], e);
				}
			}
		}
	}
}

async function initTabs(email) {
	// init tabs
	var tabs;
	var account = getAccountByEmail(email);
	if (account) {
		tabs = await account.getSetting("tabs");
		
		// add enabled tabs only
		var tabsArray = [];
		for (tab in tabs) {
			if (tabs[tab]) { // check if enabled
				tabsArray.push(initTab(account, tab));
			}
		}
		
		tabsArray.sort(function($a, $b) {
			if (parseInt($a.attr("sortIndex")) < parseInt($b.attr("sortIndex"))) {
				return -1;
			} else if (parseInt($a.attr("sortIndex")) > parseInt($b.attr("sortIndex"))) {
				return 1;
			} else {
				return 0;
			}
		});
		
		var SHRINK_TABS_THRESHOLD = 6;
		if (tabsArray.length > SHRINK_TABS_THRESHOLD) {
			$("#tabs").addClass("shrink");
		}
		$("#tabs")
			.empty()
			.append( tabsArray )
		;
		
		if (tabsArray.length) {
			$("html").addClass("hasTabs");
		} else { //if ($.isEmptyObject(tabs)) {
			$("html").removeClass("hasTabs");
		}
		
		resizeFrameInExternalPopup();

		// sync labels after display them (because the callback might delay the tabs from initially showing) remove any renamed or deleted from the settings
		account.getLabels().then(async labels => {
            console.log("labels soft", labels);
			if (labels.length && tabs) {
				var tabsUnsynced;
				for (tab in tabs) {
					var tabFoundInLabels = false;
					for (var a=0; a<labels.length; a++) {
						if (labels[a].id.equalsIgnoreCase(tab)) {
							tabFoundInLabels = true;
							break;
						}
					}
					
					if (!isSystemLabel(tab) && !tabFoundInLabels) {
						console.log("remove this tab from settings: " + tab);
						delete tabs[tab];
						tabsUnsynced = true;
					}
				}
				
				if (tabsUnsynced) {
					console.log("rescyning tabs");
					var emailSettings = await storage.get("emailSettings");
					emailSettings[email].tabs = tabs;
					await storage.set("emailSettings", emailSettings);
					
					// force refresh of labels
					account.getLabels(true).then(labels => {
                        console.log("labels hard", labels);
						showMessage("You have renamed or removed some Gmail labels. You have to re-select them in the extension options.");
					});
				}
			}
		}).catch(error => {
			showError("Error loading labels: " + error);
		});
	
	}
	
	showSelectedTab(await storage.get("tabletViewUrl"));
}

function initTab(account, tabName) {
	var $tab = $("<div class='tab visible'/>");
	var tabId;
	var sortIndex;
	if (tabName == SYSTEM_INBOX) {
		tabId = "tabInbox";
		tabTitle = getMessage("inbox");
		sortIndex = 0;
	} else if (tabName == SYSTEM_IMPORTANT) {
		tabId = "tabImportant";
		tabTitle = getMessage("important");
		sortIndex = 1;
	} else if (tabName == SYSTEM_ALL_MAIL) {
		tabId = "tabAllMail";
		tabTitle = getMessage("allMail");
		sortIndex = 2;
	} else if (tabName == SYSTEM_PRIMARY) {
		tabId = "tabPrimary";
		tabTitle = getMessage("primary");
		sortIndex = 3;
	} else if (tabName == SYSTEM_PURCHASES) {
		tabId = "tabPurchases";
		tabTitle = getMessage("purchases");
		sortIndex = 4;
	} else if (tabName == SYSTEM_FINANCE) {
		tabId = "tabFinance";
		tabTitle = getMessage("finance");
		sortIndex = 5;
	} else if (tabName == SYSTEM_SOCIAL) {
		tabId = "tabSocial";
		tabTitle = getMessage("social");
		sortIndex = 6;
	} else if (tabName == SYSTEM_PROMOTIONS) {
		tabId = "tabPromotions";
		tabTitle = getMessage("promotions");
		sortIndex = 7;
	} else if (tabName == SYSTEM_UPDATES) {
		tabId = "tabUpdates";
		tabTitle = getMessage("updates");
		sortIndex = 8;
	} else if (tabName == SYSTEM_FORUMS) {
		tabId = "tabForums";
		tabTitle = getMessage("forums");
		sortIndex = 9;
	} else {
		if (tabName) {
			const labelName = account.getLabelName(tabName);
			console.log("names: ", tabName, labelName)
			// keep it lower case and insidew tablet.js also, seems that when clicking nonsystem labels it resets to inbox after a few seconds??
			if (labelName) {
				tabId = "label_" + labelName.toLowerCase();
				// Nested labels use / but the /mu/ uses -    ... so let's replace themm all from / to -
				tabId = tabId.replaceAll("/", "-");
				console.log("tabid: " + tabId);
				tabTitle = labelName;
				sortIndex = labelName.toLowerCase().charCodeAt(0);
			}
		}
	}
	
	$tab
		.attr("id", tabId)
		.attr("sortIndex", sortIndex)
		.attr("title", tabTitle)
		.text(tabTitle)
		.addClass("visible")
		.off().on("click", function() {
			var thisTabId = $(this).attr("id");
			tabletFramePort.postMessage({action: "goToLabel", label:thisTabId});
		})
	;

	return $tab;
}

function initPopupView() {
	
	initSwitchMenuItem();
	
	console.log("initpopupview: " + popupView);
	$(document).ready(function() {

        (async () => {

            if (popupView == POPUP_VIEW_CHECKER_PLUS) {
                $("html")
                    .removeClass("tabletView")
                    .addClass("checkerPlusView")
                ;
            } else {
                $("html")
                    .removeClass("checkerPlusView")
                    .addClass("tabletView")
                ;
                
                // display any errors with accounts above
                if (accounts && accounts.length) {
                    accounts.some(account => {
                        if (account.error) {
                            setTimeout(() => {
                                showError(account.getEmail() + ": " + account.getError().niceError + " - " + account.getError().instructions);
                            }, 500)
                            return true;
                        }
                    });
                } else {
                    setTimeout(() => {
                        showError("Refresh or sign out and in!");
                    }, 500)
                }
                
                /*
                    mui (checkerPlusForGmail must also be hard coded in manifest include_globs) is passed to the context script
                    the context script stores the mui value in the GMAIL_AT
                    which then Gmail API calls pass it as the &at= in the urls of /u/0/s/ etc.
                    I intercept those urls in the webrequests and set the correct at parameter (instead of the mui value)
                */
                const urlPrefix = "https://mail.google.com/mail/mu/mp/?mui=" + MUI + "&hl=" + await storage.get("language");

                let url;
                if (previewMailId) {
                    const mail = findMailById(previewMailId);
                    
                    var mobileViewFolder;
                    if (mail && mail.monitoredLabel == SYSTEM_PRIMARY) {
                        mobileViewFolder = "priority/%5Esmartlabel_personal";
                    } else {
                        mobileViewFolder = "Inbox";
                    }
                    url = urlPrefix + "#cv/" + mobileViewFolder + "/" + previewMailId;
                } else {
                    url = await storage.get("tabletViewUrl");
                }
                
                if (!url) {
                    url = urlPrefix;
                }

                showLoading();
                const permissionsObj = {permissions: ["webRequest", "webRequestBlocking"]};
                chrome.permissions.contains(permissionsObj, async result => {
                    new Promise((resolve, reject) => {
                        if (result) {
                            console.log("contains permissions")
                            resolve(true);
                        } else {
                            chrome.permissions.request(permissionsObj, async granted => {
                                if (chrome.runtime.lastError) {
                                    // mainly for Firefox users who already had inbox view as their default because it requires a user gesture
                                    const $dialog = initTemplate("inboxViewPermissionDialogTemplate");
                                    $dialog.find(".okDialog").off().click(() => {
                                        chrome.permissions.request(permissionsObj, async granted => {
                                            resolve(granted);
                                        });
                                    });
                                    openDialog($dialog);
                                } else {
                                    console.log("requested permissions: " + granted);
                                    if (granted) {
                                        sendMessageToBG("initWebRequest");
                                    }
                                    resolve(granted);
                                }
                            });
                        }
                    }).then(result => {
                        if (result) {
                            $("#tabletViewFrame")
                                .attr("src", url)
                                .off("load").on("load", function() {
                                        hideLoading();
                                        console.log("frame loaded " + new Date());
                                        // backup method: if could not detect current email from frame then let's default to first email from accounts detected
                                        setTimeout(async () => {
                                            console.log("detect email timeout reached " + new Date());
                                            if (!currentTabletFrameEmail) {
                                                console.log("timeout default to first detected account");
                                                initTabs(getFirstEmail(accounts));
                                            }
                                        }, 500);
                                        
                                    })
                                .focus()
                            ;

                            // backup method if user toggles back and foorth between views, the on load above might not be called
                            setTimeout(() => {
                                hideLoading();
                            }, 1000);
                        } else {
                            showError("Could not obtain permissions to load Inbox view")
                        }
                    });
                });

            }

        })();
	});
}

async function reversePopupView(force, oneTime) {
	console.log("reversepopupview");
	if (force || !reversingView) {
		reversingView = true;

		if (oneTime) {
			// store previous button action to delete next time
			await storage.set("_oneTimeReversePopupView", await storage.get("browserButtonAction"));
		}
		
		// reverse view
		if (popupView == POPUP_VIEW_CHECKER_PLUS) {
			popupView = POPUP_VIEW_TABLET;
			await storage.set("browserButtonAction", BROWSER_BUTTON_ACTION_GMAIL_INBOX);
		} else {
			popupView = POPUP_VIEW_CHECKER_PLUS;
			await storage.set("browserButtonAction", BROWSER_BUTTON_ACTION_CHECKER_PLUS);
		}
		
		initPopupView();
	}
}

function resizeFrameInExternalPopup() {
	// Force resize to resize tabletviewframe
	if (isDetached && popupView == POPUP_VIEW_TABLET) {
		setTimeout(function() {
			resizeNodes();
		}, 10);
	}
}

function initSwitchMenuItem() {
	if (popupView == POPUP_VIEW_CHECKER_PLUS) {
		$(".switchViewLabel").text(getMessage("switchToInbox"));
	} else {
		$(".switchViewLabel").text(getMessage("switchToCheckerPlus"));
	}
}

async function cacheContactsData() {
    if (!globalThis.cacheContactsDataPromise || !contactsData) {
        globalThis.cacheContactsDataPromise = new Promise(async (resolve, reject) => {
            if (!contactsData) {
                contactsData = await storage.get("contactsData");
            }
            resolve();
        });
    }
    return globalThis.cacheContactsDataPromise;
}

async function getBGObjects() {
	console.time("getBGObjects");
    
    await initUI();

    accountAddingMethod = await storage.get("accountAddingMethod");
    highlightDates = await storage.get("highlightDates");
    skinsSettings = await storage.get("skins");
    maxEmailsToShowPerAccount = await storage.get("maxEmailsToShowPerAccount")
    emailPreview = await storage.get("emailPreview");
    keyboardException_R = await storage.get("keyboardException_R");

	console.timeEnd("getBGObjects");
}

async function executeAccountAction(account, action, params = {}) {
    params.account = account;
    params.action = action;
    return sendMessageToBG("accountAction", params, true);
}

function executeMailAction(mail, action, params = {}) {
    params.mail = mail;
    params.action = action;

	return new Promise((resolve, reject) => {
		const $mail = getMailNode(params.mail);
		
		if (!params.actionParams) {
			params.actionParams = {};
		}
        
        if (params.maybeHide) {
            params.actionParams.instantlyUpdatedCount = true;
        }
        
        console.log("executeMailAction", params);
        // firefox gave error "The object could not be cloned." when trying to pass objects with functions declared, solution is stringify it manually
        sendMessageToBG("mailAction", params, true).then(response => {
			resolve();
		}).catch(async error => {
            console.error("mailaction error", error);
			let errorStr;
			if (error.errorCode == 503) {
                errorStr = error + ". " + getMessage("tryAgainLater");
			} else {
				if (await storage.get("accountAddingMethod") == "autoDetect") {
					errorStr = error + ". " + getMessage("signOutAndIn");
				} else {
					errorStr = error;
				}
            }
            
            clearCloseWindowTimeout(true);
            
            showError(errorStr);
			//reject(error);
		});
        
        if (params.maybeHide) {
            if (params.keepInInboxAsRead) {
                $mail.removeClass("unread");
                updateUnreadCount(-1, $mail);
            } else {
                hideMail($mail, params.autoAdvance);
            }
        }
	});
}

function executeMailActionAndHide(mail, action, params = {}) {
    params.maybeHide = true;
    return executeMailAction(mail, action, params);
}

async function setContactPhoto(params, imageNode) {

	function setNoPhoto() {
		imageNode.attr("src", "images/noPhoto.svg");
		imageNode.addClass("noPhoto");
	}

	// contact photo
	const contactPhoto = await getContactPhoto(params);
    imageNode.attr("setContactPhoto", "true");
    
    if (params.useNoPhoto && !contactPhoto.realContactPhoto) {
        setNoPhoto();
    } else if (contactPhoto.photoUrl) {
        imageNode.on("error", function() {
            setNoPhoto();
        });
        
        // used timeout because it was slowing the popup window from appearing
        setTimeout(function() {
            if (imageNode.is(":visible")) {
                imageNode.attr("src", contactPhoto.photoUrl);
            }
        }, params.delay ? params.delay : 20);
    } else {
        if (params.useNoPhoto) {
            setNoPhoto();
        } else {
            var name;			
            if (params.name) {
                name = params.name;
            } else if (params.mail) {
                name = params.mail.getName();
            }
            
            var letterAvatorWord;
            if (name) {
                letterAvatorWord = name;
            } else {
                letterAvatorWord = params.email;
            }
            imageNode
                .removeAttr("fade")
                .attr("src", await letterAvatar(letterAvatorWord))
            ;
        }
    }
}

async function letterAvatar(name, color) {
	var colours = ["#1abc9c", "#2ecc71", "#3498db", "#9b59b6", "#34495e", "#16a085", "#27ae60", "#2980b9", "#8e44ad", "#2c3e50", "#f1c40f", "#e67e22", "#e74c3c", "#ecf0f1", "#95a5a6", "#f39c12", "#d35400", "#c0392b", "#bdc3c7", "#7f8c8d"];
	
	if (!name) {
		name = " ";
	}
	 
	var letter = name.charAt(0).toUpperCase();
	var letterCode = letter.charCodeAt();
	 
	var charIndex = letterCode - 64,
	    colourIndex = charIndex % 20;
	 
	var canvas;
	const CANVAS_XY = 256;
	if (typeof OffscreenCanvas != "undefined") {
		canvas = new OffscreenCanvas(CANVAS_XY, CANVAS_XY);
	} else if (typeof document != "undefined") {
		canvas = document.createElement("canvas");
		canvas.width = canvas.height = CANVAS_XY;
	}

	var context = canvas.getContext("2d");
	 
	if (color) {
		context.fillStyle = color;
	} else {
		context.fillStyle = colours[colourIndex];
	}
	context.fillRect (0, 0, canvas.width, canvas.height);
	context.font = "128px Arial";
	context.textAlign = "center";
	context.fillStyle = "#FFF";
	context.fillText(letter, CANVAS_XY / 2, CANVAS_XY / 1.5);
	
	return await getDataUrl(canvas);
}

function setPopupBgColor(color) {
	if (color) {
		addSkin({
			id: "background-color",
            css: `
                body:not(.background-skin) #inboxSection,
                body:not(.background-skin) #inboxSection app-header-layout #main-header-toolbar {
                    background-color: ${color};
                }
            `
		});
	}
}

function hideMail($mail, autoAdvance) {
	console.log("hideMail");
	var mail = $mail.data("mail");
	
	// commented because was choppy
	/*
	$(node).animate({
	    opacity: 0,
	    height: 0
	}, 2000, ["swing"], function() {
		$(node).remove();
		if ($(".mail").length == 0) {
			window.close();
		}
	});
	*/
	
	if (mail) {
		hiddenMails.push(mail.id);
	}
	
	var wasUnread = $mail.hasClass("unread");
	
	var onlyMailAndInPreview = false;
	/*
	 * commented because we added an undo notification that we wanted to be show before closing
	// if in open email view and it's the only mail left then just close window with no animation 
	if ($(".mail").length == 1 && document.querySelector('neon-animated-pages').selected == 1) {
		onlyMailAndInPreview = true;
	}
	*/
	
	if (!onlyMailAndInPreview) {
		$mail
			// queue=false so they run immediately and together
			.slideUp({ duration: 'fast', queue: false })
			.fadeOut({ duration: 'fast', queue: false, always:function() {
                // preserve account before removing $mail below
                const $account = $mail.closest(".account");
                $mail.remove();
                
                initAccountHeaderClasses($account);
				
				// had to wait till mail node was removed to init prev next buttons
				var openMail = getOpenEmail();
				if (openMail) {
					var $openMail = getMailNode(openMail);
					initPrevNextButtons($openMail);
				}
				
				if (mail) {
					console.log("pass exclude id: " + mail.title);
				}
				renderMoreAccountMails();
				
				if ($(".mail").length == 0) {
					closeWindow({source:"!onlyMailAndInPreview", delay:seconds(2)});
				}
			}})
		;
	}

    // for notifications
    sendMessageToBG("hideMailTriggeredInPopup");
	
	if (wasUnread) {
        updateUnreadCount(-1, $mail);
	}
	
	if (onlyMailAndInPreview) {
		closeWindow({source:"onlyMailAndInPreview"});
	} else {
		if (autoAdvance) {
			autoAdvanceMail($mail);
		}
	}
}

function getAccountAvatar(account) {
	var $retAccountAvatar;
	
	$(".accountAvatar").each(function() {
		const $accountAvatar = $(this);
		if ($accountAvatar.data("account").id == account.id) {
			//setAvatarUnreadCount($accountAvatar, unreadCount);
			$retAccountAvatar = $accountAvatar;
			return false;
		}
	});
	
	return $retAccountAvatar;
}

function setUnreadCountLabels($account) {
	var account = $account.data("account");
	var $unreadCount = $account.find(".unreadCount");
	let unreadCount = $unreadCount.data("count");
	if (unreadCount == undefined) {
        unreadCount = account.unreadCount;
	}
	
	if (unreadCount >= 1) {
		$account.addClass("hasUnread");
		$unreadCount
			.text("(" + unreadCount + ")")
			.show()
		;
	} else {
		$account.removeClass("hasUnread");
		$unreadCount.hide();
	}
	
	var $accountAvatar = getAccountAvatar(account);
	
	if ($accountAvatar) {
		setAvatarUnreadCount($accountAvatar, unreadCount);
	}
}

async function setAccountAvatar($account, $accountAvatar) {
	var account = $accountAvatar.data("account");
	var $accountPhoto = $accountAvatar.find(".accountPhoto");
	
	var profileInfo = await account.getSetting("profileInfo");
	if (profileInfo) {
		setTimeout(function() {
			$account.find(".accountPhoto").attr("src", profileInfo.imageUrl);
			$accountPhoto.attr("src", profileInfo.imageUrl);
		}, 20);
	} else {
		$account.find(".accountPhoto").hide();
		
		var color;
		if (await account.getSetting("accountColor") == "transparent") {
			color = "#ccc";
		} else {
			color = await account.getSetting("accountColor");
        }
        const emailDisplayName = await account.getEmailDisplayName();
		$accountPhoto.attr("src", await letterAvatar(emailDisplayName, color));
	}
}

function setAvatarUnreadCount($accountAvatar, unreadCount) {
	var account = $accountAvatar.data("account");
	let $unreadCount = $accountAvatar.find(".accountAvatarUnreadCount");
	if (unreadCount >= 1) {
		$unreadCount
			.text(unreadCount)
			.show();
		;
	} else {
		$unreadCount.hide();
	}
}

function updateUnreadCount(offset, $mail) {
	const $account = $mail.closest(".account");
	const account = $account.data("account");
    const $unreadCount = $account.find(".unreadCount");
    console.log($account, account, $unreadCount)
	let unreadCount = $unreadCount.data("count");
	if (unreadCount == undefined) {
		unreadCount = account.unreadCount;
	}
	unreadCount += offset;
	
	$unreadCount.data("count", unreadCount);
	
	setUnreadCountLabels($account);

    // update background unreadcount because it was out of sync after marking an email as read (since we don't poll immedaitely after), the count will be temporary because it will be overwritten on every poll
    ls["unreadCount"] = lsNumber("unreadCount") + offset;

    sendMessageToBG("updateBadge");
}

// try to sync highlight BOTH mail and openEmail stars
async function initStar($star, mail) {
	var $mail = getMailNode(mail);
	var $mailStar = $mail.find(".star");
	var $starNodes = $star.add($mailStar);
	
	if ($mailStar.attr("icon") == "star" || await mail.hasLabel(SYSTEM_STARRED)) {
		$starNodes.attr("icon", "star");
	} else {
		$starNodes.attr("icon", "star-border");
	}
	
	$star
		.off()
		.click(function(event) {
			if ($(this).attr("icon") == "star") {
                $starNodes.attr("icon", "star-border");
                executeMailAction(mail, "removeStar");
			} else {
                $starNodes.attr("icon", "star");
                executeMailAction(mail, "star");
			}
			return false;
		})
	;
}

function setContactPhotos(accounts, $mailNodes) {
	return ensureContactsWrapper(accounts).then(function() {
		$mailNodes.each(function(index, mailNode) {
			var mail = $(mailNode).data("mail");
			if (mail) {
				// photo
				var $imageNode = $(this).find(".contactPhoto");
				
				// if not already set
				if (!$imageNode.attr("setContactPhoto")) {
					// function required to keep imageNode in scope
					setContactPhoto({mail:mail}, $imageNode);
				}
			}
		});
	});
}

function openMailInBrowser(mail, event) {
	const openParams = {
        actionParams: {}
    };
	if (isCtrlPressed(event) || event.which == 2) {
		openParams.actionParams.openInBackground = true;
    }
    executeMailAction(mail, "open", openParams);
	if (!openParams.actionParams.openInBackground) {
		setTimeout(() => {
			closeWindow({ source: "openMailInBrowser" });
		}, 100);
	}
}

function openDialogWithSearch($dialog, $search, $selectionsWrapper, $selections) {
	setTimeout(function() {
		openDialog($dialog).then(function(response) {
			// because i DID NOT set autoCloseDisabled="true" then the .close happens automatically
		}).catch(function(error) {
			// on close
			showError("error: " + error);
		});
		$dialog.on("iron-overlay-opened", () => {
			$search
				.val("")
				.focus()
				.css("opacity", 1)
				.keyup(function(e) {
					if (e.key == "ArrowDown") {
						$selectionsWrapper.focus();
						return false;
					} else {
						var str = $(this).val().toLowerCase();
						$selections.each(function() {
							if ($(this).text().trim().toLowerCase().includes(str)) {
								$(this).removeAttr("hidden");
								$(this).removeAttr("disabled");
							} else {
								$(this).attr("hidden", "");
								$(this).attr("disabled", "");
							}
						});
					}
				})
			;
			$search.focus();
		});
	}, 1);
}

function initOpenEmailEventListeners() {
	
	$("#back").click(function() {
		openInbox();
	});

	$("#openEmailSection").click(function(e) {
		if (e.button == 3) { // Back button on mouse, ref: https://jasonsavard.com/forum/discussion/3405/hotkey-improvement
			openInbox();
		}
	});

	$("#prevMail").click(function() {
		if ($(this).hasClass("visible")) {
			const mail = getOpenEmail();
			const $mail = getMailNode(mail);
			
			openPrevMail($mail);
		}
	});

	$("#nextMail").click(function() {
		if ($(this).hasClass("visible")) {
			const mail = getOpenEmail();
			const $mail = getMailNode(mail);
	
			openNextMail($mail);
		}
	});

	$("#archive").click(function() {
        executeMailActionAndHide(getOpenEmail(), "archive", {autoAdvance:true});
	});

	$("#delete").click(function() {
		const mail = getOpenEmail();
        executeMailActionAndHide(mail, "deleteEmail", {autoAdvance:true});
		showUndo({mail:mail, text:getMessage("movedToTrash"), undoAction: "untrash"}).then(function() {
			openEmail({mail:mail});
		});
	});

	$("#markAsRead, #markAsUnread").click(function() {
		const mail = getOpenEmail();
		const $mail = getMailNode(mail);

		if ($(this).attr("id") == "markAsRead") {
            executeMailActionAndHide(mail, "markAsRead", {autoAdvance:true});
			showUndo({mail:mail, text:getMessage("markedAsRead"), undoAction: "markAsUnread"}).then(function() {
				openEmail({mail:mail});
			});
		} else { // mark as UNread
			openInbox();
            
            executeMailAction(mail, "markAsUnread");
			$mail.addClass("unread");
			updateUnreadCount(+1, $mail);
		}
	});

	$("#addToGoogleCalendar").click(function() {
		var mail = getOpenEmail();
		var $mail = getMailNode(mail);
		
		var newEvent = {};
		newEvent.allDay = true;
		newEvent.summary = mail.title;
		//newEvent.source = {title:mail.title, url:mail.getUrl()};
		newEvent.description = mail.getUrl() + "\n\n" + mail.messages.last().content.htmlToText(); //mail.getLastMessageText();
		
		console.log("newEvent", newEvent);
		
		sendMessageToCalendarExtension({action:"generateActionLink", eventEntry:JSON.stringify(newEvent)}).then(function(response) {
			console.log("response: ", response);
			if (response && response.url) {
				openUrl(response.url);
			} else if (response && response.error) {
				showError(response.error);
			} else {
				// not supported yet
				openGenericDialog({
					title: "Not supported yet",
					content: "The extension Checker Plus for Google Calendar is required.<br>But your version does not currently support this feature.",
					showCancel: true,
					okLabel: "Update extension"
				}).then(function(response) {
					if (response == "ok") {
						openUrl("https://jasonsavard.com/wiki/Extension_Updates");
					}
				})
			}
		}).catch(response => {
			// not installed or disabled
			hideSaving();
			
			requiresCalendarExtension("addToGoogleCalendar");
		});

	});

	$("#moveLabel").click(function() {
		var mail = getOpenEmail();
		var $mail = getMailNode(mail);

		var $moveLabelDialog = initTemplate("moveLabelDialogTemplate");
		
		showLoading();
		mail.account.getLabels().then(async labels => {
			hideLoading();
			
			//$("#moveLabelTemplate")[0].labels = labels;
			// labels
			var labelsTemplate = $moveLabelDialog.find("#moveLabelTemplate")[0];
			var $moveLabels = $moveLabelDialog.find("#moveLabels");
			//$moveLabels.find(".moveLabel").remove();
			$moveLabels.find(".moveLabel").each(function() {
				this.parentNode.removeChild(this);
			});
			
			// shallow copy
			var labels = labels.slice(0);

			if (await storage.get("accountAddingMethod") == "oauth") {
				// Add categories at end of dropdown
				labels.push({id:GmailAPI.labels.CATEGORY_PERSONAL, name:getMessage("primary")});
				labels.push({id:GmailAPI.labels.CATEGORY_SOCIAL, name:getMessage("social")});
				labels.push({id:GmailAPI.labels.CATEGORY_PROMOTIONS, name:getMessage("promotions")});
				labels.push({id:GmailAPI.labels.CATEGORY_UPDATES, name:getMessage("updates")});
				labels.push({id:GmailAPI.labels.CATEGORY_FORUMS, name:getMessage("forums")});
			}
			
			labels.forEach(labelObj => {
				var labelNode = document.importNode(labelsTemplate.content, true);
				//$moveLabels.append(labelNode);
				// FYI need to wrap paper-item with a paper-menu to capture up/down keys
				// patch: Must use Polymer dom append to insert node into paper-menu's shadow dom <div selected... ref: https://github.com/PolymerElements/paper-menu/issues/21
				var response = $moveLabels[0].appendChild(labelNode);
				var $label = $moveLabels.find(".moveLabel").last();
				
				$label
					.click(function() {
                        executeMailActionAndHide(mail, "moveLabel", {autoAdvance: true, actionParams: {newLabel:labelObj.id}}).then(() => {
							showMessage("Moved to " + labelObj.name);
						});
						$moveLabelDialog[0].close();
					})
				;
				$label.find(".labelText").text(labelObj.name);
				
			});
			
			openDialogWithSearch($moveLabelDialog, $("#moveLabelSearch"), $moveLabels, $(".moveLabel"));
		}).catch(error => {
			hideLoading();
			showError("error: " + error);
		});
		
	});
	
	$("#changeLabels").click(function() {
		var mail = getOpenEmail();
		var $mail = getMailNode(mail);

		var $changeLabelsDialog = initTemplate("changeLabelsDialogTemplate");
		
		showLoading();
		mail.account.getLabels().then(async labels => {
			hideLoading();
			
			var labelsTemplate = $changeLabelsDialog.find("#changeLabelTemplate")[0];
			var $changeLabelsWrapper = $changeLabelsDialog.find("#changeLabelsWrapper");
			//$changeLabelsWrapper.find(".labelWrapper").remove();
			$changeLabelsWrapper.find(".labelWrapper").each(function() {
				this.parentNode.removeChild(this);
			});
			
			// shallow copy
			var labels = labels.slice(0);

			if (await storage.get("accountAddingMethod") == "oauth") {
				// Add categories at end of dropdown
				labels.push({id:GmailAPI.labels.CATEGORY_PERSONAL, name:getMessage("primary")});
				labels.push({id:GmailAPI.labels.CATEGORY_SOCIAL, name:getMessage("social")});
				labels.push({id:GmailAPI.labels.CATEGORY_PROMOTIONS, name:getMessage("promotions")});
				labels.push({id:GmailAPI.labels.CATEGORY_UPDATES, name:getMessage("updates")});
				labels.push({id:GmailAPI.labels.CATEGORY_FORUMS, name:getMessage("forums")});
			}
            
            await asyncForEach(labels, async labelObj => {
				var labelNode = document.importNode(labelsTemplate.content, true);
				$changeLabelsWrapper[0].appendChild(labelNode);
				var $checkbox = $changeLabelsWrapper.find(".labelWrapper").last();
				$checkbox[0].checked = await mail.hasLabel(labelObj.id);
				
				$checkbox
					.on("change", function() {
						if ($checkbox[0].checked) {
                            // add label
                            executeMailAction(mail, "applyLabel", {actionParams: labelObj.id}).then(() => {
								showMessage(getMessage("labelAdded"));
							});
						} else {
                            // remove labels
                            executeMailAction(mail, "removeLabel", {actionParams: labelObj.id}).then(() => {
								showMessage(getMessage("labelRemoved"));
							});
						}
					})
				;
				//$checkbox.find("#checkboxLabel").text(labelObj.name);
				$checkbox[0].textContent = labelObj.name;
				
			});
			
			openDialogWithSearch($changeLabelsDialog, $("#changeLabelSearch"), $changeLabelsWrapper, $(".labelWrapper"));
		}).catch(error => {
			hideLoading();
			showError("error: " + error);
		});
		
	});
	
	$("#markAsSpam").click(function() {
        executeMailActionAndHide(getOpenEmail(), "markAsSpam", {autoAdvance: true});
	});

	$("#revertAutoSizing").click(function() {
		$("#openEmail").toggleClass("resized");
	});

	$("#translateMessage").click(async function() {
		var mail = getOpenEmail();
		openUrl("https://translate.google.com/#auto/" + await storage.get("language") + "/" + encodeURIComponent(mail.getLastMessageText()));
	});

	$("#listenToEmail").click(function() {
		var mail = getOpenEmail();
		var $mail = getMailNode(mail);

		showToast({toastId:"playingEmail", text:"Playing email...", duration:9999, actionParams:{
			text:       "Stop",
			onClick:    () => {
                chrome.runtime.sendMessage({command: "chromeTTS", stop:true});
                dismissToast($("#playingEmail"));
			}
		}});
        
        chrome.runtime.sendMessage({command: "chromeTTS", text:mail.getLastMessageText()}, response => {
            dismissToast($("#playingEmail"));
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                showError(chrome.runtime.lastError.message);
            }
        });
	});
	
	$("#openEmailInBrowser").click(function(event) {
		const mail = getOpenEmail();
		openMailInBrowser(mail, event);
		return false;
	});
	
	$("#openEmailClose").click(function() {
		closeWindow();
	});
	
	
	initOpenEmailEventListenersLoaded = true;
}

async function maxHeightOfPopup() {
	if (fromToolbar) {
		await zoomPromise;
        console.log("zoomfactor: " + zoomFactor);
        document.body.style.height = (MAX_POPUP_HEIGHT / zoomFactor) + "px";
	}
}

async function resizePopup() {
	console.log("resizePopup");
	if (fromToolbar) {
        const zoomFactor = await getZoomFactor();
        if (zoomFactor > 1 || popupView == POPUP_VIEW_TABLET) {
            maxHeightOfPopup();
        } else {
            if (accounts.length) {
                var allUnreadMails = getAllUnreadMail(accounts);
                
                var mailHeight;
                const displayDensity = await storage.get("displayDensity");
                if (displayDensity == "compact") {
                    mailHeight = 79;
                } else if (displayDensity == "cozy") {
                    mailHeight = 89;
                } else {
                    mailHeight = 107;
                }
                
                var newBodyHeight = HEADER_HEIGHT + (accounts.length * ACCOUNT_HEADER_HEIGHT) + (allUnreadMails.length * mailHeight) + FAB_HEIGHT + 25;
                if (newBodyHeight > MAX_POPUP_HEIGHT) {
                    newBodyHeight = MAX_POPUP_HEIGHT;
                }
                
                console.log("resizePopup2");
                // only need to set the height if it will be larger than exsiting, because we can't shrink the popup window - it will cause scrollbars
                if (document.body.clientHeight < newBodyHeight) {
                    // v2 removed timeout because of race issue with renderMoreAccountMails: the height of the window would be small when rendering and so not all emails would render
                    // v1 patch for mac issue popup clipped at top ref: https://bugs.chromium.org/p/chromium/issues/detail?id=428044
                    //setTimeout(() => {
                        console.info("setting height");
                        document.body.style.height = newBodyHeight + "px";
                    //}, 1); // tried 100, 150, then 250, back to 1 even for mac & pc
                }
            }
        }
	}
}

async function openEmail(params) {
    $("body").addClass("page-loading-animation");
    await polymerPromise2;
    $("body").removeClass("page-loading-animation");
    maxHeightOfPopup();
    
    if (params.mail) {
        try {
            await openEmailPromise(params);
            history.pushState({openEmail:true}, "", "#open-email");
        } catch (error) {
            logError(error);
            showError("error: " + error);
            throw error;
        }
    } else {
        const error = "Email might already be read!";
        showError(error);
        throw error;
    }
}

function initPrevNextButtons($mail) {
	var hasPrevMail = $mail.index(".mail") != 0;
	$("#prevMail").toggleClass("visible", hasPrevMail);
	var hasNextMail = $mail.index(".mail") < $(".mail").length - 1;
	$("#nextMail").toggleClass("visible", hasNextMail);
}

function processMessage(mail, $messageBody, index) {
	console.log("process message")
	if (accountAddingMethod == "oauth") {
		// must do this before interceptClicks
		var linkedText = Autolinker.link( $messageBody.html(), {
			stripPrefix : false,
		    replaceFn : function( autolinker, match ) {
		    	//console.log("match", match)
		        //console.log( "href = ", match.getAnchorHref() );
		        //console.log( "text = ", match.getAnchorText() );

		        switch( match.getType() ) {
		            case 'url' :
		                //console.log( "url: ", match.getUrl() );
		                
		                // if google.com do not prepend http:// to the text (of course to url is ok and mandatory)
		                if (!match.protocolUrlMatch) {
		                	var tag = autolinker.getTagBuilder().build( match ); 
		                	//console.log("fixing: " + match.matchedText);
		                	tag.setInnerHtml(match.matchedText);
		                	return tag;
		                }

		                /*
		                if( match.getUrl().indexOf( 'mysite.com' ) === -1 ) {
		                    var tag = autolinker.getTagBuilder().build( match );  // returns an `Autolinker.HtmlTag` instance, which provides mutator methods for easy changes
		                    //tag.setAttr( 'rel', 'nofollow' );
		                    //tag.addClass( 'external-link' );
		                    return tag;
		                } else {
		                    return true;  // let Autolinker perform its normal anchor tag replacement
		                }
		                */
		            /*
		            case 'email' :
		                var email = match.getEmail();
		                console.log( "email: ", email );

		                if( email === "my@own.address" ) {
		                    return false;  // don't auto-link this particular email address; leave as-is
		                } else {
		                    return;  // no return value will have Autolinker perform its normal anchor tag replacement (same as returning `true`)
		                }

		            case 'phone' :
		                var phoneNumber = match.getPhoneNumber();
		                console.log( phoneNumber );

		                return '<a href="http://newplace.to.link.phone.numbers.to/">' + phoneNumber + '</a>';

		            case 'twitter' :
		                var twitterHandle = match.getTwitterHandle();
		                console.log( twitterHandle );

		                return '<a href="http://newplace.to.link.twitter.handles.to/">' + twitterHandle + '</a>';

		            case 'hashtag' :
		                var hashtag = match.getHashtag();
		                console.log( hashtag );

		                return '<a href="http://newplace.to.link.hashtag.handles.to/">' + hashtag + '</a>';
		            */
		        }
		    }
		} );
		
		$messageBody.html( linkedText );
	}
	
	if (highlightDates && mail.messages.length == (index+1)) {
        console.time("DateTimeHighlighter");
        
        if (!window.loadedDateTimeHighlighter) {
            DateTimeHighlighter();
            window.loadedDateTimeHighlighter = true;
        }
		
		var highlighterDetails;
		
		// only parse if not too big or else it hangs
		// .html() can be null !!
		if ($messageBody && $messageBody.html() && $messageBody.html().length < 10000) {
			highlighterDetails = DateTimeHighlighter.highlight($messageBody.html(), function(myDateRegex) {
				console.log(myDateRegex);
				var obj = JSON.stringify(myDateRegex);
				obj = encodeURIComponent(obj);
				
				return "<a class='DTH' href='#' object=\"" + obj + "\">" + myDateRegex.match + "</a>";
			});
			console.log("highlighterDetails", highlighterDetails);
			console.timeEnd("DateTimeHighlighter");
		}
		
		if (highlighterDetails && highlighterDetails.matchCount) {
			$messageBody.html(highlighterDetails.highlightedText);
			$messageBody.find(".DTH").each(function() {
				var $tooltip = $("<paper-tooltip/>");
				$(this).append($tooltip);
				$tooltip.find("#tooltip").text(getMessage("addToGoogleCalendar"));
				$(this).click(function() {
					showSaving();
					var newEvent = $(this).attr("object");
					newEvent = decodeURIComponent(newEvent);
					newEvent = JSON.parse(newEvent);
					
					newEvent.summary = mail.title;
					newEvent.source = {title:mail.title, url:mail.getUrl()};
					newEvent.description = mail.messages.last().content;
					
					console.log("newEvent", newEvent);
					sendMessageToCalendarExtension({action:"createEvent", event:JSON.stringify(newEvent)}).then(function(response) {
						console.log("response: ", response);
						hideSaving();
						if (response && response.success) {
							// nothing
						} else if (response && response.error) {
							showError(response.error);
						} else {
							// not supported yet
							openGenericDialog({
								title: "Not supported yet",
								content: "The extension Checker Plus for Google Calendar is required.<br>But your version does not currently support this feature.",
								showCancel: true,
								okLabel: "Update extension"
							}).then(function(response) {
								if (response == "ok") {
									openUrl("https://jasonsavard.com/wiki/Extension_Updates");
								}
							});
						}
					}).catch(response => {
						// not installed or disabled
						hideSaving();
                        requiresCalendarExtension("dateTimeParsing");
					});
				})
			});
		}
	}

	// must do this after DateTimeHighlighter
	interceptClicks($messageBody.find("a:not(.DTH)"), mail);
	
	$(".showTrimmedContent").off().click(function() {
		$(this).next().slideToggle("fast");
	});

	$messageBody.data("processMessage", true);
}

function setMailMessage($openEmailMessages, mail, message) {
	if (!message.to) {
		message.to = [];
	}
	if (!message.cc) {
		message.cc = [];
	}
	if (!message.bcc) {
		message.bcc = [];
	}
	
	var messageTemplate = document.querySelector('#openEmailMessageTemplate');
	var messageNode = document.importNode(messageTemplate.content, true);
	
	$openEmailMessages.append(messageNode);
	var $message = $openEmailMessages.find(".message").last();
	
	$message.data("message", message);
	
	// sender
	$message.find(".openEmailSender")
		.text( mail.getName(message.from) )
		.attr("title", message.from.email )
	;

	getContact({ mail:mail }).then(contact => {
		if (!contact || !contact["gContact$groupMembershipInfo"]) { // gContact$groupMembershipInfo means probably added as a contact (not just recently emailed)
			$message.find(".openEmailSenderEmailAddress").text( "<" + message.from.email + ">");
		}
	});
	
	// date
	let dateStr;						
	if (message.date) {
		dateStr = message.date.displayDate({relativeDays: true, long: true});
		$message.find(".date").attr("title", message.date.toLocaleStringJ());
	} else {
        dateStr = message.dateStr;
    }

	$message.find(".date").text(dateStr);
	
	var $toCC = $("<span>").text(getMessage("to") + ": ");
	var $toCCFullDetails = $("<span>").text(getMessage("from").toLowerCase() + ": " + message.from.email).append("<br>");
	
	var firstTo = true;
	var firstCC = true;

	if (message.to.length) {
		$toCCFullDetails.append(getMessage("to") + ": ");
		$.each(message.to, function(index, to) {
			if (!firstTo) {
				$toCC.append(", ");
				$toCCFullDetails.append(", ");
			}
			firstTo = false;
			
			$toCC.append(pretifyRecipientDisplay(to, mail.account.getEmail()));
			$toCCFullDetails.append(pretifyRecipientDisplay(to, mail.account.getEmail(), true));
		});
	}
	
	if (message.cc.length) {
		if (message.to.length) {
			$toCCFullDetails.append("<br>");
		}
		$toCCFullDetails.append("cc: ");
		$.each(message.cc, function(index, cc) {
			if (!firstTo) {
				$toCC.append(", ");
			}
			firstTo = false;
			if (!firstCC) {
				$toCCFullDetails.append(", ");
			}
			firstCC = false;
			
			$toCC.append(pretifyRecipientDisplay(cc, mail.account.getEmail()));
			$toCCFullDetails.append(pretifyRecipientDisplay(cc, mail.account.getEmail(), true));
		});
	}
	
	if (message.bcc.length) {
		if (message.to.length || message.cc.length) {
            $toCC.append(", ");
			$toCCFullDetails.append("<br>");
        }
		$toCC.append("bcc: ");
		$toCC.append(pretifyRecipientDisplay(message.bcc.first(), mail.account.getEmail()));
        
		$toCCFullDetails.append("bcc: ", pretifyRecipientDisplay(message.bcc.first(), mail.account.getEmail(), true));
	}

	$message.find(".viewMessageDetails").click(function() {
		$message.find(".messageDetails").slideToggle("fast");
		return false;
	});
	
	$message.find(".to").empty().append($toCC);
	$message.find(".messageDetails").empty().append($toCCFullDetails);
	$message.find(".snippet").text(message.textContent.htmlToText());
	
	var $messageBody = $message.find(".messageBody");
	
	$messageBody.html(message.content);
	
	fixRelativeLinks($messageBody[0], mail);
	
	return $message;
}

function resizeMessageHeight() {
	console.log("resizeMessageHeight()")
	
	var $replyArea = $("#replyArea");
	//$("#openEmailSection #mainContainer").css("margin-bottom", ($replyArea.height() + ($replyArea.hasClass("clicked") ? 20 : 10) ) + "px");
	if ($replyArea.hasClass("clicked")) {
		setReplyAreaTop(($replyArea.height() + 22) + "px");
	} else {
		setReplyAreaTop("52px");
	}
}

function previewVideo(source) {
	var $dialog = initTemplate("videoDialogTemplate");
	var video = $("#videoDialog video")[0];
	
	video.src = source;
	video.load();
	video.play();
	
	$(video).off().click(function() {
		if (video.paused == false) {
			video.pause();
		} else {
			video.play();
		}
	});
	
	$dialog.off().on("iron-overlay-closed", function() {
		video.pause();
		video.currentTime = 0;
	});
	
	$dialog.find(".closeVideo").off().click(function() {
		$dialog[0].close();
	});
	
	openDialog($dialog);
}

function getReplyTextArea() {
	return $($("#replyTextareaWrapper")[0].textarea);
}

function setReplyAreaTop(value) {
	getShadowRoot("#openEmailSection app-header-layout").find("#contentContainer").css("margin-bottom", value);
}

function openEmailPromise(params) {
	return new Promise(function(resolve, reject) {

		const mail = params.mail;
		console.log("open email", mail);
		
		const $openEmailSection = initTemplate("openEmailSectionTemplate");

        // detect if already active or else causing incomplete transition when using back to inbox button
        if (!$("#openEmailSection").hasClass("active")) {
            $(".page").removeClass("active");
            $("#openEmailSection").addClass("active");
            $("#openEmailSection").one("transitionend", function(e) {
                // #openEmail must have a tabindex for this focus to work
                $("#openEmail").focus();
            });
        }

		setReplyAreaTop();

		resetOpenEmailScrollTop();

		$("#openEmail")
			.data("mail", mail)
			.addClass("resized")
		;
		
		$("#openEmail").toggleClass("facebook", mail.authorMail.includes("facebookmail.com"));
		
		$(".u-url").text(mail.getUrl());
		$(".openEmailSubject")
			.text(mail.title ? mail.title : "(" + getMessage("noSubject") + ")")
			.off()
			.click(function(e) {
				openMailInBrowser(mail, e);
			})
		;
		
		// labels
		const labelsTemplate = $("#openEmailLabelsTemplate")[0];
		const $labels = $("#openEmailLabels");
		$labels.find(".label").remove();
		
		const labels = mail.getDisplayLabels();
		labels.forEach(labelObj => {
			const labelNode = document.importNode(labelsTemplate.content, true);
			$labels.append(labelNode);
			const $label = $labels.find(".label").last();
			
			$label.find(".labelName").text(labelObj.name);

			if (labelObj.color) {
				$label.find(".labelName, .removeLabel").css({
					"color": labelObj.color.textColor,
					"background-color": labelObj.color.backgroundColor
				})
			}

			$label.find(".removeLabel").click(function() {
                executeMailAction(mail, "removeLabel", {actionParams: labelObj.id}).then(() => {
					showMessage(getMessage("labelRemoved"));
				});
				$label.remove();
			});
			
		});
		
		initStar($("#openEmail .star"), mail);

		let $attachmentIcon = $("#openEmail").find(".attachment-icon");
		if (mail.hasAttachments()) {
			$attachmentIcon.unhide();
		} else {
			$attachmentIcon.hidden();
		}

		var $mail = getMailNode(mail);
		
		$(".message").remove();
		$("#messageExpander").remove();
		
		$("#openEmailProgress").addClass("visible");
		
		mail.getThread({forceDisplayImages:mail.forceDisplayImages}).then(async response => {
            const mail = response;
            
            const lastAccountEmailPreviewDates = await storage.get("_lastAccountEmailPreviewDates");
            lastAccountEmailPreviewDates[mail.account.getEmail()] = new Date();
            storage.set("_lastAccountEmailPreviewDates", lastAccountEmailPreviewDates);

            const autoCollapseConversations = await storage.get("autoCollapseConversations");
            const alwaysDisplayExternalContent = await storage.get("alwaysDisplayExternalContent");
            const showSendAndArchiveButton = await storage.get("showSendAndArchiveButton");
            const showSendAndDeleteButton = await storage.get("showSendAndDeleteButton");
            const replyingMarksAsRead = await storage.get("replyingMarksAsRead")

			if (mail.messages.last()) {
				
				initPrevNextButtons($mail);
				
				var markAsReadSetting = await storage.get("showfull_read");
				if (markAsReadSetting) {
					$("#markAsRead").attr("hidden", true);
					$("#markAsUnread").removeAttr("hidden");
					if ($mail.hasClass("unread")) {
                        executeMailActionAndHide(mail, "markAsRead", {keepInInboxAsRead: true});
					}
				} else {
					if ($mail.hasClass("unread")) {
						$("#markAsRead").removeAttr("hidden");
						$("#markAsUnread").attr("hidden", true);
					} else {
						$("#markAsRead").attr("hidden", true);
						$("#markAsUnread").removeAttr("hidden");
					}
				}
				
				var $openEmailMessages = $("#openEmailMessages");
				var totalHiddenMessages = 0;
				
				mail.messages.forEach(function(message, messageIndex) {
					
					var mustCollapse = false;
					var mustHide = false;
					
					if (messageIndex < mail.messages.length-1) {
						// it's an email from this user, so ignore/collapse it
						if (message.from.email == mail.account.getEmail()) {
							mustCollapse = true;
						} else {
						   if (message.date) {
							   if (ls["_lastCheckedEmail"]) {
                                   const lastCheckedEmail = new Date(ls["_lastCheckedEmail"]);
								   // more than 24 hours collapse it before last "supposedly" user checked emails
								   if (message.date.diffInHours() <= -24 || message.date.diffInSeconds(lastCheckedEmail) < 0) {
									   mustCollapse = true;
								   }
							   } else {
								   // never last checked, might be first install or something so collapse all
								   mustCollapse = true;
							   }
						   } else {
							   // can't parse the dtes so let's only collapse last
							   mustCollapse = true;
						   }
						}
					}
					
					// hide middle messages
					if (mail.messages.length >=4 && messageIndex >= 1 && messageIndex < mail.messages.length-1) {
						// might not have been viewed yet (ie. not collapsed) so let's NOT hide it
						if (mustCollapse) {
							mustHide = true;
						}
					}
					
					// if should be hidden but user has clicked to expandMessages so don't hide them
					if (mustHide && (params.expandMessages || !autoCollapseConversations)) {
						mustHide = false;
					} 
					
					// for performance, let's not create hidden thread message nodes
					if (mustHide) {
						totalHiddenMessages++;
						if (totalHiddenMessages >= 2) {
							return;
						}
					}
					
					var $message = setMailMessage($openEmailMessages, mail, message);
					var $messageBody = $message.find(".messageBody");
					
					if (alwaysDisplayExternalContent) {
						// put back the imghidden to img (note: we had to manually change these when retreving the message to avoid fetching the images)
						var filteredHTML = $messageBody.html();
						if (filteredHTML.includes("<imghidden")) {
							showImages($messageBody);
						}
					} else {
						var externalContentHidden = false;

						if (!mail.forceDisplayImages) {
							$messageBody.find("img[src], imghidden[src], input[src]").each(function() {
								//var src = $(this).attr("src");
								//if (src && !src.match(MAIL_DOMAIN + "/")) {
									$(this).removeAttr("src");
									externalContentHidden = true;
								//}
							});

							$messageBody.find("*[background]").each(function() {
								$(this).removeAttr("background");
								externalContentHidden = true;
							});
							
							$messageBody.find("*[style*='background:'], *[style*='background-image:']").each(function() {
								var style = $(this).attr("style");
								style = style.replace(/background/ig, "backgroundDISABLED");
								$(this).attr("style", style);
								externalContentHidden = true;
							});
						} else if (mail.forceDisplayImages && accountAddingMethod == "oauth") {
							showImages($messageBody);
						}
						
						if (externalContentHidden) {
							showToast({toastId:"displayImages", text:"", duration:20, keepToastLinks:true});
							
							$("#displayImagesLink, #alwaysDisplayImages").off("click").on("click", async function(event) {
								
								// in autodetect - img is always converted to imghidden (refer to patch 101) so we must refetch the thread
								if (accountAddingMethod == "autoDetect") {
									mail.messages = [];
								}
								
								mail.forceDisplayImages = true;
								openEmail({mail:mail});
								
								if ($(this).attr("id") == "alwaysDisplayImages") {
									await storage.set("alwaysDisplayExternalContent", true);
								}
								
								dismissToast($(this));
							});
						}
					}
					
					if (mustCollapse && autoCollapseConversations) {
						$message.addClass("collapsed");
					}
					
					if (mustHide) {
						$message.addClass("hide");
					}
					
					// last message
					if (messageIndex == mail.messages.length-1) {
						// just do this for last message for now - optimize
						// for h-event microformat: identify last messages as summary
						$message.addClass("p-summary");
					} else {
						// previous messages
						$message.find(".messageHeader").click(function() {
							$message.toggleClass("collapsed");
							var $messageBody = $message.find(".messageBody");
							if (!$message.hasClass("collapsed") && !$messageBody.data("processMessage")) {
								setTimeout(function() {
									processMessage(mail, $messageBody, messageIndex);
								}, 1);
							}
						});
					}
					
					// if last child is block quote then hide else keep it
					$message.find("[class$=gmail_extra], blockquote:not(.gmail_quote):last-child").each(function(index, gmailExtra) { // blockquote[type='cite'], [class$=gmail_quote], blockquote:not(.gmail_quote)
						
						// this is possibly a real quote inside the body so ignore it
						//if (this.nodeName == "BLOCKQUOTE" && this.className && this.className.includes("gmail_quote")) {
							// continue loop
							//return true;
						//}
						
						var $trimmedContent = $(this);
						$trimmedContent.hide();
						var $elipsis = $("<div class='showTrimmedContent' title='Show trimmed content'>...</div>");
						/*
						$elipsis.click(function() {
							$trimmedContent.toggle();
						});
						*/
						$trimmedContent.before($elipsis);
						
						// if gmail_extra found then stop embedding any other ...
						if (this.className && this.className.includes("gmail_extra")) {
							return false;
						}
					});
					
					// auto-detect files
					$message.find(".att > tbody > tr").each(function() {
						var $soundImage = $(this).find("img[src*='sound']");
						if ($soundImage.length) {
							var soundSrc = $soundImage.parent().attr("href");
							// make sure it's from the google or we might be picking up random links that made it all the way to this logic
							if (soundSrc && soundSrc.includes("google.com")) {
								var $audio = $("<td><audio controls preload='metadata' style='margin:8px'><source/>Your browser does not support the audio element.</audio></td>");
								$audio.find("source").attr("src", soundSrc);
								$(this).append($audio);
							}
						} else if (/\.(mpg|mpeg|mp4|webm)\b/.test($(this).find("b").first().text())) {
							var videoSrc = $(this).find("a").first().attr("href");
							var $videoWrapper = $("<td class='videoWrapper'><video preload='metadata'></video><iron-icon class='videoPlayButton' icon='av:play-circle-outline'></iron-icon></td>");
							var $video = $videoWrapper.find("video");
							$video
								.attr("src", videoSrc)
								.on("loadedmetadata", function() {
									$videoWrapper.addClass("loaded");
								})
								.click(function() {
									previewVideo(videoSrc);
								})
							;
							$(this).append($videoWrapper);
						}
					});
					
					// manual files
					if (message.files && message.files.length) {
						
						var $attachmentsWrapper = $message.find(".attachmentsWrapper");

						message.files.forEach(function(file, fileIndex) {
							var contentDisposition = MyGAPIClient.getHeaderValue(file.headers, "Content-Disposition");
							// content id ex. "<image002.jpg@01CFC9BD.81F3BC70>"
							var contentId = MyGAPIClient.getHeaderValue(file.headers, "Content-Id");
							console.log("file", file);
							if (contentId) {
								// remove any < or > from start or end
								contentId = contentId.replace(/^</, "").replace(/>$/, "");
							}
							
							if (contentId && !/attachment\;/.test(contentDisposition)) {
								// means we have an inline image etc.
                                // see if we already queued this file for fetching
                                // we couldn't use attachmentid or even content id because they seemed always unique
								let queuedFile = mail.allFiles.find(allFile => allFile.filename == file.filename && allFile.size == file.body.size);
								
								// if not then added it to the queue
								if (!queuedFile) {
									queuedFile = mail.queueFile(message.id, file);
								}
								
								queuedFile.fetchPromise.then(function(response) {
									// $messageBody context is not lost because we are inside the loop function above... $.each(response.mail.messages, function(index, message)
									const blobUrl = generateBlobUrl(response.data, file.mimeType);
									
									$messageBody.find("img").each(function() {
										if ($(this).attr("src") && $(this).attr("src").includes(FOOL_SANITIZER_CONTENT_ID_PREFIX + contentId)) {
											$(this).attr("src", blobUrl); // "data:" + file.mimeType + ";base64," + response.data
										}
									});
								}).catch(error => {
									console.error("error in fetchpromise", error);
									$messageBody.find("img").replaceWith("<span>Error loading image: " + error + "</span>");
								});
							} else {
								const attachmentTemplate = $('#attachmentTemplate')[0];
								const attachmentTemplateNode = document.importNode(attachmentTemplate.content, true);
								
								$attachmentsWrapper.append(attachmentTemplateNode);
								const $attachmentDiv = $attachmentsWrapper.find(".attachment").last();
								
								var attachmenutImageUrl;
								var attachmentType;
								if (file.mimeType && file.mimeType == "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
									attachmenutImageUrl = "/images/driveIcons/word.png";
								} else if ((file.mimeType && file.mimeType == "application/pdf") || file.filename.includes(".pdf")) {
									attachmenutImageUrl = "/images/driveIcons/pdf.png";
									attachmentType = "pdf";
								} else if (file.mimeType && file.mimeType.includes("audio/")) {
									attachmenutImageUrl = "/images/driveIcons/audio.png";
									attachmentType = "audio";
								} else if (file.mimeType && file.mimeType.includes("video/")) {
									attachmenutImageUrl = "/images/driveIcons/video.png";
									attachmentType = "video";
								} else if (file.mimeType && file.mimeType.includes("image/")) {
									attachmenutImageUrl = "/images/driveIcons/image.png";
									attachmentType = "image";
								} else if (file.mimeType && file.mimeType.includes("application/vnd.ms-excel")) {
									attachmenutImageUrl = "/images/driveIcons/excel.png";
								} else {
									attachmenutImageUrl = "/images/driveIcons/generic.png";
								}
								
								$attachmentDiv.find(".attachmentIcon")
									.attr("src", attachmenutImageUrl)
									.attr("title", file.mimeType)
								;
								$attachmentDiv.find(".filename").text(file.filename);
								
								$attachmentDiv.find(".downloadIcon").click(function(e) {
									showLoading();
									mail.account.fetchAttachment({messageId:message.id, attachmentId:file.body.attachmentId, size:file.body.size, noSizeLimit:true}).then(function(response) {
										hideLoading();
										downloadFile(response.data, file.mimeType, file.filename);
									}).catch(function(error) {
										console.error(error);
										showError(error);
									});
									
									e.preventDefault();
									e.stopPropagation();
								});
								
								$attachmentDiv.click(function() {
									showLoading();
									mail.account.fetchAttachment({messageId:message.id, attachmentId:file.body.attachmentId, size:file.body.size, noSizeLimit:true}).then(function(response) {
										hideLoading();
										
										if (attachmentType == "audio") {
											var $dialog = initTemplate("audioDialogTemplate");
											$("#audioDialog source")[0].src = "data:" + file.mimeType + ";base64," + response.data;

											var $audio = $dialog.find("audio");
											var audio = $audio[0];
											
											audio.load();
											audio.play();
											
											$dialog.off().on("iron-overlay-closed", function() {
												audio.pause();
												audio.currentTime = 0;
											});
											
											openDialog($dialog);
										} else if (attachmentType == "video") {
											previewVideo("data:" + file.mimeType + ";base64," + response.data);
										} else if (attachmentType == "pdf" || attachmentType == "image") {
											var blob = generateBlob(response.data, file.mimeType);
											saveToLocalFile(blob, file.filename).then(function(url) {
												openUrl(url);
											})
										} else {
											downloadFile(response.data, file.mimeType, file.filename);
										}
									}).catch(function(error) {
										console.error(error);
										showError(error);
									});
								});
							}
						});
						
						$attachmentsWrapper.removeAttr("hidden");
					}

					// set message photo
					var contactPhotoParams = $.extend({}, message.from);
					contactPhotoParams.mail = mail;
					var $imageNode = $message.find(".messageHeader .contactPhoto");
					setContactPhoto(contactPhotoParams, $imageNode);

				});
				
				var $hiddenMessages = $(".message.hide");
				if ($hiddenMessages.length) {
					var $expander = $("<div id='messageExpander'>");
					$expander.append( $("<div id='messagesHidden'>").text(totalHiddenMessages) );
					$expander.click(function() {
						$("#openEmailProgress").addClass("visible");
						// timeout required to show progress bar
						setTimeout(function() {
							openEmail({mail:mail, expandMessages:true});
						}, mail.messages.length < 10 ? 1 : 200); // smaller then 10 messages then no timeout needed 
					});
					$hiddenMessages.first().before($expander);
				}

				// reply area
				var $replyArea = $("#replyArea");
				
				// reset
				$replyArea.attr("hidden", true);
				
				function initReply() {
					$replyArea
						.removeClass("clicked")
						.removeClass("sending")
						.removeClass("sendingComplete")
					;
					
					$replyArea.find("#send").text(getMessage("send"));
					$replyArea.find("#sendAndArchive").empty().append(getMessage("send") + " + ", $("<iron-icon icon='archive'>") );
					$replyArea.find("#sendAndDelete").empty().append(getMessage("send") + " + ", $("<iron-icon icon='delete'>") );
					
					getReplyTextArea().val("");

					var totalRecipients = 0;
					if (mail.messages.last().to) {
						totalRecipients += mail.messages.last().to.length;
					}
					if (mail.messages.last().cc) {
						totalRecipients += mail.messages.last().cc.length;
					}
					
					if (totalRecipients <= 1) {
						$replyArea.removeAttr("replyAll");
						$("#replyPlaceholder").text(getMessage("reply"));
					} else {
						console.log("show reply all")
						$replyArea.attr("replyAll", true);
						$("#replyPlaceholder").text(getMessage("replyToAll"));
					}
				}
				
				initReply();

				$replyArea.off().click(function() {
                    console.log("replyTextarea clicked");
					if (!$replyArea.hasClass("clicked")) {
						$replyArea.addClass("clicked");
						getReplyTextArea().focus();
					}
				});

				// reply only to sender
				$("#replyOnlyToSender").off().click(function() {
					$replyArea.removeAttr("replyAll");
				});

				// reply only to sender
				$("#forward").off().click(function(event) {
					openMailInBrowser(mail, event);
					return false;
				});

				var replyObj;
				
				// MUST USE .off() for every event
				
				getReplyTextArea().off()
					.on("keyup", function(e) {
						resizeMessageHeight();
					})
					.on("keydown", function(e) {
						//console.log("keydown: ", e);
						if (isCtrlPressed(e) && e.key == "Enter" && !e.originalEvent.isComposing) {
							var $button;
							if (showSendAndArchiveButton) {
								$button = $("#sendAndArchive");
							} else if (showSendAndDeleteButton) {
								$button = $("#sendAndDelete");
							} else {
								$button = $("#send");
							}
							console.log("button focus click");
							
							$button
								.focus()
								.click()
							;
							return false;
						} else {
							return true;
						}
					})						
					.on("focus", {mail:mail}, async function(e) {
						console.log("focus")
						
						if ($replyArea.attr("replyAll")) {
							replyObj = await mail.generateReplyObject({replyAllFlag:true});
							console.log(replyObj);
							
							$("#replyTo").empty().append(getMessage("to") + " ");

							var firstTo = true;
							$.each(replyObj.tos, function(index, to) {
								if (!firstTo) {
									$("#replyTo").append(", ");
								}
								firstTo = false;
								$("#replyTo").append( pretifyRecipientDisplay(to, mail.account.getEmail()) );
							});
							
							$.each(replyObj.ccs, function(index, cc) {
								if (!firstTo) {
									$("#replyTo").append(", ");
								}
								firstTo = false;
								$("#replyTo").append( pretifyRecipientDisplay(cc, mail.account.getEmail()) );
							});
						} else {
							replyObj = await mail.generateReplyObject();
							console.log("replyobj", replyObj);
							$("#replyTo").empty().append( getMessage("to") + " ", pretifyRecipientDisplay(replyObj.tos[0]) );
						}
						
						$replyArea.addClass("clicked");
						replyingToMail = mail;
						
						resizeMessageHeight();
						
						clearInterval(autoSaveInterval);
						autoSaveInterval = setInterval(function() {
							autoSave();
						}, seconds(3));
					})
					.on("blur", {mail:mail}, function(e) {
						console.log("blur", e);
						
						if (!$replyArea.hasClass("sendingComplete") && !getReplyTextArea().val()) {
							// if button is clicked inside reply area (ie Send) then don't reset reply area
							if (e.relatedTarget && e.relatedTarget.nodeName == "PAPER-BUTTON" && $(e.relatedTarget).closest("#replyArea").length) {
								// do nothing
							} else {
								initReply();
							}

							clearInterval(autoSaveInterval);
							autoSave();
						}
						
						resizeMessageHeight();
					})
				;
				
				if (showSendAndArchiveButton) {
					$replyArea.find("#sendAndArchive").removeAttr("hidden");
				} else {
					$replyArea.find("#sendAndArchive").attr("hidden", true);
				}

				if (showSendAndDeleteButton) {
					$replyArea.find("#sendAndDelete").removeAttr("hidden");
				} else {
					$replyArea.find("#sendAndDelete").attr("hidden", true);
				}

				$replyArea.find("#send, #sendAndArchive, #sendAndDelete").off().click(function(e) {
					// save this varirable because apparently e.data was being lost inside callback of .postReply just below??
					const $sendButtonClicked = $(this);
					const sendAndArchive = $sendButtonClicked.attr("id") == "sendAndArchive";
					const sendAndDelete = $sendButtonClicked.attr("id") == "sendAndDelete";
					
					const replyMessageText = getReplyTextArea().val();
					
					$replyArea.addClass("sending");
					
					// use Polymer.dom because in Firefox the paper-spinner was not instantianting
					$sendButtonClicked[0].innerHTML = "<paper-spinner class='white' active></paper-spinner>";
					
                    const postReplyParams = {
                        actionParams: {
                            message: replyMessageText,
                            replyAllFlag: $replyArea.attr("replyAll"),
                            markAsRead: replyingMarksAsRead && $mail.hasClass("unread")
                        }
                    }

                    executeMailAction(mail, "postReply", postReplyParams).then(response => {
						$replyArea.removeClass("sending");
						
						if (sendAndArchive) {
                            executeMailAction(mail, "archive");
						} else if (sendAndDelete) {
                            executeMailAction(mail, "deleteEmail");
						}
						
						// append message to top
						const newMessage = {
                            alreadyRepliedTo: true,
                            from: {
                                name: getMessage("me"),
                                email: mail.account.getEmail()
                            },
                            date: new Date(),
                            to: replyObj.tos,
                            cc: replyObj.ccs,
                            textContent: replyMessageText,
                            content: convertPlainTextToInnerHtml(replyMessageText) // htmltotext because we didn't want <script> or other tags going back into the content
                        };
						
						mail.messages.push(newMessage);
						
						const $message = setMailMessage($openEmailMessages, mail, newMessage);
						
						$message.find(".contactPhoto").attr("src", $replyArea.find(".contactPhoto").attr("src"));

						resizeMessageHeight();
						
						// scroll to bottom
						getOpenEmailScrollTarget().scrollTop = getOpenEmailScrollTarget().scrollHeight;
						
						showMessage(getMessage("sent"));
						
						// this timeout MUST happen BEFORE the next timeout below for hiding the emails
						setTimeout(function() {
							// place this in a timeout to ensure autoSave is removed before it is added on blur event
							console.log("autoSave remove: " + new Date());
							clearInterval(autoSaveInterval);
							storage.remove("autoSave");
						}, 200);

						setTimeout(function() {
							if (replyingMarksAsRead) {
								if ($mail.hasClass("unread")) {
									let keepInInboxAsRead;
									let autoAdvance;
									if (sendAndArchive || sendAndDelete) {
										keepInInboxAsRead = false;
										autoAdvance = true;
									} else {
										keepInInboxAsRead = true;
										autoAdvance = false;
                                    }
                                    if (keepInInboxAsRead) {
                                        $mail.removeClass("unread");
                                        //updateUnreadCount(-1, $mail);
                                    } else {
                                        hideMail($mail, autoAdvance);
                                    }
									$("#markAsRead").attr("hidden", true);
									$("#markAsUnread").removeAttr("hidden");
								} else {
									if (sendAndArchive || sendAndDelete) {
										hideMail($mail, true);
									}
								}
							}
						}, 1000);
						
						initReply();
						
					}).catch(error => {
						$replyArea.removeClass("sending");
						$replyArea.find("#send").text(getMessage("send"));
						if (error && error.sessionExpired) {
							showError("There's a problem. Save your reply outside of this extension or try again.");
						} else {
							showError(error);
						}
					});
				});
				
				$replyArea.removeAttr("hidden");
				
				// need extra time especially when loading email via notification popup click
				setTimeout(function() {
					resizeMessageHeight();
				}, 100)

				// set message photo, use profile first, else use contacts
				var $imageNode = $replyArea.find(".contactPhoto");
				var profileInfo = await mail.account.getSetting("profileInfo");
				if (profileInfo && profileInfo.imageUrl) {
					$imageNode.attr("src", profileInfo.imageUrl);
				} else {
					var contactPhotoParams = $.extend({}, {useNoPhoto:true, email:mail.account.getEmail()});
					contactPhotoParams.mail = mail;
					setContactPhoto(contactPhotoParams, $imageNode);
				}
			} else {
				// happens sometimes if a single message from the thread was deleted (ie. using "Delete this message" from dropdown on the right of message in Gmail)
				const error = "Problem retrieving message, this could happen if you deleted an individual message!";
				showError(error, {
					text:"Disable conversation view",
					onClick:function() {
						openUrl("https://jasonsavard.com/wiki/Conversation_View_issue?ref=problemRetrievingMessage");
					}
				});
				logError(error);
				reject(error);
			}
			
			// need just a 1ms timeout apparently so that transitions starts ie. core-animated-pages-transition-prepare before detecting it
			setTimeout(function() {
				// wait for certain events before processing message
				new Promise(function(resolve, reject) {
					// already there so let's process message
					setTimeout(function() {
						resolve();
					}, 300);
				}).then(function() {
					$(".message:not(.collapsed) .messageBody").each(function(index) {
						if (!$(this).data("processMessage")) {
							processMessage(mail, $(this), index);
						}
					});
					renderMoreAccountMails({mailsToRender:1});
				});
				
			}, 1);
			
			$("#openEmailProgress").removeClass("visible");
		}).catch(error => {
            showError(error + ", please try again later!");
            console.trace(error);
			logError("error in getThread: " + error);
			reject(error);
		});
		
		if (!initOpenEmailEventListenersLoaded) {
			initOpenEmailEventListeners();
		}
		
		$("#archive").attr("icon", "archive");
		
		resolve();
		
	});		
}

function observe($node, className, processor) {
	if ($node) {
		var observer = new MutationObserver(function(mutations) {
			//console.log("mutation", mutations);
			mutations.forEach(function(mutation) {
				for (var a=0; a<mutation.addedNodes.length; a++) {
					if (mutation.addedNodes[a].className && mutation.addedNodes[a].className.hasWord && mutation.addedNodes[a].className.hasWord(className)) {
						processor(mutation.addedNodes[a]);
					}
				}
			});    
		});
		
		var config = { childList: true, subtree:true };
		observer.observe($node[0], config);
	}
}

function autoSave() {
	var $replyArea = $("#replyArea");
	var replyAll = $replyArea.attr("replyAll");
	var message = getReplyTextArea().val();
	if (message) {
		console.log("autosave set: " + new Date());
		storage.set("autoSave", {mailId:replyingToMail.id, replyAll:replyAll, message:message});
	}
}

chrome.runtime.onConnect.addListener(function(port) {
	$(document).ready(function() {
		
		tabletFramePort = port;
		if (tabletFramePort.name == "popupWindowAndTabletFrameChannel") {
			console.log("onconnect")
			
			if (window.darkTheme) {
				tabletFramePort.postMessage({action: "invert"});
			}
			
			tabletFramePort.onMessage.addListener(function(message) {
				console.log("onMessage: " + message.action);
				if (message.action == "tabletViewUrlChanged") {
					storage.set("tabletViewUrl", message.url);
					showSelectedTab(message.url);
				} else if (message.action == "getCurrentEmail") {
					console.log("current email in popup: " + message.email);
					if (message.email && message.email != currentTabletFrameEmail) {
						initTabs(message.email);
						currentTabletFrameEmail = message.email;
					}
				} else if (message.action == "reversePopupView") {
					reversePopupView();
				} else if (message.action == "openTabInBackground") {
					chrome.tabs.create({ url: message.url, active: false });
				}
			});
		}
		
	});
});

if (chrome.runtime.onMessage) {
	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		if (message.command == "profileLoaded") {
			refresh();
			showMessage(getMessage("profileLoaded"));
		} else if (message.command == "grantPermissionToContacts") {
			refresh();
			showMessage(getMessage("contactsLoaded"));
			niceAlert("You can also enable them in notifications:<br>Options > Notifications > Show Contact Photos");
		} else if (message.command == "closeWindow") {
            closeWindow(message.params);
        }
		sendResponse();
	});
}
	
if (chrome.runtime.onMessageExternal) {
	chrome.runtime.onMessageExternal.addListener(function(message, sender, sendResponse) {
		// MUST declare this same action "getEventDetails" in the backbround so that it does not sendresponse before we sendresponse here
		if (message.action == "getEventDetails") {
			var mail = getOpenEmail();
			if (mail) {
				const responseObj = {
                    title: mail.title,
                    description: mail.messages.last().content,
                    url: mail.getUrl()
				}
				console.log("sendreponse", responseObj)
				sendResponse(responseObj);
			} else {
				// no details
				sendResponse();
			}
		}
	});
}
		
function showImages($node) {
	var html = $node.html();
	html = html.replace(/<imghidden/g, "<img");
	html = html.replace(/\/imghidden>/g, "/img>");
	$node.html( html );
}

function resetOpenEmailScrollTop() {
	let openEmailScrollTarget = getOpenEmailScrollTarget();
	if (openEmailScrollTarget) {
		openEmailScrollTarget.scrollTop = 0;
	}
}

function getInboxScrollTarget() {
	return $("#inboxSection app-header-layout app-header")[0].scrollTarget;
}

function getOpenEmailScrollTarget() {
	if ($("#openEmailSection app-header-layout app-header").length) {
		return $("#openEmailSection app-header-layout app-header")[0].scrollTarget;
	}
}

function openInbox() {
	history.replaceState({openInbox:true}, "", "#inbox");
	$(".page").removeClass("active");
	$("#inboxSection").addClass("active");

	// need a slight pause or else the render would not work
	setTimeout(function() {
		renderMoreAccountMails();
	}, 10);
	
	setTimeout(function() {
		resetOpenEmailScrollTop();
	}, 100)
}

function getMailNode(mail) {
	let $node;
	
	$(".mail").each(function() {
		if ($(this).data("mail").id == mail.id) {
			$node = $(this);
			return false;
		}
	});
	
	if (!$node) {
        $(".mail").each(function() {
            if ($(this).data("mail").threadId == mail.id) {
                $node = $(this);
                return false;
            }
        });

        if (!$node) {
            // use $() to return empty jquery node if node is 
    		$node = $();
        }
	}
	return $node;
}

function getOpenEmail() {
	return $("#openEmail").data("mail");
}

function openPrevMail($mail) {
	console.log("openPrevMail");
	openOtherMail($mail, "prev");
}

function openNextMail($mail) {
	console.log("openNextMail");
	openOtherMail($mail, "next");
}

function openOtherMail($mail, direction) {
	console.log("openOtherMail");
	var $nextMail;
	var mailIndex = $mail.index(".mail");
	console.log("mailindex: " + mailIndex);
	
	if (direction == "prev" && mailIndex >= 1) {
		$nextMail = $(".mail").eq(mailIndex-1);
	} else if (direction == "next" && mailIndex+1 < $(".mail").length) {
		$nextMail = $(".mail").eq(mailIndex+1);
	}
    
    const mailAccount = $mail.data("mail") ? $mail.data("mail").account : null;
	if ($nextMail && $nextMail.data("mail").account && mailAccount && mailAccount.id == $nextMail.data("mail").account.id) {
		var nextMail = $nextMail.data("mail");
		openEmail({mail:nextMail});
	} else {
		if (!$mail.hasClass("unread") && $(".mail").length == 1) {
			console.log("in autoAdvanceMail before close");
			openInbox();
			// commented because seems the closeWindow is called via hideMail
			// MAKE SURE to use a delay before closing window or CPU issue - maybe!
			//closeWindow({source:"openOtherMail", delay:seconds(2)});
		} else {
			openInbox();
		}
	}
}

//auto-advance - find newest email
async function autoAdvanceMail($mail) {
    console.log("autoAdvanceMail");
    const autoAdvance = await storage.get("autoAdvance");
	if (autoAdvance == "newer") {
		openPrevMail($mail);
	} else if (autoAdvance == "older") {
		openNextMail($mail);
	} else {
		openInbox();
	}
}

function refresh(hardRefresh) {
	return new Promise((resolve, reject) => {
        showLoading();
        
        sendMessageToBG("refreshAccounts", hardRefresh).then(async () => {
            await initAllAccounts()
            resizePopup();

            // avoid null when fetching $account.data("account");
            clearTimeout(window.renderAccountsTimeout);
			window.renderAccountsTimeout = setTimeout(async () => {
				await renderAccounts();
				// must resolve inside timeout because we need to make sure renderAccounts (which is synchronous) is run before
				resolve();
			}, 50);
			hideLoading();
        });
	});
}

async function prepareMarkAllAsX($account, account, action) {
	var content;
	var tooManyAlternativeButton;
	var tooManyMarkAsX;
	if (action == "markAsRead") {
		content = getMessage("markAllAsReadWarning");
		tooManyAlternativeButton = getMessage("markAllAsReadTitle");
		tooManyMarkAsX = getMessage("readLinkTitle");
	} else if (action == "archive") {
		content = getMessage("archiveAllWarning");
		tooManyAlternativeButton = getMessage("archive");
		tooManyMarkAsX = getMessage("archive");
	}
	
	if (await storage.get("usedMarkAllAsReadButton")) {
        let markAllAsXFlag = false;
		if (account.unreadCount > MAX_EMAILS_TO_ACTION) {
			const $dialog = initTemplate("tooManyActionsTemplate");
			$dialog.find("#tooManyActionsDescription").text(getMessage("tooManyUnread", MAX_EMAILS_TO_ACTION));
			$dialog.find(".tooManyAlternative").text(tooManyAlternativeButton);
			$dialog.find(".tooManyMarkAsX").text(tooManyMarkAsX + " (" + MAX_EMAILS_TO_ACTION + ")");
            const response = await openDialog($dialog);
            if (response == "ok") {
                markAllAsXFlag = true;
            } else if (response == "cancel") {
                // nothing
            } else {
                openUrl("https://jasonsavard.com/wiki/Mark_all_unread_emails_as_read?ref=markAllAsReadDialog");
            }
		} else {
            markAllAsXFlag = true;
        }
        
        if (markAllAsXFlag) {
            showLoading();
            sendMessageToBG("markAllAsX", {account: account, action: action, closeWindow: true}, true).then(() => {
				refresh();
			}).catch(error => {
				showError(error);
			});
        }
	} else {
		openGenericDialog({
			title: "Warning",
			content: content,
			showCancel: true,
			okLabel: getMessage("continue")
		}).then(async response => {
			if (response == "ok") {
				await storage.setDate("usedMarkAllAsReadButton");
				$account.find(".markAllAsReadButton").click();
			}
		});
	}
}

function closeMenu(thisNode) {
	var node = $(thisNode).closest("paper-menu-button")[0];
	if (node) {
		node.close();
	}
}

function scrollAccountIntoView(accountDiv) {
	// forced to use jquery animate in Chrome 71 because was causing whole popout window to scroll
    if (true) { // DetectClient.isFirefox()
        $("#inboxSection app-drawer-layout").animate({
            scrollTop: $(accountDiv).position().top
        }, 100);

        // patch for inbox view
        $("#inboxSection app-header[slot='header']").animate({
            _scrollTop: $(accountDiv).position().top
        }, 100);
	} else {
		accountDiv.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
	}
}

function updateAccountHeaderColor(account, $account, newColor) {
	account.saveSetting("accountColor", newColor);
	
	$account.find(".accountHeader").css("background-color", newColor);
	
	var $accountAvatar = getAccountAvatar(account);
	setAccountAvatar($account, $accountAvatar);
}

function openComposeSection(params) {
	var voiceEmail = params.voiceEmail;
	var videoEmail = params.videoEmail;
	var account = params.account;
	
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
	
	if (accountAddingMethod == "autoDetect") {
		openGenericDialog({
			content: getMessage("switchToAddAccounts"),
			okLabel: getMessage("addAccount"),
			showCancel: true
		}).then(function(response) {
			if (response == "ok") {
				openUrl("options.html?ref=voiceEmailFromAutoDetectUser&highlight=addAccount#accounts");
			}
		});
		return;
	}
	
	$(".chip").remove();
	
	maxHeightOfPopup();
	
	var $composeSection = initTemplate("composeSectionTemplate");
	
	if (voiceEmail) {
		$(".recordSoundWrapper").show();
		$("#recordVideoWrapper").hide();
	} else {
		$(".recordSoundWrapper").hide();
		$("#recordVideoWrapper").hide();
	}
	
	$composeSection.off().click(function(e) {
		if (!$(e.target).closest(".acSuggestions").length) {
			console.log("Hiding suggestions because clicked away");
			$acSuggestions.hide();
		}
	})
	
	$("#composeBack").off().click(function() {
		// stop microphone and camera
		if (mediaStream) {
			mediaStream.getTracks().forEach(function(track) {
				track.stop();
			});
		}
		
		$(".page").removeClass("active");
		$("#inboxSection").addClass("active");
	});
	
	$(".contacts").off().click(function() {
		openUrl("https://contacts.google.com/u/" + account.id + "/");
	});

	$(".syncContacts").off().click(function() {
		showSaving();
		updateContacts().then(function() {
			showMessage(getMessage("done"));
		}).catch(error => {
			showError(error);
		}).then(function() {
			hideSaving();
		})
	});
	
	$composeSection.find(".close").off().click(function() {
		window.close();
	});

	function addChip($inputNode, $acSuggestions) {
		var $chip = $("<div class='chip layout horizontal center'><iron-image class='contactPhoto' sizing='cover' preload placeholder='/images/noPhoto.svg'></iron-image><span class='chipName'></span><iron-icon class='removeChip' icon='close'></iron-icon></div>");
		
		var name;
		var email;
		
		if ($acSuggestions.is(":visible") && $acSuggestions.find(".selected").length) {
			var chipData = $acSuggestions.find(".selected").data("data");
			name = chipData.name;
			email = chipData.email;
			$acSuggestions.hide();
		} else {
			email = $inputNode.val();
		}
		
		$chip.data("data", {name:name, email:email});
		
		var data = {account:account, name:name, email:email};
		setContactPhoto(data, $chip.find(".contactPhoto"));
		
		$chip.find(".chipName")
			.text(name ? name : email)
			.attr("title", email)
		;
		
		$chip.find(".removeChip").click(function() {
			$chip.remove();
			$("#composeTo").focus();
		});
		
		$(".chips").append($chip);
		$inputNode
			.val("")
			.attr("placeholder", "")
		;
	}
	
	var $fetchContacts = $("#fetchContacts");
	$fetchContacts.off().click(function() {
		chrome.permissions.request({ origins: [Origins.CONTACT_PHOTOS] }, granted => {
			if (granted) {
				oAuthForContacts.openPermissionWindow({email: account.getEmail()});
			}
		});
	});
	
	var MAX_SUGGESTIONS = 4;
	var MAX_SUGGESTIONS_BY_CLICK = 8;
	var performAutocomplete;
	var suggestions = [];
	var lastSuggestions = [];
	
	var $acSuggestions = $(".acSuggestions");
	var contacts = [];
	
	function addSuggestion(params) {
		var $acItem = $("<div class='acItem layout horizontal center'><iron-image class='contactPhoto' sizing='cover' preload placeholder='/images/noPhoto.svg'></iron-image><div class='acName'></div><div class='acEmail'></div></div>");
		
		$acItem
			.data("data", params)
			.mouseenter(function() {
				$acSuggestions.find(".selected").removeClass("selected");
				$(this).addClass("selected");
			})
			.mouseleave(function() {
				$(this).removeClass("selected");
			})
			.click(function() {
				addChip($("#composeTo"), $acSuggestions);
				$("#composeTo").focus();
			})
		;
		
		params.delay = 1; // I tried 100 before
		setContactPhoto(params, $acItem.find(".contactPhoto"));
		
		$acItem.find(".acName").text(params.name ? params.name : params.email.split("@")[0]);
		$acItem.find(".acEmail").text(params.email);
		$acSuggestions.append($acItem);
	}
	
	function showSuggestions() {
		suggestions.forEach(function(suggestion) {
			addSuggestion(suggestion);
		});
		lastSuggestions.forEach(function(suggestion) {
			addSuggestion(suggestion);
		});
		
		$acSuggestions.find(".acItem").first().addClass("selected");
		$acSuggestions.show();
	}
	
	function generateSuggestionDataFromContact(account, contact, emailIndex) {
		var email = contact.emails[emailIndex].address;
		var name = contact.name;
		var updated = contact.updatedDate;
		return { account: account, email: email, name: name, updated: updated };
	}
	
	// prefetch for speed
	getContacts({account:account}).then(thisContacts => {
        if (thisContacts) {
            contacts = thisContacts;
        }
    });
	
	$("#composeTo")
		.attr("placeholder", getMessage("to").capitalize())
		.off()
		.click(function() {
			suggestions = [];
			$acSuggestions.empty();
			contacts.every(function(contact, index) {
				if (index < MAX_SUGGESTIONS_BY_CLICK) {
					for (var b = 0; contact.emails && b < contact.emails.length; b++) {
						var suggestion = generateSuggestionDataFromContact(account, contact, b);
						if (contact.emails[b].primary) {
							suggestions.push(suggestion);
						}
					}
					return true;
				} else {
					return false;
				}
			});
			showSuggestions();
			return false;
		})
		.keydown(function(e) {
			//console.log("keydown", e);
			if (e.key == "Tab" || e.key == "Enter") {
				if ($(this).val()) {
					addChip($(this), $acSuggestions);
					return false;
				}
				performAutocomplete = false;
			} else if (e.key == "Backspace") {
				if ($(this).val() == "") {
					$(".chips").find(".chip").last().remove();
					performAutocomplete = false;
				} else {
					performAutocomplete = true;
				}
			} else if (e.key == "ArrowUp") {
				var $current = $acSuggestions.find(".selected");
				var $prev = $current.prev();
				if ($prev.length) {
					$current.removeClass("selected");
					$prev.addClass("selected");
				}
				performAutocomplete = false;
				return false;
			} else if (e.key == "ArrowDown") {
				var $current = $acSuggestions.find(".selected");
				var $next = $current.next();
				if ($next.length) {
					$current.removeClass("selected");
					$next.addClass("selected");
				}
				performAutocomplete = false;
				return false;
			} else {
				performAutocomplete = true;
			}
		})
		.keyup(function(e) {
			//console.log("keyup", e);
			
			if (performAutocomplete) {
				if (contacts.length) {
					suggestions = [];
					lastSuggestions = [];
					$acSuggestions.empty();
					if ($(this).val()) {
						var firstnameRegex = new RegExp("^" + $(this).val(), "i");
						var lastnameRegex = new RegExp(" " + $(this).val(), "i");
						var emailRegex = new RegExp("^" + $(this).val(), "i");
						var matchedContacts = 0;
						for (var a=0; a<contacts.length; a++) {
							var contact = contacts[a];
							var firstnameFound = firstnameRegex.test(contact.name);
							var lastnameFound;
							if (!firstnameFound) {
								lastnameFound = lastnameRegex.test(contact.name);
							}
							if (firstnameFound || lastnameFound) {
								if (contact.emails && contact.emails.length) {
									//console.log("contact", contact);
									matchedContacts++;
									for (var b = 0; b < contact.emails.length; b++) {
										var suggestion = generateSuggestionDataFromContact(account, contact, b);
										if (contact.emails[b].primary && firstnameFound) {
											suggestions.push(suggestion);
										} else {
											lastSuggestions.push(suggestion);
										}
									}
								}
							} else {
								if (contact.emails && contact.emails.length) {
									for (var b = 0; b < contact.emails.length; b++) {
										if (emailRegex.test(contact.emails[b].address)) {
											//console.log("contact email", contact);
											matchedContacts++;
											var suggestion = generateSuggestionDataFromContact(account, contact, b);
											if (contact.emails[b].primary && contact.name) {
												suggestions.push(suggestion);
											} else {
												lastSuggestions.push(suggestion);
											}
										}
									}
								}
							}
							
							if (matchedContacts >= MAX_SUGGESTIONS) {
								break;
							}
						}
						
						showSuggestions();
					} else {
						$acSuggestions.hide();
					}
				} else {
					$fetchContacts.show();
				}
			}
		})
	;
	
	$("#composeSubject")
		.off()
		.prop("value", voiceEmail ? getMessage("voiceMessage") : getMessage("videoMessage"))
		.focus(function() {
			if ($("#composeTo").val()) {
				addChip($("#composeTo"), $acSuggestions);
			}
		})
	;
	
	if (params.skipAnimation) {
		$(".page").addClass("disableTransition");
	}

	$(".page").removeClass("active");
	$("#composeSection").addClass("active");

	// my page transitions bugged if focus on an input was set during animation
	$("#composeSection").one("transitionend", function(e) {
		$("#composeTo").focus();
		$(".page").removeClass("disableTransition");
	});

	var mediaStream;
	var mediaRecorder;
	var chunks = [];
	var blob;
	var base64Data;
	
	var recorder;
	
	var AUDIO_CONTENT_TYPE = "audio/wav";
	var VIDEO_CONTENT_TYPE = "video/webm";
	
	var videoMimeTypeAndCodec;
	
	var $recordSoundWrapper = $(".recordSoundWrapper");
	var $recordSoundButton = $("#recordSoundButton");
	
	function ensureRecordingIsSaved(params = {}) {
		console.log("ensureRecordingIsSaved");

		return new Promise(function(resolve, reject) {
			
			if (voiceEmail) {
				if ($recordSoundWrapper.hasClass("recording")) {
					
					recorder.stop();
					
					recorder.exportWAV(function(blobFromExport) {
						blob = blobFromExport;
						blobToBase64(blob).then(function(response) {
							
							$recordSoundWrapper.find("source").attr("type", AUDIO_CONTENT_TYPE);
							$recordSoundWrapper.find("source")[0].src = response;
							
							base64Data = response;
							
							$recordSoundWrapper.removeClass("recording");
							$recordSoundWrapper.addClass("recordedSound");
							
							if (params.autoplay !== false) {
								$recordSoundWrapper.find("audio")[0].load();
								$recordSoundWrapper.find("audio")[0].play();
							}
							resolve();
							
						}).catch(error => {
							reject(error);
						});
					}, AUDIO_CONTENT_TYPE, 44100);
				} else {
					resolve();
				}
			} else {
				if ($recordVideoWrapper.hasClass("recording")) {
					
					mediaRecorder.stop();
					
					mediaRecorder.onstop = function(e) {

						/*
						mediaStream.getTracks().forEach(function(track) {
							track.stop();
						});
						*/
					
						blob = new Blob(chunks, { 'type' : VIDEO_CONTENT_TYPE });
				        video.muted = false;
						video.src = window.URL.createObjectURL(blob);
						video.srcObject = null;

				        $(video)
				        	.off()
				        	.click(function() {
				        		if (video.paused == false) {
				        			video.pause();
				        		} else {
				        			video.play();
				        		}
				        	})
				        	.on("playing", function() {
				        		if (!$recordVideoWrapper.hasClass("recording")) {
				        			$recordVideoWrapper.addClass("playing");
				        		}
				        	})
				        	.on("pause ended", function() {
				        		$recordVideoWrapper.removeClass("playing");
				        	})
				        	.mouseenter(function() {
				        		video.controls = true;
				        	})
				        	.mouseleave(function() {
				        		video.controls = false;
				        	})
				        ;
				        
			        	video.controls = true;

			        	blobToBase64(blob).then(function(response) {
			        		base64Data = response;
					        $recordVideoWrapper.removeClass("recording");
					        $recordVideoWrapper.addClass("recordedVideo");
					        resolve();
						}).catch(error => {
							reject(error);
						});
			        	
				    }
				} else {
					resolve();
				}
			}
			
		});
	}
	
	// Video stuff
	var $recordVideoWrapper = $("#recordVideoWrapper");
	var $recordVideoButton = $("#recordVideoButton");
	var mediaRecorder;
	var chunks;
	var video = $("#video")[0];
	
	/*
	navigator.mediaDevices.enumerateDevices().then(function(response) {
		console.log("devices", response);
	});
	*/
	
	var userMediaParams = {};
	if (voiceEmail) {
		userMediaParams.audio = true;
	} else {
		userMediaParams.audio = true;
		userMediaParams.video = { facingMode: "user" };
	}
	
	navigator.mediaDevices.getUserMedia(userMediaParams).then(stream => {
		mediaStream = stream;
		
		if (voiceEmail) {
			$recordSoundButton.off().on("click", function() {
				if ($recordSoundWrapper.hasClass("recording")) {
					ensureRecordingIsSaved().catch(function(error) {
						showError(error);
					});
				} else {
					var audio_context = new AudioContext;
					var input = audio_context.createMediaStreamSource(mediaStream);
				    // Uncomment if you want the audio to feedback directly
				    //input.connect(audio_context.destination);
				    //__log('Input connected to audio context destination.');
				    recorder = new Recorder(input, {numChannels:1}); // bufferLen: 1024, 
				    recorder.record();
					
					$recordSoundWrapper.addClass("recording");
				}
			});
		} else {
			// Video
			function initVideoStream() {
			    $recordVideoWrapper.removeClass("recordedVideo");
				
				video.srcObject = stream;
				video.muted = true;
				video.controls = false;
				video.play();
			}

			initVideoStream();
	        $(video)
	        	.off()
	        	.on("canplay", function() {
	        		$("#recordVideoWrapper").show();
	        	})
	        	.on("click", function() {
	        		$recordVideoButton.click();
	        	})
	        ;
			
			$recordVideoButton.off().click(function() {
				if ($recordVideoWrapper.hasClass("recording")) {
					ensureRecordingIsSaved({autoplay:false}).then(function() {
						// nothing
					}).catch(function(error) {
						showError(error);
					});
				} else {
					initVideoStream();
				    
					chunks = [];
					
					/*
					videoMimeTypeAndCodec = VIDEO_CONTENT_TYPE + ";codecs=vp9,opus"; // codes=vp9 was very slow while recording
					if (!MediaRecorder.isTypeSupported(videoMimeTypeAndCodec)) {
						videoMimeTypeAndCodec = VIDEO_CONTENT_TYPE + ";codecs=vp9";
						if (!MediaRecorder.isTypeSupported(videoMimeTypeAndCodec)) {
							videoMimeTypeAndCodec = VIDEO_CONTENT_TYPE;
						}
					}
					*/
					
					var options = {mimeType : VIDEO_CONTENT_TYPE}
					mediaRecorder = new MediaRecorder(stream, options);
					mediaRecorder.start();
					mediaRecorder.ondataavailable = function(e) {
						chunks.push(e.data);
					}
					mediaRecorder.onwarning = function(e) {
					    console.warn('mediarecord wraning: ' + e);
					};
					mediaRecorder.onerror = function(e) {
						console.error('mediarecord error: ' + e);
						throw e;
					};
				    
				    $recordVideoWrapper.addClass("recording");
				}
			});
		}
		
	}).catch(error => {
		console.error("media error", error);
		if (error.name == "PermissionDismissedError") {
			openGenericDialog({
				content: "You must grant access to use this feature.",
				okLabel: getMessage("grantAccess"),
				showCancel: true
			}).then(function(response) {
				if (response == "ok") {
					location.reload();
				}
			});
		} else if (error.name == "NotAllowedError" || error.name == "PermissionDeniedError") {
			if (isDetached) {
				if (location.href.includes("action=getUserMediaDenied") || location.href.includes("action=getUserMediaFailed")) {
					openGenericDialog({
						title: "You must grant access to use this feature",
						content: "Click the <iron-icon style='color:#aaa' icon='av:videocam'></iron-icon> icon <i>(On the right of the address bar near the star)</i><br>Select <b>Always allow ... </b> and reload the page."
					}).then(function(response) {
						if (response == "ok") {
							$($recordSoundButton).add($recordVideoButton).off().click(function() {
								openGenericDialog({
									content: "I assume you granted access now let's refresh the page",
									okLabel: getMessage("refresh")
								}).then(function(response) {
									if (response == "ok") {
										location.reload();
									}
								});
							});
						}
					});
				}
			} else {
				openUrl(getPopupFile() + "?action=getUserMediaDenied&mediaType=" + (voiceEmail ? "voiceEmail" : "videoEmail") + "&accountEmail=" + encodeURIComponent(account.getEmail()));
			}
		} else if (error.name == "MediaDeviceFailedDueToShutdown") {
			openUrl(getPopupFile() + "?action=getUserMediaDenied&mediaType=" + (voiceEmail ? "voiceEmail" : "videoEmail") + "&accountEmail=" + encodeURIComponent(account.getEmail()));
		} else {
			showError(error.name);
		}
	});
	
	function resetSending() {
		$("#composeSection").removeClass("sending");
		$("#sendComposeEmail").replaceWith( $("<paper-button id='sendComposeEmail' class='colored sendButton' raised>").text(getMessage("send")) );
	}
	
	resetSending();
	
	$("#sendComposeEmail")
		.off()
		.click(function() {
			if ($("#composeTo").val()) {
				addChip($("#composeTo"), $acSuggestions);
			}
			
			var tos = [];
			$(".chip").each(function() {
				tos.push( $(this).data("data") );
			});
			
			if (tos.length == 0) {
				openGenericDialog({
					content: "Please specify at least one recipient."
				});
				return;
			}
			
			if (((voiceEmail && !$recordSoundWrapper.hasClass("recording")) || (videoEmail && !$recordVideoWrapper.hasClass("recording"))) && !base64Data) {
				openGenericDialog({
					content: "You forgot to record a message."
				});
				return;
			}

			$("#composeSection").addClass("sending");
			this.innerHTML = "<paper-spinner class='white' active></paper-spinner>";

			ensureRecordingIsSaved({autoplay:false}).then(async function() {
				const sendEmailParams = {};
				if (await storage.get("donationClicked")) {
					sendEmailParams.tos = tos;
				} else {
					sendEmailParams.tos = [{email:account.getEmail()}];
				}
				sendEmailParams.subject = $("#composeSubject").val();
				
				sendEmailParams.htmlMessage = "";
				sendEmailParams.htmlMessage += "<span style='color:gray;font-size:90%'>To play this message:<br>Download file > Select a program > Choose <b>Google Chrome</b> or any other browser. <a href='https://jasonsavard.com/wiki/Opening_email_attachments?ref=havingTrouble'>Having trouble?</a></span><br><br>";
				sendEmailParams.htmlMessage += "Sent via Checker Plus for Gmail";
				
				sendEmailParams.attachment = {
                    filename: voiceEmail ? VOICE_MESSAGE_FILENAME_PREFIX + ".wav" : VIDEO_MESSAGE_FILENAME_PREFIX + ".webm",
                    contentType: voiceEmail ? AUDIO_CONTENT_TYPE : VIDEO_CONTENT_TYPE,
                    data: base64Data.split("base64,")[1]
                };
				if (voiceEmail) {
					sendEmailParams.attachment.duration = parseFloat($recordSoundWrapper.find("audio")[0].duration).toFixed(2);
				}
				
				sendGA('sendAttachment', 'start');
				
				if (!await storage.get("donationClicked") && await storage.get("_sendAttachmentTested")) {
					openContributeDialog("sendAttachment", true);
					resetSending();
				} else {
					// insert slight delay because seems sendEmail bottlenecks when sending large attachments
					setTimeout(async () => {
                        executeAccountAction(account, "sendEmail", {actionParams: sendEmailParams}).then(async () => {
							showMessage("Sent");
							
							if (!await storage.get("donationClicked")) {
								openContributeDialog("sendAttachment", true, "<i style='color:gray'>For testing this message will be sent to yourself at " + account.getEmail() + "</i>");
							}
							
							await storage.setDate("_sendAttachmentTested");
							setTimeout(function() {
								$("#composeBack").click();
							}, 1200);
							sendGA('sendAttachment', 'success');
						}).catch(error => {
                            console.error(error);
							openGenericDialog({
								title: error,
								content: "There was problem sending the email. Don't worry you can still download the message and attach it yourself in Gmail",
								okLabel: getMessage("download"),
								showCancel: true
							}).then(function(response) {
								if (response == "ok") {
									var url = window.URL.createObjectURL(blob);
						            var link = window.document.createElement('a');
						            link.href = url;
						            link.download = sendEmailParams.attachment.filename;
						            var click = document.createEvent("Event");
						            click.initEvent("click", true, true);
						            link.dispatchEvent(click);
								}
							});
							sendGA('sendAttachment', 'error', error);
						}).then(function() {
							resetSending();
						});					
					}, 1);
				}
			}).catch(error => {
				resetSending();
				showError(error);
			});
		})
	;
}

function initAccountHeaderClasses($account) {
    if ($account.find(".mail").length) {
        $account.addClass("hasMail");
    } else {
        $account.removeClass("hasMail");
    }
}

async function renderAccounts() {

    await cacheContactsData();

	var $inbox = $("#inbox");
	
	$inbox.find(".account").remove();
	$(".accountAvatar").remove();
	
	var accountAvatarTemplate = $("#accountAvatarTemplate")[0];
	var $accountAvatars = $("#accountAvatars");
    
    await asyncForEach(accounts, async (account, accountIndex, thisArray) => {

		if (accountIndex != 0 && accountIndex == (thisArray.length-1) && !account.hasBeenIdentified()) {
			console.error("has not been identified: " + account.getEmail());
		} else {
			var accountTemplate = document.querySelector('#accountTemplate');
			var accountNode = document.importNode(accountTemplate.content, true);
			
			$inbox.append(accountNode);
			var $account = $inbox.find(".account").last();
			
			initMessages($account.find("*"));
			
			$account.attr("email", account.getEmail());
			$account.data("account", account);
			
			var $accountErrorWrapper = $account.find(".accountErrorWrapper");
			//account.error = JError.ACCESS_REVOKED;
			if (account.error) {
				$accountErrorWrapper.removeAttr("hidden");
				$accountErrorWrapper.find(".accountError")
                    .empty()
                    .append(account.getError().niceError + " ", account.getError(true, $, document).$instructions)
					.attr("title", account.getError().niceError)
				;
				$accountErrorWrapper.find(".refreshAccount").click(function() {
					refresh();
				});
			} else {
				$accountErrorWrapper.attr("hidden", true);
			}
            
            const accountColor = await account.getSetting("accountColor");
            if (accountColor == DEFAULT_SETTINGS.accountColor) {
                $account.find(".accountHeader").attr("default-color", "true");
            }

			$account.find(".accountHeader").css("background-color", accountColor);
			
			$account.find(".accountTitleArea")
				.attr("title", getMessage("open"))
				.click(function(event) {
					const openParams = {};
					if (isCtrlPressed(event) || event.which == 2) {
						openParams.openInBackground = true;
                    }
                    executeAccountAction(account, "openInbox", {actionParams: openParams});
					closeWindow({source:"accountTitleArea"});
				})
			;
			
			$account.find(".markAllAsReadButton")
				.click(function() {
					prepareMarkAllAsX($account, account, "markAsRead");
				})
			;

			if (await storage.get("showArchiveAll")) {
				$account.find(".archiveAll")
					.unhide()
					.click(function() {
						prepareMarkAllAsX($account, account, "archive");
					})
				;
			}

			$account.find(".compose")
				.click(function() {
					// new: uing transport: 'beacon' ensures the data is sent even if window closes, old: using bg. because open compose closes this window and compose wasn't being registered in time
					sendGA('accountBar', 'compose', {transport: 'beacon'});
                    executeAccountAction(account, "openCompose");
					closeWindow();
				})
			;
			
			$account.find(".voiceEmail")
				.click(function() {
					openComposeSection({voiceEmail:true, account:account});
					sendGA('accountBar', 'voiceEmail');
				})
			;

			$account.find(".videoEmail")
				.click(function() {
					openComposeSection({videoEmail:true, account:account});
					sendGA('accountBar', 'videoEmail');
				})
			;

			$account.find(".search")
				.click(function() {
					$("html").addClass("searchInputVisible");
					$("#searchInput")
						.data("account", account)
						.focus()
					;
				})
			;
			
			$account.find(".accountOptionsMenuButton")
				.one("mousedown", async function() { // MUST use .one because mousedown will also be called when menu items *inside the dropdown all are also clicked
					
					$(this).closest(".accountHeader").removeClass("sticky");
					
					maxHeightOfPopup();
					var $accountOptions = initTemplate($(this).find(".accountOptionsMenuItemsTemplate"));
					
					$account.find(".markAllAsReadButton")
						.attr("title", getMessage("markAllAsRead"))
					;
					
					$account.find(".markAllAsRead")
						.click(function(event) {
							closeMenu(this);
							prepareMarkAllAsX($account, account, "markAsRead");
						;
					});
					
					$account.find(".sendPageLink")
						.click(event => {
							getActiveTab().then(tab => {
								sendGA("inboxLabelArea", "sendPageLink");
                                sendMessageToBG("sendPageLink", {tab: tab, account: account}, true);
								closeWindow({source: "sendPageLink"});
							});
						;
					});
	
					$account.find(".contacts")
						.click(function() {
							openUrl("https://contacts.google.com/u/" + account.id + "/");
						})
					;

					$account.find(".copyEmailAddress")
						.click(function() {
							$("#hiddenText")
								.val(account.getEmail())
								.focus()
								.select()
							;
							document.execCommand('Copy');
							showMessage(getMessage("done"));
							closeMenu(this);
						})
					;
	
					async function updateAlias(alias) {
						await account.saveSetting("alias", alias);
						$account.find(".accountTitle").text(await account.getEmailDisplayName());
					}
					
					$account.find(".alias")
						.click(async function() {
							closeMenu(this);
							if (await donationClicked("alias")) {
								var $dialog = initTemplate("aliasDialogTemplate");
								$dialog.find("#newAlias")
									.off()
									.attr("value", await account.getEmailDisplayName())
									.keydown(function(e) {
										if (e.key == 'Enter' && !e.originalEvent.isComposing) {
											updateAlias($dialog.find("#newAlias")[0].value);
											$dialog[0].close();
										}
									})
                                ;
                                try {
                                    const response = await openDialog($dialog);
                                    if (response == "ok") {
                                        updateAlias($dialog.find("#newAlias")[0].value);
                                    }
                                } catch (error) {
                                    showError("error: " + error);
                                }
							}
						})
					;
					$account.find(".colors")
						.click(async function() {
							closeMenu(this);
							if (await donationClicked("colors")) {
								var $dialog = initTemplate("colorPickerDialogTemplate");
								$dialog.find("paper-swatch-picker")
									.attr("color", await account.getSetting("accountColor"))
									.off().on("color-changed", e => {
										let color = e.originalEvent.detail.value;
										updateAccountHeaderColor(account, $account, color);
									})
								;
								openDialog($dialog);
							}
						})
					;
					
					var profileInfo = await account.getSetting("profileInfo");
					if (profileInfo) {
						$account.find(".setAccountIcon")
							.click(function() {
								account.deleteSetting("profileInfo");
								refresh();
							})
						;
						// little tricky here because we process the [msg] nodes with a call initMessages way below we must change the msg here or else it will be overwritten later
						$account.find(".setAccountIconLabel").attr("msg", "removeAccountIcon");
					} else {
						$account.find(".setAccountIcon")
							.click(async function() {
								closeMenu(this);
								if (await donationClicked("setAccountIcon")) {
                                    ls["emailAccountRequestingOauth"] = account.getEmail();
									oAuthForProfiles.openPermissionWindow({email: account.getEmail()});
								}
							})
						;
					}
					
					$account.find(".showContactPhotos")
						.click(function() {
							closeMenu(this);

							chrome.permissions.request({ origins: [Origins.CONTACT_PHOTOS] }, granted => {
								if (granted) {
									oAuthForContacts.openPermissionWindow({email: account.getEmail()});
								}
							});
						})
					;
					
					if (accounts.length <= 1) {
						$account.find(".ignore").hide();
					} else {
						$account.find(".ignoreAccountText").text( accountAddingMethod == "autoDetect" ? getMessage("ignoreThisAccount") : getMessage("removeAccount") );
						$account.find(".ignore").show();
					}
					$account.find(".ignore")
						.click(async function() {
                            showLoading();
                            await executeAccountAction(account, "remove");
                            
                            try {
                                await sendMessageToBG("pollAccounts", {showNotification:true});
                                location.reload();
                            } catch (error) {
                                showError(error);
                            } finally {
                                hideLoading();
                            }
						})
					;
					$account.find(".accountOptions")
						.click(function() {
							openUrl("options.html?ref=accountOptions&accountEmail=" + encodeURIComponent(account.getEmail()) + "#accounts")
						})
					;
				
					// must be last
					initMessages(".accountOptionsMenu *");

				})
			;

			// avatars
			var accountAvatarNode = document.importNode(accountAvatarTemplate.content, true);
			$accountAvatars.append(accountAvatarNode);
			var $accountAvatar = $accountAvatars.find(".accountAvatar").last();
			
			$accountAvatar
				.data("account", account)
				.attr("title", await account.getEmailDisplayName())
			;
			
            setAccountAvatar($account, $accountAvatar);
            
            // place this below setaccountavatar because of fouc when no avatar
			$account.find(".accountTitle").text(await account.getEmailDisplayName());

			// must be done after avatar to update avatar count
			setUnreadCountLabels($account);

			$accountAvatar.click(async function() {
				if (popupView == POPUP_VIEW_CHECKER_PLUS) {
					showSaving();
					setTimeout(function() {
						renderMoreAccountMails({renderAll:true});
						scrollAccountIntoView($account[0]);
						hideSaving();
					}, 50);
				} else {
					if (await storage.firstTime("onlyCheckerPlusSupportsClickToScroll")) {
						openGenericDialog({
							content: "Only the Checker Plus view supports click to scroll to account",
							okLabel: getMessage("switchToCheckerPlus"),
							showCancel: true
						}).then(response => {
							if (response == "ok") {
								reversePopupView(true, true);
								renderMoreAccountMails();
							}
						});
					} else {
						reversePopupView(true, true);
						renderMoreAccountMails({ renderAll: true });
						setTimeout(() => {
							scrollAccountIntoView($account[0]);
						}, 50);
					}
				}
            });
            
            renderMails({$account:$account});
            
            initAccountHeaderClasses($account);
		}
	});
	
	// used to keep a skeleton scrollbar (windows only) there so the action buttons don't shift when the scrollbar normally disappear
	polymerPromise2.then(function() {
		if ($(getInboxScrollTarget()).hasVerticalScrollbar(8)) {
			$("#inboxSection").addClass("hasVerticalScrollbars");
		}
	});

	setContactPhotos(accounts, $(".mail"));
}

function showUndo(params) {
	return new Promise((resolve, reject) => {
		if (params.$mail && params.$mail.offset().top >= $(window).height() - 150) {
			$("#undoToast").attr("vertical-align", "top");
		} else {
			$("#undoToast").attr("vertical-align", "bottom");
		}
		showToast({toastId:"undoToast", duration:5, text:params.text, actionParams:{
				onClick: function() {
                    clearCloseWindowTimeout();
                    showLoading();
                    executeMailAction(params.mail, params.undoAction).then(async response => {
						const hiddenMailIndex = hiddenMails.indexOf(params.mail.id);
						if (hiddenMailIndex != -1) {
							hiddenMails.splice(hiddenMailIndex, 1);
						}
						
						if (params.undoAction == "untrash" && accountAddingMethod == "oauth") {
                            // seems the polling logic would not resurface the deleted email so had to delete historyid
                            await executeAccountAction(params.mail.account, "reset");
						}
						
						refresh().then(() => {
							resolve();
						});
						
						hideLoading();
                    });
                    dismissToast($("#undoToast"));
				}
			}
		});
	});
}

function initInboxMailActionButtons($mail) {
	if ($mail.length) {
		var mail = $mail.data("mail");
		var account = mail.account;
		
		// paper-icon-button were slow to initially load so decided to dynamically load them via template and mouseover
		var $inboxMailActionButtonsTemplate = $mail.find(".inboxMailActionButtonsTemplate");
		if ($inboxMailActionButtonsTemplate.length) {
			initTemplate($inboxMailActionButtonsTemplate);
			
			$mail.find(".archive")
				.attr("title", getMessage("archive"))
				.attr("icon", "archive")
				.click(function() {
                    executeMailActionAndHide(mail, "archive");
					return false;
			});

			$mail.find(".markAsSpam")
				.attr("title", getMessage("spamLinkTitle"))
				.click(function() {
                    executeMailActionAndHide(mail, "markAsSpam");
					return false;
			});

			$mail.find(".delete")
				.attr("title", getMessage("delete"))
				.click(function() {
                    executeMailActionAndHide(mail, "deleteEmail");
					showUndo({mail: mail, text: getMessage("movedToTrash"), undoAction: "untrash"});
					return false;
			});
			
			$mail.find(".markAsRead")
				.attr("title", getMessage("readLinkTitle"))
				.click(function() {
                    executeMailActionAndHide(mail, "markAsRead");
					showUndo({$mail:$mail, mail:mail, text:getMessage("markedAsRead"), undoAction:"markAsUnread"});
					return false;
			});

			$mail.find(".markAsUnread")
				.attr("title", getMessage("unreadLinkTitle"))
				.click(function() {
                    executeMailAction(mail, "markAsUnread");
					$mail.addClass("unread");
					updateUnreadCount(+1, $mail);
					return false;
			});

			$mail.find(".reply")
				.attr("title", getMessage("reply"))
				.click(function(event) {
                    executeMailAction(mail, "reply");
					setTimeout(() => {
                        closeWindow();
					}, 100);
					return false;
			});

			$mail.find(".openMail")
				.attr("title", getMessage("openGmailTab"))
				.click(function(event) {
					openMailInBrowser(mail, event);
					return false;
			});
		}
	}
}

function renderMails(params) {
	var $account = params.$account;
	var maxIssuedDate = params.maxIssuedDate;

	// Load mails
	var account = $account.data("account");
	var mails = account.getMails().slice(0);
	
	mails.sort(function (a, b) {
	   if (a.issued > b.issued)
		   return -1;
	   if (a.issued < b.issued)
		   return 1;
	   return 0;
	});
	
	var mailTemplate = $account.find(".mailTemplate")[0];
	var $mails = $account.find(".mails");
	
	var mailNodesBelowFold = 0;
	var newlyRenderedMails = 0;
	
	if (skinsSettings) {
		window.buttonsAlwaysShow = skinsSettings.some(function(skin) {
			// [Buttons] Always show
			if (skin.id == 29) {
				return true;
			}
		});
		window.darkTheme = skinsSettings.some(function(skin) {
			if (skin.id == 4) {
				return true;
			}
		});
	}
	
	var existingMailsCount = $(".mail").length;
	
	console.time("renderMails");
	mails.some((mail, mailIndex) => {
		if (hiddenMails.includes(mail.id)) {
			console.log("exclude: " + mail.title);
			return false;
		}
		
		var $lastMail = $(".mail").last();
		if ($lastMail.length && !isVisibleInScrollArea($lastMail, $("#inbox"), existingMailsCount + mailIndex)) {
			mailNodesBelowFold++;
		}
		
		// skip mails that have newer then the max issued date
		if (maxIssuedDate && mail.issued >= maxIssuedDate) {
            // same as "continue" ie. to skip this mail
			return false;
		} else if (mailNodesBelowFold >= 2) { // if 1 or more mail are below fold (ie. not visible) then stop loading the rendering the rest; do it later so that popup loads initially faster
			if (params.renderAll) {
				// just continue below
			} else if (params.mailsToRender) {
				if (newlyRenderedMails >= params.mailsToRender) {
					// we can break out now
					console.log("newlyRenderedMails >= params.mailsToRender");
					return true;
				} else {
					// just continue
				}
			} else {
				console.log("below fold: " + mailNodesBelowFold);
				return true;
			}
		} else {
			console.log("mail", mail.title + " " + maxIssuedDate + " " + mail.issued);
		}
		
		if (!params.showMore && mailIndex+1 > maxEmailsToShowPerAccount) {
			if (!$mails.find(".showMoreEmails").length) {
				var $showMoreEmails = $("<div class='showMoreEmails' title='Show more emails'><paper-icon-button icon='expand-more'></paper-icon-button></div>");
				$showMoreEmails.click(function() {
                    $(this).remove();
                    // had to resassign $account because params.$account was always referencing last account
                    params.$account = $account;
					params.showMore = true;
					params.mailsToRender = 20;
					renderMoreMails(params);
				});
				$mails.append( $showMoreEmails );
			}
			return true;
		}
		
		newlyRenderedMails++;
		
		const mailNode = document.importNode(mailTemplate.content, true);

		$mails.append(mailNode);
		
        const $mail = $mails.find(".mail").last();
        
		$mail.data("mail", mail);
		
		// sender
		var sender = mail.generateAuthorsNode($);
		if (!sender) {
			sender = getMessage("unknownSender");
		}
		
		$mail.find(".sender").empty().append(sender);
		
		$mail.find(".date").text(mail.getDate());
		
		if (mail.issued) {
			$mail.find(".date").attr("title", mail.issued.toLocaleStringJ());
		}
		
		$mail.find(".subject").text(mail.title);
		
		// snippet
		var maxSummaryLetters;
		
		if ($mail.width() == 0) { // sometimes happens then use default
			maxSummaryLetters = 180;
		} else {
			maxSummaryLetters = $mail.width() / (drawerIsVisible ? 4.2 : 4);
		}
		
		var $EOM_Message = $("<span class='eom'></span>");
		$EOM_Message
			.attr("title", getMessage("EOMToolTip"))
			.text("[" + getMessage("EOM") + "]")
		;
		
		mail.getLastMessageText({maxSummaryLetters:maxSummaryLetters, htmlToText:true, targetNode:$mail.find(".snippet"), EOM_Message:$EOM_Message});
		
		// labels
		var labelsTemplate = $mail.find(".labelsTemplate")[0];
		var $labels = $mail.find(".labels");
		
		if (labelsTemplate && labelsTemplate.content) {
			var labels = mail.getDisplayLabels(true);
			labels.forEach(function(labelObj) {
				//console.log("label", labelObj);
				var labelNode = document.importNode(labelsTemplate.content, true);
				$labels.append(labelNode);
				var $label = $labels.find(".label").last();
				$label.data("label", labelObj);
				$label.find(".labelName")
					.text(labelObj.name)
				;
				if (labelObj.color) {
					$label.find(".labelName").css({
						"color": labelObj.color.textColor,
						"background-color": labelObj.color.backgroundColor
					})
				}
			});
		}
		
		initStar($mail.find(".star"), mail);

		if (mail.hasAttachments()) {
			$mail.find(".attachment-icon").unhide();
		}
		
		if (buttonsAlwaysShow) {
			initInboxMailActionButtons($mail);
		}
		
		// click
		$mail
			.click(function(event) {
				if (emailPreview && !isCtrlPressed(event)) {
					// ** for auto-detect only because i think oauth already fills up .messages: openEmail must be called atleast once to generate the messages! for them to appear
					openEmail({mail:mail});
				} else {
					openMailInBrowser(mail, event);
					return false;
				}
			})
			.mouseenter(function() {
				if (!buttonsAlwaysShow) {
					initInboxMailActionButtons($mail);
				}
			})
		;
		
	});
	
	console.timeEnd("renderMails");
}

function isVisibleInScrollArea($node, $scroll, mailIndex) {
    // patch seems firefox was not returning :visible on scroll or Y value for newly rendered nodes
    if (DetectClient.isFirefox()) {
    	return true;
    } else {
		var vpH = getInboxViewportHeight(), // Viewport Height
			//st = $scroll[0].scroller.scrollTop,
			//st = $scroll.scrollTop(), // Scroll Top
			y = $node.position().top;// + getInboxTop();
		console.info($scroll.is(":visible") + " y: " + y + " vph: " + vpH);
		// when machine is slow it seems visible == false and y == 0
		// commented: also included vpH <= 0 refer to bug https://jasonsavard.com/forum/discussion/comment/15849#Comment_15849
    	return (!$scroll.is(":visible") && y == 0) || $scroll.is(":visible") && y < vpH;
    }
}

function renderMoreAccountMails(params = {}) {
	console.log("renderMoreAccountMails");
	$(".account").each(function() {
		params.$account = $(this);
		renderMoreMails(params);
	});
}

function renderMoreMails(params) {
	var maxIssuedDate;
	var $lastMail = params.$account.find(".mail").last();
	if ($lastMail.length) {
		maxIssuedDate = $lastMail.data("mail").issued;
	}
	
	params.maxIssuedDate = maxIssuedDate;

	renderMails(params);
	setContactPhotos(accounts, $(".mail"));
}

function getInboxTop() {
	// because inbox is inside paper-header-panel [main] so the inbox.top can be negative so we must add the scrollTop of paper-headerpanel
	return $("#inbox").offset().top; // + $("[main]")[0].scroller.scrollTop;
}

function getInboxViewportHeight() {
	// $(window) in firefox gave me different results??
	let windowHeight;
	if (DetectClient.isFirefox()) {
		windowHeight = window.outerHeight;
	} else {
		windowHeight = $(window).height();
	}
	return windowHeight - getInboxTop() - 4;
}

function resizeNodes() {
	console.log("resizeNodes");
	
	if (isDetached) {
		if (popupView == POPUP_VIEW_CHECKER_PLUS) {
			renderMoreAccountMails();
		} else {
			$("#tabletViewFrame").height( $(window).height() -  $("#tabletViewFrame").offset().top - 10 );
		}
	}
}

function getDeepNode(id) {
	return $("html /deep/ #" + id);
}

function shouldWatermarkImage(skin) {
	//if (skin.name && skin.name.startsWith("[img:") && skin.author != "Jason") {
	if (skin.image && skin.author != "Jason") {
		return true;
	}
}

function addSkinPiece(id, css) {
	polymerPromise.then(function() {
		$("#" + id).append(css);
	});
}

function addSkin(skin, id) {
	if (!id) {
		id = "skin_" + skin.id;
	}
    $("#" + id).remove();

    const $body = $("body");
    
    $body.addClass(id);
	
	let css = "";
	
	if (skin.image) {
		$body.addClass("background-skin");

        let defaultBackgroundColorCSS = "";
		// normally default is black BUT if image exists than default is white, unless overwritten with text_color
		if (skin.text_color != "dark") {
            defaultBackgroundColorCSS = "background-color:black;";
            css += `
                html:not(.searchInputVisible) #inboxSection app-header-layout app-toolbar paper-icon-button:not(#menu),
                #topLeft,
                #searchIcon,
                #searchInput,
                #skinWatermark,
                .showMoreEmails {
                    color:white;
                }
            `;
        }

		var resizedImageUrl;
		if (/blogspot\./.test(skin.image) || /googleusercontent\./.test(skin.image)) {
			resizedImageUrl = skin.image.replace(/\/s\d+\//, "\/s" + parseInt($body.width()) + "\/");
		} else {
			resizedImageUrl = skin.image;
		}
		
		//| += "[main] {background-size:cover;background-image:url('" + resizedImageUrl + "');background-position-x:50%;background-position-y:50%} [main] paper-toolbar {background-color:transparent} .accountHeader {background-color:transparent}";
		// Loading the background image "after" initial load for 2 reasons: 1) make sure it loads after the mails. 2) to trigger opacity transition
        addSkinPiece(id, `
            #inboxSection app-header-layout::before {
                opacity: 1;
                background-size: cover;
                background-image: url('${resizedImageUrl}');
                ${defaultBackgroundColorCSS}
                background-position-x: 50%;
                background-position-y: 50%;
            }
            #inboxSection app-header-layout app-toolbar#main-header-toolbar {
                background-color:transparent;
            }
            #inboxSection app-header-layout app-toolbar[default-color] {
                background-color: ${DEFAULT_SETTINGS.accountColorWithBackgroundImage} !important;
            }
        `);

		if (shouldWatermarkImage(skin)) {
            const $skinWatermark = $("#skinWatermark");
			$skinWatermark.addClass("visible");
			$skinWatermark.text(skin.author);
			if (skin.author_url) {
				$skinWatermark.attr("href", skin.author_url); 
			} else {
				$skinWatermark.removeAttr("href");
			}
		}
	}
	if (skin.css) {
		css += " " + skin.css;
	}
	
	addCSS(id, css);
}

function removeSkin(skin) {
    $("#skin_" + skin.id).remove();
    $("body").removeClass("skin_" + skin.id);

	if (shouldWatermarkImage(skin)) {
		$("#skinWatermark").removeClass("visible");
	}
}

function setSkinDetails($dialog, skin) {
	
	$dialog.find("#skinCSS").off().on("click", function() {
		
		var $textarea = $("<textarea readonly style='width:400px;height:200px'></textarea>");
		$textarea.text(skin.css);
		
		openGenericDialog({
			title: "Skin details",
			content: $textarea
		});

		return false;
	});

	$("#skinAuthorInner").unhide();

	if (skin.css) {
		$dialog.find("#skinCSS").attr("href", "#");
	} else {
		$dialog.find("#skinCSS").removeAttr("href");
	}
	
	$dialog.find("#skinAuthor").text(skin.author);
	if (skin.author_url) {
		$dialog.find("#skinAuthor").attr("href", skin.author_url);
	} else {
		$dialog.find("#skinAuthor").removeAttr("href");
	}
}

function getSkin(skins, $paperItem) {
	return skins.find(skin => {
		return skin.id == $paperItem.attr("skin-id");
	});
}

function maybeRemoveBackgroundSkin(skinsSettings) {
	let oneSkinHasAnImage = skinsSettings.some(skin => {
	   if (skin.image) {
		   return true;
	   }
   });

   if (!oneSkinHasAnImage) {
	   $("body").removeClass("background-skin");
   }
}

function showSkinsDialog() {
	showLoading();
	
	Controller.getSkins().then(async skins => {
        const donationClickedFlag = await storage.get("donationClicked");
		
		var attemptedToAddSkin = false;
		
		var $dialog = initTemplate("skinsDialogTemplate");
		var $availableSkins = $dialog.find("#availableSkins");
		$availableSkins.empty();
		$availableSkins
			.off()
			.on("click", ".addButton", async function (e) {
				attemptedToAddSkin = true;

				var $addButton = $(this);
				var $paperItem = $addButton.closest("paper-item");
				var skin = getSkin(skins, $paperItem);

                function preventPreview() {
					$paperItem.removeAttr("focused");
					$paperItem.blur();

					e.preventDefault();
					e.stopPropagation();
                }

				$("#previewSkin").remove();

				if ($addButton.hasClass("selected")) {
					console.log("remove skin: ", skin);
					$addButton.removeClass("selected");
					$addButton.attr("icon", "add");
					removeSkin(skin);
					skinsSettings.some(function (thisSkin, index) {
						if (skin.id == thisSkin.id) {
							skinsSettings.splice(index, 1);
							return true;
						}
					});

					maybeRemoveBackgroundSkin(skinsSettings);

					storage.set("skins", skinsSettings).then(() => {
						Controller.updateSkinInstalls(skin.id, -1);
					}).catch(error => {
						showError(error);
					});

                    preventPreview();
					return false;
				} else if (donationClickedFlag) {
                    console.log("add skin");
                    $addButton.addClass("selected");
                    $addButton.attr("icon", "check");
                    addSkin(skin);
                    skinsSettings.push(skin);
                    storage.set("skins", skinsSettings).then(() => {
                        Controller.updateSkinInstalls(skin.id, 1);
                    }).catch(error => {
                        showError(error);
                    });
				} else {
                    openContributeDialog("skins");
                    preventPreview();
					return false;
                }
			})
			.on("click", "paper-item", function () {
                var $paperItem = $(this);
                // patch to remove highlighed gray
                $paperItem.removeAttr("focused");
                $paperItem.blur();

                $("#skinWatermark").removeClass("visible");
                var skin = getSkin(skins, $paperItem);
                addSkin(skin, "previewSkin");
                setSkinDetails($dialog, skin);
                return false;
			})
		;
		
		skins.forEach(skin => {
			const paperItem = document.createElement("paper-item");
            paperItem.setAttribute("skin-id", skin.id);
            
			const skinAdded = skinsSettings.some(thisSkin => skin.id == thisSkin.id);
			
			const addButton = document.createElement("paper-icon-button");
			let className = "addButton";
			if (skinAdded) {
				className += " selected";
				addButton.setAttribute("icon", "check");
			} else {
				addButton.setAttribute("icon", "add");
			}
			addButton.setAttribute("class", className);
			addButton.setAttribute("title", "Add it");
			paperItem.appendChild(addButton);

			const textNode = document.createTextNode(skin.name);
			paperItem.appendChild(textNode);

			$availableSkins[0].appendChild(paperItem);
        });
        
        $dialog.find(".resetSkins").off().on("click", async function() {
            await storage.remove("skins");
            await storage.remove("customSkin");
            await storage.remove("popup-bg-color");
            await niceAlert(getMessage("reset"));
			location.reload();
		});
		
		$dialog.find(".updateSkins").off().on("click", async function() {
			skinsSettings.forEach(function(skinSetting) {
				skins.forEach(function(skin) {
					if (skinSetting.id == skin.id) {
						copyObj(skin, skinSetting);
						
						// refresh skin
						addSkin(skin);
					}
				});
			});
			await storage.set("skins", skinsSettings);
			showMessage(getMessage("done"));
		});

		$dialog.find("#background-color")
			.attr("color", "#999")
			.off().on("color-changed", async e => {
				if (await donationClicked("background-color")) {
					let color = e.originalEvent.detail.value;
					setPopupBgColor(color);
					await storage.set("popup-bg-color", color);
					if ($("body").hasClass("background-skin")) {
						showMessage("Remove image to see background color.");
					}
				}
			})
		;
		
		$dialog.find(".customSkin").off().on("click", async function() {
			$("#previewSkin").remove();
			
			var $dialog = initTemplate("customSkinDialogTemplate");

			var customSkin = await storage.get("customSkin");

			$dialog.find("textarea").val(customSkin.css);
			$dialog.find("#customBackgroundImageUrl").val(customSkin.image);

			$dialog.find(".shareSkin").off().on("click", function() {
				openUrl("https://jasonsavard.com/forum/categories/checker-plus-for-gmail-feedback?ref=shareSkin");
			});

			$dialog.find(".updateSkin").off().on("click", async function() {
				$("#customSkin").remove();
				addSkin({id:"customSkin", css:$dialog.find("textarea").val(), image:$dialog.find("#customBackgroundImageUrl").val()});
				if (!await storage.get("donationClicked")) {
					showMessage(getMessage("donationRequired"));
				}
			});
			
			openDialog($dialog).then(async function(response) {
				if (response == "ok") {
					if (donationClickedFlag) {
						customSkin.css = $dialog.find("textarea").val();
						customSkin.image = $dialog.find("#customBackgroundImageUrl").val();
						
						addSkin(customSkin);
						await storage.set("customSkin", customSkin);
					} else {
						$dialog.find("textarea").val("");
						removeSkin(customSkin);
						if (!donationClickedFlag) {
							showMessage(getMessage("donationRequired"));
						}
					}
					
					$dialog[0].close();
				}
			});
		});

		openDialog($dialog).then(async response => {
			if (response == "ok") {
				if ($("#previewSkin").length) {
					$("#previewSkin").remove();

					maybeRemoveBackgroundSkin(skinsSettings);

					if (!attemptedToAddSkin) {
						openGenericDialog({
							content: "Use the <paper-icon-button style='vertical-align:middle' icon='add'></paper-icon-button> to add skins!"
						}).then(response => {
							if (response == "ok") {
								// make sure next time the skins dialog closes when clicking done
								$dialog.find(".okDialog").attr("dialog-confirm", true);
							}
						});
						let $addButton = $("#skinsDialog #availableSkins paper-item.iron-selected .addButton");
						$addButton.one("transitionend", () => {
							$addButton.toggleClass("highlight");
						});
						$addButton.toggleClass("highlight");
					} else {
						$dialog[0].close();
					}
					
				} else {
					$dialog[0].close();
				}
			}
		});

		hideLoading();

	}).catch(error => {
		console.error(error);
		showError("There's a problem, try again later or contact the developer!");
	});
}

async function resizeInboxPatch() {
    await sleep(1);
    $("body").hide().show(0); // must set parameter to 0
}

// ensure clearing timeout done after it's set (race condition)
function clearCloseWindowTimeout(withDelay) {
    setTimeout(() => {
        clearTimeout(closeWindowTimeout);
    }, withDelay ? 200 : 1);
}

async function init() {

    // patch2 for https://jasonsavard.com/forum/discussion/comment/22430#Comment_22430
    if (totalUnreadCount) {
        //maxHeightOfPopup();
    }

    bgObjectsReady = await getBGObjects();

    document.body.classList.add(await storage.get("displayDensity"));

    const _oneTimeReversePopupView = await storage.get("_oneTimeReversePopupView");
	if (_oneTimeReversePopupView) {
		await storage.set("browserButtonAction", _oneTimeReversePopupView);
		storage.remove("_oneTimeReversePopupView");
	}
	if (await storage.get("browserButtonAction") == BROWSER_BUTTON_ACTION_GMAIL_INBOX) {
		if (location.href.includes("noSignedInAccounts")) {
			popupView = POPUP_VIEW_TABLET;
		} else {
			if (totalUnreadCount === 0 && await storage.get("gmailPopupBrowserButtonActionIfNoEmail") == BROWSER_BUTTON_ACTION_CHECKER_PLUS) {
				popupView = POPUP_VIEW_CHECKER_PLUS;
			} else {
				popupView = POPUP_VIEW_TABLET;
			}
		}
	} else {
		if (location.href.includes("noSignedInAccounts")) {
			popupView = POPUP_VIEW_CHECKER_PLUS;
		} else {
			if (totalUnreadCount === 0 && await storage.get("checkerPlusBrowserButtonActionIfNoEmail") == BROWSER_BUTTON_ACTION_GMAIL_INBOX) {
				popupView = POPUP_VIEW_TABLET;
			} else {
				popupView = POPUP_VIEW_CHECKER_PLUS;
			}
		}
	}
    
    console.log("view: " + popupView);

    // resizepopup requires popupView to be declared is delcared
    resizePopup();

    await $.ready;
    
	var $html = $("html");
	var $body = $("body");

	if (fromToolbar) {
		$html.addClass("fromToolbar");
    }
	
	$body.addClass(await storage.get("accountAddingMethod"));

	if (DetectClient.isMac()) {
		$body.addClass("mac");
	}
	
	if (getMessage("dir") == "rtl") {
		$("app-drawer").attr("align", "end");

		// patch for incomplete transition
		$(".page").addClass("disableTransition");
    }

    if (skinsSettings) {
		//pageVisible.then(() => {
			skinsSettings.forEach(skin => {
				addSkin(skin);
			});
			addSkin(await storage.get("customSkin"));

			const popupBgColor = await storage.get("popup-bg-color");
			setPopupBgColor(popupBgColor);
		//});
    }

    // Had to move this code here for some reason (probably before polymer loaded)
    if (accounts.length >= 2) {
        $("#menu").show();

        if (await storage.get("drawer") != "closed") {
            drawerIsVisible = true;
            $("app-drawer-layout")
                .removeAttr("force-narrow")
            ;
            if (DetectClient.isFirefox()) {
                $("#drawerPanel").attr("opened", true);
                $("#drawerPanel").find(".app-drawer").last().attr("opened", true);
            }
            setTimeout(() => {
                $("app-drawer-layout").addClass("delay");
            }, 1500);
        }
    }
    
	if (!await storage.get("donationClicked")) {
		$body.addClass("donationNotClicked");
		
		$("body").on("mouseenter", "[contribute]", function(e) {
			console.log(e);
			var $donationRequired = $("#donationRequired");
			
			var left;
			var SPACING = 15;
			if (getMessage("dir") == "rtl") {
				left = $(this).offset().left + $(this).width() + SPACING;
			} else {
				left = $(this).offset().left - $donationRequired.width() - SPACING;
			}
			
			$donationRequired
				.css({left:left, top:$(this).offset().top + 5})
				.show()
			;
		}).on("mouseleave", "[contribute]", function() {
			var $donationRequired = $("#donationRequired");
			$donationRequired.hide();
		});
	}
	
	if (isDetached) {
		$html.addClass("detached");
		resizeNodes();
	}

	// do this right away to skip the transition when calling openEmail
	if (previewMailId && await storage.get("browserButtonAction") != BROWSER_BUTTON_ACTION_GMAIL_INBOX) {
        $("body").addClass("page-loading-animation");
        
        $(".page").addClass("disableTransition");
        $(".page").removeClass("active");
        // commented because it was causing incomplete transition https://jasonsavard.com/forum/discussion/5149/issue-with-checker-gmails-popup-ignoring-mouse-v21-5-1-v21-5-2
        //$("#openEmailSection").addClass("active");
	} else if (location.href.includes("action=getUserMediaDenied") || location.href.includes("action=getUserMediaFailed")) {
		polymerPromise2.then(function() {
			setTimeout(function() {
				var params = {};
				
				var accountEmail = getUrlValue(location.href, "accountEmail", true);
				params.account = getAccountByEmail(accountEmail);
				params.skipAnimation = true;
				
				if (getUrlValue(location.href, "mediaType") == "voiceEmail") {
					params.voiceEmail = true;
				} else {
					params.videoEmail = true;
				}
				
				openComposeSection(params);
			}, 1)
		});
	}
	
	$(window).on("resize", function() {
		console.log("window.resize");
		if (windowOpenTime.diffInSeconds() > -1) {
			console.log("skip resize - too quick");
		} else {
			// in firefox this would loop alot and crash
			if (DetectClient.isChrome()) {
				resizeNodes();
			}
		}
	});
	
	resizeFrameInExternalPopup();

    [
        "showArchive",
        "showSpam",
        "showDelete",
        "showMoveLabel",
        "showMarkAsRead",
        "showArchiveAll",
        "showMarkAllAsRead",
        "showMarkAsUnread",
        "showReply",
        "showOpen"
    ].forEach(setting => {
        storage.get(setting).then(enabled => {
            if (!enabled) {
                $body.addClass(setting.replace("show", "hide"));
            }
        });
    });
	
	$body
		.click(function() {
            clearCloseWindowTimeout(true);

			// reset interval everytime user clicks in popup
			if (isDetached) {
				clearInterval(renderAccountsInterval);
				renderAccountsInterval = setIntervalSafe(() => {
					renderAccounts();
				}, seconds(30));
			}
		})
		.keydown(function(e) {
			//console.log("key: ", e);
			
			if (isFocusOnInputElement()) {
				//return true;
			} else {
				var $selectedMail = $(".mail").first();
				
				initInboxMailActionButtons($selectedMail);
				
				if (e.key == 'c' && !isCtrlPressed(e)) {
					$(".account:first .compose").click();
				} else if (e.key == 'o' || e.key == "Enter") {
					if (!isComposeView()) {
						if ($selectedMail.length) { // found unread email so open the email
							if (e.key == "Enter") {
								// enter toggles between preview mode
								if (isEmailView()) {
									//openInbox();
								} else {
									$selectedMail.click();
								}
							} else {
								$selectedMail.find(".openMail").click();
							}
                        } else { // no unread email so open the inbox instead
                            executeAccountAction(accounts[0], "openInbox");
                            closeWindow({source:"openInboxShortcutKey"});
						}
					}
                } else if (e.key == "ArrowLeft" || e.key == "ArrowRight") {
                    if (isEmailView()) {
                        openInbox();
                    } else {
                        $selectedMail.click();
                    }
                } else if (e.key == 'j') { // next/down
					if (isEmailView()) {
						$("#nextMail").click();
					}
				} else if (e.key == 'k') { // prev/up
					if (isEmailView()) {
						$("#prevMail").click();
					}
				} else if (e.key == '#') { // delete
					if (isEmailView()) {
						$("#delete").click();
					} else {
						$selectedMail.find(".delete").click();
					}
				} else if (e.key == 'e') { // archive
					if (isEmailView()) {
						$("#archive").click();
					} else {
						$selectedMail.find(".archive").click();
					}
				} else if (e.key == '!') { // spam
					if (isEmailView()) {
						$("#markAsSpam").click();
					} else {
						$selectedMail.find(".markAsSpam").click();
					}
				} else if (e.key == 's') { // star
					if (isEmailView()) {
						$("#openEmail .star").click();
					} else {
						$selectedMail.find(".star").click();
					}
				} else if (e.key == 'v' && !isCtrlPressed(e)) { // move
					if (isEmailView()) {
						$("#moveLabel").click();
					}
				// r = reply (if setting set for this)
				} else if ((keyboardException_R == "reply" && e.key == 'r') || (!isCtrlPressed(e) && e.key == 'a')) {
                    if ($selectedMail.length) {

                        function clickReplyArea(e) {
							if (e.key == 'r') {
								$("#replyArea").removeAttr("replyAll");
							} else {
								$("#replyArea").attr("replyAll", true);
                            }
                            $("#replyArea").click();

                        }

                        if (isEmailView()) {
                            clickReplyArea(e);
						} else {
                            $selectedMail.click();
                            $("#openEmailSection").one("transitionend", function(e) {
                                setTimeout(() => {
                                    clickReplyArea(e);
                                }, 1);
                            });
						}
						return false;
					}
				} else if (e.key == 'I' || (keyboardException_R == "markAsRead" && e.key == 'r')) {
					if (isEmailView()) {
						$("#markAsRead").click();
					} else {
						$selectedMail.find(".markAsRead").click();
                    }
                } else if (e.key == "?") {
                    maxHeightOfPopup();
                    openDialog("keyboardShortcutDialogTemplate").then(response => {
                        if (response != "ok") {
                            openUrl("https://jasonsavard.com/wiki/Keyboard_shortcuts?ref=gmailShortcutDialogMoreInfo");
                        }
                    });
				} else {
					console.trace("key not recognized: ", e);
				}
			}
			
		})
	;
	
	$("#titleClickArea").click(async function() {
		if (await storage.get("clickingCheckerPlusLogo") == "openHelp") {
			openUrl("https://jasonsavard.com/wiki/Checker_Plus_for_Gmail?ref=GmailChecker");
		} else {
            await sendMessageToBG("openGmail");
			closeWindow({source:"titleClickArea"});
		}
	});

	if (await storage.get("removeShareLinks")) {
		// hide actual share button
		$(".share-button").closest("paper-menu-button").remove();
		// hide share button (placeholder)
		$(".share-button").remove();
	}
	
	$(".share-button").on("mousedown", function() {
		maxHeightOfPopup();
	});
	$(".share-button").one("click", async function() {
		await storage.enable("followMeClicked");
		initTemplate("shareMenuItemsTemplate");
		
		$("#share-menu paper-item").click(function() {
			var value = $(this).attr("id");
			sendGA('shareMenu', value);
			
			if (value == "facebook") {
				openUrl("https://www.facebook.com/thegreenprogrammer");
			} else if (value == "twitter") {
				openUrl("https://twitter.com/JasonSavard");
			} else if (value == "linkedin") {
				openUrl("https://www.linkedin.com/in/jasonsavard");
			} else if (value == "email-subscription") {
				openUrl("https://jasonsavard.com/blog/?show-email-subscription=true");
			}
		});

	})

	$("#refresh").click(function() {
		refresh();
	});

	$("#refresh").dblclick(function() {
		refresh(true);
	});
    
	$("#maximize").mousedown(async function(e) {
		if (isCtrlPressed(e)) {
			openWindowInCenter(chrome.runtime.getURL("popup.html"), '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes', await storage.get("popupWidth"), await storage.get("popupHeight"));
			closeWindow({source:"maximize"});
		} else {
			var currentAccount;
			if (currentTabletFrameEmail) {
				currentAccount = getAccountByEmail(currentTabletFrameEmail);
			}
			
			if (currentAccount) {
                const tabletViewUrl = await storage.get("tabletViewUrl");
				if (tabletViewUrl) {
					const messageId = extractMessageIdFromOfflineUrl(tabletViewUrl);
					if (messageId) {
                        executeAccountAction(currentAccount, "openMessageById", {actionParams: {messageId:messageId}});
					} else { // NOT viewing a message, probably in the inbox or something
                        executeAccountAction(currentAccount, "openInbox");
					}
				} else {
                    executeAccountAction(currentAccount, "openInbox");
				}
			} else {
                await sendMessageToBG("openGmail");
			}
			sendGA("maximize", "click");
			closeWindow({source:"maximize"});
		}
	});
	
	if (await storage.get("quickComposeEmail")) {
		const quickComposeEmailAlias = await storage.get("quickComposeEmailAlias");
		if (quickComposeEmailAlias) {
			$("#quickContactLabel").text(quickComposeEmailAlias);
		}
		
		const contactPhotoParams = $.extend({}, {
            useNoPhoto: true,
            account: accounts[0],
            email: await storage.get("quickComposeEmail")
        });
		const $imageNode = $("#quickContactPhoto");
		setContactPhoto(contactPhotoParams, $imageNode);
	}
	
	$("#quickContact").click(async function() {
        await openQuickCompose();
        closeWindow();
	});
	
	$("#composeArea")
		.hover(function() {
			$("#compose").attr("icon", "create");
		}, function() {
			$("#compose").attr("icon", "add");
		})
	;
	
	$("#compose")
		.click(function() {
			$(".account:first .compose").click();
		})
	;
	
	$("#mainOptions").on("mousedown", function() {
		maxHeightOfPopup();
	});
	
	// must use .one because we don't want to queue these .click inside (was lazy and didn't want to code .off .on :)
	$("#mainOptions").one("click", function() {
		maxHeightOfPopup();
		
		$(".switchView").click(function() {
            closeMenu(this);
            
            const permissionsObj = {permissions: ["webRequest", "webRequestBlocking"]};
            chrome.permissions.request(permissionsObj, async granted => {
                if (granted) {
                    reversePopupView(true);
                    renderMoreAccountMails();
                } else {
                    showError("Problem with permission for inbox view")
                }
            });
		});
		
		initSwitchMenuItem();
		
		$(".popout").click(function() {
			openUrl(getPopupFile());
		});
		
		$(".dnd")
			.click(function() {
				
				var $dialog = initTemplate("dndDialogTemplate");
				var $radioButtons = $dialog.find("paper-radio-button");
				
				$radioButtons.off().on("change", function() {
					var value = $(this).attr("name");
					if (value == "today") {
						setDND_today();
					} else if (value == "indefinitely") {
						setDND_indefinitely();
					} else {
						setDND_minutes(value);
					}
					setTimeout(function() {
						closeWindow();
					}, 200);
				});

				openDialog($dialog).then(response => {
					if (response == "ok") {
						// nothing
					} else if (response == "other") {
						openDNDScheduleOptions();
					} else {
						openDNDOptions();
					}
				});
				
				closeMenu(this);
			})
		;
		
		$(".dndOff")
			.click(function() {
				setDND_off();
				
				// wait for message sending to other extension to sync dnd option
				setTimeout(function() {
					closeWindow();
				}, 10);
			})
		;

		isDNDbyDuration().then(DNDflag => {
            if (DNDflag) {
                $(".dnd").hide();
            } else {
                $(".dndOff").hide();
            }
        });
			
		$(".displayDensity").click(async function() {
			closeMenu(this);
			
			var $dialog = initTemplate("displayDensityDialogTemplate");
			var $radioButtons = $dialog.find("paper-radio-button");
			
			$dialog.find("paper-radio-group")[0].setAttribute("selected", await storage.get("displayDensity"));
			
			$radioButtons.off().on("change", function() {
				var value = $(this).attr("name");
				storage.set("displayDensity", value);
				
				//location.reload();
				$("body")
					.removeClass("comfortable cozy compact")
					.addClass(value)
                ;
                
                resizeInboxPatch();
			});
			
			openDialog($dialog);
		});
		
		$(".skins")
			.click(function() {
				closeMenu(this);
				showSkinsDialog();
				sendGA('topbar', 'skins');
			})
		;

		$(".options").click(function() {
			openUrl("options.html?ref=popup");
		});

		$(".changelog").click(async function() {
            await storage.remove("_lastBigUpdate");
            openChangelog("GmailCheckerOptionsMenu");
		});

		$(".contribute").click(function() {
			openUrl("contribute.html?ref=GmailCheckerOptionsMenu");
		});

		$(".discoverMyApps").click(function() {
			openUrl("https://jasonsavard.com?ref=GmailCheckerOptionsMenu");
		});

		$(".feedback").click(function() {
			openUrl("https://jasonsavard.com/forum/categories/checker-plus-for-gmail-feedback?ref=GmailCheckerOptionsMenu");
		});

		$(".followMe").click(function() {
			openUrl("https://jasonsavard.com/?followMe=true&ref=GmailCheckerOptionsMenu");
		});

		$(".aboutMe").click(function() {
			openUrl("https://jasonsavard.com/about?ref=GmailCheckerOptionsMenu");
		});

		$(".help").click(function() {
			openUrl("https://jasonsavard.com/wiki/Checker_Plus_for_Gmail?ref=GmailCheckerOptionsMenu");
		});
	});
	
	$(".close").click(function() {
		window.close();
	});
	
	if (await daysElapsedSinceFirstInstalled() >= UserNoticeSchedule.DAYS_BEFORE_SHOWING_FOLLOW_ME && !await storage.get("followMeClicked")) {
        let expired = false;
        const followMeShownDate = await storage.get("followMeShownDate");
		if (followMeShownDate) {
			if (followMeShownDate.diffInDays() <= -UserNoticeSchedule.DURATION_FOR_SHOWING_FOLLOW_ME) {
				expired = true;
			}
		} else {
			storage.setDate("followMeShownDate");
		}
		if (!expired) {
			$(".share-button-real .share-button").addClass("swing");
		}
	}

	polymerPromise.then(async () => {
		if (await shouldShowExtraFeature()) {
			$("#newsNotification")
				.attr("icon", "myIcons:theme")
				.unhide()
				.click(() => {
					maxHeightOfPopup();
					showSkinsDialog();
				})
			;
            $("#newsNotificationReducedDonationMessage")
                .text( getMessage("addSkinsOrThemes") )
                .unhide()
            ;
		} else if (await shouldShowReducedDonationMsg(true)) {
			$("#newsNotification")
				.unhide()
				.click(() => {
					openUrl("contribute.html?ref=reducedDonationFromPopup");
				})
            ;
            $("#newsNotificationReducedDonationMessage").unhide();
		} else if (await storage.get("_lastBigUpdate")) {
			$("#newsNotification")
				.unhide()
				.click(async () => {
                    await storage.remove("_lastBigUpdate");
                    openChangelog("bigUpdateFromPopupWindow")
				})
            ;
            $("#newsNotificationBigUpdateMessage").unhide();
        }
	});

	getDNDState().then(dndState => {
		if (dndState) {
			polymerPromise2.then(() => {
				showError(getMessage("DNDisEnabled"), {
					text: getMessage("turnOff"),
					onClick: () => {
						setDND_off();
						hideError();
					}
				});
			});
		}
	});
	
	// FYI whole block below used to be above document.ready
	await polymerPromise;

	$("body").removeAttr("jason-unresolved");

    sendMessageToBG("stopAllSounds");
	
    if (isDetached
        && !await storage.get("popoutMessage")
        && !previewMailId
        && !location.href.includes("action=getUserMediaDenied")
        && !location.href.includes("action=getUserMediaFailed")
        && !location.href.includes("source=oauth")) {
		polymerPromise2.then(async () => {
			const $dialog = initTemplate("popoutDialogTemplate");
			const response = await openDialog($dialog);
            if (response != "ok") {
                openUrl("https://jasonsavard.com/wiki/Popout?ref=gmailPopoutDialog");
                $dialog[0].close();
            }
			storage.enable("popoutMessage");
		});
	}
	
	getZoomFactor().then(function(zoomFactor) {
		if (fromToolbar && window && zoomFactor > 1) {
			$("html").addClass("highDevicePixelRatio");
		}
	});
	
	initPopupView();

	$("#menu").click(function() {
		let drawerLayout = $("app-drawer-layout")[0];

		if ((drawerLayout.forceNarrow || !drawerLayout.narrow)) {
			drawerLayout.forceNarrow = !drawerLayout.forceNarrow;
		}

		if (drawerLayout.drawer.opened) {
			drawerLayout.drawer.close();
			storage.set("drawer", "closed");
		} else {
			drawerLayout.drawer.open();
			storage.set("drawer", "open");
		}
	});
	
	$("#searchInput")
		.blur(function() {
			$("html").removeClass("searchInputVisible");
		})
		.keydown(function(e) {
			if (e.key == "Enter" && !e.originalEvent.isComposing) {
				const account = $(this).data("account");
                executeAccountAction(account, "openSearch", {actionParams: $(this).val()});
				closeWindow({source:"onlyMailAndInPreview"});
			}
		})
	;

	if (accounts.length == 0 || (accounts.length == 1 && accounts[0].error && accounts[0].error != "timeout" && accounts[0].getMailUrl().includes("/mail/"))) {
        if (isOnline()) {
            let $dialog;

            const mustUseAddAccount = accounts.some(account => account.errorCode == JError.CANNOT_ENSURE_MAIN_AND_INBOX_UNREAD);
            const accountsSummary = await getAccountsSummary(accounts);
    
            polymerPromise2.then(() => { // polymerPromise2 required to fix paper-dialog-scrollable issue with 0 height
                if (accountAddingMethod == "autoDetect" && !mustUseAddAccount) {
                    $dialog = initTemplate("signInTemplate");
                } else {
                    $dialog = initTemplate("addAccountTemplate");
                }
    
                if (accounts.length == 1 && accounts.first().error) {
                    if (accounts.first().getError().niceError && accounts.first().getError().niceError != "error") {
                        $dialog.find("#signInError").text(accounts.first().getError().niceError);
                    } else {
                        $dialog.find("#signInError").text(getMessage("networkProblem"));
                    }
                    $dialog.find("#signInErrorInstructions").text(accounts.first().getError().instructions);
                } else {
                    if (accountAddingMethod == "autoDetect") {
                        if (accountsSummary.allSignedOut) {
                            $dialog.find("#signInError").text("Must sign in!");
                        } else {
                            $dialog.find("#signInError").text(getMessage("networkProblem"));
                        }
                        if (DetectClient.isFirefox() && navigator.doNotTrack) {
                            $dialog.find("#signInErrorInstructions").text(JError.DO_NOT_TRACK_MESSAGE);
                        }
                } else {
                        $dialog.find("#signInError").text("Must add an account!");
                    }
                }
    
                if (accountAddingMethod == "autoDetect" && !mustUseAddAccount) {
                    openDialog($dialog).then(response => {
                        if (response == "ok") {
                            openUrl(Urls.SignOut);
                        } else if (response == "other") {
                            openUrl("https://jasonsavard.com/wiki/Auto-detect_sign_in_issues");
                        } else if (response == "other2") {
                            $dialog[0].close();
                            refresh().then(() => {
                                if (accounts.length == 0 || getAccountsWithErrors(accounts).length) {
                                    location.reload();
                                }
                            });
                        } else {
                            openUrl("options.html#accounts");
                        }
                    }).catch(error => {
                        showError("error: " + error);
                    });
                } else {
                    openDialog($dialog).then(response => {
                        if (response == "ok") {
                            let url = "options.html";
                            if (mustUseAddAccount) {
                                url += "?highlight=addAccount";
                            }
                            url += "#accounts";
                            openUrl(url);
                        } else {
                            $dialog[0].close();
                            refresh().then(() => {
                                location.reload();
                            });
                        }
                    }).catch(error => {
                        showError("error: " + error);
                    });
                }
            });
        }
	} else {
        await renderAccounts();

        // patch for https://jasonsavard.com/forum/discussion/comment/22430#Comment_22430
        // patch2 above
        if ($("#inboxSection app-header-layout").height() < $("body").height()) {
            console.info("Brave patch");
            //console.info($("#inboxSection app-header-layout").height())
            //console.info($("body").height())
            await sleep(1);
            resizeInboxPatch();
        }
		
		if (previewMailId && await storage.get("browserButtonAction") != BROWSER_BUTTON_ACTION_GMAIL_INBOX) {
			var mail = findMailById(previewMailId);
			openEmail({mail:mail});
		}
	}

	// patch for mac issue popup clipped at top ref: https://bugs.chromium.org/p/chromium/issues/detail?id=428044
	// must make sure rendermoreaccounts still works
	// v3 commented in Chrome 66 because was showing vertical scroll bars
	// v2 add code here after rendering accounts
	// v1 settimeout in resizePopup when changing height
	/*
	if (DetectClient.isMac()) {
		let h = $("body").height();
		$("body").height(h + 1);
	}
	*/
	
	$(window).on("unload", function() {
		if (mouseHasEnteredPopupAtleastOnce) {
            ls["_lastCheckedEmail"] = new Date();
		}
		sendMessageToBG("stopAllSounds");
	});
	
	$('body').hover(function () {
		mouseInPopup = true;
		if (!mouseHasEnteredPopupAtleastOnce) {
			console.log("stop any speaking")
			sendMessageToBG("stopAllSounds");
		}
		mouseHasEnteredPopupAtleastOnce = true;
	}, function () {
		mouseInPopup = false;
	});
	
	polymerPromise2.then(function () {
		var currentlyRenderingMails = false;
		// getInboxScrollTarget() works for polymer
		// #inboxSection app-drawer-layout works when I use overflow-y:scroll
		// patch need to add (#inboxSection app-drawer-layout) because when i set the hasVerticalScrollbars ... {overflow-y:scroll} then the polymer scroll event does not trigger anymore so default
		$(getInboxScrollTarget()).add("#inboxSection app-drawer-layout").on("scroll", function(e) {
			var target = e.originalEvent.target;
			if (target.scrollTop != 0) {
				if (!currentlyRenderingMails) {
					currentlyRenderingMails = true;
					renderMoreAccountMails();
					currentlyRenderingMails = false;
				}
			}
		});
	});
	/*
	var accountsTemplate = document.querySelector('#accountsTemplate');
	if (accountsTemplate) {
		// template-bound event is called when an auto-binding element is ready
		accountsTemplate.addEventListener('template-bound', function () {
			console.log("accounts template-bound")
			
			setMailDetails(accounts, $(".mail"));
		});
		
		syncMails();
		
		accountsTemplate.accounts = accounts;
	}
	*/

	var autoSaveObj = await storage.get("autoSave");
	if (autoSaveObj && autoSaveObj.message) {
		polymerPromise2.then(() => {
			var $dialog = initTemplate("draftSavedTemplate");
			var $draftSavedTextarea = $dialog.find("#draftSavedTextarea");
			$draftSavedTextarea.val(autoSaveObj.message);
			
			// delay after loading poymer or else dialog would not center properly
			setTimeout(() => {
				openDialog($dialog).then(response => {
					console.log("response: " + response);
					if (response == "ok") {
						$draftSavedTextarea
							.focus()
							.select()
						;
						if (document.execCommand('Copy')) {
							$dialog[0].close();
							showMessage(getMessage("done"));
						} else {
							niceAlert("Please select the text and right click > Copy");
						}
					}
					storage.remove("autoSave");
					// v2: autoclosedisable had nothing to do with it, the issue was related to putting span tags inside the cancel and ok buttons (don't do that, just put text). v1:because i set autoCloseDisabled="true" we have to explicitly close the dialog
					//$dialog[0].close();
				}).catch(error => {
					showError("error: " + error);
				});
            }, 1) // 800 before
        });
    }
    
    // Delay some
    setTimeout(function() {
        var $optionsMenu = initTemplate("optionsMenuItemsTemplate");
        initMessages("#options-menu *");
    }, 400);

    if (!isOnline()) {
        showError(getMessage("yourOffline"));
    }
}

console.time("init");
init().then(() => {
	console.timeEnd("init");
});

window.onpopstate = function(event) {
	console.log("pop", location.href, event.state);
	if (!event.state || event.state.openInbox) {
		openInbox();
	}
};