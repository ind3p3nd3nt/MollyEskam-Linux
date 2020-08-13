function closeWindow() {
	var windowId = localStorage["_permissionWindowId"];
	if (windowId) {
		localStorage.removeItem("_permissionWindowId");
		chrome.windows.remove(parseInt(windowId));
	}
	$("body").removeClass("page-loading-animation").append("You can close this window!");
	window.close();
}

async function processOAuthUserResponse(oAuthForMethod, accessTokenParams, oauthFollowupMethod) {
    const accessTokenResponse = await oAuthForMethod.getAccessToken(accessTokenParams);
    const tokenResponse = accessTokenResponse.tokenResponse;
    const sendMessageParams = await oauthFollowupMethod(tokenResponse);
    return new Promise((resolve, reject) => {
        if (isPopupOrOptionsOpen()) {
            // append oauth token in case needed
            sendMessageParams.tokenResponse = tokenResponse;
            chrome.runtime.sendMessage(sendMessageParams, () => {
                closeWindow();
                resolve();
            });
        } else {
            location.href = chrome.runtime.getURL("popup.html?source=oauth");
            resolve();
        }
    });
}

function isPopupOrOptionsOpen() {
	return chrome.extension.getViews().some(thisWindow => {
		if (thisWindow.location.href.includes("popup.html") || thisWindow.location.href.includes("options.html")) {
			return true;
		}
	});
}

function showError(error) {
	$("body").removeClass("page-loading-animation");
	$("body").text(error);
}

$(document).ready(() => {

	(async () => {

        await initUI();

		var code = getUrlValue(location.href, "code", true);
		if (code) {	
            const securityToken = getUrlValue(location.href, "security_token");
            let scopes = getUrlValue(location.href, "scopes", true);
            if (scopes) {
                // patch for Google server response using +
                scopes = scopes.replaceAll("+", " ");
            }
    
            const accessTokenParams = {
                code:   code,
                scopes: scopes
            }

            try {
                if (securityToken == oAuthForEmails.getSecurityToken()) {
                    processOAuthUserResponsePromise = processOAuthUserResponse(oAuthForEmails, accessTokenParams, async tokenResponse => {
                        // do nothing
                        return {command: "grantPermissionToEmails"};
                    });
                } else if (securityToken == oAuthForProfiles.getSecurityToken()) {
                    processOAuthUserResponsePromise = processOAuthUserResponse(oAuthForProfiles, accessTokenParams, async tokenResponse => {
                        const data = await oAuthForProfiles.send({
                            userEmail: tokenResponse.userEmail,
                            url: "https://people.googleapis.com/v1/people/me",
                            data: {
                                "personFields":	"names,photos"
                            }
                        });
                        if (data) {
                            console.log(data);
                            if (data.photos && data.photos[0].url) {
                                const account = getAccountByEmail(tokenResponse.userEmail);
                                await account.saveSetting("profileInfo", {
                                    displayName:	data.names[0].displayName,
                                    imageUrl:		data.photos[0].url
                                });
                                return {command: "profileLoaded"};
                            } else {
                                throw new Error("No profile picture found");
                            }
                        }
                    });
                } else if (securityToken == oAuthForContacts.getSecurityToken()) {
                    processOAuthUserResponsePromise = processOAuthUserResponse(oAuthForContacts, accessTokenParams, async tokenResponse => {
                        const response = await fetchContacts(tokenResponse.userEmail);
                        const contactsData = await storage.get("contactsData") || [];
                        
                        var dataIndex = getContactDataItemIndexByEmail(contactsData, response.contactDataItem.userEmail);
                        if (dataIndex != -1) {
                            console.log('found: updating existing contactsDataItem')
                            contactsData[dataIndex] = response.contactDataItem;
                        } else {
                            console.log("creating new contactsDataItem");
                            contactsData.push(response.contactDataItem);
                        }
                        
                        console.log("contactdata: ", contactsData);
                        await storage.set("contactsData", contactsData);
                        await storage.set("showContactPhoto", true);
                        return {
                            command: "grantPermissionToContacts",
                            contactDataItem:response.contactDataItem
                        };
                    });
                } else {
                    throw "security_token not matched!";
                }
            } catch (error) {
                showError(error);
            }
		} else {
			const url = "https://jasonsavard.com/wiki/Granting_access?ref=permissionDenied&ext=gmail";
			
			if (isPopupOrOptionsOpen()) {
				await openUrl(url);
			} else {
				await openUrl(url, parseInt(localStorage._currentWindowId));
			}
			
            closeWindow();
		}
	})(); // end async
});