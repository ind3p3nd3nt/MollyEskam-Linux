var monitorLabelsEnabled;
var justInstalled = getUrlValue(location.href, "action") == "install";
var permissionWindow;
var userResponsedToPermissionWindow;
var playing;
var donationClickedFlagForPreventDefaults;

var langs =
[['Afrikaans',       ['af-ZA']],
 ['አማርኛ',           ['am-ET']],
 ['Azərbaycanca',    ['az-AZ']],
 ['বাংলা',            ['bn-BD', 'বাংলাদেশ'],
                     ['bn-IN', 'ভারত']],
 ['Bahasa Indonesia',['id-ID']],
 ['Bahasa Melayu',   ['ms-MY']],
 ['Català',          ['ca-ES']],
 ['Čeština',         ['cs-CZ']],
 ['Dansk',           ['da-DK']],
 ['Deutsch',         ['de-DE']],
 ['English',         ['en-AU', 'Australia'],
                     ['en-CA', 'Canada'],
                     ['en-IN', 'India'],
                     ['en-KE', 'Kenya'],
                     ['en-TZ', 'Tanzania'],
                     ['en-GH', 'Ghana'],
                     ['en-NZ', 'New Zealand'],
                     ['en-NG', 'Nigeria'],
                     ['en-ZA', 'South Africa'],
                     ['en-PH', 'Philippines'],
                     ['en-GB', 'United Kingdom'],
                     ['en-US', 'United States']],
 ['Español',         ['es-AR', 'Argentina'],
                     ['es-BO', 'Bolivia'],
                     ['es-CL', 'Chile'],
                     ['es-CO', 'Colombia'],
                     ['es-CR', 'Costa Rica'],
                     ['es-EC', 'Ecuador'],
                     ['es-SV', 'El Salvador'],
                     ['es-ES', 'España'],
                     ['es-US', 'Estados Unidos'],
                     ['es-GT', 'Guatemala'],
                     ['es-HN', 'Honduras'],
                     ['es-MX', 'México'],
                     ['es-NI', 'Nicaragua'],
                     ['es-PA', 'Panamá'],
                     ['es-PY', 'Paraguay'],
                     ['es-PE', 'Perú'],
                     ['es-PR', 'Puerto Rico'],
                     ['es-DO', 'República Dominicana'],
                     ['es-UY', 'Uruguay'],
                     ['es-VE', 'Venezuela']],
 ['Euskara',         ['eu-ES']],
 ['Filipino',        ['fil-PH']],
 ['Français',        ['fr-FR']],
 ['Basa Jawa',       ['jv-ID']],
 ['Galego',          ['gl-ES']],
 ['ગુજરાતી',           ['gu-IN']],
 ['עברית',           ['he-IL']],
 ['Hrvatski',        ['hr-HR']],
 ['IsiZulu',         ['zu-ZA']],
 ['Íslenska',        ['is-IS']],
 ['Italiano',        ['it-IT', 'Italia'],
                     ['it-CH', 'Svizzera']],
 ['ಕನ್ನಡ',             ['kn-IN']],
 ['ភាសាខ្មែរ',          ['km-KH']],
 ['Latviešu',        ['lv-LV']],
 ['Lietuvių',        ['lt-LT']],
 ['മലയാളം',          ['ml-IN']],
 ['मराठी',             ['mr-IN']],
 ['Magyar',          ['hu-HU']],
 ['ລາວ',              ['lo-LA']],
 ['Nederlands',      ['nl-NL']],
 ['नेपाली भाषा',        ['ne-NP']],
 ['Norsk bokmål',    ['nb-NO']],
 ['Polski',          ['pl-PL']],
 ['Português',       ['pt-BR', 'Brasil'],
                     ['pt-PT', 'Portugal']],
 ['Română',          ['ro-RO']],
 ['සිංහල',          ['si-LK']],
 ['Slovenščina',     ['sl-SI']],
 ['Basa Sunda',      ['su-ID']],
 ['Slovenčina',      ['sk-SK']],
 ['Suomi',           ['fi-FI']],
 ['Svenska',         ['sv-SE']],
 ['Kiswahili',       ['sw-TZ', 'Tanzania'],
                     ['sw-KE', 'Kenya']],
 ['ქართული',       ['ka-GE']],
 ['Հայերեն',          ['hy-AM']],
 ['தமிழ்',            ['ta-IN', 'இந்தியா'],
                     ['ta-SG', 'சிங்கப்பூர்'],
                     ['ta-LK', 'இலங்கை'],
                     ['ta-MY', 'மலேசியா']],
 ['తెలుగు',           ['te-IN']],
 ['Tiếng Việt',      ['vi-VN']],
 ['Türkçe',          ['tr-TR']],
 ['اُردُو',            ['ur-PK', 'پاکستان'],
                     ['ur-IN', 'بھارت']],
 ['Ελληνικά',         ['el-GR']],
 ['български',         ['bg-BG']],
 ['Pусский',          ['ru-RU']],
 ['Српски',           ['sr-RS']],
 ['Українська',        ['uk-UA']],
 ['한국어',            ['ko-KR']],
 ['中文',             ['cmn-Hans-CN', '普通话 (中国大陆)'],
                     ['cmn-Hans-HK', '普通话 (香港)'],
                     ['cmn-Hant-TW', '中文 (台灣)'],
                     ['yue-Hant-HK', '粵語 (香港)']],
 ['日本語',           ['ja-JP']],
 ['हिन्दी',             ['hi-IN']],
 ['ภาษาไทย',         ['th-TH']]];

chrome.windows.onRemoved.addListener(windowId => {
	if (permissionWindow && permissionWindow.id == windowId) {
		// closed permission window
		permissionWindow = null;
	}
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.info("onMessage", message);
    if (message.command == "grantPermissionToEmails") {
        grantPermissionToEmails(message.tokenResponse).then(() => {
            sendResponse();
        });
        return true;
    } else if (message.command == "featuresProcessed") {
        donationClickedFlagForPreventDefaults = true;
        location.reload();
    }
});

function reloadExtension() {
	if (chrome.runtime.reload) {
		chrome.runtime.reload();
	} else {
		niceAlert("You must disable/re-enable the extension in the extensions page or restart the browser");
	}
}

async function waitForStorageSync() {
    await sleep(100);
}

function sendNotificationTest(testType, e) {
    const sendParams = {
        testType:           testType,
        requirementText:    getMessage("notificationTryItOutInstructions"),
        showAll:            e.ctrlKey
    }

    sendMessageToBG("showNotificationTest", sendParams).catch(error => {
        niceAlert(error);
    }).finally(() => {
        hideLoading();
    });
}

