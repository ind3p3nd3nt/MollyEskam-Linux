var amount;
var licenseType = "singleUser";
var licenseSelected;
var minimumDonation = 1; // but being set overwritten when donate buttons are clicked

var donateButtonClicked = null;
var extensionName = getMessage("nameNoTM");
var email;
var stripeLiveMode = true;
var donationPageUrl = location.protocol + "//" + location.hostname + location.pathname;

function showLoading() {
	$("body").addClass("processing");
}

function hideLoading() {
	$("body").removeClass("processing");
}

if (!extensionName) {
	try {
		extensionName = chrome.runtime.getManifest().name;
	} catch (e) {
		console.error("Manifest has not been loaded yet: " + e);
	}
	
	var prefix = "__MSG_";
	// look for key name to message file
	if (extensionName && extensionName.match(prefix)) {
		var keyName = extensionName.replace(prefix, "").replace("__", "");
		extensionName = getMessage(keyName);
	}
}

function isSimilarValueToUS(currencyCode) {
	if (/USD|CAD|EUR|GBP|AUD/i.test(currencyCode)) {
		return true;
	}
}

async function initCurrencyAndMinimums(currencyCode) {
	if (licenseType == "multipleUsers") {
		$("#currency")[0].selected = "USD"; // hard coded to USD for multipe user license
	} else {
		$("#currency")[0].selected = currencyCode;

		if (isSimilarValueToUS(currencyCode) || currencyCode == "JPY") {
			if (isMonthly()) {
				$("#monthlyAmountSelections").unhide();
				$("#onetimeAmountSelections").attr("hidden", true);
			} else {
				$("#monthlyAmountSelections").attr("hidden", true);
				$("#onetimeAmountSelections").unhide();
			}
		} else {
			$("#monthlyAmountSelections").attr("hidden", true);
			$("#onetimeAmountSelections").attr("hidden", true);
		}
		
		if (isMonthly()) {
			if (isPayPalSubscriptionsSupported()) {
				$("#paypal").unhide();
			} else {
				$("#paypal").hidden();
			}
			$("#alipay").hidden();
			$("#wechat-pay").hidden();
            
            /*
            if ($("#paymentType")[0].selected == "monthly-all-extensions") {
                $("#monthlyAmountSelections [amount='2']").hidden();
                $("#monthlyAmountSelections [amount='3']").hidden();
                $("#amount").hidden();
            } else {
                $("#monthlyAmountSelections [amount='2']").unhide();
                $("#monthlyAmountSelections [amount='3']").unhide();
                $("#amount").unhide();
            }
            */
		} else {
			$("#paypal").unhide();
			$("#alipay").unhide();
			$("#wechat-pay").unhide();
		}
		
		if (currencyCode == "BTC") {
			if (await isEligibleForReducedDonation()) {
				minimumDonation = 0.0005;
			} else {
				minimumDonation = 0.001;
			}
		} else {
			$("paper-button[amount]").each(function() {
				let amount;
				if (currencyCode == "JPY") {
					amount = convertUSDToJPY($(this).attr("amount"));
				} else {
					amount = $(this).attr("amount");
				}
				$(this).text(amount);
			});

			if (await isEligibleForReducedDonation()) {
				if (currencyCode == "JPY") {
					minimumDonation = 50;
				} else if (currencyCode == "TWD") {
					minimumDonation = 15;
				} else {
					minimumDonation = 0.50;
				}
			} else {
				if (currencyCode == "JPY") {
					minimumDonation = 100;
				} else if (currencyCode == "TWD") {
					minimumDonation = 30;
				} else {			
					minimumDonation = 1;
				}
			}
		}
	}
}
	