async function initPage(tabName) {
	console.log("initPage: " + tabName);
	if (!$("#" + tabName + "Page").length) {
		initTemplate(tabName + "PageTemplate");

		// patch for mac: because polymer dropdowns default values were not correctly populating
		setTimeout(() => {
			initPaperElement($("#" + tabName + "Page [indexdb-storage], #" + tabName + "Page [permissions]"));
		}, 1);

		if (await storage.get("donationClicked")) {
			$("[mustDonate]").each(function (i, element) {
				$(this).removeAttr("mustDonate");
			});
		}

		if (tabName == "welcome") {
			var navLang = await storage.get("language");
			if ($("#lang").find("[value='" + navLang + "']").exists()) {
				$("#lang")[0].selected = navLang;
			} else if ($("#lang").find("[value='" + navLang.substring(0, 2) + "']").exists()) {
				$("#lang")[0].selected = navLang.substring(0, 2);
			} else {
				$("#lang").val("en");
			}

			$("#lang paper-item").click(async function () {
                try {
                    delete window.initMiscPromise;
                    await initUI();
                    storage.remove("tabletViewUrl");
                    await sendMessageToBG("resetInitMiscWindowVars");
                    sendMessageToBG("updateBadge");
                } catch (error) {
                    showError(error);
                }
			});

			$("#notificationsGuide").click(function() {
				showOptionsSection("notifications");
				sendGA("guide", "notifications");
			});

			$("#makeButtonOpenGmailGuide").click(function () {
				showOptionsSection("button");
				$("#browserButtonActionToolTip").show();
				$("#browserButtonActionToolTip")[0].show();
				sendGA("guide", "openGmail");
			});

			$("#guideForPrimaryCategory").click(async function () {
				showOptionsSection("accounts");

				await sleep(1000);
                if (accounts.length >= 2) {
                    $("#accountsListToolTip").show();
                    $("#accountsListToolTip")[0].show();
    
                    await sleep(1500);
                }

                if ($("#inboxLabelToolTip").length) {
                    $("#inboxLabelToolTip").show();
                    $("#inboxLabelToolTip")[0].show();
                }

                await sleep(1500);
                if (!$("#categoriesLabel").hasClass("opened")) {
                    $("#categoriesLabel").click();
                }
                $("#primaryLabelToolTip").show();
                $("#primaryLabelToolTip")[0].show();

				sendGA("guide", "primaryCategory");
			});
			
		} else if (tabName == "notifications") {
			loadVoices();
			// seems we have to call chrome.tts.getVoices twice at a certain 
			if (DetectClient.isLinux()) {
				setTimeout(function() {
					loadVoices();
				}, seconds(1));
			}

			var notificationSound = await storage.get("notificationSound");
			if (notificationSound) {
				$("#soundOptions").show();
			} else {
				$("#soundOptions").hide();
			}

			$("#playNotificationSound").click(function () {
				if (playing) {
					sendMessageToBG("stopNotificationSound");
					playing = false;
					$(this).attr("icon", "av:play-arrow");
				} else {
					playSound();
				}
			});

			$("#notificationSoundVolume").on("change", async function () {
				await waitForStorageSync();
				playSound();
			});

			$("#notificationSoundInputButton").change(function () {
				console.log("notificationSoundInputButton", arguments);
				var params = $(this).data("params");
				var file = this.files[0];
				var fileReader = new FileReader();

				fileReader.onloadend = async function () {

					var customSounds = await storage.get("customSounds");
					if (!customSounds) {
						customSounds = [];
					}

					var soundFilename = file.name.split(".")[0];

					params.title = soundFilename;
					params.data = this.result;
					addCustomSound(params);
				}

				fileReader.onabort = fileReader.onerror = function (e) {
					niceAlert("Problem loading file");
				}

				console.log("file", file)
				fileReader.readAsDataURL(file);
			});

			$("#soundBrowse").change(function () {
				saveSoundFile(this.files);
			});

			var $soundOptions = await generateSoundOptions();
			$(".defaultSoundOptionWrapper").append($soundOptions);

			var $voiceOptions = await generateVoiceOptions();
			$(".defaultVoiceOptionWrapper").append($voiceOptions);

			if (await storage.get("notificationVoice")) {
				$("#voiceOptions").show();
			} else {
				$("#voiceOptions").hide();
			}

			$("#notificationVoice").on("click", "paper-item", function () {
				var voiceName = $("#voiceMenu")[0].selected;
				//var voiceName = $(this).val(); // commented because .val would not work for non-dynamically values like addVoice etc.

				if (voiceName) {
					if (voiceName == "addVoice") {
						openUrl("https://jasonsavard.com/wiki/Voice_Notifications");
					} else {

						if (voiceName.includes("Multilingual TTS Engine")) {
							$("#pitch, #rate").attr("disabled", "true");
						} else {
							$("#pitch, #rate").removeAttr("disabled");
						}

						playVoice();
					}
					$("#voiceOptions").fadeIn();
				} else {
					$("#voiceOptions").hide();
				}
			});

			$("#playVoice").click(function () {
				chrome.runtime.sendMessage({command: "chromeTTS", isSpeaking:true}, isSpeaking => {
                    if (isSpeaking) {
                        chrome.runtime.sendMessage({command: "chromeTTS", stop:true});
                        $("#playVoice").attr("icon", "av:stop");
                    } else {
                        playVoice();
                    }
                });
			});

			$("#voiceOptions paper-slider").on("change", async function () {
				await waitForStorageSync();
				playVoice();
            });
            
            $("#moveIntoActionCenter").click(function() {
                if (this.checked) {
                    niceAlert("This will also set the option 'Close after' to 'never'.");
                    $("#showNotificationDuration_rich")[0].select("infinite");
                    storage.set("showNotificationDuration", "infinite");
                }
            });
			
			$("#runInBackground").click(function () {
				var that = this;
				// timeout to let permissions logic determine check or uncheck the before
				setTimeout(function () {
					if (that.checked) {
						openDialog("runInBackgroundDialogTemplate");
					}
				}, 1);
			});

			$("#showContactPhotos").click(function() {
				chrome.permissions.request({ origins: [Origins.CONTACT_PHOTOS] }, granted => {
					if (granted) {
						showMessage(getMessage("done"));
						niceAlert("Make sure to also grant access to each Gmail account:<br>Popup Window > Email Account Menu <iron-icon icon='more-vert'></iron-icon> > Show Contact Photos");
					}
				});
			});

			async function initNotifications(startup) {
				var showMethod;
				var hideMethod;
				if (startup) {
					showMethod = "show";
					hideMethod = "hide";
				} else {
					showMethod = "slideDown";
					hideMethod = "slideUp";
				}
				
				var desktopNotification = await storage.get("desktopNotification");
				if (desktopNotification == "") {
					$("#desktopNotificationOptions")[hideMethod]();
				} else if (desktopNotification == "text") {
					$("#desktopNotificationOptions")[showMethod]();
					$("#textNotificationOptions")[showMethod]();
					$("#richNotificationOptions")[hideMethod]();
				} else if (desktopNotification == "rich") {
					$("#desktopNotificationOptions")[showMethod]();
					$("#textNotificationOptions")[hideMethod]();
					$("#richNotificationOptions")[showMethod]();
				}
			}
			
			initNotifications(true);

			function requestTextNotificationPermission(showTest, e) {
				Notification.requestPermission(permission => {
					if (permission == "granted") {
						if (showTest) {
                            sendNotificationTest("text", e);
						}
					} else {
						niceAlert("Permission denied! Refer to <a style='color:blue' href='https://support.google.com/chrome/answer/3220216'>Chrome notifications</a> to enable them." + " (permission: " + permission + ")");
					}
				});
			}
			
			$("#desktopNotification paper-item").click(async function(e) {
                await waitForStorageSync();
				initNotifications();
				if (await storage.get("desktopNotification") == "text") {
					requestTextNotificationPermission(false, e);
				}
			});
			
			$("#testNotification").click(async function(e) {
                await waitForStorageSync();
                const desktopNotification = await storage.get("desktopNotification")
				if (desktopNotification == "text") {
					requestTextNotificationPermission(true, e);
				} else if (desktopNotification == "rich") {
                    showLoading();
                    sendNotificationTest("rich", e);
				}
			});
			
			$("#showNotificationDuration_text paper-item").click(function() {
				const value = $(this).attr("value");
				$("#showNotificationDuration_rich")[0].setAttribute("selected", value);
			});

			$("#showNotificationDuration_rich paper-item").click(function() {
                const value = $(this).attr("value");
				$("#showNotificationDuration_text")[0].setAttribute("selected", value);
                if (value == "infinite") {
                    niceAlert("This setting might require your to also change your system notification settings. Click Ok for instructions.").then(() => {
                        openUrl("https://jasonsavard.com/wiki/System_Notifications?ref=neverDisappear");
                    });
                }
			});

			$("#showSnoozedNotifications").change(async function () {
				if (this.checked && await storage.get("accountAddingMethod") == "autoDetect") {
					openGenericDialog({
						content: getMessage("switchToAddAccounts"),
						okLabel: getMessage("addAccount"),
						showCancel: true
					}).then(response => {
						if (response == "ok") {
							openUrl("options.html?ref=showSnoozedNotifications&highlight=addAccount#accounts");
						}
					});
					$("#showSnoozedNotifications")[0].checked = false;
				}
			});

		} else if (tabName == "dnd") {
			setTimeout(function() {
				if (location.href.match("highlight=DND_schedule")) {
					$("#dndSchedule").click();
				}
			}, 500);

			if (await storage.get("dndDuringCalendarEvent")) {
				$("#dndDuringCalendarEvent")[0].checked = true;
			}
			
			$("#dndDuringCalendarEvent").change(function() {
				let checked = this.checked;
				sendMessageToCalendarExtension({action:"getInfo"}).then(response => {
					if (response) {
						storage.set("dndDuringCalendarEvent", checked);
					} else {
						$("#dndDuringCalendarEvent")[0].checked = false;
						requiresCalendarExtension("dndDuringCalendarEvent");
					}
				}).catch(error => {
                    requiresCalendarExtension("dndDuringCalendarEvent");
                });
			});

			$("#dndSchedule").click(async function () {
				var $dialog = initTemplate("dndScheduleDialogTemplate");
				var $timetable = $dialog.find("#dndTimetable");
				jqueryEmpty($timetable);

				let DND_timetable = await storage.get("DND_timetable");

				let $header = $("<div class='header layout horizontal'>");

				$header.append("<div class='time'>");
				for (var a = 1; a < 8; a++) {
					let $dayHeader = $("<div class='day'>")
					let $allDay = $("<paper-icon-button class='allDay' icon='done-all'>")
					$allDay.attr("day", a % 7);
					$allDay.off().click(async function () {
						if (await donationClicked("DND_schedule")) {
							let allDayChecked = this.checked;
							let day = $(this).attr("day");
							$("#dndScheduleDialog paper-checkbox[day='" + day + "']").each(function () {
								this.checked = !allDayChecked;
							});
							this.checked = !this.checked;
						}
					});
					$dayHeader.append($allDay);
					$dayHeader.append(dateFormat.i18n.dayNamesShort[a % 7]);
					$header.append($dayHeader);
				}

				$timetable.append($header);

				for (var hour = 0; hour < 24; hour++) {
					let $row = $("<div class='row'>");

                    const date = new DateZeroTime();
                    date.setHours(hour);

					let $time = $("<div class='time'>");
					$time.text(date.toLocaleTimeStringJ());

					$row.append($time);

					for (var b = 0; b < 7; b++) {
						let day = (b + 1) % 7;
						let $checkbox = $("<paper-checkbox>");
						$checkbox.attr("day", day);
						$checkbox.attr("hour", hour);
						$checkbox.off().click(async function () {
							if (!await donationClicked("DND_schedule")) {
								this.checked = false;
							}
						});

						if (DND_timetable && DND_timetable[day][hour]) {
							$checkbox[0].checked = true;
						}

						$row.append($checkbox);
					}
					let $allWeek = $("<paper-icon-button class='allWeek' icon='done-all'>")
					$allWeek.off().click(async function () {
						if (await donationClicked("DND_schedule")) {
							let allWeekChecked = this.checked;
							$(this).closest(".row").find("paper-checkbox").each(function () {
								this.checked = !allWeekChecked;
							});
							this.checked = !this.checked;
						}
					});

					$row.append($allWeek);
					$timetable.append($row);
				}

				$dialog.find(".resetDND").off().click(function () {
					$("#dndScheduleDialog paper-checkbox").each(function () {
						this.checked = false;
					});
				});
				$dialog.find(".okDialog").off().click(async function () {
					let atleastOneChecked = false;
					let DND_timetable = {};
					$("#dndScheduleDialog paper-checkbox").each(function () {
						let day = $(this).attr("day");
						let hour = $(this).attr("hour");
						if (!DND_timetable[day]) {
							DND_timetable[day] = {};
						}
						DND_timetable[day][hour] = this.checked;
						if (this.checked) {
							atleastOneChecked = true;
						}
					});
					// just a flag to indicate schedule is on/off
					await storage.set("DND_schedule", atleastOneChecked);
					// store actual hours
					await storage.set("DND_timetable", DND_timetable);

					sendMessageToBG("updateBadge");
				});

				openDialog($dialog);
			});

		} else if (tabName == "button") {

			$("#hide_count, #showButtonTooltip").change(async function () {
                await waitForStorageSync();
                sendMessageToBG("updateBadge");
			});

			$("#badgeIcon paper-icon-item").click(async function () {
				await waitForStorageSync();
				if ($(this).attr("value") == "custom") {
					buttonIcon.setIcon({ force: true });
                    sendMessageToBG("updateBadge");

					$(this).closest("paper-dropdown-menu")[0].close();

					var $dialog = initTemplate("customButtonDialogTemplate");

					$dialog.find("#chooseSignedOutIcon").off().on("click", function () {
						$("#signedOutButtonIconInput").trigger("click");
						return false;
					});

					$dialog.find("#chooseNoUnreadEmail").off().on("click", function () {
						$("#noUnreadButtonIconInput").trigger("click");
						return false;
					});

					$dialog.find("#chooseUnreadEmail").off().on("click", function () {
						$("#unreadButtonIconInput").trigger("click");
						return false;
					});

					$dialog.find("#signedOutButtonIconInput, #noUnreadButtonIconInput, #unreadButtonIconInput").off().on("change", function (e) {
						console.log(this.files);
						var buttonId = $(this).attr("id");
						var file = this.files[0];
						var fileReader = new FileReader();

						fileReader.onload = function () {
							console.log("result: ", this.result);

							var canvas = document.createElement("canvas");
							var img = new Image();
							img.onload = async function () {
								var widthHeightToSave;
								if (this.width <= 19) {
									widthHeightToSave = 19;
								} else {
									widthHeightToSave = 38;
								}
								canvas.width = canvas.height = widthHeightToSave;

								var context2 = canvas.getContext("2d");
								context2.drawImage(this, 0, 0, widthHeightToSave, widthHeightToSave);

								console.log("dataurl: " + canvas.toDataURL().length);

								async function storeIcon(all) {
									if (all || buttonId == "signedOutButtonIconInput") {
										await storage.set("customButtonIconSignedOut", canvas.toDataURL());
									}
									if (all || buttonId == "noUnreadButtonIconInput") {
										await storage.set("customButtonIconNoUnread", canvas.toDataURL());
									}
									if (all || buttonId == "unreadButtonIconInput") {
										await storage.set("customButtonIconUnread", canvas.toDataURL());
									}

									$("input[name='icon_set'][value='custom']").click();
									await updateCustomIcons();
                                    buttonIcon.setIcon({ force: true });
                                    sendMessageToBG("updateBadge");
								}

								if (await storage.get("customButtonIconSignedOut") || await storage.get("customButtonIconNoUnread") || await storage.get("customButtonIconUnread")) {
									storeIcon();
									showMessage(getMessage("done"));
								} else {
									openGenericDialog({
										content: "Use this icon for all email states?",
										okLabel: "Yes to all",
										cancelLabel: "Only this one"
									}).then(response => {
										if (response == "ok") {
											storeIcon(true);
										} else {
											storeIcon();
										}
										niceAlert(getMessage("done"));
									});
								}

							}

							img.onerror = function (e) {
								console.error(e);
								niceAlert("Error loading image, try another image!");
							}

							img.src = this.result;
							//img.src = "chrome://favicon/size/largest/https://inbox.google.com";
							//img.src = "https://ssl.gstatic.com/bt/C3341AA7A1A076756462EE2E5CD71C11/ic_product_inbox_16dp_r2_2x.png";

						}

						fileReader.onabort = fileReader.onerror = function (e) {
							console.error("fileerror: ", e);
							if (e.currentTarget.error.name == "NotFoundError") {
								alert("Temporary error, please try again.");
							} else {
								alert(e.currentTarget.error.message + " Try again.");
							}
						}

						fileReader.readAsDataURL(file);

					});

					openDialog($dialog).then(function (response) {
						if (response != "ok") {
							openUrl("https://jasonsavard.com/wiki/Button_icon#Add_your_own_custom_icons");
						}
					});
				} else {
                    buttonIcon.setIcon({ force: true });
                    sendMessageToBG("updateBadge");
				}
				$("#currentBadgeIcon").attr("src", await buttonIcon.generateButtonIconPath());
			});
			
			initPopupWindowOptions();

			$("#browserButtonAction paper-item").click(async function () {
				await waitForStorageSync();
				initPopupWindowOptions($(this).attr("value"));
				initPopup();
			});

			$(".browserButtonActionIfNoEmail paper-item").click(async function () {
				await waitForStorageSync();
				initPopup();
			});

			updateCustomIcons();

			$("#testButtonIconAnimation").click(async function() {
				showMessage("Don't look here, look at the top right :)")
				await sleep(seconds(1));
                buttonIcon.startAnimation({testAnimation:true});
			});

			$("#sample-unread-count").css("background-color", await storage.get("unreadCountBackgroundColor"));

			$("#unread-count-background-color")
				.attr("color", await storage.get("unreadCountBackgroundColor"))
				.off().on("color-changed", async e => {
					let color = e.originalEvent.detail.value;
					await storage.set("unreadCountBackgroundColor", color);
					$("#sample-unread-count").css("background-color", color);
					sendMessageToBG("updateBadge");
				})
			;

		} else if (tabName == "general") {
			setTimeout(function () {
				if (location.href.match("highlight=quickContact")) {
					$("#quickComposeWrapper").addClass("highlight");
					setTimeout(function () {
						$("#quickComposeEmail").focus();
					}, 200);
				}
			}, 500);

			initPopupWindowOptions();

			async function initSetPositionAndSizeOptions() {
				if (await storage.get("setPositionAndSize")) {
					$("#setPositionAndSizeOptions").show();
					$("#testOutPopupWindow").show();
				} else {
					$("#setPositionAndSizeOptions").hide();
					$("#testOutPopupWindow").hide();
				}
			}

			initSetPositionAndSizeOptions();
			$("#setPositionAndSize").change(async function () {
				await waitForStorageSync();
				initSetPositionAndSizeOptions();
			});

			$("#testOutPopupWindow").click(function() {
				openTabOrPopup({url:"https://mail.google.com?view=cm&fs=1&tf=1", name:"test", testingOnly:true});
			});
            
			function reinitContextMenu() {
				console.log("reinitContextMenu");
				clearTimeout(window.initQuickContactContextMenuTimeout);
				window.initQuickContactContextMenuTimeout = setTimeout(function () {
                    // Must be called from bg or i was loosing menu items would not respond??
                    sendMessageToBG("initQuickContactContextMenu", { update: true });
				}, 200);

			}

			$("#showContextMenuItem").change(function () {
				reinitContextMenu();
			});

			$("#quickComposeEmail, #quickComposeEmailAlias").on("blur keydown", function () {
				reinitContextMenu();
			});

			$("#autoCollapseConversations").change(function() {
				if (!this.checked) {
					niceAlert("Done. But, but not recommended because it will slow the loading of message.");
				}
			});

			$("#starringAppliesInboxLabel").change(async function (e) {
                await waitForStorageSync();
				var that = this;
				if (await storage.get("accountAddingMethod") == "autoDetect") {
					niceAlert("Only available with enabling adding accounts method in Accounts tab");

					// reset it now
					that.checked = false;
					storage.remove("starringAppliesInboxLabel");
				}
			});

			$("#useBasicHTMLView").change(async function () {
                await waitForStorageSync();
                
				if (this.checked) {
					openGenericDialog({
						title: getMessage("useBasicHTMLView"),
						content: "This is generally only used for people with slow internet connections!",
						cancelLabel: getMessage("testIt"),
						noAutoFocus: true
					}).then(async response => {
						if (response == "cancel") {
							openUrl(accounts[0].getMailUrl({ useBasicGmailUrl: true }));
						} else {
                            pollAndLoad({showNotification:false, refresh:true});
                        }
					});
				} else {
                    pollAndLoad({showNotification:false, refresh:true});
                }
            });
            
            $("#showEOM, #hideSentFrom").change(async function () {
                await waitForStorageSync();
                pollAndLoad({showNotification:false, refresh:true});
            });

		} else if (tabName == "accounts") {
			setTimeout(function () {
				if (location.href.match("highlight=addAccount")) {
					highlightAddAccount();
				}
			}, 500);
			
			$("#signIn").click(function() {
				openUrl(Urls.SignOut);
			});
			
			$(".refresh").click(function() {
				pollAndLoad({showNotification:true, refresh:true});
				return false;
			});
			
			$("#signInNotWorking").click(function() {
				openUrl("https://jasonsavard.com/wiki/Auto-detect_sign_in_issues");
			});

			initDisplayForAccountAddingMethod();
			
			$("#accountAddingMethod paper-radio-button").click(async (e) => {
                await waitForStorageSync();
                const accountAddingMethod = await storage.get("accountAddingMethod");

                if (accountAddingMethod == "oauth") {
                    await sendMessageToBG("switchToOauth");
                    await initAllAccounts();
                }

				await resetSettings(accounts);
				await alwaysPromise(pollAndLoad({showNotification:false, refresh:true}));
				await initDisplayForAccountAddingMethod();
                sendMessageToBG("restartCheckEmailTimer", true);
			});
			
			$("#pollingInterval paper-listbox").on("iron-activate", async function(e) {
				console.log("iron-activate");
				var pollingInterval = e.originalEvent.detail.selected;
				if (pollingInterval == "realtime" && !supportsRealtime()) {
					niceAlert("Only available with Chrome");
				} else if ($("#accountAddingMethod")[0].selected == "autoDetect" && pollingInterval == "realtime") {
					e.preventDefault();
					highlightAddAccount();
					niceAlert(getMessage("switchToAddAccounts"));
				} else {
					var previousPollingInterval = await storage.get("poll");

                    try {
                        if (previousPollingInterval != "realtime" && pollingInterval == "realtime") {
                            await asyncForEach(accounts, async (account) => {
                                if (!await account.isBeingWatched()) {
                                    await account.enablePushNotifications();
                                }
                            });
                        } else {
                            if (previousPollingInterval == "realtime" && pollingInterval != "realtime") {
                                accounts.forEach(account => {
                                    account.stopWatchAlarm();
                                });
                            }
                        }

						console.log("all good")
						await storage.set("poll", pollingInterval);
						sendMessageToBG("restartCheckEmailTimer", true);
                    } catch (error) {
						console.error(error)
						$("#pollingInterval paper-listbox")[0].select( previousPollingInterval );
						niceAlert("Could not enable real-time!" + " (error: " + error + ")");
                    }
				}
			});

			$("#addAccount").click(async function () {
				let tokenResponses = await storage.get("tokenResponsesEmails");
                // already added an account (assuming chrome profile) so go directly to google accounts prompt
				if (supportsChromeSignIn() && !(tokenResponses && tokenResponses.length)) {
                    openPermissionsDialog({ oAuthForDevices: oAuthForEmails }).then(response => {
						console.log("openpermissresponse", response);
						if (response && response.useGoogleAccountsSignIn) {
							// nothing already handled in onMessage
						} else {
							grantPermissionToEmails(response.tokenResponse);
						}
					});
				} else {
					requestPermission({ oAuthForDevices: oAuthForEmails, useGoogleAccountsSignIn: true });
				}
			});

			$("#syncSignInOrder").click(function () {
				showLoading();
				syncSignInOrderForAllAccounts().then(() => {
					showMessage(getMessage("done"));
				}).catch(error => {
					niceAlert("Try signing out and into your Gmail accounts and then do this sync again.\n\n" + error);
				}).then(() => {
					hideLoading();
				});
            });
            
        } else if (tabName == "skinsAndThemes") {

            const $skinsListing = $("#skinsAndThemesListing");

            showLoading();
            try {
                const skins = await Controller.getSkins();
                skins.forEach(skin => {
                    const $row = $("<tr class='skinLine'><td class='name'>" + skin.name + "</td><td class='skinImageWrapper'><a class='skinImageLink'><img class='skinImage'/></a></td><td class='author'></td><td>" + skin.installs + "</td><td><paper-icon-button class='addSkin' icon='add'></paper-icon-button></td></tr>");
                    $row.data("skin", skin);
                    if (skin.image) {
                        $row.find(".skinImage")
                            .attr("src", skin.image)
                        ;
                        $row.find(".skinImageLink")
                            .attr("href", skin.image)
                            .attr("target", "_previewWindow")
                        ;
                    }
    
                    var $author = $("<a/>");
                    $author.text(skin.author);
                    if (skin.author_url) {
                        $author.attr("href", skin.author_url);
                        $author.attr("target", "_preview");
                        $row.find(".skinImage")
                            .css("cursor", "pointer")
                            //.click(function() {
                                //window.open(skin.author_url);
                            //})
                        ;
                    }
                    $row.find(".author").append($author);
                    $row.find(".addSkin").click(() => {
                        window.open("https://jasonsavard.com/wiki/Skins_and_Themes?ref=skinOptionsTab", "emptyWindow");
                    });
    
                    $skinsListing.append($row);
                });
            } catch (error) {
                $skinsListing.append("Problem loading skins: " + error);
            }

            hideLoading();
			
		} else if (tabName == "voiceInput") {
			if (!('webkitSpeechRecognition' in window)) {
				$("#voiceInput").attr("disabled", true);
			}


			initVoiceInputOptions();

            if (await storage.get("voiceInput")) {
                $("#voiceInput")[0].checked = true;
            }

			$("#voiceInput").change(async function () {
				if (this.checked) {
                    chrome.permissions.request({permissions: ["webRequest"]}, async function(granted) {
                        if (granted) {
                            await storage.enable("voiceInput");
                            // note: when removing webRequest it stays accessible until extension is reloaded
                            sendMessageToBG("initWebRequest");
        
                            chrome.tabs.query({ url: "https://mail.google.com/*" }, function (tabs) {
                                $.each(tabs, function (index, tab) {
                                    insertSpeechRecognition(tab.id);
                                });
                            });

                            initVoiceInputOptions();
                        }
                    });
				} else {
                    await storage.disable("voiceInput");
					// wait for pref to be saved then reload tabs
					await waitForStorageSync();
					chrome.tabs.query({ url: "https://mail.google.com/*" }, function (tabs) {
						$.each(tabs, function (index, tab) {
							chrome.tabs.reload(tab.id);
						});
                    });
                    
                    initVoiceInputOptions();
				}
			});

			// init languages
			if (window.voiceInputLanguage) {
				var voiceInputDialectPref = await storage.get("voiceInputDialect", getPreferredLanguage());
				var voiceInputLanguageIndex;
				var voiceInputDialectIndex;
				for (var i = 0; i < langs.length; i++) {
					voiceInputLanguage.options[i] = new Option(langs[i][0], i);
					//console.log("lang: " + langs[i][0]);
					for (var a = 1; a < langs[i].length; a++) {
						//console.log("dial: " + langs[i][a][0]);
						if (langs[i][a][0] == voiceInputDialectPref) {
							voiceInputLanguageIndex = i;
							voiceInputDialectIndex = a - 1;
							break;
						}
					}
				}

				voiceInputLanguage.selectedIndex = voiceInputLanguageIndex;
				updateVoiceInputCountry();
				voiceInputDialect.selectedIndex = voiceInputDialectIndex;

				$("#voiceInputLanguage").change(function () {
					updateVoiceInputCountry();
					if (voiceInputLanguage.options[voiceInputLanguage.selectedIndex].text == "English") {
						voiceInputDialect.selectedIndex = 6;
					}
					onVoiceInputLanguageChange();
				});

				$("#voiceInputDialect").change(function () {
					onVoiceInputLanguageChange();
				});
			}
		} else if (tabName == "admin") {
			$("#deleteAllCustomSounds").click(async function () {
				await storage.remove("customSounds");
				location.reload();
            });
            
            $("#testSerialization").click(async () => {
                var begin = Date.now();
                const accounts = await retrieveAccounts();
                var end = Date.now();

                var timeSpent=(end-begin)/1000+"secs";

                console.log("accounts", accounts);
                let size = 0;
                JSON.stringify(accounts, function(key, value) {
                    console.log(key + ": " + typeof value, value);
                    if (value) {
                        if (value.length) {
                            console.log("len: " + value.length)
                            size += value.length;
                        }
                        if (value.byteLength) {
                            console.log("bytelen: " + value.byteLength);
                            size += value.byteLength;
                        }
                    }
                    return value;
                });
                niceAlert(timeSpent + "<br>size: " + new Intl.NumberFormat().format(size));
            });

            $("#resetSettings").click(async () => {
                localStorage.clear();
                
                //wrappedDB.db.close();
                const req = indexedDB.deleteDatabase(wrappedDB.db.name);
                req.onsuccess = function () {
                    niceAlert("Click OK to restart the extension").then(() => {
                        reloadExtension();
                    });
                };
                req.onerror = function () {
                    niceAlert("Couldn't delete database");
                };
                req.onblocked = function () {
                    //niceAlert("Couldn't delete database due to the operation being blocked");
                    niceAlert("Storage blocked, but click OK to restart anyways").then(() => {
                        reloadExtension();
                    });
                };
            });

			$("#saveSyncOptions").click(function () {
				syncOptions.save("manually saved").then(function () {
					openGenericDialog({
						title: "Done",
						content: "Make sure you are signed into the browser for the sync to complete",
						cancelLabel: getMessage("moreInfo")
					}).then(response => {
						if (response == "cancel") {
							if (DetectClient.isFirefox()) {
								openUrl("https://support.mozilla.org/kb/access-mozilla-services-firefox-accounts");
							} else {
								openUrl("https://support.google.com/chrome/answer/185277");
							}
						}
					});
				}).catch(function (error) {
					showError("Error: " + error);
				});
				return false;
			});

			$("#loadSyncOptions").click(function () {
				syncOptions.fetch(function (response) {
					// do nothing last fetch will 
					console.log("syncoptions fetch response", response);
				}).catch(function (response) {
					console.log("catch reponse", response);
					// probably different versions
					if (response && response.items) {
						return new Promise(function (resolve, reject) {
							openGenericDialog({
								title: "Problem",
								content: response.error + "<br><br>" + "You can force it but it <b>might create issues</b> in the extension and the only solution will be to re-install without loading settings!",
								okLabel: "Force it",
								showCancel: true
							}).then(function (dialogResponse) {
								if (dialogResponse == "ok") {
									resolve(response.items);
								} else {
									reject("cancelledByUser");
								}
							});
						});
					} else {
						throw response;
					}
				}).then(function (items) {
					console.log("syncoptions then");
					return syncOptions.load(items);
				}).then(function () {
					niceAlert("Click OK to restart the extension").then(() => {
						reloadExtension();
					});
				}).catch(function (error) {
					console.log("syncoptions error: " + error);
					if (error != "cancelledByUser") {
						openGenericDialog({
							content: "error loading options: " + error
						});
					}
				});

				return false;
			});

			$("#exportLocalStorage").click(function () {
				downloadObject(localStorage, "localStorage.json");
			})
			$("#importLocalStorage").click(function () {
				var localStorageText = $("#jsonString").val();
				if (localStorageText) {
					var localStorageImportObj = JSON.parse(localStorageText);
					localStorage.clear();
					for (item in localStorageImportObj) {
						localStorage.setItem(item, localStorageImportObj[item]);
					}
					niceAlert("Done. Reload the extension to use these new settings!");
				} else {
					niceAlert("Must enter JSON string!")
				}
			})

			$("#importIndexedDB").click(function () {
				var jsonString = $("#jsonString").val();
				if (jsonString) {
					var jsonObject = JSON.parse(jsonString);

					syncOptions.importIndexedDB(jsonObject).then(function () {
						niceAlert("Done. Reload the extension to use these new settings!");
					}).catch(function (error) {
						niceAlert(error);
					});

				} else {
					niceAlert("Must enter JSON string!")
				}
			});

			$("#exportIndexedDB").click(function () {
				syncOptions.exportIndexedDB({ exportAll: true }, function (response) {
					if (response.error) {
						niceAlert(response.error);
					} else {
						downloadObject(response.data, "indexedDB.json");
					}
				});
			});

			$("#maxUnauthorizedAccount paper-item").click(async function () {
				await waitForStorageSync();
				pollAndLoad({ showNotification: true });
			});

			$("#console_messages").change(function () {
				openGenericDialog({ content: this.checked ? "logging enabled" : "logging disabled", okLabel: "Restart Extension", showCancel: true }).then(response => {
					if (response == "ok") {
						reloadExtension();
					}
				});
			});
			
		}
	}
}

function showOptionsSection(tabName) {
	console.log("showtabName: " + tabName)
	$("#mainTabs")[0].selected = tabName;
	$("#pages").prop("selected", tabName);

	$(".page").removeClass("active");
	setTimeout(() => {
		$(".page.iron-selected").addClass("active");
	}, 1);

    //document.body.scrollTop = 0;
    $("app-header-layout app-header")[0].scrollTarget.scroll({top:0})

	initPage(tabName);
	// wait for tab animation
	setTimeout(() => {
		$("app-header").first()[0].notifyResize();
    }, 500);
    
    // timeout required because the pushstate created chopiness
    setTimeout(() => {
        history.pushState({}, "blah", "#" + tabName);
    }, 500)

	const emailParam = getUrlValue(location.href, "accountEmail", true);
	if (tabName == "accounts") {
		if (emailParam) {
			loadAccountsOptions({ selectedEmail: emailParam });
		} else {
			setTimeout(function () {
				loadAccountsOptions();
			}, 500)
		}
	}
	
}

function initSelectedTab() {
	var tabId = location.href.split("#")[1];
	
	if (tabId) {
		showOptionsSection(tabId);
	} else {
		showOptionsSection("notifications");
	}
}

function getSelectedAccount() {
	return $("#monitorLabels").data("account");
}