function initPaymentDetails(buttonClicked) {
	donateButtonClicked = buttonClicked;
	
	$("#multipleUserLicenseIntro").slideUp();

	if (ITEM_ID == "screenshots" && !email && (isMonthly() || buttonClicked == "alipay" || buttonClicked == "wechat")) {
		let promptMessage;
		if (isMonthly()) {
			promptMessage = "Enter your email to link the other extensions";
		} else {
			promptMessage = "Enter your email for the receipt";
		}
		email = prompt(promptMessage);
		if (!email) {
			niceAlert("You must enter an email");
			return;
		}
	}

	if (licenseType == "singleUser") {
		initPaymentProcessor(amount);
	} else {
		initPaymentProcessor(licenseSelected.price);
	}
}

function isZeroDecimalCurrency(currencyCode) {
	var zeroDecimalCurrencies = ["bif", "djf", "jpy", "krw", "pyg", "vnd", "xaf", "xpf", "clp", "gnf", "kmf", "mga", "rwf", "vuv", "xof"];
	if (zeroDecimalCurrencies.includes(currencyCode.toLowerCase())) {
		return true;
	}
}

function getAmountNumberOnly() {
	var amount = $("#amount").val();

	amount = amount.replace(",", ".");
	amount = amount.replace("$", "");
	amount = amount.replace("¥", "");
	amount = amount.replace("£", "");
	
	amount = amount.replace(/o/ig, '0');

	amount = amount.replace(/０/g, '0');
	amount = amount.replace(/１/g, '1');
	amount = amount.replace(/２/g, '2');
	amount = amount.replace(/３/g, '3');
	amount = amount.replace(/４/g, '4');
	amount = amount.replace(/５/g, '5');
	amount = amount.replace(/６/g, '6');
	amount = amount.replace(/７/g, '7');
	amount = amount.replace(/８/g, '8');
	amount = amount.replace(/９/g, '9');

	var centRegex = new RegExp('c$|cents?', 'ig');
	if (centRegex.test(amount)) {
		amount = amount.replace(centRegex, '');
		if (!amount.includes(".")) {
			amount = amount / 100 + "";
		}
	}
	
	if (amount.indexOf(".") == 0) {
		amount = "0" + amount;
	}
	
	// make sure 2 decimal positions ie. 0.5 > 0.50
	if (/\..$/.test(amount)) {
		amount += "0";
	}
	
	amount = $.trim(amount);
	return amount;
}

function hideBeforeSuccessfulPayment() {
	$("#extraFeatures").hide();
	$("#paymentArea").hide();
}

async function showSuccessfulPayment() {
	await Controller.processFeatures();
	hideBeforeSuccessfulPayment();

	if (DetectClient.isFirefox()) {
		$("#video").attr("src", "contributeVideo.html");
		$('#video').on("load", function () {
			$(this).contents().find("body").off().on('click', () => {
				chrome.tabs.create({ url: "https://www.youtube.com/watch?v=Ue-li7gl3LM" });
			});
		});
	} else {
		$("#video").attr("src", "https://www.youtube.com/embed/Ue-li7gl3LM?rel=0&autoplay=1&showinfo=0&theme=light");
		//$("#video").attr("src", "https://player.vimeo.com/video/207059726?title=false&byline=false&portrait=false&autoplay=true");
	}

	$("#extraFeaturesWrapper").show();
	
	if (localStorage._amountForAllExtensions) {
		$("#unlockOtherExtensions").unhide();
	}
	$("#paymentComplete").unhide();
}

function getStripeAmount(price, currencyCode) {
	var stripeAmount;

	if (isZeroDecimalCurrency(currencyCode)) {
		stripeAmount = price;
	} else {
		stripeAmount = price * 100;
	}

	stripeAmount = Math.round(stripeAmount) // round to prevent invalid integer error ie. when entering amount 1.1

	return stripeAmount;
}

async function paymentFetch(url, data, options = {}) {
    try {
        return await fetchJSON(url, data, options);
    } catch (error) {
        hideLoading();
        openGenericDialog({
            title: getMessage("theresAProblem") + " - " + error,
            content: getMessage("tryAgainLater") + " " + getMessage("or") + " " + "try another payment method."
        });
        console.error(error);
        throw error;
    }
}