async function pollAndLoad(params) {
	console.log("pollAndLoad");
	showLoading();
    
    try {
        await sendMessageToBG("pollAccounts", params);
        await initAllAccounts();
		loadAccountsOptions(params);
    } catch (error) {
        showError(error);
    } finally {
        hideLoading();
    }
}

function addPaperItem(params) { // node, value, label, prepend
	var paperItem;
	
	if (params.icon) {
		paperItem = document.createElement("paper-icon-item");
		var $ironIcon = $("<iron-icon slot='item-icon'/>").attr("icon", params.icon);
		jqueryEmpty($(paperItem)); // patch seems polymer would add shadydom when creating the paper-icon-item so i had to remove it
		$(paperItem).append($ironIcon);
		$(paperItem).append(params.label);
	} else {
		paperItem = document.createElement("paper-item");
		var textNode = document.createTextNode(params.label);
		paperItem.appendChild(textNode);
	}
	
	paperItem.setAttribute("value", params.value);
	
	if (params.prepend) {
		params.node.insertBefore(paperItem, params.node.firstChild);
	} else {
		params.node.appendChild(paperItem);
	}
}

function addSeparator(node, prepend) {
	var paperItem = document.createElement("paper-item");
	paperItem.setAttribute("class", "separator");
	paperItem.setAttribute("disabled", "");
	
	if (prepend) {
		node.insertBefore(paperItem, node.firstChild);
	} else {
		node.appendChild(paperItem);
	}
}

async function generateSoundOptions(account, labelValue) {
	var template = $("#soundsDropDown")[0];
	if (template) {
		template = template.cloneNode(true);
		var $template = $(template.content);
		var paperMenuDiv = template.content.querySelector("paper-listbox");
		
		$template.find("paper-dropdown-menu").attr("label", getMessage("notificationSound"));
	
		var sounds = await storage.get("customSounds");
		if (sounds && sounds.length) {
			addSeparator(paperMenuDiv);
			$.each(sounds, function(index, sound) {
				addPaperItem({node:paperMenuDiv, value:"custom_" + sound.name, label:sound.name});
			});
		}
		
		addSeparator(paperMenuDiv);
		addPaperItem({node:paperMenuDiv, value:"custom", label:getMessage("uploadSound"), icon:"cloud-upload"});
		addPaperItem({node:paperMenuDiv, value:"record", label:getMessage("recordSound"), icon:"av:mic"});

		var dropdown = document.importNode(template.content, true);
		var $dropdown = $(dropdown);
		var $paperMenu = $dropdown.find("paper-listbox");
	
		initMessages($dropdown.find("paper-item, paper-icon-item"));
		
		var defaultValue = await storage.get("notificationSound");
		
		if (account) {
			var settingValue = await account.getSettingForLabel("sounds", labelValue, defaultValue);
			$paperMenu[0].setAttribute("selected", settingValue);
		} else {
			$paperMenu[0].setAttribute("selected", defaultValue);
		}
		
		if (account) {
			initPaperElement($paperMenu, {mustDonate:true, account:account, key:"sounds", label:labelValue});
		}
		
		$paperMenu.find("paper-item, paper-icon-item").click(async function(event) {
			var $paperMenu = $(this).closest("paper-listbox");
			var soundName = $(this).attr("value");

			if (DetectClient.isWindows() && !soundName) {
                let showWarning;
                const desktopNotification = await storage.get("desktopNotification");
				if (account) { // show warning if sound off and specific label notifs off
					showWarning = await account.getSettingForLabel("notifications", labelValue, desktopNotification);
				} else { // show warning if general sound off and notifiations off
					showWarning = desktopNotification;
				}
				if (showWarning) {
					// commented because I'm using "silent = true" for notifications
					//niceAlert("Note: Windows also has notification sounds. To disable them follow these <a href='https://jasonsavard.com/wiki/Notification_Sounds'>instructions</a>.");
				}
			}

			if (!account) {
				$("#playNotificationSound").css("display", "block");

				if (soundName) {
					$("#soundOptions").fadeIn();
				} else {
					$("#soundOptions").hide();
				}
			}

			if (soundName && soundName != "custom" && soundName != "record") {
				playSound(soundName);
			}

			if (soundName == "custom") {
				if (!account || await storage.get("donationClicked")) {
					openSoundDialog({$paperMenu:$paperMenu, account:account, labelValue:labelValue});
				} else {
					// do nothing cause the initOptions will take care of contribute dialog
				}
			} else if (soundName == "record") {
				if (!account || await storage.get("donationClicked")) {
					var mediaStream;
					var mediaRecorder;
					var chunks = [];
					var blob;
					
					var $dialog = initTemplate("recordSoundDialogTemplate");
					var $recordSoundWrapper = $dialog.find(".recordSoundWrapper");
					var $recordSound = $dialog.find("#recordSoundButton");
					$recordSound.off().on("click", function() {
						if ($recordSoundWrapper.hasClass("recording")) {
							mediaRecorder.stop();
						} else {
							//navigator.mediaDevices.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
							navigator.mediaDevices.getUserMedia({audio: true}).then(responseMediaStream => {
								mediaStream = responseMediaStream;
								$dialog.off().on("iron-overlay-closed", function() {
									mediaStream.getAudioTracks()[0].stop();
									$recordSoundWrapper.removeClass("recordedSound");
									$recordSoundWrapper.removeClass("recording");
								});
								
								chunks = [];
								mediaRecorder = new MediaRecorder(mediaStream);
								mediaRecorder.start();
								mediaRecorder.ondataavailable = function(e) {
									chunks.push(e.data);
									
									mediaStream.getTracks().forEach(function(track) {
										track.stop();
									});
									
									blob = new Blob(chunks, { 'type' : 'audio/webm' }); //  'audio/webm'  OR   audio/ogg; codecs=opus
									blobToBase64(blob).then(response => {
										$dialog.find("source")[0].src = response;
										
										$dialog.find("audio")[0].load();
										$dialog.find("audio")[0].play();
										
										$recordSoundWrapper.removeClass("recording");
										$recordSoundWrapper.addClass("recordedSound");
										
										$dialog.find(".buttons").removeAttr("hidden");
									}).catch(error => {
										showError(error);
									});
								}
								mediaRecorder.onwarning = function(e) {
								    console.warn('mediarecord wraning: ' + e);
								};
								mediaRecorder.onerror = function(e) {
									console.error('mediarecord error: ' + e);
									showError(e);
								};
								
								$recordSoundWrapper.removeClass("recordedSound");
								$recordSoundWrapper.addClass("recording");
							}).catch(error => {
								showError(error.name);
							});
						}
					});
					
					$dialog.find(".okDialog").off().click(function() {
						if ($("#recordedSoundTitle")[0].validate()) {
							addCustomSound({$paperMenu:$paperMenu, account:account, labelValue:labelValue, title:$("#recordedSoundTitle").val(), data:$dialog.find("source")[0].src, overwrite:true});
							$dialog[0].close();
							showMessage(getMessage("done"));
						}
					});
					
					openDialog($dialog).then();
				}
			} else if (!account) {
				storage.set("notificationSound", soundName).catch(error => {
					showError(error);
				});
			}
		});
		
		$("#browserButtonAction").click(function() {
			$("#browserButtonActionToolTip").hide();
		});
		
	}
	
	return $dropdown;
}

async function generateVoiceOptions(account, labelValue) {
	var template = $("#voiceHearOptionsDropDown")[0];
	if (template) {
		template = template.cloneNode(true);
		var $template = $(template.content);
		var paperMenuDiv = template.content.querySelector("paper-listbox");
		
		$template.find("paper-dropdown-menu").attr("label", getMessage("hearEmail"));
	
		if (account) {
			addSeparator(paperMenuDiv, true);
			addPaperItem({node:paperMenuDiv, value:"", label:getMessage("off"), prepend:true});
		}

		var dropdown = document.importNode(template.content, true);
		var $dropdown = $(dropdown);
		var $paperMenu = $dropdown.find("paper-listbox");
	
		initMessages($dropdown.find("*"));
		
		var defaultValue = await storage.get("voiceHear");
		
		if (account) {
			var settingValue = await account.getSettingForLabel("voices", labelValue, defaultValue);
			$paperMenu[0].setAttribute("selected", settingValue);
		} else {
			$paperMenu[0].setAttribute("selected", defaultValue);
		}
		
		$paperMenu.find("paper-item").click(function() {
			var $paperMenu = $(this).closest("paper-listbox");
			var voiceValue = $(this).attr("value");
			
			var storagePromise;
			if (account) {
				storagePromise = account.saveSettingForLabel("voices", labelValue, voiceValue);
			} else {
				storagePromise = storage.set("voiceHear", voiceValue);
			}
			storagePromise.catch(error => {
				showError(error);
			});
		});
	}
	
	return $dropdown;	
}

// desc: stores labelvalue in monitorlabelline node
async function generateMonitorLabelOptions(account, title, labelValue, icon) {
	if (icon == "NONE") {
		icon = "";
	} else if (!icon) {
		icon = "icons:label";
	}
	
	var $monitorLabelLine = $("<div class='monitorLabelLine layout horizontal center'><paper-checkbox class='monitoredLabelCheckbox flex'><div class='layout horizontal'><iron-icon class='labelIcon'></iron-icon> <div class='label'></div></div></paper-checkbox> <div class='soundOptionsWrapper'></div> <div class='voiceOptionsWrapper'></div> <div><paper-icon-button icon='social:notifications' class='toggleIcon notification'></paper-icon-button><paper-tooltip animation-delay='0' class='desktopNotificationsTooltip'></paper-tooltip></div> <div><paper-icon-button class='toggleIcon tab' icon='icons:tab'></paper-icon-button><paper-tooltip animation-delay='0' class='tabTooltip'></paper-tooltip></div></div>");
	$monitorLabelLine.find(".labelIcon").attr("icon", icon);
	if (!await storage.get("donationClicked")) {
		$monitorLabelLine.find(".soundOptionsWrapper").attr("mustDonate", "");
	}
	$monitorLabelLine.find(".desktopNotificationsTooltip")[0].textContent = getMessage("showDesktopNotifications");
	$monitorLabelLine.find(".tabTooltip")[0].textContent = getMessage("tabToolTip");

	if (labelValue == SYSTEM_INBOX) {
		$monitorLabelLine.append("<paper-tooltip id='inboxLabelToolTip' position='right' manual-mode='true'>" + getMessage("uncheckInboxLabel") + ". This is used for the classic Gmail inbox" + "</paper-tooltip>");
	}
	if (labelValue == SYSTEM_IMPORTANT_IN_INBOX) {
		$monitorLabelLine.addClass("importantInInbox");
	}
	if (labelValue == SYSTEM_PRIMARY) {
		$monitorLabelLine.addClass("primaryCategory");
		$monitorLabelLine.off().on("mousemove", function() {
			$(".otherCategories").slideDown();
		});
		$monitorLabelLine.append("<paper-tooltip id='primaryLabelToolTip' position='right' manual-mode='true'>" + getMessage("checkPrimaryOrMore") + ". This adds them to the count and the popup window" + "</paper-tooltip>");
	}
	$monitorLabelLine.data("labelValue", labelValue);
	$monitorLabelLine.find(".monitoredLabelCheckbox").attr("title", title);
	$monitorLabelLine.find(".label")
		.text(title)
	;
	
	if (monitorLabelsEnabled.includes(labelValue)) {		
		$monitorLabelLine.find(".monitoredLabelCheckbox")[0].checked = true;

		var $soundOptions = await generateSoundOptions(account, labelValue);
		var $voiceOptions = await generateVoiceOptions(account, labelValue);
		
		$monitorLabelLine.find(".soundOptionsWrapper").append($soundOptions);
		$monitorLabelLine.find(".voiceOptionsWrapper").append($voiceOptions);
	} else {
		$monitorLabelLine.addClass("disabledLine");
	}
	
	// sound notifications are handled inside generateSoundOptions()
	// voice notifications are handled inside generateVoiceOptions()
	
	var settingValue;

	// desktop notifications
	settingValue = await account.getSettingForLabel("notifications", labelValue, await storage.get("desktopNotification"));
	if (settingValue) {
		$monitorLabelLine.find(".notification").attr("enabled", "");
	}
	$monitorLabelLine.find(".notification").click(function() {
		var $this = $(this);
		$this.toggleAttr("enabled");
		var enabled = $this.attr("enabled") != undefined;
		account.saveSettingForLabel("notifications", labelValue, enabled).catch(error => {
			showError(error);
		});
	});

	// tabs
	settingValue = await account.getSettingForLabel("tabs", labelValue, false);
	$monitorLabelLine.find(".tab").toggleAttr("enabled", settingValue);
	$monitorLabelLine.find(".tab").click(async function() {
		if (await storage.get("donationClicked")) {
			var $this = $(this);
			$this.toggleAttr("enabled");
			var enabled = $this.attr("enabled") != undefined;
			account.saveSettingForLabel("tabs", labelValue, enabled);
		} else {
			openContributeDialog("tabForLabel");
		}
	});

	return $monitorLabelLine;
}