async function createStripeSource(params) {
	showLoading();

	/*
		Flow:
			-Create source on server (not client side because chrome page was not https) which returns an Alipay payment page
			-Alipay page on success (and failure) returns to extensionUrl
			-Asynchronously the server will call a webhook to charge the source
	*/

    let extensionUrl;
    if (params.type == "wechat") {
        extensionUrl = "https://jasonsavard.com/contribute";
    } else {
        extensionUrl = donationPageUrl;
    }

    let data = {
        action: "createSource",
        type: params.type,
        amount: getStripeAmount(params.price, getCurrencyCode()),
        currency: getCurrencyCode(),
        email: email,
        itemId: ITEM_ID,
        itemName: extensionName,
        description: extensionName,
        extensionUrl: extensionUrl + "?action=" + params.type,
        livemode: stripeLiveMode
    };
    if (licenseType == "multipleUsers") {
        data.licenseType = licenseType;
        data.licenseNumber = licenseSelected.number;
    } else if (isMonthly()) {
        data.billingPeriod = "monthly";
    }

    data = await paymentFetch("https://apps.jasonsavard.com/paymentSystems/stripe/ajax.php", data, {method: "POST"});
    localStorage.stripeClientSecret = data.client_secret;
    return data.redirect_url;
}

async function validateStripeSource(type) {
	if (getUrlValue(location.href, "client_secret") == localStorage.stripeClientSecret) {
		showLoading();
		// Since webhook charges are asynchronous let's wait a second before verifying the payment success
        await sleep(seconds(1));
        
        const data = await paymentFetch("https://apps.jasonsavard.com/paymentSystems/stripe/ajax.php", {
                action: "getPaymentStatus",
                sourceId: getUrlValue(location.href, "source"),
                livemode: stripeLiveMode
            },
            {
                method: "POST"
            }
        );
        hideLoading();
        console.log("payment status", data);
        // possible status: failed, canceled, pending, chargeable, consumed, succeeded
        if (data.status == "failed" || data.status == "canceled") {
            openGenericDialog({
                title: "Payment " + data.status,
                content: getMessage("tryAgainLater") + " " + getMessage("or") + " " + "try PayPal instead."
            });
            sendGA("stripe", 'failed or cancelled status: ' + data.status);
        } else {
            localStorage.removeItem("stripeClientSecret");
            showSuccessfulPayment();
            sendStats(type);
        }
	} else {
		niceAlert("JERROR: Client not matched!");
	}
}