function getEnabledLabels() {
	var values = [];
	
	// loop through lines to pull data and then see if checkbox inside line is checked
	$(".monitorLabelLine").each(function() {
		var labelValue = $(this).data("labelValue");
		if ($(this).find(".monitoredLabelCheckbox[checked]").length) {
			values.push(labelValue);
		}
	});
	return values;
}

function addCollapse($monitorLabels, opened, title, id) {
	var $header = $("<div class='layout horizontal accountsLabelsHeader expand' style='padding:10px 20px;position:relative;cursor:pointer'>");
    if (id) {
        $header.attr("id", id);
    }
    $header.append("<paper-ripple>");
	var $expand = $("<iron-icon icon='expand-more' style='margin-left:5px'>");
	$monitorLabels.append($header.append(title, $expand));
	var $collapse = $("<iron-collapse>");
	if (opened) {
		$collapse.attr("opened", "");
		$header.addClass("opened");
	}
	
	$header.off().on("click", function() {
		$collapse[0].toggle();
		$header.toggleClass("opened");
	});
	
	$monitorLabels.append($collapse);
	return $collapse;
}

async function loadLabels(params) {
	console.log("load labels");
	var account = params.account;
	
	var $monitorLabels = $("#monitorLabels");
	$monitorLabels.data("account", account);
	
	if (account) {
		jqueryEmpty($monitorLabels);
		
		monitorLabelsEnabled = await account.getMonitorLabels();

		var $option, $collapse;

        var systemLabelsOpened = !await account.isUsingGmailCategories()
            || monitorLabelsEnabled.includes(SYSTEM_INBOX)
            || monitorLabelsEnabled.includes(SYSTEM_IMPORTANT)
            || monitorLabelsEnabled.includes(SYSTEM_IMPORTANT_IN_INBOX)
            || monitorLabelsEnabled.includes(SYSTEM_ALL_MAIL);
		$collapse = addCollapse($monitorLabels, systemLabelsOpened, getMessage("systemLabels"));
		
		$option = await generateMonitorLabelOptions(account, getMessage("inbox"), SYSTEM_INBOX, "icons:inbox");
		$collapse.append($option);
		$option = await generateMonitorLabelOptions(account, getMessage("importantMail"), SYSTEM_IMPORTANT, "icons:info-outline");
		$collapse.append($option);
		$option = await generateMonitorLabelOptions(account, getMessage("importantMail") + " " + getMessage("in") + " " + getMessage("inbox"), SYSTEM_IMPORTANT_IN_INBOX, "icons:info-outline");
		$collapse.append($option);
		$option = await generateMonitorLabelOptions(account, getMessage("allMail"), SYSTEM_ALL_MAIL, "communication:present-to-all");
		$collapse.append($option);
		
		var categoryLabelsOpened = !systemLabelsOpened || await account.isMaybeUsingGmailCategories() || hasMainCategories(monitorLabelsEnabled);
		$collapse = addCollapse($monitorLabels, categoryLabelsOpened, getMessage("categories"), "categoriesLabel");

		$option = await generateMonitorLabelOptions(account, getMessage("primary"), SYSTEM_PRIMARY, "icons:inbox");
		$collapse.append($option);
		$option = await generateMonitorLabelOptions(account, getMessage("social"), SYSTEM_SOCIAL, "social:people");
		$collapse.append($option);
		$option = await generateMonitorLabelOptions(account, getMessage("promotions"), SYSTEM_PROMOTIONS, "maps:local-offer");
		$collapse.append($option);
		$option = await generateMonitorLabelOptions(account, getMessage("updates"), SYSTEM_UPDATES, "icons:flag");
		$collapse.append($option);
		$option = await generateMonitorLabelOptions(account, getMessage("forums"), SYSTEM_FORUMS, "communication:forum");
		$collapse.append($option);
		
		//$monitorLabels.append($("<div style='height:5px'>&nbsp;</div>"));
		
		$collapse = addCollapse($monitorLabels, true, getMessage("labels"));

		var $spinner = $("<paper-spinner active style='margin-left:20px'>");
		$monitorLabels.append($spinner);
		
		account.getLabels(params.refresh).then(async labels => {
            await asyncForEach(labels, async label => {
                $option = await generateMonitorLabelOptions(account, label.name, label.id);
                if (label.color) {
                    $option.find(".labelIcon").css({color:label.color.backgroundColor});
                }
                $collapse.append($option);
            });
		}).catch(error => {
			console.error(error);
			$monitorLabels.append( $("<div style='color:red;padding:5px'>").text(error) );
		}).then(() => {
			$spinner.remove();
		});
	}
}

function processEnabledSetting(node, settingName) {
	var $this = $(node);
	$this.toggleAttr("enabled");
	
	var enabled = $this.attr("enabled") != undefined;
	
	var account = getAccountByNode(node);
	account.saveSetting(settingName, enabled);

	setTimeout(function() {
		console.log("blur");
		$this.closest("paper-item").blur();
	}, 1);

	// if already loaded this account's labels then cancel bubbling to paper-item
	if ($("#monitorLabels").data("account").getEmail() == account.getEmail()) {
		return false;
	} else {
		return true;
	}
}

function getAccountByNode(node) {
	const email = $(node).closest("paper-item[email]").attr("email");
	return getAccountByEmail(email);
}

async function loadAccountsOptions(loadAccountsParams = {}) {
	console.log("loadAccountsOptions", loadAccountsParams);
	let allAccounts = accounts;
	
	var $monitorLabels = $("#monitorLabels");

	// only do this if accounts detected or oauth because or we leave the signInToYourAccount message in the dropdown
	if (allAccounts.length || await storage.get("accountAddingMethod") == "oauth") {
		jqueryEmpty($monitorLabels);
	}
	
	if (await storage.get("accountAddingMethod") == "autoDetect") {
		allAccounts = allAccounts.concat(ignoredAccounts);
	}
	
	if (allAccounts.length) {
		//$("#accountsAndLabels .refresh").unhide();
		$("#syncSignInOrder").unhide();
	} else {
		//$("#accountsAndLabels .refresh").hidden();
		$("#syncSignInOrder").hidden();
	}
	
	const accountsList = [];

	var selectedAccount;

    await asyncForEach(allAccounts, async (account, i) => {
		if ((i==0 && !loadAccountsParams.selectedEmail) || (loadAccountsParams.selectedEmail && loadAccountsParams.selectedEmail == account.getEmail())) {
			selectedAccount = account;
		}
		
		accountsList.push({
			email:                          account.getEmail(),
			openLabel:                      await account.getOpenLabel(),
			showSignatureAndFetchedData:    await account.getSetting("showSignature", "accountsShowSignature") && await account.hasSignature(),
			conversationView:               await account.getSetting("conversationView"),
			ignore:                         await storage.get("accountAddingMethod") == "autoDetect" && await account.getSetting("ignore")
		});
	});

	loadAccountsParams.account = selectedAccount;
	loadLabels(loadAccountsParams);

	var t = document.querySelector('#accountsBind');
	// could only set this .data once and could not use .push on it or it breaks the bind

    if (t) {
        t.data = accountsList;
	
        setTimeout(async function() {
    
            var lastError;
            var lastErrorCode;
            
            if (accountsList.length) {
                initMessages($("#accountsList *"));
                if (selectedAccount) {
                    $("#accountsList")[0].select(selectedAccount.getEmail());
                } else {
                    $("#accountsList")[0].select(accountsList.first().email);
                }
                $("#accountsList").find("paper-item[email]").each(function() {
                    var account = getAccountByNode(this);
                    if (account.error) {
                        lastError = account.getError().niceError + " " + account.getError().instructions;
                        lastErrorCode = account.errorCode;
                        $(this).find(".accountError").text( lastError );
                    } else {
                        $(this).find(".accountError").text( "" );
                    }
                });
            }
    
            // patch because when paper-item was focused we couldn't get paper-tooltip to work inside the paper-item
            $("#accountsList").find("paper-item[email]").blur();
            
            if (await storage.get("accountAddingMethod") == "autoDetect" && (accountsList.length == 0 || (lastError && lastErrorCode != JError.CANNOT_ENSURE_MAIN_AND_INBOX_UNREAD))) {
                $("#accountErrorButtons").unhide();
            } else {
                $("#accountErrorButtons").hidden();
            }
            
            if (lastError) {
                showError(lastError);
            }
    
        }, 1);
    }
	
	$("body").toggleClass("disabledSound", !await storage.get("notificationSound"));
	$("body").toggleClass("disabledVoice", !await storage.get("notificationVoice"));
	$("body").toggleClass("disabledNotification", !await storage.get("desktopNotification"));
	$("body").toggleClass("browserButtonAction_gmailInbox", await storage.get("browserButtonAction") == BROWSER_BUTTON_ACTION_GMAIL_INBOX);
	
	console.log("accountslist event handlers")
	$("#accountsList")
		.off()
		.on("click", ".openLabel", function() {
			return false;
		})
		.on("click", ".openLabel paper-item", function(e) {
			var openLabel = $(this).attr("value");
			var account = getAccountByNode(this);
			account.saveSetting("openLabel", openLabel);
			return false;
		})
		.on("click", ".signature", async function() {
			var account = getAccountByNode(this);
			var that = this;
			if (await account.getSetting("showSignature", "accountsShowSignature") && await account.hasSignature()) {
				processEnabledSetting(that, "showSignature");
				showMessage("Signatures disabled");
			} else {
				showLoading();
				account.fetchSendAs().then(async sendAsData => {
					if (await account.hasSignature()) {
						processEnabledSetting(that, "showSignature");
						showMessage("Signatures enabled");
					} else {
						niceAlert("No signatures found! Have you created one in your Gmail?") // https://support.google.com/mail/answer/8395
					}
				}).catch(error => {
					niceAlert(error);
				}).then(() => {
					hideLoading();
				});
			}
			return false;
		})
		.on("click", ".conversationView", function(e) {
            // since we must synchronously return on click we must poll after changes saved in processenable...
            setTimeout(() => {
                pollAndLoad({showNotification:false, refresh:true});
            }, 200);

			return processEnabledSetting(this, "conversationView");
		})
		.on("click", ".ignoreAccount", async function(e) {
			const $this = $(this);
			const account = getAccountByNode(this);
			
			if (account) {
				if (this.checked) {
					await account.saveSetting("ignore", false);
					$this.closest("paper-item").removeAttr("ignore");
                    sendMessageToBG("pollAccounts", {showNotification : true});
				} else {
					if (await storage.get("accountAddingMethod") == "autoDetect") {
						await account.saveSetting("ignore", true);
						$this.closest("paper-item").attr("ignore", "");
                        sendMessageToBG("pollAccounts", {showNotification : true});
					} else {
                        await sendMessageToBG("accountAction", {account: account, action: "remove"}, true);
						pollAndLoad({showNotification:false});
					}
				}
			} else {
				niceAlert("Could not find account! Click OK to refresh").then(() => {
					pollAndLoad({showNotification:true, refresh:true});
				});
			}
		})
		.on("click", "paper-item[email]", function(e) {
			var $this = $(this);
			console.log("paper-item clicked", e);
			var account;
			allAccounts.some(function(thisAccount) {
				if (thisAccount.getEmail() == $("#accountsList")[0].selected) {
					account = thisAccount;
					return true;
				}
			});
	
			loadAccountsParams.account = account;
			loadLabels(loadAccountsParams);
			
			setTimeout(function() {
				$this.removeAttr("focused");
				$this.blur();
			}, 1)
		})
		.on("mousemove", function() {
			//$("#accountsListToolTip").hide();
		});
	;
	
	$monitorLabels.off("change").on("change", ".monitoredLabelCheckbox", async function() {
		
		var account = getSelectedAccount();
		
		var $monitorLabelLine = $(this).closest(".monitorLabelLine");
		var labelValue = $monitorLabelLine.data("labelValue");
		
		if (this.checked) {
			var $soundOptions = await generateSoundOptions(account, labelValue);
			var $voiceOptions = await generateVoiceOptions(account, labelValue);
			
			$monitorLabelLine.find(".soundOptionsWrapper").append($soundOptions);
			$monitorLabelLine.find(".voiceOptionsWrapper").append($voiceOptions);
		} else {
			jqueryEmpty($monitorLabelLine.find(".soundOptionsWrapper"));
			jqueryEmpty($monitorLabelLine.find(".voiceOptionsWrapper"));
		}
		
		$(this).closest(".monitorLabelLine").toggleClass("disabledLine", !this.checked);
		
		var values = getEnabledLabels();
		
		var inbox = values.includes(SYSTEM_INBOX);
		var important = values.includes(SYSTEM_IMPORTANT);
		var importantInInbox = values.includes(SYSTEM_IMPORTANT_IN_INBOX);
		var allMail = values.includes(SYSTEM_ALL_MAIL);
		var primary = values.includes(SYSTEM_PRIMARY);
		
		// warn if selecting more than more than one of the major labels
		var duplicateWarning = false;
		if ((inbox || allMail) && (important || importantInInbox || primary)) {
			duplicateWarning = true;
		} else if (important && importantInInbox) {
			duplicateWarning = true;
		}

		let hiddenTabUnchecked;
		if ((labelValue == SYSTEM_SOCIAL || labelValue == SYSTEM_PROMOTIONS || labelValue == SYSTEM_UPDATES || labelValue == SYSTEM_FORUMS) && !this.checked) {
			hiddenTabUnchecked = true;
		}
		
		if (duplicateWarning) {
			openGenericDialog({
				title: getMessage("duplicateWarning"),
				content: getMessage("duplicateLabelWarning")
			});
		} else if ((labelValue == SYSTEM_PRIMARY && this.checked) || (labelValue == SYSTEM_INBOX && !this.checked && primary) || hiddenTabUnchecked) {
			if (await account.hasHiddenTabs()) {
				var $dialog = initTemplate("hiddenGmailTabsNoteDialogTemplate");
				openDialog($dialog).then(response => {
					if (response == "ok") {
						chrome.tabs.create({url: "https://jasonsavard.com/wiki/Gmail_tabs?ref=primaryLabelChecked"});
					}
				});
			}
		}

		if (await storage.get("accountAddingMethod") == "autoDetect" && values.length > 5) {
			openGenericDialog({
				title: "Too many labels! Here are some solutions:",
				content: "1) I recommend monitoring less than 5 labels for faster polling and avoiding lockouts<br>2) Consider using the <b>All mail</b> label instead<br>3) Try the add accounts option above"
			});
		}
		
		if (allMail && values.length >= 2) {
			openGenericDialog({
				content: "If you select <b>All mail</b> then you should unselect the other labels or else you will get duplicates!"
			});
		}

        try {
            await account.saveSetting("monitorLabel", getEnabledLabels());
            await sendMessageToBG("pollAccounts", {showNotification : true, refresh:true});
            await initAllAccounts();
            accounts.forEach(account => {
                if (account.error) {
                    throw Error(account.getError().niceError + " - " + account.getError().instructions);
                }
            });
        } catch (error) {
            showError(error);
        }
	});
}

function loadVoices() {
	console.log("loadVoices");
	if (chrome.tts) {
		chrome.tts.getVoices(function(voices) {
			
			var nativeFound = false;
			var options = [];
			
			for (var i=0; i<voices.length; i++) {
				if (voices[i].voiceName == "native") {
					nativeFound = true;
				} else {
					var optionsObj = {label:voices[i].voiceName, value:voices[i].voiceName};
					if (voices[i].extensionId) {
						optionsObj.value += "___" + voices[i].extensionId;
					}
					options.push(optionsObj);
				}
	      	}
			
			var t = document.querySelector('#t');
			// could only set this .data once and could not use .push on it or it breaks the bind
			
			if (t) {
				t.data = options;
			}
		});
	}
}

async function playSound(soundName) {
	console.log("playsound: " + soundName);
	if (!soundName) {
		soundName = await storage.get("notificationSound");
	}
	$("#playNotificationSound").attr("icon", "av:stop");
    playing = true;
    await sendMessageToBG("playNotificationSound", soundName);
    playing = false;
    $("#playNotificationSound").attr("icon", "av:play-arrow");
}

function playVoice() {
    $("#playVoice").attr("icon", "av:stop");
    
    chrome.runtime.sendMessage({command: "chromeTTS", text: $("#voiceTestText").val()}, response => {
        $("#playVoice").attr("icon", "av:play-arrow");
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            showError(chrome.runtime.lastError.message);
        }
	});
}

function updateVoiceInputCountry() {
	for (var i = voiceInputDialect.options.length - 1; i >= 0; i--) {
		voiceInputDialect.remove(i);
	}
	var list = langs[voiceInputLanguage.selectedIndex];
	for (var i = 1; i < list.length; i++) {
		voiceInputDialect.options.add(new Option(list[i][1], list[i][0]));
	}
	voiceInputDialect.style.visibility = list[1].length == 1 ? 'hidden' : 'visible';
}

async function initVoiceInputOptions() {
	if (await storage.get("voiceInput")) {
		$("#voiceInputOptions").show();
	} else {
		$("#voiceInputOptions").hide();
	}
}

function onVoiceInputLanguageChange() {
	storage.set("voiceInputDialect", voiceInputDialect.value);
}

async function resetCustomSounds() {
	var found = false;
	var emailSettings = await storage.get("emailSettings");
	
	if (emailSettings) {	
		try {
			for (email in emailSettings) {									
				for (label in emailSettings[email].sounds) {
					if (emailSettings[email].sounds[label].includes("custom_")) {
						found = true;
						emailSettings[email].sounds[label] = await storage.get("notificationSound");
					}
				}
			}								
		} catch (e) {
			logError("error with hasCustomSounds: " + e);
		}
	}
	
	if (found) {
		await storage.set("emailSettings", emailSettings);
	}
	
	return found;
}

function openSoundDialog(params) {
	$("#notificationSoundInputButton")
		.data("params", params)
		.click()
	;
}

async function updateCustomIcons() {
	
	async function updateCustomIcon(iconFlagId) {
		var url = await storage.get(iconFlagId);
		if (url) {
			$("#" + iconFlagId)
				.attr("src", url)
				.width(19)
				.height(19)
			;
		}
	}

	updateCustomIcon("customButtonIconSignedOut");
	updateCustomIcon("customButtonIconNoUnread");
	updateCustomIcon("customButtonIconUnread");
	
	$("#currentBadgeIcon").attr("src", await buttonIcon.generateButtonIconPath());
}

async function addCustomSound(params) {
	var title = params.title;
	
	var customSounds = await storage.get("customSounds");
	if (!customSounds) {
		customSounds = [];
	}

	var existingCustomSoundIndex = -1;
	$.each(customSounds, function(index, customSound) {
		if (customSound.name == title) {
			existingCustomSoundIndex = index;
		}
	});

	if (params.overwrite && existingCustomSoundIndex != -1) {
		customSounds[existingCustomSoundIndex] = {name:title, data:params.data};
	} else {
		// look for same filenames if so change the name to make it unique
		if (existingCustomSoundIndex != -1) {
			title += "_" + String(Math.floor(Math.random() * 1000));
		}
		customSounds.push({name:title, data:params.data});
	}

	storage.set("customSounds", customSounds).then(() => {
		playSound("custom_" + title);
		if (params.account) {
			// label specific
			return params.account.saveSettingForLabel("sounds", params.labelValue, "custom_" + title).then(() => {
				$(".monitorLabelLine").each(async function() {
					var labelValue = $(this).data("labelValue");
					
					var soundDropdown = await generateSoundOptions(params.account, labelValue);
					$(this).find(".soundOptionsWrapper paper-dropdown-menu").replaceWith( soundDropdown );
				});
				
			});
		} else {
			// default
			return storage.set("notificationSound", "custom_" + title).then(async () => {
				var soundDropdown = await generateSoundOptions();
				params.$paperMenu.closest("paper-dropdown-menu").replaceWith( soundDropdown );
			});
		}
	}).catch(error => {
		var error = "Error saving file: " + error + " Try a smaller file or another one or click the 'Not working' link.";
		niceAlert(error);
		logError(error);
	});
}

async function initDisplayForAccountAddingMethod() {
	console.log("initDisplayForAccountAddingMethod");

	if (await storage.get("accountAddingMethod") == "autoDetect") {
		$("body").addClass("autoDetect");
		if (await storage.get("poll") == "realtime") {
			await storage.remove("poll");
		}
	} else {
		$("body").removeClass("autoDetect");
	}

	let $pollingInterval = $("#pollingInterval paper-listbox");
	if ($pollingInterval.length) {
		$pollingInterval[0].select(await calculatePollingInterval(accounts));
	}
}