function openMobilePayDialog(params) {
	var $dialog = initTemplate("mobilePayDialogTemplate");
	$dialog.find(".dialogDescription").html(params.message + "<br><br><img src='https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodeURIComponent(params.url) + "'/>");
	$dialog.find(".continue").off().on("click", function () {
		showLoading();
		Controller.verifyPayment(ITEM_ID, email).then(response => {
			hideLoading();
			if (response.unlocked) {
				$dialog[0].close();
				showSuccessfulPayment();
				sendStats(params.type);
			} else {
				niceAlert("You must scan the code and complete the payment first.<br><br>If you did this then <a href='https://jasonsavard.com/contact'>contact</a> the developer!");
			}
		}).catch(error => {
			$dialog[0].close();
			hideLoading();
			// show success anyways because they might just have extensions preventing access to my server
			showSuccessfulPayment();
			sendGA(params.type, 'failure ' + error + ' but show success anyways');
		});
	})
	openDialog($dialog);
}

async function initPaymentProcessor(price) {
	if (donateButtonClicked == "paypal") {
		sendGA("paypal", 'start');
		
		showLoading();

		// seems description is not used - if item name is entered, but i put it anyways
		var data = {
			itemId:			ITEM_ID,
			itemName:		extensionName,
			currency:		getCurrencyCode(),
			price:			price,
			description:	extensionName,
			successUrl:		donationPageUrl + "?action=paypalSuccess",
			errorUrl:		donationPageUrl + "?action=paypalError",
			cancelUrl:		"https://apps.jasonsavard.com/tools/redirectToExtension.php?url=" + encodeURIComponent(donationPageUrl)
		};

		if (email) {
			data.email = email;
		}
		
		if (licenseType == "multipleUsers") {
			data.license = licenseSelected.number;
			data.action = "recurring";
		} else if (isMonthly()) {
			data.action = "recurring";
		}
        
        location.href = await paymentFetch(Controller.FULLPATH_TO_PAYMENT_FOLDERS + "paymentSystems/paypal/createPayment.php", data, {method: "POST"});
	} else if (donateButtonClicked == "stripe") {
		sendGA("stripe", 'start');
		
		function addFormField(form, name, value) {
			form.append($('<input>', {
				'name': name,
				'value': value,
				'type': 'hidden'
			}));
		}

		var form = $('<form>', {
			'action': 'https://jasonsavard.com/payment',
			'method': DetectClient.isChrome() ? 'post' : 'get' // seems firefox cross domain post
		});

		addFormField(form, "amount", 		price);
		addFormField(form, "currency", 		getCurrencyCode());
		addFormField(form, "itemId",		ITEM_ID);
		addFormField(form, "itemName",		extensionName);
		addFormField(form, "description", 	extensionName);
		addFormField(form, "livemode", 		true);
		addFormField(form, "returnUrl", 	donationPageUrl);
		        
		if (email) {
			addFormField(form, "email", email);
		}

		if (licenseType == "multipleUsers") {
			addFormField(form, "license", licenseSelected.number);
			addFormField(form, "billingPeriod", "monthly");
		} else if (isMonthly()) {
			addFormField(form, "billingPeriod", "monthly");
		}
		        
		form
			.appendTo('body')
			.submit()
			.remove()
		;
	} else if (donateButtonClicked == "alipay") {
		sendGA("alipay", 'start');

		location.href = await createStripeSource({
			type:	"alipay",
			price:	price
		});

	} else if (donateButtonClicked == "wechat") {
		sendGA("wechat", 'start');

		const url = await createStripeSource({
			type:	"wechat",
			price:	price
		});
        hideLoading();

        openMobilePayDialog({
            message:	"Use WeChat to scan this QR code.",
            url:		url,
            type:		"wechat"
        });
	} else if (donateButtonClicked == "applePay") {
		sendGA("applePay", 'start');
		
		let url = "https://jasonsavard.com/contribute?action=applePay";

		function appendParam(url, name, value) {
			return url + "&" + name + "=" + encodeURIComponent(value);
		}

		url = appendParam(url, "amount", price);	
		url = appendParam(url, "currency", getCurrencyCode());
		url = appendParam(url, "itemId", ITEM_ID);
		url = appendParam(url, "itemName", extensionName);
		url = appendParam(url, "description", extensionName);

		if (window.email) {
			url = appendParam(url, "email", window.email);
		}
		
		if (licenseType == "multipleUsers") {
			url = appendParam(url, "license", licenseSelected.number);
			url = appendParam(url, "billingPeriod", "monthly");
		} else if (isMonthly()) {
			url = appendParam(url, "billingPeriod", "monthly");
		}

		openMobilePayDialog({
			message:	"Scan this QR code with your mobile.",
			url:		url,
			type:		"applePay"
		});
	} else if (donateButtonClicked == "coinbase") {
		sendGA("coinbase", 'start');
		
		var data = {
			action: "createCoinbaseCharge",
			name: extensionName,
			amount: price,
			currency: getCurrencyCode(),
			itemId: ITEM_ID,
			redirectUrl: "https://apps.jasonsavard.com/tools/redirectToExtension.php?url=" + encodeURIComponent(donationPageUrl + "?action=coinbaseSuccess")
		}

		if (window.email) {
			data.email = window.email;
		}

		if (licenseType == "multipleUsers") {
			data.license = licenseSelected.number;
		}
			
        showLoading();
		data = await paymentFetch("https://apps.jasonsavard.com/paymentSystems/coinbase/ajax.php", data, {method: "post"});
        location.href = data.url;
	} else {
		openGenericDialog({
			title: getMessage("theresAProblem"),
			content: 'invalid payment process'
		});
	}
}

function ensureEmail(closeWindow) {
	if (!email) {
		niceAlert(getMessage("mustSignInToPay")).then(function() {
			if (closeWindow) {
				window.close();
			}
		});
	}
}

function signOut() {
	location.href = Urls.SignOut;
}

function canHaveALicense(email) {
	return isDomainEmail(email) || getUrlValue(location.href, "testlicense");
}


function isPayPalSubscriptionsSupported() {
	function isInThisLang(thisLang) {
		return lang.includes(thisLang) || chrome.i18n.getUILanguage().includes(thisLang);
	}
	
	if (isInThisLang("de") || isInThisLang("zh")) {
		return false;
	} else {
		return true;
	}
}

function isMonthly() {
	return $("#paymentType")[0].selected == "monthly" || isMonthlyForAllExtensions();
}

function isMonthlyForAllExtensions() {
    return $("#paymentType")[0].selected == "monthly-all-extensions";
}

function showAmountSelections() {
	$("#multipleUserLicenseIntro").hide();
	$("#donateAmountWrapper").slideDown();
	$("#paymentMethods").slideUp();
}

async function sendStats(paymentProcessor) {
	if (localStorage._amountSubmitted) {
		sendGA(paymentProcessor, "success", localStorage._amountType == "monthly" ? "monthlyAmount": "amount", localStorage._amountSubmitted);

		if (localStorage._amountType == "monthly") {
			if (localStorage._minMonthlyPayscale) {
				sendGA("ABTest", "minMonthlyPayscale " + localStorage._minMonthlyPayscale, localStorage._amountSubmitted, localStorage._amountSubmitted);
			}
		} else {
			if (localStorage._minOnetimePayscale) {
				sendGA("ABTest", "minOnetimePayscale " + localStorage._minOnetimePayscale, localStorage._amountSubmitted, localStorage._amountSubmitted);
			}
		}
	}
	sendGA(paymentProcessor, "success", "daysElapsedSinceFirstInstalled", await daysElapsedSinceFirstInstalled());

}

function getCurrencyCode() {
	return $("#currency")[0].selected;
}

function amountSelected(amount) {
	if (isSimilarValueToUS(getCurrencyCode())) {
		localStorage._amountSubmitted = amount;
		if (isMonthly()) {
			localStorage._amountType = "monthly";
		} else {
			localStorage._amountType = "onetime";
        }
        
        if (isMonthlyForAllExtensions()) {
            localStorage._amountForAllExtensions = true;
        } else {
            localStorage.removeItem("_amountForAllExtensions");
        }

		sendGA("donationAmount", isMonthly() ? 'monthlySubmitted' : 'submitted', amount);
	}
	
	if (amount == "") {
		showError(getMessage("enterAnAmount"));
        $("#amount").focus();
    } else if (isNaN(amount)) {
		showError("Invalid number");
        $("#amount").focus();
	} else if (parseFloat(amount) < minimumDonation) {
		var minAmountFormatted = minimumDonation;
		showError(getMessage("minimumAmount", $("#currency")[0].selectedItem.getAttribute("symbol") + " " + minAmountFormatted));
		$("#amount").val(minAmountFormatted).focus();
	} else {
		$("#paymentMethods").slideDown();
		$("#multipleUserLicenseIntro").hide();
	}
}

function convertUSDToJPY(amountInUSD) {
	return amountInUSD * 100;
}

$(document).ready(() => {

	$("title, .titleLink").text(extensionName);
	
	$("#multipleUserLicenseWrapper").slideUp();

	if (DetectClient.isFirefox()) {
		$("#video").attr("src", "contributeVideo.html");
		$('#video').on("load", function () {
			$(this).contents().find("body").on('click', () => {
				chrome.tabs.create({ url: "https://www.youtube.com/watch?v=fKNZRkhC3OE" });
			});
		});
	} else {
		$("#video").attr("src", "https://www.youtube.com/embed/pN9aec4QjRQ?showinfo=0&theme=light&enablejsapi=1");
	}

	(async () => {

        await initUI();

        window.lang = await storage.get("language");

		const accountsWithoutErrors = getAccountsWithoutErrors(accounts);
		email = getFirstEmail( accountsWithoutErrors );
		ensureEmail(true);

		initCurrencyAndMinimums(getMessage("currencyCode"));

		/*
		var randomNumber = Math.floor(Math.random() * 2) + 1;
		if (randomNumber == 1) { // Math.random() < 0.5
			localStorage._minMonthlyPayscale = "10-5-3-2";
		} else if (randomNumber == 2) {
			localStorage._minMonthlyPayscale = "10-5-2";
			$("#monthlyAmountSelections [amount='3']").hidden();
		}
		*/

		if (canHaveALicense(email)) {
			$("#paymentType").hide();
		
			$("#singleUserButton")
				.unhide()
				.click(function() {
					$("#singleUserButton").slideUp();
					$("#paymentType").slideDown();
				})
			;
			
			$("#multipleUserLicenseLink").hide();
			$("#multipleUserLicenseFor").text( getMessage("multipleUserLicenseFor", email.split("@")[1]) );
			$("#multipleUserLicenseButtonWrapper").show();
		} else {
			/*
			if (randomNumber == 1) { // Math.random() < 0.5
				localStorage._minOnetimePayscale = "40-20-15-10";
			} else if (randomNumber == 2) {
				localStorage._minOnetimePayscale = "40-20-10";
				$("#onetimeAmountSelections [amount='15']").hidden();
			}
			*/
		}
		
		var action = getUrlValue(location.href, "action");
		
			if (action == "paypalSuccess" || action == "stripeSuccess") {
				hideBeforeSuccessfulPayment();
				
				new Promise((resolve, reject) => {
					if (ITEM_ID == "screenshots") {
						resolve();
					} else {
						showLoading();
						Controller.verifyPayment(ITEM_ID, email).then(response => {
							hideLoading();
							if (response.unlocked) {
								resolve();
							} else {
								openGenericDialog({
									title: getMessage("theresAProblem"),
									content: "Could not match your email, please <a href='https://jasonsavard.com/contact'>contact</a> the developer!"
								});
							}
						}).catch(error => {
							hideLoading();
							// show success anyways because they might just have extensions preventing access to my server
							showSuccessfulPayment();
							sendGA("paypal", 'failure ' + error + ' but show success anyways');
						});
					}
				}).then(() => {
					showSuccessfulPayment();
					if (action == "paypalSuccess") {
						sendStats("paypal");
					} else if (action == "stripeSuccess") {
						sendStats("stripe");
					}
				});
			} else if (action == "paypalError" || action == "stripeError") {
				var error = getUrlValue(location.href, "error");
				if (!error) {
					error = "";
				}
				
				openGenericDialog({
					title: getMessage("theresAProblem") + " " + error,
					content: getMessage("tryAgainLater") + " " + getMessage("or") + " " + "try another payment method instead."
				});
				
				if (action == "paypalError") {
					sendGA("paypal", 'failure ' + error);
				} else if (action == "stripeError") {
					sendGA("stripe", 'failure ' + error);
				}
			} else if (action == "alipay") {
				validateStripeSource(action);
			} else if (action == "coinbaseSuccess") {
				showSuccessfulPayment();
		} else {
			// nothing
		}
		
		if (getUrlValue(location.href, "ref") == "reducedDonationFromNotif") {
			niceAlert(getMessage("reducedDonationAd_popup", getMessage("extraFeatures")));
		}
		
		var contributionType = getUrlValue(location.href, "contributionType");
		
		if (contributionType == "monthly") {
			// nothing
		}
		
		$("#paymentType").on("paper-radio-group-changed", function() {
			initCurrencyAndMinimums(getCurrencyCode());
			
			if (window.matchMedia && window.matchMedia("(min-height: 800px)").matches) {
				showAmountSelections();
			} else {
				$("#multipleUserLicenseIntro").hide();
				$("#extraFeaturesWrapper").slideUp("slow");
				setTimeout(() => {
					showAmountSelections();
				}, 200);
			}
			sendGA("paymentTypeClicked", this.selected);
		});
		
		$("#currency").on("iron-activate", function(e) {
			var currencyCode = e.originalEvent.detail.selected;
			
			initCurrencyAndMinimums(currencyCode);
			
			if (!isSimilarValueToUS(currencyCode) && currencyCode != "JPY") {
				setTimeout(function() {
					$("#amount")
						.removeAttr("placeholder")
						.focus()
					;
				}, 100)
			}
		});
		
		$("#paypal").click(function() {
			initPaymentDetails("paypal");
			sendGA("paymentProcessorClicked", "paypal");
		});
		
		$("#stripe, #googlePay").click(function() {
			initPaymentDetails("stripe");
			sendGA("paymentProcessorClicked", "stripe");
		});

		$("#alipay").click(function () {
			initPaymentDetails("alipay");
			sendGA("paymentProcessorClicked", "alipay");
		});

		$("#wechat-pay").click(function () {
			initPaymentDetails("wechat");
			sendGA("paymentProcessorClicked", "wechat");
		});

		$("#applePay").click(function () {
			initPaymentDetails("applePay");
			sendGA("paymentProcessorClicked", "applePay");
		});

		$("#coinbase").click(function() {
			if (isMonthly()) {
				niceAlert("The coinbase option doesn't support monthly payments, please try PayPal instead or use the one-time option.");
			} else {
				initPaymentDetails("coinbase");
				sendGA("paymentProcessorClicked", "coinbase");
			}
		});

		$(".amountSelections paper-button").click(function() {
			amount = $(this).attr("amount");
			if (getCurrencyCode() == "JPY") {
				amount = convertUSDToJPY(amount);
			}
			
			amountSelected(amount)
		});

		$("#submitDonationAmount").click(function() {
			amount = getAmountNumberOnly();
			amountSelected(amount);
		});

		$('#amount')
			.click(function(event) {
				$(this).removeAttr("placeholder");
				$("#paymentMethods").slideUp();
			})
			.keydown(function(event) {
				if (event.key == 'Enter' && !event.originalEvent.isComposing) {
					$("#submitDonationAmount").click();
				} else {
					$("#submitDonationAmount").addClass("visible");
				}
			})
		;
		
		$("#alreadyDonated").click(function() {
			if (email) {
				showLoading();
				Controller.verifyPayment(ITEM_ID, email).then(response => {
					hideLoading();
					if (response.unlocked) {
						showSuccessfulPayment();
					} else {
						var $dialog = initTemplate("noPaymentFoundDialogTemplate");
						$dialog.find("#noPaymentEmail").text(email);
						openDialog($dialog).then(function(response) {
							if (response == "ok") {
								
							}
						});
					}
				}).catch(error => {
					hideLoading();
					openGenericDialog({
						title: getMessage("theresAProblem"),
						content: getMessage("tryAgainLater")
					});
				});
			} else {
				ensureEmail();
			}
		});
		
		$("#help").click(function() {
			location.href = "https://jasonsavard.com/wiki/Extra_features_and_contributions";
		});
		
		$("#multipleUserLicenseLink, #multipleUserLicenseButton").click(function(e) {
			$("#multipleUserLicenseIntro").slideUp();
			$('#donateAmountWrapper').slideUp();
			if (email) {
				$("#licenseDomain").text("@" + email.split("@")[1]);
				if (canHaveALicense(email)) {
					$("#singleUserButton").slideUp();
					$("#paymentType").slideUp();
					$("#paymentMethods").slideUp();
					
					$("#licenseOptions paper-item").each(function() {
						var users = $(this).attr("users");
						var price = $(this).attr("price");
						
						var userText;
						var priceText;
						
						if (users == 1) {
							userText = getMessage("Xuser", 1);
							priceText = getMessage("anyAmount");
						} else if (users == "other") {
							// do nothing
						} else {
							if (users == "unlimited") {
								userText = getMessage("Xusers", getMessage("unlimited"));
							} else {
								userText = getMessage("Xusers", users);
							}
							priceText = "$" + price + "/" + getMessage("month").toLowerCase();
						}
						
						if (userText) {
							$(this).find("div").eq(0).text( userText );
							$(this).find("div").eq(1).text( priceText );
						}
						
						$(this).off().click(function(e) {
							sendGA("license", users + "");
							if (users == 1) {
								$("#paymentType").slideDown();
								$("#paymentMethods").slideUp();
								$("#multipleUserLicenseLink").hide();
								$("#multipleUserLicenseIntro").slideDown();
								$("#multipleUserLicenseWrapper").slideUp();
							} else if (users == "other") {
								location.href = "https://jasonsavard.com/contact?ref=otherLicense";
							} else {
								if (e.ctrlKey) {
									price = 0.01;
								}
								licenseSelected = {number:users, price:price};

								$("#paymentType")[0].selected = "monthly";
								licenseType = "multipleUsers";
								initCurrencyAndMinimums(); // called only to set default currency to usd

								if (isPayPalSubscriptionsSupported()) {
									initPaymentDetails("paypal");
								} else {
									initPaymentDetails("stripe");
								}
							}
						});
					});
				} else {
					$("#licenseOnlyValidFor").hide();
					$("#signInAsUserOfOrg").show();
					$("#licenseOptions").hide();
					
					$("#exampleEmail").empty().append( $("<span>").text(email.split("@")[0]), $("<b>").text("@mycompany.com") );
				}
				$("#multipleUserLicenseWrapper").slideDown();
			} else {
				ensureEmail();
			}
			
			sendGA("license", "start");
		});
		
		$("#changeDomain").click(function() {
			openGenericDialog({
				content: getMessage("changeThisDomain", getMessage("changeThisDomain2")),
				otherLabel: getMessage("changeThisDomain2")
			}).then(function(response) {
				if (response == "other") {
					signOut();
				}
			});
		});
		
		$("#options").click(function() {
			location.href = "options.html";
		});
		
		$(".signOutAndSignIn").click(function() {
			signOut();
		});
		
		$("#driveExtraFeatures").click(function() {
			chrome.tabs.create({url:"https://jasonsavard.com/Checker-Plus-for-Google-Drive?ref=contributePage"});
		});

		$("#gmailExtraFeatures").click(function() {
			chrome.tabs.create({url:"https://jasonsavard.com/Checker-Plus-for-Gmail?ref=contributePage"});
		});

		$("#calendarExtraFeatures").click(function() {
			chrome.tabs.create({url:"https://jasonsavard.com/Checker-Plus-for-Google-Calendar?ref=contributePage"});
		});

		$("#support").click(function() {
			chrome.tabs.create({url:"https://jasonsavard.com/forum/?ref=contributePage"});
		});

		// load these things at the end
		
		// prevent jumping due to anchor # and because we can't javascript:; or else content security errors appear
		$("a[href='#']").on("click", function(e) {
			e.preventDefault()
		});

	})(); // end async

}); // end jquery