async function grantPermissionToEmails(tokenResponse) {
	showLoading();
    userResponsedToPermissionWindow = true;
    
    try {
        const response = await sendMessageToBG("addAccountViaOauth", {tokenResponse: tokenResponse});
        await initAllAccounts();

        if (response.syncSignInIdError) {
            niceAlert("Could not determine the sign in order, so assuming " + accounts.length);
        }

        loadAccountsOptions({ selectedEmail: tokenResponse.userEmail });
        initDisplayForAccountAddingMethod();
    } catch (error) {
        showError(error);
    } finally {
        hideLoading();
    }
}

async function initOnlyWithCheckerPlusPopupWarning(params) {
    const browserButtonAction = await storage.get("browserButtonAction");
	if (browserButtonAction == BROWSER_BUTTON_ACTION_CHECKER_PLUS || browserButtonAction == BROWSER_BUTTON_ACTION_CHECKER_PLUS_POPOUT) {
		$("#checkerPlusButtons").show();
		$("#emailPreview").show();
		$("#alwaysDisplayExternalContentWrapper").show();
	} else {
		$("#checkerPlusButtons").hide();
		$("#emailPreview").hide();
		$("#alwaysDisplayExternalContentWrapper").hide();
	}
}

async function initPopupWindowOptions(value) {
	if (!value) {
		value = await storage.get("browserButtonAction");
	}

	if (value == BROWSER_BUTTON_ACTION_CHECKER_PLUS || value == BROWSER_BUTTON_ACTION_CHECKER_PLUS_POPOUT) {
		$("#popupWindowOptionsForComposeReply").show();
		$("#checkerPlusBrowserButtonActionIfNoEmail").show();
		$("#gmailPopupBrowserButtonActionIfNoEmail").hide();
		$("#clickingCheckerPlusLogo").show();
		initOnlyWithCheckerPlusPopupWarning({ remove: true })
	} else if (value == BROWSER_BUTTON_ACTION_GMAIL_TAB || value == BROWSER_BUTTON_ACTION_GMAIL_IN_NEW_TAB || value == BROWSER_BUTTON_ACTION_COMPOSE) {
		$("#checkerPlusBrowserButtonActionIfNoEmail").hide();
		$("#gmailPopupBrowserButtonActionIfNoEmail").hide();
		$("#popupWindowOptionsForComposeReply").show();
		$("#clickingCheckerPlusLogo").hide();
		initOnlyWithCheckerPlusPopupWarning({ add: true })
	} else {
		$("#popupWindowOptionsForComposeReply").hide();
		$("#checkerPlusBrowserButtonActionIfNoEmail").hide();
		$("#gmailPopupBrowserButtonActionIfNoEmail").show();
		$("#clickingCheckerPlusLogo").show();
		initOnlyWithCheckerPlusPopupWarning({ add: true })
	}
}

function highlightAddAccount() {
	$("#accountAddingMethod").addClass("highlight");
	setTimeout(function () {
		$("#accountAddingMethod").removeClass("highlight");
	}, seconds(3));
}

$(document).ready(function() {

	(async () => {

        await initUI();
        await polymerPromise;
        
        donationClickedFlagForPreventDefaults = await storage.get("donationClicked");
		
		if (await storage.get("settingsAccess") == "locked") {
			if (justInstalled) {
				// might not be necessary because in onInstalled i also avoid opening this options page if locked (but keeping this here in case of a race condition)
				window.close();
			} else {
				niceAlert("The options have been disabled by your network adminstrator!");
			}
		} else if (await storage.get("settingsAccess") == "userCanModifyOnlyMonitoredLabels") {
			niceAlert("Many options have been disabled by your network administrator!")
		}

		$("#mainTabs paper-tab").click(function(e) {
			var tabName = $(this).attr("value");
			showOptionsSection(tabName);
		});
	
		if (justInstalled || (!await storage.get("_optionsOpened") && gtVersion(await storage.get("installVersion"), "22.1"))) {
            storage.setDate("_optionsOpened");
			showOptionsSection("welcome");
            
            if (justInstalled) {
                const newUrl = setUrlParam(location.href, "action", null);
                history.replaceState({}, 'Install complete', newUrl);
            }
					
			if (DetectClient.isOpera()) {
				if (!window.Notification) {
					niceAlert("Desktop notifications are not yet supported in this browser!");				
				}
				if (window.chrome && !window.chrome.tts) {
					niceAlert("Voice notifications are not yet supported in this browser!");				
				}
				niceAlert("You are not using the stable channel of Chrome! <a target='_blank' style='color:blue' href='https://jasonsavard.com/wiki/Unstable_browser_channel'>More info</a><br><br>Bugs might occur, you can use this extension, however, for obvious reasons, these bugs and reviews will be ignored unless you can replicate them on stable channel of Chrome.");
			}
			
			// check for sync data
			syncOptions.fetch().then(function(items) {
				console.log("fetch response", items);
				openGenericDialog({
					title: "Restore settings",
					content: "Would you like to use your previous extension options? <div style='margin-top:4px;font-size:12px;color:gray'>(If you had previous issues you should do this later)</div>",
					showCancel: true
				}).then(function(response) {
					if (response == "ok") {
						syncOptions.load(items).then(function(items) {
							resetCustomSounds();
							
							openGenericDialog({
								title: "Options restored!",
								okLabel: "Restart extension"
							}).then(response => {
								reloadExtension();
							});
						});
					}
				});
			}).catch(error => {
				console.warn("error fetching: ", error);
			});
	
		} else {
			initSelectedTab();
		}
		
		window.onpopstate = function(event) {
			console.log(event);
			initSelectedTab();
		}
		
		$(window).focus(function(event) {
			console.log("window.focus");
			// reload voices
			loadVoices();
		});
		
	    $("#logo").dblclick(async function() {
	    	if (await storage.get("donationClicked")) {
	    		await storage.remove("donationClicked");
	    	} else {
	    		await storage.set("donationClicked", true)
	    	}
	    	location.reload(true);
	    });
	    
		$("#version").text("v." + chrome.runtime.getManifest().version);
		$("#version").click(function() {
            showLoading();
            if (chrome.runtime.requestUpdateCheck) {
                chrome.runtime.requestUpdateCheck(function(status, details) {
                    hideLoading();
                    console.log("updatechec:", details)
                    if (status == "no_update") {
                        openGenericDialog({title:getMessage("noUpdates"), otherLabel:getMessage("moreInfo")}).then(function(response) {
                            if (response == "other") {
                                location.href = "https://jasonsavard.com/wiki/Extension_Updates";
                            }
                        })
                    } else if (status == "throttled") {
                        openGenericDialog({title:"Throttled, try again later!"});
                    } else {
                        openGenericDialog({title:"Response: " + status + " new version " + details.version});
                    }
                });
            } else {
                location.href = "https://jasonsavard.com/wiki/Extension_Updates";
            }
        });

        $("#changelog").click(function() {
            openChangelog("GmailOptions");
            return false;
        });

        // detect x
        document.getElementById("search").addEventListener("search", function(e) {
           if (!this.value) {
                $("*").removeClass("search-result");
           }
        });

        function highlightTab(node) {
            const page = $(node).closest(".page");
            const tabName = page.attr("value");
            // :not(.iron-selected)
            $("paper-tab[value='" + tabName + "']").addClass("search-result");
        }

        function highlightPriorityNode(highlightNode) {
            return [
                "paper-dropdown-menu",
                "paper-button",
                "paper-checkbox",
                "select"
            ].some(priorityNodeName => {
                const $priorityNode = $(highlightNode).closest(priorityNodeName);
                if ($priorityNode.length) {
                    $priorityNode[0].classList.add("search-result");
                    return true;
                }
            });
        }

        async function search(search) {
            if (!window.initTabsForSearch) {
                await asyncForEach(document.querySelectorAll("paper-tab"), async (tab) => {
                    await initPage(tab.getAttribute("value"));
                });
                window.initTabsForSearch = true;
            }

            $("*").removeClass("search-result");
            if (search.length >= 2) {
                search = search.toLowerCase();
                var elms = document.getElementsByTagName("*"),
                len = elms.length;
                for(var ii = 0; ii < len; ii++) {

                    let label = elms[ii].getAttribute("label");
                    if (label && label.toLowerCase().includes(search)) {
                        elms[ii].classList.add("search-result");
                        highlightTab(elms[ii]);
                    }

                    var myChildred = elms[ii].childNodes;
                    len2 = myChildred.length;
                    for (var jj = 0; jj < len2; jj++) {
                        if (myChildred[jj].nodeType === 3) {
                            if (myChildred[jj].nodeValue.toLowerCase().includes(search)) {
                                let highlightNode = myChildred[jj].parentNode;
                                if (highlightNode.nodeName != "STYLE") {
                                    let foundPriorityNode = highlightPriorityNode(highlightNode);
                                    if (!foundPriorityNode) {
                                        const $priorityNode = $(highlightNode).closest("paper-tooltip");
                                        if ($priorityNode.length) {
                                            foundPriorityNode = highlightPriorityNode($priorityNode[0].target);
                                            if (!foundPriorityNode) {
                                                $priorityNode[0].target.classList.add("search-result");
                                            }
                                        } else {
                                            highlightNode.classList.add("search-result");
                                        }
                                    }
    
                                    console.log("highlightNode", highlightNode);
                                    
                                    highlightTab(myChildred[jj]);
                                }
                            }
                        }
                    }
                }
            }
        }
        
        $("#search").keyup(function(e) {
            const searchValue = this.value;
            clearTimeout(window.searchTimeout);
            searchTimeout = setTimeout(() => {
                search(searchValue);
            }, window.initTabsForSearch ? 0 : 300);

            clearTimeout(window.analyticsTimeout);
            analyticsTimeout = setTimeout(async () => {
                while (!window.initTabsForSearch) {
                    await sleep(200);
                }
                if (searchValue) {
                    sendGA("optionsSearch", searchValue);
                    console.log("search results: " + $(".search-result").length);
                    if (!$(".search-result").length) {
                        openGenericDialog({
                            title: "No results found in options",
                            showCancel: true,
                            okLabel: "Search FAQ & Forum"
                        }).then(response => {
                            if (response == "ok") {
                                window.open("https://jasonsavard.com/search?q=" + encodeURIComponent(searchValue), "emptyWindow");
                            }
                        });
                    }
                }
            }, 1000);
        });
		
		setTimeout(function() {
			$("body").removeAttr("jason-unresolved");
			$("body").addClass("explode");
		}, 200)

	})();
});