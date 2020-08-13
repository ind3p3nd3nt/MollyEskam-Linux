// Copyright Jason Savard

function Account() {

    var that = this;

	this.unreadCount = -1;
	this.lastGetEmailsDate = new Date(1);
	this.lastSuccessfulMailUpdate = new Date(1);
	
    var email;
    var historyId;
    
	var mailArray = [];
	var newestMailArray = [];
	var unsnoozedEmails = [];
	var emailsInAllLabels = [];
	var labels = null;
    
    var accountAddingMethod;
    var useBasicHTMLView;
    var conversationView;
    var hideSentFrom;

	var lastGmailATFetch = new Date(1);
	var gmailAT;
	var getGmailAtPromise;
	var gmailATProcessing = false;
	var cachedInboxFeedDetails;

    this.init = async params => {
        that.id = params.accountNumber;
        email = params.email;

        // use this section to "cache" storage variables so I wouldn't have to convert all calls to async
        accountAddingMethod = await storage.get("accountAddingMethod");
        useBasicHTMLView = await storage.get("useBasicHTMLView");
        that.showEOM = await storage.get("showEOM");
        hideSentFrom = await storage.get("hideSentFrom");

        // account specific
        conversationView = await that.getSetting("conversationView");
    }
    
    this.getAccountAddingMethod = function() {
        return accountAddingMethod;
    }

    this.setAccountAddingMethod = function(thisAccountAddingMethod) {
        accountAddingMethod = thisAccountAddingMethod;
    }
    
	this.test = function() {
		console.log(mailArray);
		mailArray.push(mailArray.first());
		mailArray.last().id = "123";
    }
    
    this.filterEmailBody = function(params) {
        let subject = params.subject;
        let body = params.body;
    
        if (body) {
            
            // remove line breaks because regex cannot match content before lines especially with start of line operator ^
            body = body.replace(/\r\n/g, " ");
            body = body.replace(/^facebook([a-z])/i, "$1"); // $1 is a regex variable indicating matching everything, remove facebook string because when doing htmlToText ... we get a string like: facebookWilliam da Silva commented on your status.William wrote:
            
            var regexs = new Array();
            
            regexs.push(/ on [a-z]{3}, [a-z]{3} \d+/i);	// On Wed, Dec 28, 2011 at 12:36 AM, Jason <jaso
            regexs.push(/ on [a-z]{3} \d+\/\d+\/\d+/i);	// On Wed 15/02/12  8:23 AM , Wade Konowalchuk
            regexs.push(/ on \d+[\/|-]\d+[\/|-]\d+/i);	// on 2011/12/28 Jason <apps@...
            regexs.push(/ on \w*, \w* \d+(st)?, \d+,/i);	// On Thursday, October 31, 2013, Jason wrote:   OR   On Wednesday, October 15, 2014, Jason <jasonsavard@gmail.com> wrote:
            regexs.push(/ >? on \w* \d+, \d+, at/i);	// In!  > On Oct 5, 2014, at 9:32 AM ...
            regexs.push(/ (on)? ([a-z]{3} )?[a-z]{3} \d+,? \d+ /i); 		// On(optional) Fri(optional) May 04 2012 15:54:46
            regexs.push(/ (on)? ([a-z]{3} )?\d+,? [a-z]{3}/i); 		// On(optional) Fri(optional) 28 April 2015 at??? 13:17
            //regexs.push(/ \d+[\/|-]\d+[\/|-]\d+/i);		// 2011/12/28 Jason <apps@...
            regexs.push(/ [\-]+ original message/i); // -------- Message original -------- 
            regexs.push(/ [\-]+ message original/i); // -------- original Message -------- 
            regexs.push(/ ?sent from: /i);
            regexs.push(/ ?get outlook for ios/i);
            regexs.push(/ ?get outlook for android/i);
            regexs.push(/ ?Envoyé de mon i/);
            regexs.push(/ ?cc: /i);
            regexs.push(/ date: /i); // removed the '?' because the word up'date' would stop the filter
            regexs.push(/ ?from: /i); //great From: Jason
            regexs.push(/ ?Reply to this email to comment on this status./i); // facebook ending
            regexs.push(/ subject: re: /i); // facebook ending
            // DONT use because passing subject string with unintential regex syntax screwed it up like ] and [ etc.
            //regexs.push( new RegExp(" subject: re: " + subject, "i") );	// I can play afterall, any room left ? Subject: Re: Saturday's game Nov 2nd at 2pm From: wade@
            
            if (hideSentFrom) {
                //regexs.push(/^(.*) ?sent from \w* ?\w* ?$/i); // "Sent from Blackberry" or "Sent from my iPhone"
                regexs.push(/ ?Sent (wirelessly )?from my /i); // "Sent from my Blackberry" or "Sent from my iPhone"
                regexs.push(/ ?Sent on the ?\w* \w* network/i); // "Sent on the TELUS Mobility network with BlackBerry"
                regexs.push(/ ?Sent from \w* mobile/i); // "Sent from Samsung Mobile"
                regexs.push(/ ?Sent from Windows Mail/i); // "Sent from Samsung Mobile"
            }
            
            for (var a=0; a<regexs.length; a++) {			   
                /*
                // max this internal loop to 10: just in case it goes on forever
                // by the way we re-passing the same regex several times until all occurences of ie from" are gone... "Hello1 from: Hello2 from:"
                for (var b=0; b<10; b++) {
                    var matches = body.match(regexs[a]);
                    if (matches && matches.length >= 2) {
                        body = matches[1];
                    } else {
                        break;
                    }
                }
                */
                
                // regex.search = faster ...
                var searchIndex = body.search(regexs[a]);
                if (searchIndex != -1) {
                    body = body.substring(0, searchIndex);
                }
            }
            
            body = body.trim();
            
            // remove repeated subject line from beginning of the body (ie. emails from facebook tend to do that etc. like William da Silva commented on your status.
            if (body.indexOf(subject) == 0 && subject && subject.length >= 20) {
                body = body.substring(subject.length);
            }
            
        } else {
            body = "";
        }
        return body;
    }
    
   	async function getFeedUnreadCount(params, rawFeed) {
        let feedUnreadCount;
        const parsedFeed = parseXML(rawFeed);
        let fullCount = parsedFeed.querySelector('fullcount');
        if (fullCount) {
            feedUnreadCount = Number(fullCount.textContent);
        }

        // TESTING
        //alert('remove test')
        //feedUnreadCount = 0;
        if (!feedUnreadCount) {
            // patch: because fullcount is 'sometimes' 0 for some user accounts for labels: important or allmail (https://github.com/aceat64/MailCheckerMinus/issues/15 or banko.adam@gmail.com)
            feedUnreadCount = Number(parsedFeed.querySelectorAll('entry').length);
            
            // TESTING
            // 20 is the limit to the feed so there might be more unread emails, let's use the basic view to fetch the real total (we can only do this for allmail/unread label because even the basic view only says 1-20 of "about"??? blahblah
            if (feedUnreadCount >= MAX_EMAILS_IN_ATOM_FEED && params.monitorLabels[params.monitorLabelsIndex] == SYSTEM_ALL_MAIL) {
                console.log("use the basic view to fetch the real total...")
                
                try {
                    const data = await ajaxBasicHTMLGmail(that.getMailUrl({useBasicGmailUrl:true}) + "?s=q&q=label%3Aunread"); // append 'unread' to only fetch unreads of this label of course
                    // patch: must place wrapper div element because jQuery would generate error when trying to parse the response into the $() contructor ... Uncaught Error: Syntax error, unrecognized expression: <html...
                    const responseText = parseHtml(data);
                    const realTotal = responseText.querySelector("table tr:first-child td b:nth-child(3)").textContent;
                    if (realTotal && !isNaN(realTotal) && realTotal != "0") {
                        feedUnreadCount = Number(realTotal);
                    } else {
                        realTotal = responseText.querySelector("table tr:first-child td b:nth-child(2)").textContent;
                        if (realTotal && !isNaN(realTotal) && realTotal != "0") {
                            feedUnreadCount = Number(realTotal);
                        }
                    }
                } catch (error) {
                    console.error("error passing gmail basic question: " + error);
                }
            }
        }

        return feedUnreadCount;
   	}
   	
   function initFeedError(account, error, errorCode) {
        account.error = error;

        const errorObj = new Error(error);
	    if (errorCode) {
		    account.errorCode = errorObj.errorCode = errorCode;
        }

        throw errorObj;
   }
   
   async function fetchFeed(params) {
        var LABEL_TO_ENSURE_MAIL_ADDRESS_IS_IDENTIFIED = SYSTEM_INBOX;
        
        var label;
        if (params.ensureMailAddressIdentifiedFlag) {
            label = LABEL_TO_ENSURE_MAIL_ADDRESS_IS_IDENTIFIED;
        } else {
            if (params.label) {
                label = params.label;
            } else {
                label = params.monitorLabels[params.monitorLabelsIndex];
            }
        }
        
        var atomFeed;
        if (label) {
            if (label == SYSTEM_INBOX) {
                atomFeed = AtomFeed.INBOX;
            } else if (label == SYSTEM_IMPORTANT) {
                atomFeed = AtomFeed.IMPORTANT;
            } else if (label == SYSTEM_IMPORTANT_IN_INBOX) {
                atomFeed = AtomFeed.IMPORTANT_IN_INBOX;
            } else if (label == SYSTEM_ALL_MAIL) {
                atomFeed = AtomFeed.UNREAD;
            } else if (label == SYSTEM_PRIMARY) {
                atomFeed = AtomFeed.PRIMARY;
            } else if (label == SYSTEM_PURCHASES) {
                atomFeed = AtomFeed.PURCHASES;
            } else if (label == SYSTEM_FINANCE) {
                atomFeed = AtomFeed.FINANCE;
            } else if (label == SYSTEM_SOCIAL) {
                atomFeed = AtomFeed.SOCIAL;
            } else if (label == SYSTEM_PROMOTIONS) {
                atomFeed = AtomFeed.PROMOTIONS;
            } else if (label == SYSTEM_UPDATES) {
                atomFeed = AtomFeed.UPDATES;
            } else if (label == SYSTEM_FORUMS) {
                atomFeed = AtomFeed.FORUMS;
            } else {
                atomFeed = label;
            }
            
            // apparently iPads add these labels with slashes (ie. INBOX/ they are not actually nested labels just labels with slashes in them)
            atomFeed = atomFeed.replace(/\//g, "-"); // slashes must had to replaced with - to work (yeah that's gmail wants it)
            atomFeed = encodeURIComponent(atomFeed);
        } else {
            atomFeed = AtomFeed.INBOX;
        }

        var url = that.getMailUrl({useStandardGmailUrl:true, atomFeed:atomFeed, urlParams:"timestamp=" + Date.now()});
        
        // now only using cache for ensuremaiaddress because there were duplicate mail issues https://jasonsavard.com/forum/discussion/comment/16273#Comment_16273
        var useCache = params.ensureMailAddressIdentifiedFlag && cachedInboxFeedDetails;
        let responseStatus;
        let responseUrl;
        let html;

        try {
            if (useCache) {
                responseStatus = cachedInboxFeedDetails.responseStatus;
                responseUrl = cachedInboxFeedDetails.responseUrl;
                html = cachedInboxFeedDetails.html;
            } else {
                response = await fetchWrapper(url);
                if (!response.ok) {
                    const error = Error(response.statusText);
                    error.errorCode = response.status;
                    throw error;
                }

                responseStatus = response.status;
                responseUrl = response.url;
                html = await response.text();
                if (params.ensureMailAddressIdentifiedFlag) {
                    cachedInboxFeedDetails = {
                        responseStatus: responseStatus,
                        responseUrl: responseUrl,
                        html: html,
                    }
                }
            }
            that.error = null;

            // detect Google account without Gmail (is usually redirected to an add gmail account page (ie. AddMailService)
            if (/AddMailService/i.test(responseUrl)) {
                // find the email address in response
                if (html) {
                    var emailMatches = extractEmails(html);
                    if (emailMatches) {
                        emailMatches.some(emailMatch => {
                            // make sure is it NOT @gmail
                            if (!emailMatch.includes("@gmail.com")) {
                                email = emailMatch;
                                return true;
                            }
                        });
                    }
                }
                
                if (!email) {
                    email = MAIL_ADDRESS_UNKNOWN;
                }
                initFeedError(that, "Error: Google account without Gmail", JError.GOOGLE_ACCOUNT_WITHOUT_GMAIL);
            } else if (/ServiceNotAllowed/i.test(responseUrl)) {
                // ie. https://accounts.google.com/ServiceLogin?continue=https://admin.google.com/blah.com/ServiceNotAllowed?service=mail&service=CPanel&skipvpage=true&authuser=1
                var matches = responseUrl.match(/continue=(.*)admin.google.com\/(.*)\//);
                if (matches && matches.length >= 3) {
                    email = matches[2];
                }
                if (!email) {
                    email = MAIL_ADDRESS_UNKNOWN;
                }
                initFeedError(that, "Gmail is not enabled", JError.GMAIL_NOT_ENABLED);
            } else if (/DomainRestrictedNetwork/i.test(responseUrl)) {
                // ie. https://accounts.google.com/b/0/DomainRestrictedNetwork?service=mail&continue=https://mail.google.com/mail/
                email = MAIL_ADDRESS_UNKNOWN;
                initFeedError(that, "Gmail is not enabled", JError.GMAIL_NOT_ENABLED);
            } else if (/CookieMismatch/i.test(responseUrl)) {
                email = MAIL_ADDRESS_UNKNOWN;
                initFeedError(that, "Problem with your cookie settings", JError.COOKIE_PROBLEMS);
            } else if (/NewServiceAccount/i.test(responseUrl)) {
                // ie. https://accounts.google.com/b/0/NewServiceAccount?service=mail&continue=https://mail.google.com/mail/
                email = MAIL_ADDRESS_UNKNOWN;
                initFeedError(that, "Service account?", JError.GOOGLE_SERVICE_ACCOUNT);
            } else {
                if (responseUrl && !responseUrl.includes("mail.google.com/mail/u/")) {
                    logError("unrecognized responseURL: " + responseUrl);
                }
                
                const rawFeed = html;
                const parsedFeed = parseXML(rawFeed);

                const titleNode = parsedFeed.querySelector('title');
                if (titleNode) {
                    var titleNodeStr = titleNode.textContent;
                    let mailTitle = titleNodeStr.replace("Gmail - ", "");
                    
                    // patch because <title> tag could contain a label with a '@' that is not an email address ie. Gmail - Label '@test@' for blah@gmail.com
                    var emails = mailTitle.match(/([\S]+@[\S]+)/ig);
                    if (emails) {
                        email = emails.last();
                    } else {
                        // catch these errors:
                        // Access to this site is blocked
                        // Acceso Denegado
                        // Denied Access Policy
                        
                        email = MAIL_ADDRESS_UNKNOWN;
                        
                        var logErrorStr = "title node error: ";
                        var error;
                        if (/Google Accounts|My Account/.test(titleNodeStr)) {
                            logErrorStr += titleNodeStr + " responseurl: " + responseUrl; // + " ... " + parsedFeed.text().substr(1000);
                            error = "Error: " + "redirection";
                        } else {
                            logErrorStr += titleNodeStr + " responseurl2: " + responseUrl;
                            error = "Error: " + titleNodeStr;
                        }

                        logError(logErrorStr);
                        initFeedError(that, error, responseStatus);
                    }
                    
                    const link = parsedFeed.querySelector('link');
                    if (link) {
                        that.link = link.getAttribute('href');
                    }
                } else {
                    email = "Cookie problem, try signing out and in or restart browser!";
                }
                
                params.rawFeed = rawFeed;
                return params;
            }
        } catch (error) {
            console.warn("fetchFeed error: " + error);
            throw initFeedError(that, error, error.errorCode);
        } finally {
            if (useCache) {
                cachedInboxFeedDetails = null;
            }
        }
   }
   
   async function fetchEmailsByLabel(params) {
	   // finished with feeds so exit/callback
	   if (params.monitorLabelsIndex >= params.monitorLabels.length) {
		   return params;
	   } else {
            const fetchFeedResponse = await fetchFeed(params);
            const accountMonitorLabels = await that.getMonitorLabels();
            const rawFeed = fetchFeedResponse.rawFeed;
            
            // If previousMonitorLabel not matching current then we are probably fetching this feed for the first time and so now we have the email address, we must now check if the user selected a different label to monitor for this email address, if so stop this one and call the feed again
            if (params.monitorLabels.toString() != accountMonitorLabels.toString()) {
                // this is a safety flag so that they we don't endless recursively call getEmails()
                if (params.fetchFeedAgainSinceMonitorLabelIsDifferent) {
                    that.error = "JError: recursive error with label";
                    throw Error(that.error);
                } else {
                    // update monitor labels and send it again
                    console.log("call again since fetchFeedAgainSinceMonitorLabelIsDifferent");
                    params.monitorLabels = accountMonitorLabels;
                    params.fetchFeedAgainSinceMonitorLabelIsDifferent = true;
                }
            } else {
                const feedUnreadCount = await getFeedUnreadCount(params, rawFeed);

                // add the parsed feeds and continue for more
                const feedInfo = {
                    label: params.monitorLabels[params.monitorLabelsIndex],
                    rawFeed: rawFeed,
                    feedUnreadCount: feedUnreadCount
                };
                
                params.feedsArrayInfo.push(feedInfo);
                params.monitorLabelsIndex++;
            }
            return fetchEmailsByLabel(params);
	   }
   }

   async function ensureUnreadAndInbox(feed1, feed2) {
	    console.log("ensureUnreadAndInbox");
        // Monitoring the Primary/inbox is usually not enough because some users will mark as done/archive emails without marking them as read and thus these "primary"/inbox labelled emails will still show up even though they don't appear in the user's ui
        // .. so we must also check that the "inbox" to prove they did not mark as done these emails
        if (feed1 && feed1.feedUnreadCount) {
            
            // get previously fetched inbox feed OR get new fetch
            if (!feed2) {
                console.log("must fetch primary/inbox feed")
                let feed2Label;
                if (feed1.label == SYSTEM_INBOX) {
                    feed2Label = SYSTEM_PRIMARY;
                } else if (isMainCategory(feed1.label)) {
                    feed2Label = SYSTEM_INBOX;
                }
                feed2 = await fetchFeed({label:feed2Label});
            }

            console.log("otherFeed", feed2);
            const feed2Parsed = parseXML(feed2.rawFeed);
            const feed2Entries = feed2Parsed.querySelectorAll("entry");

            var feed2UnreadCount = Number(feed2Entries.length);
            
            const feed1Parsed = parseXML(feed1.rawFeed);
            let lastFeed1EntryIssued = feed1Parsed.querySelector("entry:last-child issued");
            if (lastFeed1EntryIssued) {
                lastFeed1EntryIssued = Date.parse(lastFeed1EntryIssued.textContent);
            }

            let lastFeed2EntryIssued;
            if (feed2Entries.length) {
                const lastEntryIssued = feed2Parsed.querySelector("entry:last-child issued");
                if (lastEntryIssued) {
                    lastFeed2EntryIssued = Date.parse(lastEntryIssued.textContent);
                }
            }
            
            console.log("last feed dates", lastFeed1EntryIssued, lastFeed2EntryIssued);
            
            // if less than the maximum 20 OR last entry is after last entry of other feed, than we can use this feed to gaurantee we can remove emails from the primary/inbox fetch if they are also not found in this primary/inbox feed
            // OR if oldest primary/inbox email is within time range of all emails in inbox feed
            if (feed2UnreadCount < MAX_EMAILS_IN_ATOM_FEED || lastFeed1EntryIssued.isAfter(lastFeed2EntryIssued)) {
                // transport jquery array to array for speed optimization
                var feed2Array = [];
                
                feed2Entries.forEach((entry) => {
                    var issued = Date.parse(entry.querySelector("issued").textContent);
                    var id = getMessageIdFromAtomFeedEntry(entry);
                    feed2Array.push({id:id, issued:issued});
                });

                // now let's remove all primary/inbox emails which do not have an inbox/primary label
                for (var a=0; a<emailsInAllLabels.length; a++) {
                    if (emailsInAllLabels[a].monitoredLabel == feed1.label) {
                        var foundFeed2Label = false;
                        for (var b=0; b<feed2Array.length; b++) {
                            if (emailsInAllLabels[a].id == feed2Array[b].id) {
                                foundFeed2Label = true;
                                break;
                            }
                        }
                        
                        if (foundFeed2Label) {
                            that.unreadCount++;
                        } else {
                            console.log("remove email because did not pass primaryANDinbox test", emailsInAllLabels[a].title);
                            
                            var mailIdNotFoundInBothPrimaryAndInbox = emailsInAllLabels[a].id;
                            
                            emailsInAllLabels.splice(a, 1);
                            a--;
                            //that.unreadCount--;
                            
                            // remove it from newestmailarray also
                            newestMailArray.some(function(newestMail, index) {
                                if (mailIdNotFoundInBothPrimaryAndInbox == newestMail.id) {
                                    newestMailArray.splice(index, 1);
                                    return true;
                                }
                            });
                        }
                    }
                }
            } else {
                // since more than 20 (or more) emails than some might have been excluded - so we cannot use this inbox fetch
                throw JError.CANNOT_ENSURE_MAIN_AND_INBOX_UNREAD;
            }
        }
   }

   function ensureUnreadAndInboxForMultipleFeeds(feeds, inboxFeed) {
        // must do it sequentially because we don't want to poll for inbox several times
        var allPromises = feeds.reduce((sequence, feed) => {
            return sequence.then(() => {
                // fetch next feed
                return ensureUnreadAndInbox(feed, inboxFeed);
            });
        }, Promise.resolve());

        return allPromises;
   }
   
   this.getHistoryId = function() {
	   return historyId;
   }

   this.setHistoryId = function(thisHistoryId) {
        historyId = thisHistoryId;
   }

   this.getLabelName = function(labelId) {
	   var labelName;
	   
	   if (accountAddingMethod == "autoDetect") {
		   labelName = labelId;
	   } else {
		   if (labelId == SYSTEM_PRIMARY) {
			   labelName = getMessage("primary");
		   } else if (labelId == SYSTEM_PURCHASES) {
			   labelName = getMessage("purchases");
		   } else if (labelId == SYSTEM_FINANCE) {
			   labelName = getMessage("finance");
		   } else if (labelId == SYSTEM_SOCIAL) {
			   labelName = getMessage("social");
		   } else if (labelId == SYSTEM_SOCIAL) {
			   labelName = getMessage("social");
		   } else if (labelId == SYSTEM_PROMOTIONS) {
			   labelName = getMessage("promotions");
		   } else if (labelId == SYSTEM_UPDATES) {
			   labelName = getMessage("updates");
		   } else if (labelId == SYSTEM_FORUMS) {
			   labelName = getMessage("forums");
		   } else {
			   if (labels) {
				   labels.some(function(thisLabel) {
					   if (thisLabel.id == labelId) {
						   labelName = thisLabel.name;
						   return true;
					   }
				   });
			   }
		   }
	   }
	   
	   if (!labelName) {
		   labelName = "NewLabelMustRestartExtension";
	   }
	   
	   return labelName;
   }

   this.getLabelColor = function(labelId) {
	   	// note: there labels declared in both the MailAccount (ie. account) & MailObject (ie. mail)
		let color;
		if (labels) {
			labels.some(thisLabel => {
				if (thisLabel.id == labelId) {
					color = thisLabel.color;
					return true;
				}
			});
		}
		return color;
   }
   
   this.hasMonitoredLabel = async function(labelId, monitoredLabels) {
	   return monitoredLabels.some(monitorLabel => {
		   if (monitorLabel == labelId) {
			   return true;
		   }
	   });
   }
   
   this.setAccountId = function(id) {
	   that.id = id;
   }
   
   this.enablePushNotifications = async function() {
       console.log("enablePushNotifications: " + email);
       try {
            // Add email/regid to datastore so watch responses know who to notify ie. extension
            await fetchJSON("https://cool-kit-794.appspot.com/ajax", {
                email: email,
                registrationId: await ensureGCMRegistration()
            }, {
                method: "post",
                headers: {
                    "content-type": "application/json; charset=utf-8"
                }
            });

            // reset retries
            const watchRetries = await storage.get("_enablePushNotificationsRetries");
            watchRetries[email] = 0;
            await storage.set("_enablePushNotificationsRetries", watchRetries);

            return that.watch();
       } catch (error) {
            const MAX_RETRIES = 3;
            const watchRetries = await storage.get("_enablePushNotificationsRetries");
			if (!watchRetries[email]) {
				watchRetries[email] = 0;
			}
            if (watchRetries[email]++ < MAX_RETRIES) {
                console.info("enablePushNotificationsRetries retry attempt #" + watchRetries[email]);
                const exponentialRetryInSeconds = Math.pow(30, watchRetries[email]); // 30s, 15m, 7hours ...
                // minimum 1 min due to chrome alarm limitation
                const delayInMinutes = Math.max(1, exponentialRetryInSeconds / 60);
                chrome.alarms.create(Alarms.ENABLE_PUSH_NOTIFICATIONS_EMAIL_ALARM_PREFIX + email, {delayInMinutes: delayInMinutes});
            }
            await storage.set("_enablePushNotificationsRetries", watchRetries);
            throw error;
       }
   }

   this.disablePushNotifications = function() {
	   return oAuthForEmails.send({
           userEmail:email,
           type:"post",
           url: GmailAPI.URL + "stop"
        });
   }
   
   this.watch = async () => {
       console.log("watch: " + email);
       try {
            const data = await oAuthForEmails.send({
                userEmail: email,
                type: "post",
                url: GmailAPI.URL + "watch",
                data: {
                    topicName: "projects/cool-kit-794/topics/watch",
                    labelFilterAction: "exclude",
                    labelIds: [GmailAPI.labels.SPAM, GmailAPI.labels.TRASH, GmailAPI.labels.DRAFT],
                },
                noCache: true
            });
            const watchExpiration = new Date(parseInt(data.expiration)); // parseInt require because expiration number is returned as a string and Date doesn't parse it
            await that.saveSetting("watchExpiration", watchExpiration);
            that.startWatchAlarm();
            // reset retries
            const watchRetries = await storage.get("_watchRetries");
            watchRetries[email] = 0;
            await storage.set("_watchRetries", watchRetries);
       } catch (error) {
            const MAX_RETRIES = 3;
            const watchRetries = await storage.get("_watchRetries");
			if (!watchRetries[email]) {
				watchRetries[email] = 0;
			}
            if (watchRetries[email]++ < MAX_RETRIES) {
                console.info("watch retry attempt #" + watchRetries[email]);
                const exponentialRetryInSeconds = Math.pow(30, watchRetries[email]);
                // minimum 1 min due to chrome alarm limitation
                const delayInMinutes = Math.max(1, exponentialRetryInSeconds / 60);
                chrome.alarms.create(Alarms.WATCH_EMAIL_ALARM_PREFIX + email, {delayInMinutes: delayInMinutes});
            }
            await storage.set("_watchRetries", watchRetries);
       }
   }
   
   this.startWatchAlarm = async function() {
	   var DELAY_BETWEEN_STOP_AND_START_IN_SECONDS = 5;
	   var watchExpiration = await that.getSetting("watchExpiration");
	   if (watchExpiration) {
		   var nextWatchDate = watchExpiration.addSeconds(DELAY_BETWEEN_STOP_AND_START_IN_SECONDS);
		   console.log("nextWatchDate", nextWatchDate);
		   chrome.alarms.create(Alarms.WATCH_EMAIL_ALARM_PREFIX + email, {when:nextWatchDate.getTime()});
	   } else {
		   console.error("Can't startWatchAlarm because no watch expiration");
	   }
   }

   this.stopWatchAlarm = function() {
	   chrome.alarms.clear(Alarms.WATCH_EMAIL_ALARM_PREFIX + email);
   }
   
   this.isBeingWatched = async function() {
       const watchExpiration = await that.getSetting("watchExpiration");
	   return watchExpiration && watchExpiration.isAfter();
   }
   
   this.reset = function() {
	   historyId = null;
	   mailArray = [];
	   newestMailArray = [];
	   unsnoozedEmails = [];
	   emailsInAllLabels = [];
   }
   
   this.syncSignInId = async function(secondCall) {
        console.log("syncSyncInId");

        const data = await fetchText(MAIL_DOMAIN_AND_PATH + "?authuser=" + encodeURIComponent(email) + "&ibxr=0");

        const html = parseHtml(data);
        const metaTag = html.querySelector("meta[name='application-url']");
        if (metaTag) {
            const content = metaTag.getAttribute("content"); // returns: https://mail.google.com/mail/u/0
            if (content) {
                // Patch: seems that on the first call to ?authuser after granting access the response points to /u/0 always, I think by caling it once it then signs in correctly and you can call ?authuser again to get the right index
                var emails = extractEmails(data);
                if (emails && emails.length && emails.first() == email) {
                    var parts = content.match(/u\/(\d+)/);
                    var id = parts[1];
                    console.log("setting " + email + " to id: " + id);
                    that.setAccountId(id);
                } else {
                    if (secondCall) {
                        console.log("failed after 2 consecutive authuser calls");
                        throw new Error("Could not find email in response - might be signed out [12]");
                    } else {
                        console.log("did not find matching email in authuser response, so call it again");
                        return that.syncSignInId(true);
                    }
                }
            } else {
                throw new Error("Could not find email in response - might be signed out");
            }
        } else {
            throw new Error("Could not find email in response2 - might be signed out");
        }

   }
   
   this.fetchThreads = function(mailArray) {
	   // accounts count will be 0 when you start the extension or pollAccounts (that's ok because initMailAccount sets accounts to 0) once the interval calls this function then the accounts should be 1 or + 
	   let maxGetThreads;
	   if (accounts.length) {
		   // do this to prevent locked accounts (note it used be 20 and no averaging so 20 for each account, i'm such an idiot
		   maxGetThreads = 5 / accounts.length; // because this method will be called for each accounts let's average the number of threads per account
	   } else {
		   maxGetThreads = 1;
	   }
	   
	   let getThreadsCount = 0;
	   const promises = [];
	   
	   mailArray.forEach(email => {
		   // lots of peeps in the thread so this might be a reply to a conversation (but which was already 'read' by user before so this check does not know the thread's past or initial email etc.) (and thus the summary in the Gmail's feed will not match what this sender wrote, but rather it matches summary of the first email in this thread
		   if (true) { //email.contributors.length || storage.get("spokenWordsLimit") == "paragraph" || storage.get("spokenWordsLimit") == "wholeEmail") { 
			   //console.log("has contributors: " + email.contributors.length + " or spokenwordslimit high");
			   if (getThreadsCount < maxGetThreads) {
				   const promise = email.getThread();
				   promises.push(promise);
				   getThreadsCount++;
			   } else {
				   console.warn("MAX fetch last conversations reached, ignoring now.");						   
			   }
		   }
	   });
	   
	   if (promises.length) {
		   console.log("fetchThreads: ", promises);
	   }
	   
	   return Promise.all(promises);
   }
   
   function initLabelDetails(mailObject) {
	   var label = mailObject.monitoredLabel;
	   if (label == SYSTEM_INBOX) {
		   mailObject.formattedLabel = getMessage("inbox");
		   mailObject.labelSortIndex = 0;
	   } else if (label == SYSTEM_IMPORTANT || label == SYSTEM_IMPORTANT_IN_INBOX) {
		   mailObject.formattedLabel = getMessage("importantMail");
		   mailObject.labelSortIndex = 1;
	   } else if (label == SYSTEM_ALL_MAIL) {
		   mailObject.formattedLabel = getMessage("allMail");
		   mailObject.labelSortIndex = 2;
	   } else if (label == SYSTEM_PRIMARY) {
		   mailObject.formattedLabel = getMessage("primary");
		   mailObject.labelSortIndex = 3;
	   } else if (label == SYSTEM_PURCHASES) {
		   mailObject.formattedLabel = getMessage("purchases");
		   mailObject.labelSortIndex = 4;
	   } else if (label == SYSTEM_FINANCE) {
		   mailObject.formattedLabel = getMessage("finance");
		   mailObject.labelSortIndex = 5;
	   } else if (label == SYSTEM_SOCIAL) {
		   mailObject.formattedLabel = getMessage("social");
		   mailObject.labelSortIndex = 6;
	   } else if (label == SYSTEM_PROMOTIONS) {
		   mailObject.formattedLabel = getMessage("promotions");
		   mailObject.labelSortIndex = 7;
	   } else if (label == SYSTEM_UPDATES) {
		   mailObject.formattedLabel = getMessage("updates");
		   mailObject.labelSortIndex = 8;
	   } else if (label == SYSTEM_FORUMS) {
		   mailObject.formattedLabel = getMessage("forums");
		   mailObject.labelSortIndex = 9;
	   } else {
		   mailObject.formattedLabel = mailObject.account.getLabelName(label);
		   if (mailObject.formattedLabel) {
			   mailObject.labelSortIndex = mailObject.formattedLabel.toLowerCase().charCodeAt(0);
		   } else {
			   // empty label, might have once been monitored but now label removed and marked as spam or something
			   // let's move it to the end of the list
			   mailObject.labelSortIndex = 10;
		   }
	   }
   }
   
   function initNewestEmails(mailObject) {
	   initLabelDetails(mailObject);
	   
	   // logic mainly for auto-detect
	   // check if this email appeared in previous label fetches (ie. it was labeled with multiple labels) if so then avoid adding this email again
	   var emailAlreadyFoundInADifferentLabelFetch;
	   //var foundInPrimaryAndInbox;
	   
	   emailsInAllLabels.forEach(function(emailInAllFeeds) {
		   //console.log("emailsInAllLabels", mailObject, emailInAllFeeds);
		   if (emailInAllFeeds.id == mailObject.id) {
			   
			   if (accountAddingMethod == "autoDetect") {
				   // only for auto-detect because oauth can retrieve all the labels for an email
				   emailInAllFeeds.labels.push( mailObject.monitoredLabel );
			   }
			   
			   if (isMainCategory(mailObject.monitoredLabel) && emailInAllFeeds.monitoredLabel == SYSTEM_INBOX) {
				   // do nothing
				   //foundInPrimaryAndInbox = true;
			   } else {
				   emailAlreadyFoundInADifferentLabelFetch = true;
			   }

		   }
	   });
	   
	   //console.log("emailAlreadyFoundInADifferentLabelFetch: " + emailAlreadyFoundInADifferentLabelFetch);
	   if (!emailAlreadyFoundInADifferentLabelFetch) {
		   emailsInAllLabels.push(mailObject);
		   
		   const mailAlreadyExisted = mailArray.some(oldMail => oldMail.id == mailObject.id);
		   if (!mailAlreadyExisted) {
			   newestMailArray.push(mailObject);
		   }
	   }
	   return {emailAlreadyFoundInADifferentLabelFetch:emailAlreadyFoundInADifferentLabelFetch};
   }
   
   function syncMailArray() {
	   // remove emails that have disappeared from the feed (user could have done any number of actions on the emails via the gmail.com etc.
	   for (var a=0; a<mailArray.length; a++) {
		   var emailStillInFeed = false; 
		   for (var b=0; b<emailsInAllLabels.length; b++) {
			   if (mailArray[a].id == emailsInAllLabels[b].id) {
				   emailStillInFeed = true;
				   break;
			   }
		   }
		   if (!emailStillInFeed) {
			   console.log("removing: " + mailArray[a].title);
			   mailArray.splice(a, 1);
			   a--;
		   }
	   }
	   
	   // commented this because i was creating a new array and break polymer's data binding
	   //mailArray = mailArray.concat(newestMailArray);
	   // this will alter the mailArray and keep the polymer data binding
	   Array.prototype.push.apply(mailArray, newestMailArray);

	   sortMailArray();
   }
   
   function sortMailArray() {
	   mailArray.sort(function (a, b) {
		   if (a.monitoredLabel == b.monitoredLabel) {
			   if (a.issued > b.issued)
				   return -1;
			   if (a.issued < b.issued)
				   return 1;
			   return 0;
		   } else {
                if (a.labelSortIndex < b.labelSortIndex) {
                    return -1;
                } else if (a.labelSortIndex > b.labelSortIndex) {
                    return 1;
                } else {
                    return 0;
                }
		   }
	   });
   }
   
   this.getError = function(useHtml, $, document) {
	   var error;
	   var niceError;
	   var instructions = "";
	   var $instructions;
	   var $refreshHtml;

       if (typeof($) != "undefined") {
	        $instructions = $("<span>", document); // need to pass context/document or else polymer elements are not rendered in the caller ie. popup.html
            $refreshHtml = $("<paper-button class='refreshAccount'>", document).text(getMessage("refresh"));
       }
       
	   console.log("online: " + navigator.onLine);

	   if (that.errorCode === 0) {
		   error = JError.NETWORK_ERROR;
		   niceError = getMessage("networkProblem");
	   } else if (that.errorCode == ErrorCodes.RATE_LIMIT_EXCEEDED) {
		   error = JError.RATE_LIMIT_EXCEEDED;
		   niceError = "Rate limit exceeded!";
	   } else if (that.errorCode == ErrorCodes.BAD_REQUEST || that.errorCode == ErrorCodes.UNAUTHORIZED) {
           if (accountAddingMethod == "autoDetect") {
                error = JError.NOT_SIGNED_IN;
                niceError = getMessage("notSignedIn");
           } else {
                error = JError.ACCESS_REVOKED;
                niceError = "Access was revoked!";
           }
	   } else if (that.error == JError.NO_TOKEN_FOR_EMAIL) {
		   error = JError.NO_TOKEN_FOR_EMAIL;
		   niceError = "No access token.";
	   } else if (that.error == JError.CANNOT_ENSURE_MAIN_AND_INBOX_UNREAD) {
		   error = JError.CANNOT_ENSURE_MAIN_AND_INBOX_UNREAD;
		   niceError = "Too many unread emails.";
	   } else if (that.errorCode == 404) {
		   error = JError.MIGHT_BE_OFFLINE;
		   niceError = getMessage("yourOffline");
	   } else if (that.errorCode == 503) {
		   error = JError.GMAIL_BACK_END;
		   niceError = "Gmail service issue: " + that.error;
	   } else if (that.error == "The user is not signed in.") { // happens with not signed into Chrome
		   error = JError.NOT_SIGNED_IN;
		   niceError = getMessage("notSignedIn");
	   } else if (that.error == "OK") {
		   niceError = "";
	   } else {
		   error = that.error;
		   niceError = that.error;
	   }
	   
	   function createButton(url, textKey) {
		   return $("<a class='inherit' target='_blank'>", document).attr("href", url).append($("<paper-button>", document).text(getMessage(textKey)));
	   }
	   
	   if (accountAddingMethod == "autoDetect") {
		   if (that.errorCode == JError.GOOGLE_ACCOUNT_WITHOUT_GMAIL) {
			   if (useHtml) {
				   $instructions.append( createButton("https://jasonsavard.com/wiki/Google_Accounts_without_Gmail?ref=autoDetectPopupError", "moreInfo") );
			   } else {
				   instructions = "Only Gmail or Google Apps can be polled";
			   }
		   } else if (that.errorCode == JError.GMAIL_NOT_ENABLED) {
			   if (useHtml) {
				   $instructions.append( createButton("https://support.google.com/a/answer/57919", "moreInfo") );
			   } else {
				   instructions = "You must enable the Gmail service in your Admin console";
			   }
		   } else if (that.errorCode == JError.COOKIE_PROBLEMS) {
			   if (useHtml) {
				   $instructions.append(createButton("https://accounts.google.com/CookieMismatch", "moreInfo"));
			   } else {
				   instructions = "Make sure your cookies are enabled. Clear cache and cookies. Adjust your privacy settings to allow www.google.com";
			   }
		   } else if (that.errorCode == JError.CANNOT_ENSURE_MAIN_AND_INBOX_UNREAD) {
			   if (useHtml) {
				   $instructions.append("Use the ", createButton("options.html?ref=cannotEnsureMainAndInbox&highlight=addAccount#accounts", "addAccount"), "option instead!");
			   } else {
				   instructions = "Use the Add Accounts option instead!";
			   }
		   } else if (DetectClient.isFirefox() && navigator.doNotTrack) {
				if (useHtml) {
					$instructions.append("Use ", createButton("options.html?ref=doNotTrack&highlight=addAccount#accounts", "addAccount"), " instead or try setting the default Tracking Protection back to 'Only in private windows'");
				} else {
					instructions = JError.DO_NOT_TRACK_MESSAGE;
				}
		   } else {
			   if (useHtml) {
				   $instructions.append($refreshHtml, createButton("https://jasonsavard.com/wiki/Auto-detect_sign_in_issues?ref=autoDetectPopupError", "help"));
			   } else {
				   instructions = "Refresh or try signing out/in or " + getMessage("addAccount");
			   }
		   }
	   } else {
		   if (error == JError.ACCESS_REVOKED || error == JError.NO_TOKEN_FOR_EMAIL || error == JError.NOT_SIGNED_IN) {
			   instructions = "";
			   if (useHtml) {
				   if (error == JError.ACCESS_REVOKED) {
					   $instructions.append($refreshHtml, " or ");
				   }
				   $instructions.append( createButton("options.html#accounts", "addAccount"), "to re-grant access!" );
			   } else {
				   if (error == JError.ACCESS_REVOKED) {
					   instructions += "Refresh or ";
				   }
				   instructions += getMessage("addAccount") + " to re-grant access!";
			   }
		   } else {
			   if (useHtml) {
				   $instructions.append($refreshHtml);
			   } else {
				   instructions = getMessage("refresh");
			   }
		   }
	   }
	   
	   return {error:error, niceError:niceError, instructions:instructions, $instructions:$instructions};
   }
   
   function getMessageIdFromAtomFeedEntry(entry) {
       var link = entry.querySelector("link");
       if (link) {
           return link.getAttribute("href").replace(/.*message_id=(\d\w*).*/, "$1");
       }
   }
   
   function getHistoryActions(history) {
	   var historyActions;
	   var deleted;
	   
	   if (history.messagesAdded) {
		   historyActions = history.messagesAdded;
	   } else if (history.messagesDeleted) {
		   historyActions = history.messagesDeleted;
		   deleted = true;
	   } else if (history.labelsAdded) {
		   historyActions = history.labelsAdded;
	   } else if (history.labelsRemoved) {
		   historyActions = history.labelsRemoved;
	   } else {
		   historyActions = [];
	   }
	   
	   return {historyActions:historyActions, deleted:deleted};
   }
   
   function isUnread(labelIds) {
       return labelIds
            && labelIds.includes(GmailAPI.labels.UNREAD)
            && !labelIds.includes(GmailAPI.labels.SPAM)
            && !labelIds.includes(GmailAPI.labels.TRASH)
        ;
   }
   
   function passesLabelTests(historyMessage, monitoredLabels) {
	   var testFlag;
	   
	   if (monitoredLabels.includes(SYSTEM_ALL_MAIL)) {
		   testFlag = true;
	   } else {
		   testFlag = monitoredLabels.some(function(monitoredLabel) {
			   if (historyMessage.labelIds && historyMessage.labelIds.includes(getGmailAPILabelId(monitoredLabel))) {
				   if (isMainCategory(monitoredLabel) || monitoredLabel == SYSTEM_IMPORTANT_IN_INBOX) { // check that INBOX is there if monitoring a main category or important+inbox label
					   if (historyMessage.labelIds && historyMessage.labelIds.includes(GmailAPI.labels.INBOX)) {
						   return true;
					   }
				   } else {
					   return true;
				   }
			   }
		   });
	   }
	   
	   return testFlag;
   }

   this.getMailObjectsForMessageIds = async function(messages) {
        const fetchMessagesByIdsResponse = await fetchMessagesByIds(messages);
        const createResponse = await createMailObjects({httpBodies: fetchMessagesByIdsResponse.httpBodies});
        return createResponse.mailObjects;
   }
   
   // Retreives inbox count and populates mail array
   this.getEmails = async function(params = {}) {
	    that.lastGetEmailsDate = new Date();
	   
        const accountMonitorLabels = await that.getMonitorLabels();

        if (accountAddingMethod == "autoDetect") {
            const fetchEmailsResponse = await fetchEmailsByLabel({monitorLabels:accountMonitorLabels, monitorLabelsIndex:0, feedsArrayInfo:[]});
            var inboxFeed;

            that.unreadCount = 0;
            
            emailsInAllLabels = [];
            newestMailArray = [];
            
            var mainCategoryFeeds = [];
            
            if (fetchEmailsResponse.feedsArrayInfo) {
                fetchEmailsResponse.feedsArrayInfo.forEach(feedInfo => {
                    
                    if (feedInfo.label == SYSTEM_INBOX) {
                        inboxFeed = feedInfo;
                    }
                    if (isMainCategory(feedInfo.label)) {
                        mainCategoryFeeds.push(feedInfo);
                    } else {
                        // if NOT main categegory then add here else we add the unread count only if matches main+inbox refer to ensureUnreadAndInbox...
                        that.unreadCount += feedInfo.feedUnreadCount;
                    }
                    
                    const parsedFeed = parseXML(feedInfo.rawFeed);

                    // Parse xml data for each mail entry
                    parsedFeed.querySelectorAll('entry').forEach(entry => {
                        
                        var title = entry.querySelector('title').textContent;
                        
                        var summary = entry.querySelector('summary').textContent;
                        summary = that.filterEmailBody({
                            subject: title,
                            body: summary
                        });
                        
                        var issued = Date.parse(entry.querySelector('issued').textContent);
                        
                        var imapMessageId = entry.querySelector('id').textContent.split(":")[2]; // ex. fetch the last number for the messageid... tag:gmail.google.com,2004:1436934733284861101
                        
                        var id = getMessageIdFromAtomFeedEntry(entry);
                        
                        const authorName = entry.querySelector('author name').textContent;
                        let authorMail = entry.querySelector('author email').textContent;
                        const entryXML = new XMLSerializer().serializeToString(entry);
                        
                        // Encode content to prevent XSS attacks
                        // commend title one because & was converted to &amp; in subject lines 
                        //title = html_sanitize(title);
                        summary = html_sanitize(summary);
                        authorMail = html_sanitize(authorMail);							   
                        
                        const mailObject = new Mail();
                        mailObject.account = that;
                        mailObject.id = id;
                        mailObject.imapMessageId = imapMessageId;
                        mailObject.title = title;
                        mailObject.summary = summary;
                        mailObject.issued = issued;
                        mailObject.authorName = authorName;
                        mailObject.authorMail = authorMail;
                        mailObject.labels = [feedInfo.label]; // initialize array and make first item in array the default label
                        mailObject.monitoredLabel = feedInfo.label;
                        mailObject.contributors = [];
                        mailObject.entryXML = entryXML;
                        mailObject.messages = [];
                        
                        var newestEmailsResponse = initNewestEmails(mailObject);
                        if (newestEmailsResponse.emailAlreadyFoundInADifferentLabelFetch) {
                            that.unreadCount--;
                        }
                    });
                });
            }
            
            try {
                await ensureUnreadAndInboxForMultipleFeeds(mainCategoryFeeds, inboxFeed);
                syncMailArray();
                
                fetchEmailsResponse.mailAccount = that;
                fetchEmailsResponse.newestMailArray = newestMailArray;
                
                if (newestMailArray.length) {
                    await that.fetchThreads(newestMailArray);
                }

                // added this here for autodetect also now (previous just manual) because in auto-detect it was not saving the labels
                // call this to load labels (no await because can probably run in paralel)
                that.getLabels(params.refresh);

                return fetchEmailsResponse;
            } catch (error) {
                console.error(error);
                
                if (error == JError.CANNOT_ENSURE_MAIN_AND_INBOX_UNREAD) {
                    that.error = "Too many unread emails.";
                    that.errorCode = JError.CANNOT_ENSURE_MAIN_AND_INBOX_UNREAD;
                } else {
                    that.error = error;
                }
                
                // always set an error field to the account before rejecting
                throw error;
            }
        } else {
            // added accounts
            
            function setAccountError(account, error) {
                account.error = error;
                account.errorCode = error.code;
                
                console.log("setaccounterror online: " + navigator.onLine);

                if (error == "timeout") {
                    // don't have to display it again since it's logged already
                } else if (error.code == ErrorCodes.RATE_LIMIT_EXCEEDED) {
                    logError("Caught rate limit exceeded");
                } else {
                    error += " code: " + error.code;
                    if (error.stack) {
                        error += " stack: " + error.stack;
                    }
                    console.error("setAccountError: ", error);
                }
            }
            
            async function getInitialMessages(params) {
                // only pass history id (if we want to skip calling getHistoryForFirstTime again)
                const accountMonitorLabels = await params.account.getMonitorLabels();
                try {
                    const newestMailArray = await getMessagesByList({monitoredLabels:accountMonitorLabels, historyId:params.historyId});
                    params.getEmailsResponse.newestMailArray = newestMailArray;
                    return params.getEmailsResponse;
                } catch (error) {
                    setAccountError(that, error);
                    throw error;
                }
            }
            
            function getMatchingMail(message) {
                var index;
                var matchingMail;
                var existingMessage;
                
                if (conversationView) {
                    index = getMailArrayIndexByThreadId(message.threadId);
                } else {
                    index = getMailArrayIndexByMessageId(message.id);
                }
                
                if (index != -1) {
                    matchingMail = mailArray[index];
                    var messageFound = matchingMail.messages.some(matchingMessage => {
                        console.log("loop messages", matchingMessage);
                        if (message.id == matchingMessage.id) {
                            console.log("existing", matchingMessage)
                            existingMessage = matchingMessage;
                            return true;
                        }
                    });
                }
                
                return {index:index, matchingMail:matchingMail, existingMessage:existingMessage};
            }

            try {
                // call this to load labels
                await that.getLabels(params.refresh);

                that.error = null;
                that.errorCode = null;
                
                const getEmailsResponse = {
                    mailAccount: that
                };

                newestMailArray = [];
                unsnoozedEmails = [];
                
                const monitoredLabels = await that.getMonitorLabels();
                const showSnoozedNotifications = await storage.get("showSnoozedNotifications");

                if (historyId) {
                    var getMessagesByHistoryParams = {historyId:historyId, histories:[]};
                    try {
                        const messagesByHistoryResponse = await getMessagesByHistory(getMessagesByHistoryParams);
                        var histories = getMessagesByHistoryParams.histories;
                        if (histories && histories.length) {
                            
                            var processedMessageIds = [];
                            var messagesToFetch = [];
                            var mergeUnreadRelativeCount = 0;
                            
                            histories.forEach((history, historyIndex) => {
                                var historyActionsResponse = getHistoryActions(history);
                                historyActionsResponse.historyActions.forEach(historyAction => {
                                    
                                    // message could be listed several times in history so only process this message once
                                    if (!processedMessageIds.includes(historyAction.message.id)) {
                                        processedMessageIds.push(historyAction.message.id);
                                        
                                        var message = historyAction.message;
                                        
                                        // possibly replace message with last message for this message id, because it could have had multiple actions performed on it
                                        for (var a=histories.length-1; a>historyIndex; a--) {
                                            var lastHistoryActionsResponse = getHistoryActions(histories[a]);
                                            var lastHistoryActionFound = lastHistoryActionsResponse.historyActions.some(lastHistoryAction => {
                                                if (lastHistoryAction.message.id == historyAction.message.id) {
                                                    console.log("matched more recent history", lastHistoryAction);
                                                    historyActionsResponse = lastHistoryActionsResponse;
                                                    message = lastHistoryAction.message;
                                                    return true;
                                                }
                                            });
                                            if (lastHistoryActionFound) {
                                                break;
                                            }
                                        }
                                        
                                        console.log("message", message);
                                        
                                        var showMailInPopup = !historyActionsResponse.deleted && isUnread(message.labelIds) && passesLabelTests(message, monitoredLabels);
                                        console.log("showMailInPopup: " + showMailInPopup + " " + isUnread(message.labelIds) + " " + passesLabelTests(message, monitoredLabels));
                                        var matchingMailResponse = getMatchingMail(message);
                                        
                                        if (matchingMailResponse.matchingMail) {
                                            if (showMailInPopup) {
                                                // merge messages
                                                if (matchingMailResponse.existingMessage) {
                                                    // update labels, they *might have changed
                                                    matchingMailResponse.matchingMail.labels = message.labelIds;
                                                } else {
                                                    messagesToFetch.push(message);
                                                }
                                            } else { // is no longer unread (maybe deleted, archive or marked as read etc.)
                                                console.log("remove message: " + message.id);
                                                matchingMailResponse.matchingMail.removeMessageById(message.id);
                                                
                                                // if all messages from thread are no longer unread then remove it from the array
                                                const allMessagesRead = matchingMailResponse.matchingMail.messages.every(message => {
                                                    return !isUnread(message.labels);
                                                });
                                                
                                                if (allMessagesRead) {
                                                    mailArray.splice(matchingMailResponse.index, 1);
                                                    mergeUnreadRelativeCount--;
                                                }
                                            }
                                        } else {
                                            if (showMailInPopup) {
                                                messagesToFetch.push(message);
                                            } else {
                                                // 1) we might have removed it immediately after user action like mark as read
                                                // 2) was never in the mailarray and is still not unread: so ignore it :)
                                                // 3) might be unsnoozed

                                                // Detect unsnoozed email
                                                if (showSnoozedNotifications) {
                                                    if (histories[historyIndex].labelsAdded) {
                                                        const labelIds = histories[historyIndex].labelsAdded[0].labelIds;
                                                        if (labelIds.length == 1 && labelIds.includes(GmailAPI.labels.INBOX)) {
                                                            console.log("unsnoozed", message);
                                                            message.unSnoozed = true;
                                                            messagesToFetch.push(message);
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                });
                                
                            });
                            
                            const mailObjects = await that.getMailObjectsForMessageIds(messagesToFetch);
                            mailObjects.forEach(historyMailObject => {
                                // Not Found, so let's generate a stub to pass to mergeMailObject to remove it
                                if (historyMailObject.jerror == JError.NOT_FOUND) {
                                    console.error("not found - should i do something", historyMailObject);
                                } else {
                                    if (historyMailObject.unSnoozed && !isUnread(historyMailObject.labelIds)) {
                                        unsnoozedEmails.push(historyMailObject);
                                    } else {
                                        var matchingMailResponse = getMatchingMail(historyMailObject);
                                        if (matchingMailResponse.matchingMail) {
                                            // merge messages
                                            matchingMailResponse.matchingMail.messages.forEach(matchingMessage => {
                                                var historyMessageFound = historyMailObject.getMessageById(matchingMessage.id);
                                                if (!historyMessageFound) {
                                                    historyMailObject.messages.push(matchingMessage);
                                                }
                                            });
                                            
                                            historyMailObject.sortMessages();

                                            // let's add this new mailobject to queue and remove it after merging the messages
                                            mailArray.push(historyMailObject);
                                            mailArray.splice(matchingMailResponse.index, 1);
                                        } else {
                                            mailArray.push(historyMailObject);
                                            mergeUnreadRelativeCount++;
                                        }
                                        newestMailArray.push(historyMailObject);
                                        
                                        initLabelDetails(historyMailObject);
                                    }
                                }
                            });

                            sortMailArray();
                            
                            getEmailsResponse.newestMailArray = newestMailArray;
                            getEmailsResponse.unsnoozedEmails = unsnoozedEmails;
                            
                            // Fixes this issue: when many emails are unread and you mark some older emails as read it does not reduce the count
                            // if already displaying more emails then the maximum allowed - then we fetch the unreadcount - because we can't rely on detecting if emails were removed since they may not have previously been fetched due to my max limits
                            if (that.unreadCount >= MAX_EMAILS_TO_FETCH) {
                                try {
                                    that.unreadCount = await fetchUnreadCount(monitoredLabels, true);
                                } catch (error) {
                                    // ignore error let's just use the other logic...
                                    that.unreadCount += mergeUnreadRelativeCount;
                                }
                            } else {
                                that.unreadCount += mergeUnreadRelativeCount;
                            }

                            // this was put in place when monitoring primary label - because we use the resultSizeEstimate which can be wrong - but the newestMailArray should be accurate
                            if (mailArray.length < that.unreadCount || mailArray.length < MAX_EMAILS_TO_FETCH) {
                                that.unreadCount = mailArray.length;
                            }
                        }

                        historyId = messagesByHistoryResponse.historyId;
                        return getEmailsResponse;
                    } catch (error) {
                        console.error("error", error);
                        if (error.jreason == JError.HISTORY_INVALID_OR_OUT_OF_DATE || error.jreason == JError.TOO_MANY_HISTORIES || error == JError.EXCEEDED_MAXIMUM_CALLS_PER_BATCH) {
                            // Must reinitalize
                            console.log(error.jreason + " - let's reinitalize mail");
                            historyId = null;
                        } else {
                            setAccountError(that, error);
                            throw error;
                        }
                    }
                }
                return getInitialMessages({account:that, getEmailsResponse:getEmailsResponse});
            } catch (error) {
                setAccountError(that, error);
                throw error;
            }
        }

	   //countEvent("getEmails");
   }
   
   async function getMessagesByList(messagesByListParams) {
	   console.log("getMessagesByList");
	   
        that.unreadCount = 0;
        emailsInAllLabels = [];

        const promises = [];
        promises.push(fetchUnreadCount(messagesByListParams.monitoredLabels));
        promises.push(async function() {
            // if we already have history then let's just pass it forward
            if (messagesByListParams.historyId) {
                return {historyId:messagesByListParams.historyId};
            } else {
                return getHistoryForFirstTime();
            }
        }());
        
        const promiseAllResponse = await Promise.all(promises);
        // fetchUnreadCount response
        that.unreadCount = promiseAllResponse[0];
        // getHistoryForFirstTime response
        const historyResponse = promiseAllResponse[1];
        await getMessages(messagesByListParams.monitoredLabels, async function(getMessagesResponse) {
            if (getMessagesResponse.fetchMessagesByLabelsResponse) {
                that.unreadCount -= getMessagesResponse.fetchMessagesByLabelsResponse.oauthEmailAlreadyFoundInADifferentLabelFetch;

                //that.unreadCount = getMessagesResponse.fetchMessagesByLabelsResponse.totalMessages;
                console.log("fetchMessagesByLabelsResponse", getMessagesResponse.fetchMessagesByLabelsResponse);
                await asyncForEach(getMessagesResponse.fetchMessagesByLabelsResponse.responses, async response => {
                    const createResponse = await createMailObjects(response);
                    createResponse.mailObjects.forEach(mailObject => {
                        initNewestEmails(mailObject);
                    });
                });

                // add with inbox count
                getMessagesResponse.fetchMessageIdsByLabelsResponse.httpBodies.some(httpBody => {
                    //if ((httpBody.monitoredLabel == SYSTEM_INBOX && that.getSetting("openLinksToInboxByGmail")) || httpBody.monitoredLabel == SYSTEM_PRIMARY) {
                    if (isMainCategory(httpBody.monitoredLabel)) {
                        //mailArray if (mailArray.length < that.unreadCount || mailArray.length < MAX_EMAILS_TO_FETCH) {
                        
                        that.unreadCount += httpBody.resultSizeEstimate;
                        
                        if (newestMailArray.length < that.unreadCount && that.unreadCount < MAX_EMAILS_TO_FETCH) {
                            that.unreadCount = newestMailArray.length;
                        }
                    }
                });
            } else {
                // no unread messages
                console.log("no unread messages");
            }
        });

        syncMailArray();
        historyId = historyResponse.historyId;
        return newestMailArray;
   }
   
   function getMailArrayIndexByThreadId(threadId) {
	   for (var a=0; a<mailArray.length; a++) {
		   if (mailArray[a].threadId == threadId) {
			   return a;
		   }
	   }
	   return -1;
   }

   function getMailArrayIndexByMessageId(messageId) {
	   for (var a=0; a<mailArray.length; a++) {
		   if (mailArray[a].id == messageId) {
			   return a;
		   }
	   }
	   return -1;
   }
   
   async function getMessagesByHistory(params) {
        const historyResponse = await getHistory(params);
        // if exists history[] then we've had changes since the last historyid - so let's fetch emails
        if (historyResponse.history) {
            console.log("history exists");
            params.histories = params.histories.concat(historyResponse.history);

            // Too many histories so let's just resync
            if (historyResponse.nextPageToken) {
                console.log("next page");
                params.nextPageToken = historyResponse.nextPageToken;
                if (!params.nextPageTokenCount) {
                    params.nextPageTokenCount = 0;
                }
                if (++params.nextPageTokenCount >= MAX_HISTORY_NEXT) {
                    historyResponse.jreason = JError.TOO_MANY_HISTORIES;
                    throw historyResponse;
                } else {
                    return getMessagesByHistory(params);
                }
            }
        } else { // no changes
            console.log("no changes");
        }

        return historyResponse;
   }
   
   async function getMessages(labels, processMessages) {
        const fetchMessageIdsByLabelsResponse = await fetchMessageIdsByLabels(labels);
        console.log("fetchMessageIdsByLabelsResponse", fetchMessageIdsByLabelsResponse);
        // detect if any messages found
        const messagesFound = fetchMessageIdsByLabelsResponse.httpBodies.some(httpBody => httpBody.messages && httpBody.messages.length);
        if (messagesFound) {
            const fetchMessagesByLabelsResponse = await fetchMessagesByLabels(fetchMessageIdsByLabelsResponse);
            await processMessages({fetchMessageIdsByLabelsResponse:fetchMessageIdsByLabelsResponse, fetchMessagesByLabelsResponse:fetchMessagesByLabelsResponse});
        } else {
            // should still execute processMessages
            await processMessages({fetchMessageIdsByLabelsResponse:fetchMessageIdsByLabelsResponse, labelsWithoutMessages:labels});
        }
   }
   
   function generateFetchMessagesByIdsParams(params) {
	   var oauthEmailAlreadyFoundInADifferentLabelFetch = 0;
	   const messages = [];
	   params.httpMessages.forEach(httpMessage => {
		   if (params.allLabelsMessageIdsToFetch && params.allLabelsMessageIdsToFetch.includes(httpMessage.id)) {
			    console.log("skip this message because already queued from another label: " + httpMessage.id);
			    oauthEmailAlreadyFoundInADifferentLabelFetch++;
		   } else {
                messages.push({
                    id: httpMessage.id,
                    monitoredLabel: httpMessage.monitoredLabel
                });
			    params.allLabelsMessageIdsToFetch.push(httpMessage.id);
		   }
	   });
	   
	   return {messages:messages, oauthEmailAlreadyFoundInADifferentLabelFetch:oauthEmailAlreadyFoundInADifferentLabelFetch};
   }
   
   async function fetchMessagesByLabels(fetchMessageIdsByLabelsResponse) {
        const fetchMessagesByIdsPromises = [];
        const errors = [];

        var allLabelsMessageIdsToFetch = [];
        var oauthEmailAlreadyFoundInADifferentLabelFetch = 0;

        fetchMessageIdsByLabelsResponse.httpBodies.forEach(httpBody => {
            if (httpBody.error) {
                errors.push(httpBody);
            } else if (httpBody.messages) {
                
                httpBody.messages.forEach(httpMessage => {
                    httpMessage.monitoredLabel = httpBody.monitoredLabel;
                });
                
                var fetchMessagesByIdsParams = generateFetchMessagesByIdsParams({httpMessages:httpBody.messages, allLabelsMessageIdsToFetch:allLabelsMessageIdsToFetch});
                // must append this int variable outside of function because it's not passed by reference (but the array allLabelMessages... is)
                oauthEmailAlreadyFoundInADifferentLabelFetch += fetchMessagesByIdsParams.oauthEmailAlreadyFoundInADifferentLabelFetch;

                if (fetchMessagesByIdsParams.messages.length) {
                    const fetchMessagesByIdsPromise = fetchMessagesByIds(fetchMessagesByIdsParams.messages);
                    fetchMessagesByIdsPromises.push(fetchMessagesByIdsPromise);
                }
            }
        });
        
        const fetchMessagesByIdsPromisesResponses = await Promise.all(fetchMessagesByIdsPromises);
        if (errors.length) {
            console.error("found some errors[]", errors);
            throw errors;
        } else {
            return {
                responses: fetchMessagesByIdsPromisesResponses,
                oauthEmailAlreadyFoundInADifferentLabelFetch: oauthEmailAlreadyFoundInADifferentLabelFetch
            };
        }
   }
   
   async function createMailObjects(params) {
       const monitoredLabels = await that.getMonitorLabels();

	   var mailObjects = [];
       var totalMessagesThatWereGrouped = 0;
       
	   params.httpBodies.forEach(function(httpBody) {

			const mailObject = new Mail();
			mailObject.unSnoozed = httpBody.unSnoozed;

		   // might be permanently deleted
		   if (httpBody.jerror == JError.NOT_FOUND) { //if (httpBody.error && httpBody.error.code == 404) { // message == Not Found  (might have been permanently deleted)
			   // just push error object into array and continue loop
			   mailObject.account = that;
			   mailObject.labels = [];
			   mailObject.messages = [];
			   mailObject.jerror = httpBody.jerror;
			   mailObjects.push(mailObject);
			   return;
		   } else if (httpBody.error) {
			   console.error("in createmailbojects, this body has this error: " + httpBody.error.message);
			   return;
		   }
		   
		   var headers = httpBody.payload.headers;
		   
		   if (conversationView) {
			   // group emails by threadid
			    var threadFound = mailObjects.some(function(existingMailObject) {
			        //console.log("find thread", existingMailObject.threadId + " " + httpBody.threadId)
				   if (existingMailObject.threadId == httpBody.threadId) {
					   const message = generateMessageFromHttpResponseMessage(existingMailObject, httpBody);
					   // add to beginning of array
					   existingMailObject.messages.unshift(message);
					   totalMessagesThatWereGrouped++;
					   return true;
				   }
			   });
			   
			   if (threadFound) {
				   // continue the "batchResponse.httpResponses.forEach" above
				   return;
			   }
		   }
		   
		   var subject = cleanEmailSubject(MyGAPIClient.getHeaderValue(headers, "Subject"));
		   console.log("subject: " + subject);
		   if (!subject) {
			   subject = "";
		   }

		   var summary = httpBody.snippet;
		   summary = that.filterEmailBody({
               subject: subject,
               body: summary
           });
		   
		   var issued = getDateFromHttpResponseMessage(httpBody);
		   var from = MyGAPIClient.getHeaderValue(headers, "From");
		   
		   var authorName;
		   var authorMail;
		   
		   var addressObj = addressparser(from).first();
		   if (addressObj) {
			   authorName = addressObj.name;
			   authorMail = addressObj.email;
		   } else {
			   authorName = "";
			   authorMail = "";
			   logError("Problem with addressparser: " + from);
		   }
		   
		   authorMail = html_sanitize(authorMail);
		   
		   mailObject.account = that;
		   mailObject.id = httpBody.id;
		   mailObject.deliveredTo = MyGAPIClient.getAllHeaderValues(headers, "Delivered-To"); // Used to determine any "send mail as" alternate emails etc.
		   mailObject.replyTo = MyGAPIClient.getHeaderValue(headers, "Reply-To"); // might have alternate reply to email
		   mailObject.messageId = MyGAPIClient.getHeaderValue(headers, "Message-ID"); // Used for replying
		   mailObject.threadId = httpBody.threadId;
		   mailObject.title = subject;
		   mailObject.summary = summary;
		   mailObject.issued = issued;
		   mailObject.authorName = authorName;
		   mailObject.authorMail = authorMail; 
		   
		   if (httpBody.labelIds) {
			   mailObject.labels = httpBody.labelIds;
		   } else {
			   mailObject.labels = [];
		   }
		   
		   if (httpBody.monitoredLabel) {
			   mailObject.monitoredLabel = httpBody.monitoredLabel;
		   } else {
			   // probably fetched via history so let's just tag the first monitoredlabel to it
			   mailObject.monitoredLabel = that.getFirstMonitoredLabel(httpBody.labelIds, monitoredLabels);
		   }
		   
		   mailObject.contributors = [];
		   
		   // init first conversation message, which is same as mailobject message
		   mailObject.messages = [
                generateMessageFromHttpResponseMessage(mailObject, httpBody)
           ];

		   mailObjects.push(mailObject);
	   });
	   
	   mailObjects.forEach(mailObject => {
		   mailObject.sortMessages();
		   // Make sure last convesation date is synced with mailobject date/issue (issue doesn't have happen on extension load but it does upon detecting history changes)
		   const lastMessage = mailObject.messages.last();
		   if (lastMessage) {
			   mailObject.issued = lastMessage.date;
		   }
	   });
	   
	   return {mailObjects:mailObjects, totalMessagesThatWereGrouped:totalMessagesThatWereGrouped};
   }
   
   async function fetchMessageIdsByLabels(monitoredLabels) {
	   console.log("fetchMessageIdsByLabels");

        const mygapiClient = getMyGAPIClient();

        /*
            decided not to finish this code because usually sent emails are never unread! , but use this in the future if have to include sent emails in message history
            var monitoredLabelsAndSent = monitoredLabels.concat([GmailAPI.labels.SENT]);
            other notes...
            test conversation view disabled for sent emails
            that.unreadCount -= getMessagesResponse.fetchMessagesByLabelsResponse.oauthEmailAlreadyFoundInADifferentLabelFetch;
            if can't match threadid remove it because we don't want a loan sent email
            might have to sort sent email into messages list (not just append/prepend etc.)
        */
        
        monitoredLabels.forEach(monitoredLabel => {
            let path = GmailAPI.PATH + "messages?labelIds=" + GmailAPI.labels.UNREAD + "&maxResults=" + MAX_EMAILS_TO_FETCH;
            if (monitoredLabel != SYSTEM_ALL_MAIL) {
                path += "&labelIds=" + getGmailAPILabelId(monitoredLabel);
            }

            // if a primary category (primary, promots etc.) or important+inbox then let's ensure they are also labeled "inbox"
            if (isMainCategory(monitoredLabel) || monitoredLabel == SYSTEM_IMPORTANT_IN_INBOX) {
                path += "&labelIds=" + GmailAPI.labels.INBOX;
            }

            const httpRequest = mygapiClient.request({
                path: path,
                method: "GET"
            });
            mygapiClient.HttpBatch.add(httpRequest);
        });

        const batchResponse = await mygapiClient.HttpBatch.execute({oauthRequest:oAuthForEmails, email:email});
        // tag monitored label to httpbodies
        batchResponse.httpBodies.forEach((httpBody, httpBodyIndex) => {
            httpBody.monitoredLabel = monitoredLabels[httpBodyIndex];
        });

        return {httpBodies:batchResponse.httpBodies};
   }

   async function fetchMessagesByIds(messages) {
	   console.log("fetchMessagesByIds", messages);
	   
        const mygapiClient = getMyGAPIClient();
        
        messages.forEach(message => {
            console.log("messageid: " + message.id);
            
            const httpRequest = mygapiClient.request({
                path: GmailAPI.PATH + "messages/" + message.id,
                method: "GET"
            });
            mygapiClient.HttpBatch.add(httpRequest);
        });

        const batchResponse = await mygapiClient.HttpBatch.execute({oauthRequest:oAuthForEmails, email:email});
        // tag monitored label to httpbodies
        // tag unsnoozed flags to httpbodies
        batchResponse.httpBodies.forEach((httpBody, httpBodyIndex) => {
            httpBody.monitoredLabel = messages[httpBodyIndex].monitoredLabel;
            httpBody.unSnoozed = messages[httpBodyIndex].unSnoozed;
        });
        
        return {httpBodies:batchResponse.httpBodies};
   }
   
   function processPart(part, message) {
	   if (part.mimeType == "text/plain") { // message/rfc822
		   message.textContent += decodeBase64UrlSafe(part.body.data);
		   
		   var MAX_CONTENT_LENGTH = 1000000;
		   
		   if (message.textContent && message.textContent.length > MAX_CONTENT_LENGTH) {
			   message.textContent = message.textContent.substr(0, MAX_CONTENT_LENGTH) + " ... (truncated by extension)";
		   }
		   
		   if (message.content == null) {
			   message.content = "";
		   }
	   } else if (part.mimeType == "text/html") {
		   if (part.body.data) {
			   message.content = decodeBase64UrlSafe(part.body.data);
			   
			   // Must keep content-id reference for inline images, so let's fool sanitizer to by prefixing it with "http://"
			   message.content = message.content.replace(/src=\"cid:/g, "src=\"" + FOOL_SANITIZER_CONTENT_ID_PREFIX);
			   message.content = message.content.replace(/src=\'cid:/g, "src=\'" + FOOL_SANITIZER_CONTENT_ID_PREFIX);
			   
			   message.content = html_sanitize(message.content, allowAllUrls, rewriteIds);
			   // just remove img altogether
			   if (message.content) {
				   message.content = message.content.replace(/<img /g, "<imghidden ");
				   message.content = message.content.replace(/\/img>/g, "/imghidden>");
			   }
		   }
	   } else if (part.parts && part.parts.length) { // do this after searching text and html, part.mimeType == "multipart/mixed" || part.mimeType == "multipart/alternative" || part.mimeType == "multipart/related" || part.mimeType == "multipart/relative" || part.mimeType == "multipart/parallel" || part.mimeType == "multipart/multipart" || part.mimeType == "multipart/report" || part.mimeType == "multipart/signed"
		   part.parts.forEach(function(part) {
			   processPart(part, message);
		   });
	   } else if (part.mimeType && part.mimeType.includes("image/")) { // this one appears with parent mimetype "multipart/multipart" like cra emails
		   message.files.push(part);
	   } else if (part.filename) {
		   message.files.push(part);
	   } else if (part.mimeType == "message/delivery-status" || part.mimeType == "message/rfc822") { // mail server errors: refer to email from my user: Yu ENOKIBORI
		   // ignore these because typically the text/plain also exists
	   //} else if (part.mimeType == "text/watch-html") {
		   // ignore this for Apple Watch display
	   } else if (part.mimeType == "application/octet-stream") {
		   if (!message.content) {
			   message.content = "";
		   }
		   message.content += " [File attached] But this extension could not process it. Use <a href='https://jasonsavard.com/forum/categories/checker-plus-for-gmail-feedback?ref=unknownMimeType'>Checker Plus forum</a> to help me with this issue.";
	   } else {
		   if (!message.textContent && !message.content) {
			   logError("must add logic for mimetype: " + part.mimeType, part);
			   message.content = "Error unknown mimetype: " + part.mimeType + " <br><br>Search or post this bug on the <a href='https://jasonsavard.com/forum/categories/checker-plus-for-gmail-feedback?ref=unknownMimeType'>Checker Plus forum</a>";
		   } else {
			   if (part.mimeType != "text/x-watch-html") { // ignore x-watch
				   logError("must add logic for mimetype (but found other content): " + part.mimeType, part);
			   }
		   }
	   }
   }
   
   function generateMessageFromHttpResponseMessage(mail, httpResponseMessage) {
	   var headers = httpResponseMessage.payload.headers;
	   
	   var message = {};
	   
	   message.id = httpResponseMessage.id;
	   message.labels = httpResponseMessage.labelIds;
	   
	   message.to = [];
	   message.cc = [];
	   message.bcc = [];
	   
	   message.files = [];
	   
	   message.date = getDateFromHttpResponseMessage(httpResponseMessage);

	   var subject = MyGAPIClient.getHeaderValue(headers, "Subject");
	   
	   var from = MyGAPIClient.getHeaderValue(headers, "From");
	   message.from = addressparser(from).first();
	   
	   var to = MyGAPIClient.getHeaderValue(headers, "To");
	   message.to = addressparser(to);
	   var cc = MyGAPIClient.getHeaderValue(headers, "CC");
	   message.cc = addressparser(cc);
	   var bcc = MyGAPIClient.getHeaderValue(headers, "BCC");
	   message.bcc = addressparser(bcc);
	   
	   message.textContent = "";

	   processPart(httpResponseMessage.payload, message);
	   
	   // if no text content then use the html content
	   if (!message.textContent) {
		   if (message.content) {
			   message.textContent = message.content.htmlToText();
		   }
		   if (!message.textContent) {
			   message.textContent = "";
		   }
	   }
	   
	   // if no html content then use the text content
	   if (!message.content) {
		   if (message.textContent) {
			   message.content = convertPlainTextToInnerHtml(message.textContent);
			   message.content = html_sanitize(message.content, allowAllUrls, rewriteIds);
		   }
		   if (!message.content) {
			   message.content = "";
		   }
	   }
	   
	   message.textContent = mail.account.filterEmailBody({
           subject: subject,
           body: message.textContent
       });
	   message.textContent = html_sanitize(message.textContent);
	   
	   // must mimic everything here for the auto-detect method and vica versa
	   //message.mail = mail;

	   return message;
   }
   
   function getDateFromHttpResponseMessage(httpResponseMessage) {
	   /*
	   var headers = httpResponseMessage.payload.headers;
	   var date = MyGAPIClient.getHeaderValue(headers, "Date");
	   if (date) {
		   date = new Date(date);
		   if (isNaN(date.getTime())) {
			   console.error("could not parse date: " + date);
			   date = new Date();
		   }
	   } else {
		   console.error("date header not found");
		   date = new Date();
	   }
	   return date;
	   */
	   
	   return new Date(parseInt(httpResponseMessage.internalDate));
   }
   
   async function fetchUnreadCount(labelIds, fetchWithInboxCount) {
	   console.log("fetchUnreadCount");
	   
        var mygapiClient = getMyGAPIClient();
        
        labelIds.forEach(function(labelId) {
            var path = null;
            // exclude primary because we need to count primary+inbox labelled emails (not just primary) we fetch that unread count using the resultSizeEstimate later in the code
            //if ((labelId == SYSTEM_INBOX && that.getSetting("openLinksToInboxByGmail")) || labelId == SYSTEM_PRIMARY) {
            if (isMainCategory(labelId)) {
                if (fetchWithInboxCount) {
                    if (conversationView) {
                        path = GmailAPI.PATH + "threads";
                    } else {
                        path = GmailAPI.PATH + "messages";
                    }
                    path += "?labelIds=" + GmailAPI.labels.UNREAD + "&labelIds=" + GmailAPI.labels.INBOX + "&labelIds=" + getGmailAPILabelId(labelId) + "&maxResults=1";
                } else {
                    // no path here because we will fetch the resultSizeEstimate size later
                }
            } else {
                path = GmailAPI.PATH + "labels/";
                if (labelId == SYSTEM_ALL_MAIL) {
                    path += GmailAPI.labels.UNREAD;
                } else {
                    path += getGmailAPILabelId(labelId);
                }
            }
            
            if (path) {
                var httpRequest = mygapiClient.request({
                    method: "GET",
                    path: path
                });
                mygapiClient.HttpBatch.add(httpRequest);
            }
        });

        const batchResponse = await mygapiClient.HttpBatch.execute({oauthRequest:oAuthForEmails, email:email});
        let unreadCount = 0;
        batchResponse.httpBodies.forEach(function(httpBody) {
            // when using messages.list API
            if (typeof httpBody.resultSizeEstimate !== "undefined") {
                unreadCount += httpBody.resultSizeEstimate;
            } else {
                if (conversationView) {
                    unreadCount += httpBody.threadsUnread;
                } else {
                    unreadCount += httpBody.messagesUnread;
                }
            }
        });
        return unreadCount;
   }
   
   async function getHistoryForFirstTime() {
        return oAuthForEmails.send({userEmail:email, url: GmailAPI.URL + "profile", noCache:true});
   }
   
   async function getHistory(params) {
	   console.log("getHistory");
        // Fetch the latest historyid by passing the history id of the last message. I'm only passing the labelid=inbox to minimize response data
        var data = {
            labelId: GmailAPI.labels.UNREAD,
            startHistoryId: params.historyId,
            maxResults: MAX_EMAILS_HISTORIES,
            fields: "history(labelsAdded,labelsRemoved,messagesAdded,messagesDeleted),historyId,nextPageToken"
        };

        if (params.nextPageToken) {
            data.pageToken = params.nextPageToken;
        }

        if (!params.labelId || params.labelId == SYSTEM_ALL_MAIL) {
            // do not send any label id params
        } else {
            data.labelId = params.labelId;
        }

        try {
            const response = await oAuthForEmails.send({
                userEmail: email,
                url: GmailAPI.URL + "history",
                data: data,
                noCache: true
            });
            if (params.labelId) {
                response.historyLabelId = params.labelId;
            }
            return response;
        } catch (error) {
            if (error.code == 404) {
                error.jreason = JError.HISTORY_INVALID_OR_OUT_OF_DATE;
            }
            throw error;
        }
   }
   
   this.fetchAttachment = async function(params) {
	   console.log("fetchAttachment");
        if (!params.noSizeLimit && params.size > FETCH_ATTACHMENT_MAX_SIZE) {
            throw Error("Size too large");
        }
        
        const fetchAttachmentResponse = await oAuthForEmails.send({
            userEmail: email,
            url: GmailAPI.URL + "messages/" + params.messageId + "/attachments/" + params.attachmentId
        });
        // Because API returns base64 url safe strings
        fetchAttachmentResponse.data = replaceBase64UrlSafeCharacters(fetchAttachmentResponse.data);
        return fetchAttachmentResponse;
   }

   async function executeGmailHttpAction(params) {
        const options = {};
        const COMMON_PARAMS = "t=" + params.mail.id + "&at=" + gmailAT + "&";
        const ACT_PARAM_NAME = "act=";
        let url;
        let urlParams = COMMON_PARAMS + ACT_PARAM_NAME;

        if (params.action == MailAction.MARK_AS_READ) {
            urlParams += "rd";
        } else if (params.action == MailAction.MARK_AS_UNREAD) {
            urlParams += "ur";
        } else if (params.action == MailAction.DELETE) {
            urlParams += "tr";
        } else if (params.action == MailAction.ARCHIVE) {
            urlParams += "rc_" + encodeURIComponent("^i");
        } else if (params.action == MailAction.MARK_AS_SPAM) {
            urlParams += "sp";
        } else if (params.action == MailAction.APPLY_LABEL) {
            urlParams += "ac_" + encodeURIComponent(params.label);
        } else if (params.action == MailAction.REMOVE_LABEL) {
            if (params.label == SYSTEM_INBOX) {
                params.action = MailAction.ARCHIVE;
                return executeGmailHttpAction(params);
            } else {
                urlParams += "rc_" + encodeURIComponent(params.label);
            }
        } else if (params.action == MailAction.UNTRASH) {
            urlParams += "ib&pcd=1&mb=0&rt=j&search=trash&ui=2";
            options.method = "POST";
            options.body = JSON.stringify({t:params.mail.id});
        } else if (params.action == MailAction.STAR) {
            urlParams += "st";
            params.mail.labels.push(SYSTEM_STARRED);
        } else if (params.action == MailAction.REMOVE_STAR) {
            urlParams += "xst";
            var index = params.mail.labels.indexOf(SYSTEM_STARRED);
            if (index != -1) {
                params.mail.labels.splice(index, 1);
            }
        } else if (params.action == MailAction.REPLY) {
            urlParams += "sm&ui=2&cmml=" + params.message.length + "&pcd=1&mb=0&rt=c&search=inbox";

            function appendLine(str) {
                data += str + "\n";
            }

            var replyObj = await params.mail.generateReplyObject(params);

            url = that.getMailUrl({useBasicGmailUrl:true}) + Math.ceil(1000000 * Math.random()) + "/";
            options.method = "POST";
            if (params.replyAllFlag) {
                var data = "";

                var boundary = "----WebKitFormBoundarythAbRn0cGJ9FBoKg";
                
                appendLine("--" + boundary);
                appendLine("Content-Disposition: form-data; name=\"redir\"");
                appendLine("");
                appendLine("?th=" + params.mail.id + "&v=c&s=l");
                
                appendLine("--" + boundary);
                appendLine("Content-Disposition: form-data; name=\"at\"");
                appendLine("");
                appendLine(gmailAT);
                
                appendLine("--" + boundary);
                appendLine("Content-Disposition: form-data; name=\"to\"");
                appendLine("");
                
                var toStr = "";
                if (replyObj) {
                    replyObj.tos.forEach(function(to, index) {
                        if (index != 0) {
                            toStr += ", ";
                        }
                        toStr += convertAddress(to, true);
                    });
                } else {
                    toStr = convertAddress(params.to, true);
                }
                
                appendLine(toStr);
                
                appendLine("--" + boundary);
                appendLine("Content-Disposition: form-data; name=\"cc\"");
                appendLine("");
                
                var ccStr = "";
                if (replyObj && replyObj.ccs && replyObj.ccs.length) {
                    replyObj.ccs.forEach(function(cc, index) {
                        if (index != 0) {
                            ccStr += ", ";
                        }
                        ccStr += convertAddress(cc, true);
                    });
                }
                
                appendLine(ccStr);

                appendLine("--" + boundary);
                appendLine("Content-Disposition: form-data; name=\"bcc\"");
                appendLine("");
                appendLine("");

                appendLine("--" + boundary);
                appendLine("Content-Disposition: form-data; name=\"file0\"; filename=\"\"");
                appendLine("Content-Type: application/octet-stream");
                appendLine("");
                appendLine("");

                appendLine("--" + boundary);
                appendLine("Content-Disposition: form-data; name=\"subject\"");
                appendLine("");
                appendLine(params.mail.title);
                
                appendLine("--" + boundary);
                appendLine("Content-Disposition: form-data; name=\"body\"");
                appendLine("");
                appendLine(params.message);
                appendLine("");
                appendLine("> " + params.mail.getLastMessageText());

                appendLine("--" + boundary);
                appendLine("Content-Disposition: form-data; name=\"nvp_bu_send\"");
                appendLine("");
                appendLine("Send");

                appendLine("--" + boundary + "--");
                
                options.headers = {
                    "Content-Type": "multipart/form-data; boundary=" + boundary
                }
                url += "?fv=b&cs=c&pv=cv&th=" + params.mail.id + "&rm=" + params.mail.id + "&cpt=r&v=b&s=l";
            } else {
                // when replying to emails with no inbox label ie. just Apps label, then we need to add s=l and also encoded s=l insie last param redir= 
                url += "?" + COMMON_PARAMS + "v=b&qrt=n&pv=cv&s=l&fv=cv&cs=qfnq&rm=" + params.mail.id + "&th=" + params.mail.id + "&qrr=" + "o" + "&body=" + encodeURIComponent(params.message) + "&nvp_bu_send=Send&haot=qt&redir=" + encodeURIComponent("?v=c&s=l");
            }
        } else {
            throw new Error("action not found: " + params.action);
        }
        
        if (!url) {
            url = that.getMailUrl({useStandardGmailUrl:true, urlParams:urlParams});
        }
        
        if (data) {
            options.body = data;
        }
        const html = await ajaxBasicHTMLGmail(url, options);

        if (params.action == MailAction.REPLY) {
            console.log("reply response: ", html);
            if (html && (html.includes("#FAD163") || html.toLowerCase().includes("your message has been sent"))) {
                return "success";
            } else {
                throw Error("Send error: Could not confirm action");
            }
        }
        
        if (params.action == MailAction.DELETE || params.action == MailAction.MARK_AS_READ || params.action == MailAction.ARCHIVE) {
            const gmailSettings = await params.mail.account.getSetting("gmailSettings");
            if (gmailSettings.conversationViewMode === false && await storage.firstTime("conversationViewWarningShown")) {
                openUrl("https://jasonsavard.com/wiki/Conversation_View_issue");
            }
        }
   }
   
   async function executeGmailAPIAction(params) {
        // save the quota by using messages vs threads depending on conversation view
        var requestPath;
        
        // is request path overridden here?
        if (params.requestPath) {
            requestPath = params.requestPath;
        } else {
            var gmailAPIaction = params.gmailAPIaction;
            // default action is modify
            if (!gmailAPIaction) {
                gmailAPIaction = "modify";
            }
            if (await params.mail.account.getSetting("conversationView")) {
                requestPath = "threads/" + params.mail.threadId + "/" + gmailAPIaction;
            } else {
                requestPath = "messages/" + params.mail.id + "/" + gmailAPIaction;
            }
        }
        
        storage.setDate("_lastGmailAPIActionByExtension");
        
        const sendParams = {
            userEmail:email,
            type:"POST",
            url:GmailAPI.URL + requestPath,
        };
        if (params.data) {
            sendParams.data = params.data;
        }

        const data = await oAuthForEmails.send(sendParams);
        console.log("execute history response", data);
        return data;
   }
   
   this.executeMailAction = async function (params) {
	   console.log("in executeMailAction", params);
	   
        if (accountAddingMethod == "autoDetect") {

            await getGmailAT();
            try {
                const response = await executeGmailHttpAction(params);
                await that.getEmails();
                await mailUpdate(params);
                return response;
            } catch (error) {
                showCouldNotCompleteActionNotification(error, true);
                console.error("executeMailAction: ", error);
                throw error;
            }
        } else { // oauth submit

            var promise;
            
            if (params.action == MailAction.MARK_AS_READ) {
                params.data = {removeLabelIds:[GmailAPI.labels.UNREAD]};
                promise = executeGmailAPIAction(params);
            } else if (params.action == MailAction.MARK_AS_UNREAD) {
                params.data = {addLabelIds:[GmailAPI.labels.UNREAD]};
                promise = executeGmailAPIAction(params);
            } else if (params.action == MailAction.DELETE) {
                params.gmailAPIaction = "trash";
                promise = executeGmailAPIAction(params);
            } else if (params.action == MailAction.UNTRASH) {
                params.gmailAPIaction = "untrash";
                await executeGmailAPIAction(params);
                // must also reapply "inbox" label
                params.action = MailAction.APPLY_LABEL;
                delete params.gmailAPIaction;
                params.data = {addLabelIds:[GmailAPI.labels.INBOX]};
                return executeGmailAPIAction(params);
            } else if (params.action == MailAction.ARCHIVE) {
                params.data = {removeLabelIds:[GmailAPI.labels.INBOX]};
                promise = executeGmailAPIAction(params);
            } else if (params.action == MailAction.MARK_AS_SPAM) {
                params.data = {addLabelIds:[GmailAPI.labels.SPAM]};
                promise = executeGmailAPIAction(params);
            } else if (params.action == MailAction.APPLY_LABEL) {
                params.data = {addLabelIds:[params.label]};
                const executeResponseParams = await executeGmailAPIAction(params);
                params.mail.labels.push(params.label);
                promise = Promise.resolve(executeResponseParams);
            } else if (params.action == MailAction.REMOVE_LABEL) {
                params.data = {removeLabelIds:[params.label]};
                const executeResponseParams = await executeGmailAPIAction(params);
                var foundIndex = params.mail.labels.indexOf(params.label);
                params.mail.labels.splice(foundIndex, 1);
                promise = Promise.resolve(executeResponseParams);
            } else if (params.action == MailAction.STAR) {
                params.data = {addLabelIds:[GmailAPI.labels.STARRED]};
                await executeGmailAPIAction(params);
                params.mail.labels.push(GmailAPI.labels.STARRED);
                promise = Promise.resolve();
            } else if (params.action == MailAction.REMOVE_STAR) {

                // remove before complete to fix this bug https://jasonsavard.com/forum/discussion/5266/small-bug-unstar-seems-to-fail-if-you-are-too-quick-to-open-the-mail
                var index = params.mail.labels.indexOf(GmailAPI.labels.STARRED);
                if (index != -1) {
                    params.mail.labels.splice(index, 1);
                }

                params.data = {removeLabelIds:[GmailAPI.labels.STARRED]};
                await executeGmailAPIAction(params);
                promise = Promise.resolve();
            } else if (params.action == MailAction.SEND_EMAIL) {
                params = await generateExecuteGmailAPIActionParams(params);
                params.timeout = minutes(2);
                promise = executeGmailAPIAction(params);
            } else if (params.action == MailAction.REPLY) {
                params = await generateExecuteGmailAPIActionParams(params);
                params.timeout = minutes(2);
                promise = executeGmailAPIAction(params);
            } else {
                var error = "action not found: " + params.action;
                logError(error);
                promise = Promise.reject(error);
            }
            
            try {
                const response = await promise;
                // let's save some quota and not call .getEmails
                let removedEmail;
                
                if (params.action == MailAction.MARK_AS_READ || params.action == MailAction.DELETE || params.action == MailAction.ARCHIVE || params.action == MailAction.MARK_AS_SPAM || (params.action == MailAction.REMOVE_LABEL && params.mail && params.mail.monitoredLabel == params.label)) {
                    if (that.removeMail(params.mail.id)) {
                        removedEmail = true;
                        --that.unreadCount; // account specific (not the global unreadCount)
                        console.log("removemail unreadcount: " + that.unreadCount);
                    }
                }
                
                if (removedEmail && !params.instantlyUpdatedCount) {
                    // use unreadCount because that is the global unreadcount (as opposed to just unreadCount which is local to this mailAccount)
                    var newBadgeCount = lsNumber("unreadCount") - 1;
                    console.log("updatebadge: " + newBadgeCount);
                    updateBadge(newBadgeCount);
                }
                
                await serializeAccounts(accounts);
                return response;
            } catch (error) {
                showCouldNotCompleteActionNotification(error.toString());
                console.error("executeGmailAPIAction: " + error);
                throw error;
            }
        }
   }
   
   this.testGmailAT = function(force) {
	   return getGmailAT(force);
   }
   
   // acts as a singleton so that it can handle multiple calls
   async function getGmailAT(force) {
	   if (!gmailATProcessing || force) {
            gmailATProcessing = true;
            getGmailAtPromise = async function() {
                // every 5 minutes
                if (!gmailAT || lastGmailATFetch.diffInMinutes() <= -5 || force) {
                    try {
                        gmailAT = await fetchGmailAT2();
                        console.log("get at: " + gmailAT);
                    } catch (error) {
                        logError(error);
                        gmailAT = await fetchGmailAT1();
                        console.log("get at2: " + gmailAT);
                    }
                    lastGmailATFetch = new Date();
                }
                return gmailAT;
            }();

            getGmailAtPromise
                .catch(error => {
                    logError(error);
                })
                .finally(() => {
                    gmailATProcessing = false;
                })
            ;
	   }
	   return getGmailAtPromise;
   }

   async function fetchGmailAT1() {
        let data;
        try {
            data = await ajaxBasicHTMLGmail(that.getMailUrl({useBasicGmailUrl:true}) + Math.ceil(1000000 * Math.random()));
        } catch (error) {
            throw "gmail AT error: " + error;
        }

        // must keep the \b because some emails had content like ... format=123  and the at=123 was matched!
        var matches = data.match(/\bat\=([^\"\&]*)/); //  new one:   /at\=([^\"\&]*)/     old one: /\at=([^"&]+)/
        if (matches && matches.length) { // sample at: AF6bupND7QvFVgjkbg_PAWf7jUnB-zQFTQ   xF6bupMdRlq_g8bP0qwnUMLHR3_PwMA7PA  xF6bupMQ3nNhcKWmba7nVIHX8Am4WaH_qQ  
            var foundAT;
            for (var a=1; a<matches.length; a++) {
                // if between 20 and 50 characters then say it's valid and don't match any html like ... 0</font></span></a></td><td nowrap>Apr OR 0%3C/font%3E%3C/span%3E%3C/a%3E%3C/td%3E%3Ctd%20nowrap%3EApr
                if (matches[a].length >= 20
                    && matches[a].length <= 50
                    && !matches[a].includes("<")
                    && !matches[a].includes(">")
                    && !matches[a].includes("/")
                    && !matches[a].includes(" ")) {
                    foundAT = matches[a];
                    break;
                }
            }
            if (foundAT) {
                return foundAT;
            } else {
                throw "gmail at error, no valid AT found";
            }
        } else {
            throw "gmail at error parsing";
        }
   }

   async function fetchGmailAT2() {
        let data;
        try {
            const url = that.getMailUrl({useStandardGmailUrl:true});
            data = await fetchText(url);
        } catch (error) {
            throw "gmail at error2: " + error;
        }

        var tmp = /GM_ACTION_TOKEN\=\"([^\"]*)\"/.exec(data);
        if (tmp && tmp.length >= 2) {
            return tmp[1];
        } else {
            throw "gmail at error2 parsing";
        }        
   }
   
   async function fetchGmailIdKey() {
        let data;
        try {
            const url = that.getMailUrl({useStandardGmailUrl:true});
            data = await fetchText(url);
        } catch (error) {
            throw "gmail id key error: " + error;
        }

        var tmp = /GM_ID_KEY\=\"([^\"]*)\"/.exec(data);
        if (tmp && tmp.length >= 2) {
            return tmp[1];
        } else {
            throw "gmail id key error parsing";
        }
	}

   async function generateExecuteGmailAPIActionParams(params) {
	   const account = that;
	   
	   var replyObj;
	   
	   if (params.action == MailAction.REPLY) {
		   replyObj = await params.mail.generateReplyObject(params);
		   console.log("replyobj in generaetexec", replyObj);
	   }

	   var mimeMessage = "";
	   
	   mimeMessage += "MIME-Version: 1.0" + "\n";
	   
	   if (params.action == MailAction.REPLY) {
		   mimeMessage += "In-Reply-To: " + params.mail.messageId + "\n";
		   mimeMessage += "References: " + params.mail.messageId + "\n";
	   }
	   
	   var fromObj = {};
	   
	   var fromEmail;
	   // if from found might have been from a "send mail as" email address
	   if (replyObj && replyObj.from) {
		   fromObj = replyObj.from;
	   } else {
		   fromObj.email = that.getEmail();
	   }
	   
	   if (account) {
		   var profileInfo = await account.getSetting("profileInfo");
		   if (profileInfo) {
			   fromObj.name = profileInfo.displayName;
		   }
	   }
	   
	   // test
	   //fromObj.name = "hello - dude";
	   //fromObj.email = "richiefarret@gmail.com";
	   
	   mimeMessage += "From: " + convertAddress(fromObj) + "\n";
	   
	   var tos = [];
	   if (replyObj) {
		   tos = replyObj.tos;
	   } else if (params.tos) {
		   tos = params.tos;
	   } else {
		   tos = [params.to];
	   }
	   
	   var toStr = "";
	   tos.forEach(function(to, index) {
		   if (index != 0) {
			   toStr += ", ";
		   }
		   toStr += convertAddress(to);
	   });
	   
	   //toStr = convertAddress({name:"Lord, Elgin", email:"richiefarret@gmail.com"});
	   console.info("to: " + toStr);
	   mimeMessage += "To: " + toStr + "\n";
	   //mimeMessage += 'To: Lord Melissa <richiefarret@gmail.com>' + '\n';

	   var ccs = [];
	   if (replyObj && replyObj.ccs && replyObj.ccs.length) {
		   ccs = replyObj.ccs;
	   } else if (params.ccs) {
		   ccs = params.ccs;
	   } else if (params.cc) {
		   ccs = [params.cc];
	   }

	   if (ccs.length) {
		   var ccStr = "";
		   ccs.forEach(function(cc, index) {
			   if (index != 0) {
				   ccStr += ", ";
			   }
			   ccStr += convertAddress(cc);
		   });
		   mimeMessage += "Cc: " + ccStr + "\n";
	   }

	   var subject;
	   if (params.action == MailAction.REPLY) {
		   subject = params.mail.title;
	   } else {
		   subject = params.subject;
	   }
	   
	   //mimeMessage += "Subject: " + subject + "\n";
	   //mimeMessage += "Content-type: text/html; charset=UTF-8" + "\n";
	   //mimeMessage += "Content-Transfer-Encoding: 8bit" + "\n";
	   //subject = "=?iso-8859-1?Q?=D0=9D=D1=8B=D0=BA =D0=B0=D0=BD =D0=BC=D1=8E=D0=BD=D0=B4=D0=B9 =D0=BA=D0=BE==D0=BD=D0=B2=D1=8B=D0=BD=D1=91=D1=80=D1=8B";
	   //subject = "=?UTF-8?B?PT91dGYtOD9CP1IyeGxaWG9nUTAxVElDMGcw?=";
	   //subject = "=?UTF-8?Q?a=C3=A9riennes?=";
	   // "Уже пожертвовали?"
	   if (subject) {
		   //subject = escapeToMime(subject, "quoted-printable", "UTF8");
		   subject = mimelib.mimeFunctions.encodeMimeWords(subject, "Q");
	   } else {
		   subject = "";
	   }
	   mimeMessage += "Subject: " + subject + "\r\n";
	   
	   /*
	    * Gmail API nuances
	    * I used to send text/plain and text/html but the Gmail API would overwrite/derive the text/plain part from the text/html with it's own logic
	    * Can't attachments + send text/plain together or else only text/plain would go through
	    */
	   
	   if (await account.getSetting("showSignature", "accountsShowSignature")) {
		   var sendAsData = await account.getSetting("sendAsData");
		   if (sendAsData) {
			   var signature;
			   sendAsData.sendAs.find(sendAs => {
				   if (sendAs.sendAsEmail == fromObj.email) {
					   signature = sendAs.signature;
					   return true;
				   }
			   });
			   
			   if (signature) {
				   if (!params.htmlMessage) {
				   		params.htmlMessage = convertPlainTextToInnerHtml(params.message);
				   }
				   params.htmlMessage += '<br><div class="gmail_signature" data-smartmail="gmail_signature">' + signature + '</div>'; 
			   }
		   }
	   }
	   
	   if (!params.message && !params.htmlMessage && !params.attachment) {
		   // send nothing!
	   } else if (params.message && !params.htmlMessage && !params.attachment) {
		   mimeMessage += "\n";
		   mimeMessage += params.message;
	   } else {
		   var BOUNDARY = "c4d5d00c4725d9ed0b3c8b";
		   mimeMessage += "Content-Type: multipart/related; boundary=" + BOUNDARY + "\n";
		   mimeMessage += "\n";
		   mimeMessage += "--" + BOUNDARY + "\n";
		   mimeMessage += "Content-Type: text/html;charset=utf-8" + "\n";
		   mimeMessage += "\n";
		   mimeMessage += params.htmlMessage;
		   mimeMessage += "\n\n";
		   
		   if (params.attachment) {
			   mimeMessage += "--" + BOUNDARY + "\n";
			   mimeMessage += "Content-Type: " + params.attachment.contentType + "\n";
			   mimeMessage += "Content-Disposition: attachment; filename=" + params.attachment.filename + "\n";
			   mimeMessage += "Content-Length: " + params.attachment.data.length + "\n";
			   if (params.attachment.duration) {
				   mimeMessage += "X-Content-Duration: " + params.attachment.duration + "\n";
			   }
			   mimeMessage += "Content-Transfer-Encoding: base64" + "\n";
			   mimeMessage += "\n";
			   mimeMessage += params.attachment.data;
		   }
		   mimeMessage += "--" + BOUNDARY + "--" + "\n";		   
	   }
	   
	   params.requestPath = "messages/send"; // ?uploadType=multipart 
	   
	   params.data = {};
	   params.data.raw = encodeBase64UrlSafe(mimeMessage);
	   if (params.action == MailAction.REPLY) {
		   params.data.threadId = params.mail.threadId;
	   }
	   return params;
   }
   
   this._openMailInBrowser = function(params = {}) {
	   params.useGmailUI = true;

	   var newURL = that.getMailUrl(params);
	   if (params.openInNewTab) {
		   openUrl(newURL, params);
	   } else if (params.openInBackground) {
		   chrome.tabs.create({url:newURL, active:false});
	   } else {
		   that.findOrOpenGmailTab(params);
	   }
   }

   // Opens the inbox
   this.openInbox = async function(params = {}) {
	   console.log("openinbox");
	   params.label = await that.getOpenLabel();
	   that._openMailInBrowser(params);
   }
   
   this.openLabel = function(label) {
	   that.findOrOpenGmailTab({label:label});
   }
   
   this.openSearch = function(searchStr, params = {}) {
	   params.label = "search";
	   params.searchStr = searchStr;
	   that.findOrOpenGmailTab(params);
   }
   
   this.openMessageById = function(params) {
	   if (!params.label) {
		   params.label = SYSTEM_ALL_MAIL;
	   }
	   
	   that.findOrOpenGmailTab(params);
   }
   
   function loadMailInGmailTab(params) {
	   return new Promise((resolve, reject) => {
		   // focus window
		   chrome.windows.update(params.tab.windowId, {focused:true}, function() {
			   // focus/update tab
			   var newURL = params.account.getMailUrl(params);
			   
			   // if same url then don't pass url parameter or else chrome will reload the tab
			   if (params.tab.url == newURL) {
				   chrome.tabs.update(params.tab.id, {active:true}, function() {
					   resolve();
				   });
			   } else {
				   chrome.tabs.update(params.tab.id, {active:true, url:newURL}, function() {
					   // patch for issue when your newly composing an email, it seems if you navigate away Gmail with change the url back #compose after this initial change, so we have to change it twice with a delay
					   if (params.tab.url.endsWith("#compose")) {
						   setTimeout(function() {
							   chrome.tabs.update(params.tab.id, {active:true, url:newURL}, function() {
								   resolve(); 
							   });
						   }, 3000);
					   } else {
						   resolve();
					   }
				   });
			   }
		   });
	   });
   }
   
   this.findOrOpenGmailTab = async function(params) {
	   params.useGmailUI = true;
	   
	   var mailUrl = that.getMailUrl(params);

	   var multiAccountPath = "/mail(/ca)?/u/";
	   var firstMultiAccountPath = "/mail/u/0";
	   
	   // get all gmail windows
	   chrome.tabs.query({url:MAIL_DOMAIN_AND_PATH + "*"}, function(tabs) {
		   
		   var defaultMailURLTab;
		   var exactMailURLTab;

		   tabs.some(tab => {
			   // apparently a launching Gmail in Chrome application shortcut is windowType = "popup" ???		   
			   if (!tab.url.match(multiAccountPath)) {
				   // no account # appended so could be the default url /mail/ (ie. NOT /mail/u/0/ etc..
				   defaultMailURLTab = tab;
				   params.account = getAccountById(0);
			   } else if (tab.url.match(multiAccountPath + that.id)) {
				   exactMailURLTab = tab;
				   params.account = getAccountById(that.id);
				   return true;
			   }
		   });
		   
		   // if 1st account then look for default url just /mail/ and not /mail/u/0/
		   if (mailUrl.includes(firstMultiAccountPath) && defaultMailURLTab) {
			   params.tab = defaultMailURLTab;
			   loadMailInGmailTab(params);
		   } else if (exactMailURLTab) {
			   params.tab = exactMailURLTab;
			   loadMailInGmailTab(params);
		   } else {
			   if (params.noMatchingTabFunction) {
				   params.noMatchingTabFunction(mailUrl);
			   } else {
				   openUrl(mailUrl);
			   }
		   }
		   
	   });
	   
	   if (params.mail) {
            await params.mail.markAsRead();
		    await that.getEmails();
			mailUpdate();
	   }
   }

   this.getSetting = async function(attributeName, settingsName) {

	   // if no settingsname passed just use attribute
	   if (!settingsName) {
		   settingsName = attributeName;
	   }
	   
	   var emailSettings = await storage.get("emailSettings");
	   if (emailSettings) {
		   var accountEmailSettings = emailSettings[that.getEmail()];
		   if (accountEmailSettings) {
			   let accountEmailSetting = accountEmailSettings[attributeName];
			   if (accountEmailSetting != undefined) {
				   return accountEmailSetting;
			   }
		   }
	   }
	   
	   // getting here means nothing matched above
	   return storage.defaults[settingsName];
   }
   
   this.deleteSetting = function(key) {
	   return that.saveSetting(key, null);
   }
   
   this.saveSetting = async function(key, value) {
	   var emailSettings = await storage.get("emailSettings");
	   var accountEmailSettings;
	   if (!emailSettings) {
		   emailSettings = {}
	   }
	   accountEmailSettings = emailSettings[that.getEmail()];
	   if (!accountEmailSettings) {
		   // do this so that accountEmailSettings is references to emailSettings
		   emailSettings[that.getEmail()] = {};
		   accountEmailSettings = emailSettings[that.getEmail()];
	   }
	   
	   if (value == null) {
		   delete accountEmailSettings[key];
	   } else {
		   accountEmailSettings[key] = value;
	   }
	   return storage.set("emailSettings", emailSettings);
   }

   this.getSettingForLabel = async function(key, label, defaultObj) {
	   	var labelSettings = await that.getSetting(key);
	   	
		if (!labelSettings) {
			labelSettings = {};
		}

		var value;
		if (typeof labelSettings[label] == "undefined") {
			value = defaultObj;
		} else {
			value = labelSettings[label];
		}
		return value;
   }

   this.saveSettingForLabel = async function(key, label, value) {
		var labelSettings = await that.getSetting(key);
		if (!labelSettings) {
			labelSettings = {};
		}
		labelSettings[label] = value;
		return that.saveSetting(key, labelSettings);
   }
   
   this.isUsingGmailCategories = async function() {
		var gmailSettings = await that.getSetting("gmailSettings");
		return (gmailSettings.tabs && gmailSettings.tabs.length >= 2);
   }
   
   this.isMaybeUsingGmailCategories = async function() {
		var gmailSettings = await that.getSetting("gmailSettings");
		return gmailSettings.tabs == undefined || (gmailSettings.tabs && gmailSettings.tabs.length >= 2);
   }

   this.hasHiddenTabs = async function() {
		var gmailSettings = await that.getSetting("gmailSettings");
		return await that.isUsingGmailCategories() && (gmailSettings.tabs && gmailSettings.tabs.length < TOTAL_GMAIL_TABS); // 5 means ok because they are all shown
   }

   this.getMonitorLabels = async function() {
	   return await that.getSetting("monitorLabel", "monitorLabelsForGmailClassic");
   }
   
   this.getFirstMonitoredLabel = function(gmailAPILabelIds, monitoredLabels) {
	   for (var a=0; a<monitoredLabels.length; a++) {
		   for (var b=0; gmailAPILabelIds && b<gmailAPILabelIds.length; b++) {
			   if (getGmailAPILabelId(monitoredLabels[a]) == gmailAPILabelIds[b]) {
				   return monitoredLabels[a];
			   }
		   }
	   }
   }

   this.getOpenLabel = async function() {
	   return await that.getSetting("openLabel", "open_label");
  }

   // Retrieves unread count
   this.getUnreadCount = function () {
	   if (that.unreadCount < 0) {
		   that.unreadCount = 0;
	   }
	   return that.unreadCount;
   }
   
   this.getEmailDisplayName = async function() {
	   var alias = await that.getSetting("alias");
	   if (alias) {
		   return alias;
	   } else {
		   return that.getEmail();
	   }
   }

	this.getMailUrl = function (params = {}) {
		var mailUrl = MAIL_DOMAIN;

		if (that.id != null && !that.mustResync) {
			// This is a Google account with multiple sessions activated
			if (params.useBasicGmailUrl || (!params.useStandardGmailUrl && useBasicHTMLView)) {
				mailUrl = MAIL_DOMAIN_AND_PATH + "u/" + that.id + "/h/";
			} else {
				mailUrl += MAIL_PATH + "u/" + that.id + "/";
			}
		} else {
			// Standard one-session Gmail account
			console.trace("no account id");
			mailUrl += MAIL_PATH;
			if (params.useGmailUI && that.mustResync) {
				mailUrl = setUrlParam(mailUrl, "authuser", encodeURIComponent(that.getEmail()));
				// leave some grace time for user to sign in if they get they are prompted for password to sign into their gmail
                // stop previous timer (if any)
                if (that.resyncAttempts > 0) {
                    chrome.alarms.create(Alarms.RESYNC_ALARM_PREFIX + email, {delayInMinutes: 1});
                }
			}
		}

		if (params.useGmailUI) {
			var labelToUse;
			if (params.label != undefined) {
				labelToUse = params.label;
			} else {
				if (accountAddingMethod == "autoDetect") {
					labelToUse = params.mail.labels.first();
				} else {
					labelToUse = params.mail.monitoredLabel;
				}
			}

			if (labelToUse == SYSTEM_INBOX || labelToUse == SYSTEM_IMPORTANT || labelToUse == SYSTEM_IMPORTANT_IN_INBOX || labelToUse == SYSTEM_PRIMARY || labelToUse == SYSTEM_PURCHASES || labelToUse == SYSTEM_FINANCE || labelToUse == SYSTEM_SOCIAL || labelToUse == SYSTEM_PROMOTIONS || labelToUse == SYSTEM_UPDATES || labelToUse == SYSTEM_FORUMS) {
				labelToUse = "inbox"; // mbox changed to inbox
			} else if (labelToUse == SYSTEM_ALL_MAIL) {
				labelToUse = "all";
			} else if (labelToUse == SYSTEM_UNREAD) {
				labelToUse = "search/label%3Aunread";
			} else if (labelToUse == "search") {
				var searchStrFormatted = encodeURIComponent(params.searchStr);
				searchStrFormatted = searchStrFormatted.replace(/%20/g, "+");
				labelToUse = "search/" + searchStrFormatted;
			} else {
				if (params.mail) {
					labelToUse = params.mail.account.getLabelName(labelToUse);
				} else {
					labelToUse = that.getLabelName(labelToUse);
				}
				labelToUse = "label/" + labelToUse;
			}
			
			mailUrl += "#" + labelToUse;
			
			var messageId;
			var threadId;
			
			// passed directly
			if (params.messageId) {
				messageId = params.messageId;
			} else if (params.mail) { // passed via mail object
				messageId = params.mail.id;
				threadId = params.mail.threadId; // when using oauth we have threadId, use it because that's what Gmail uses when viewing emails (but not able to fetch it with auto-detect)
			}
			
			if (messageId) {
				if (useBasicHTMLView) {
					// only works with message id (not thread id)
					mailUrl = setUrlParam(mailUrl, "th", messageId);
					mailUrl = setUrlParam(mailUrl, "v", "c");
				} else if (conversationView && threadId) {
					mailUrl += "/" + threadId;
				} else {
					mailUrl += "/" + messageId;
				}
			}
		}

		if (params.atomFeed != undefined) {
			mailUrl += "feed/atom/" + params.atomFeed;
		}

		if (params.urlParams) {
			if (mailUrl.includes("?")) {
				mailUrl += "&"
			} else {
				mailUrl += "?";
			}
			mailUrl += params.urlParams;
		}

		return mailUrl;
	}

   // Returns the email address for the current account
   this.getEmail = function () {
	   if (email) {
		   return email;
	   } else {
		   return that.getMailUrl();
	   }
   }
   
   this.hasBeenIdentified = function() {
	   return email && email != MAIL_ADDRESS_UNKNOWN;
   }

   // Returns the mail array
   this.getMails = function () {
	   return mailArray;
   }

   this.setMail = function (mails) {
        mailArray = mails;
   }
   
   this.getMailIndexById = function(id) {
       return mailArray.findIndex(mail => mail.id == id);
   }

   this.getMailById = function(id) {
	   const mailIndex = that.getMailIndexById(id);
	   if (mailIndex != -1) {
		   return mailArray[mailIndex];
	   }
   }
   
   this.removeMail = function(id) {
	   const mailIndex = that.getMailIndexById(id);
	   if (mailIndex != -1) {
		   return mailArray.splice(mailIndex, 1);
	   }
   }

   // Returns the newest mail
   this.getNewestMail = function () {
	   return newestMailArray.first();
   }

   // Returns the newest mail
   this.getAllNewestMail = function () {
	   return newestMailArray;
   }

   this.getUnsnoozedEmails = function () {
	   return unsnoozedEmails;
   }

   this.setUnsnoozedEmails = function (emails) {
        unsnoozedEmails = emails;
    }

   this.getLabelsForSerialization = function () {
        return labels;
   }

   this.setLabels = function (thisLabels) {
        labels = thisLabels;
   }

   this.openCompose = async function(params = {}) {
	   params.account = that;
	   params.url = await generateComposeUrl(params);
	   
	   // generate a reply all regardless to store it for possible use later
	   params.generateReplyAll = true;
	   var urlReplyAll = await generateComposeUrl(params);
	   
	   localStorage["_composeUrl"] = params.url;
	   localStorage["_composeUrlReplyAll"] = urlReplyAll;
	   
	   console.log("open compose:", params);
	   
	   if (params.replyAction) {
		   // detect if more than 1 recipient and if so we show the reply all option to user
		   if ((params.replyAll.tos && params.replyAll.tos.length >= 2) || (params.replyAll.tos && params.replyAll.tos.length == 1 && params.replyAll.ccs >= 1) || (params.ccs && params.ccs.length >= 2)) {
			   params.showReplyAllOption = true;
			   console.log("show reply all");
		   }
	   }
	   
	   openTabOrPopup(params);
   }
   
   this.sendEmail = async function(params) {
        params.action = MailAction.SEND_EMAIL;
        return that.executeMailAction(params);
   }
   
   this.ensureMailAddressIdentified = async function() {
	   if (!that.hasBeenIdentified()) {
		   return fetchFeed({ensureMailAddressIdentifiedFlag:true});
	   }
   }
   
   this.fetchGmailSettings = async function(params = {}) {
	    await that.ensureMailAddressIdentified();
        let FETCH_INTERVAL_IN_DAYS = 1; // fetch every x days
        var lastFetchedGmailSettings = await that.getSetting("lastFetchedGmailSettings");
        if (lastFetchedGmailSettings && lastFetchedGmailSettings.diffInDays() > -FETCH_INTERVAL_IN_DAYS) { // !params.refresh && 
            return;
        } else {
            console.log("Fetch Gmail settings ...");
            const data = await fetchText(that.getMailUrl({useStandardGmailUrl:true}));
            console.log("gmail settings", data);
            if (data) {
                // Detect conversation view off ["bx_vmb","1"]
                var conversationViewMode = true;
                if (data.includes("[\"bx_vmb\",\"1\"]")) {
                    conversationViewMode = false;
                }
                
                // Detect Gmail category tabs ["sx_pits","^smartlabel_personal|^smartlabel_social"]
                var tabs = [];
                var tabsStr = data.match(/sx_pits\",\"(.*?)\"]/);
                if (tabsStr) {
                    tabsStr = tabsStr[1]
                    if (tabsStr.includes(AtomFeed.PRIMARY)) {
                        tabs.push(SYSTEM_PRIMARY);
                    }
                    if (tabsStr.includes(AtomFeed.SOCIAL)) {
                        tabs.push(SYSTEM_SOCIAL);
                    }
                    if (tabsStr.includes(AtomFeed.PROMOTIONS)) {
                        tabs.push(SYSTEM_PROMOTIONS);
                    }
                    if (tabsStr.includes(AtomFeed.UPDATES)) {
                        tabs.push(SYSTEM_UPDATES);
                    }
                    if (tabsStr.includes(AtomFeed.FORUMS)) {
                        tabs.push(SYSTEM_FORUMS);
                    }
                    
                    if (!lastFetchedGmailSettings) {
                        //sendGA("gmailSettings", "tabs", tabsStr);
                    }
                }
                
                await that.saveSetting("gmailSettings", {conversationViewMode:conversationViewMode, tabs:tabs});
            } else {
                throw new Error("no data");
            }

            that.saveSetting("lastFetchedGmailSettings", new Date());
        }
   }
   
   async function fetchLabelsFromHtmlSource() {
		const labels = [];
        
        try {
            const idKey = await fetchGmailIdKey();
            const data = await fetchText(that.getMailUrl({useStandardGmailUrl:true, urlParams:"ui=2&view=omni&rt=j&ik=" + idKey})); // "ui=2&view=up&rt=c&ik=" + idKey
            const labelStartStr = '[[[';
            const startIndex = data.indexOf(labelStartStr);
            if (startIndex != -1) {
                //startIndex += labelStartStr.length;
                //var endIndex = data.indexOf(']]', startIndex) + 2;
                var endIndex = data.length;
                var length = endIndex - startIndex;
                var labelsRawStr = data.substr(startIndex, length);
                var labelsRawObj = JSON.parse(labelsRawStr);

                const obj = labelsRawObj[0];
                for (let a=0; a<obj.length; a++) {
                    if (obj[a][0] == "omni") {
                        const obj2 = obj[a][1];
                        for (let b=0; b<obj2.length; b++) {
                            var labelName = obj2[b][0];
                            if (labelName.indexOf("^") != 0) {
                                labels.push({id:labelName, name:labelName});
                            }
                        }
                        break;
                    }
                }
            } else {
                var error = "did not find label search str: " + labelStartStr;
                logError(error);
                throw error;
            }
        } catch (error) {
			logError("An error occured while fetching globals: " + error);
            console.warn("trying alternative fetch for labels");
            const data = await ajaxBasicHTMLGmail(that.getMailUrl({useBasicGmailUrl:true}));
            var startIndex = data.indexOf("<select name=tact>");
            if (startIndex != -1) {
                var endIndex = data.indexOf("</select>", startIndex);
                var html = data.substring(startIndex, endIndex);
                parseHtml(html).querySelectorAll("option").forEach(option => {
                    var label = option.getAttribute("value");
                    if (label.indexOf("ac_") == 0) {
                        var labelName = label.substring(3);
                        labels.push({id:labelName, name:labelName});
                    }
                });
            } else {
                var error = "Error getting labels backup method";
                logError(error);
                throw error;
            }
        } finally {
            return labels;
        }
   }
   
   this.getLabels = async function(forceRefresh) {
        if (!labels || forceRefresh) {
            if (accountAddingMethod == "autoDetect") {
                labels = await fetchLabelsFromHtmlSource();
                console.log("fetchlabels", labels);
            } else {
                const data = await oAuthForEmails.send({
                    userEmail: email,
                    url: GmailAPI.URL + "labels",
                    noCache: true
                });
                labels = data.labels;
                console.log("fetchlabelsoauth", labels);
                
                if (labels) {
                    labels = labels.filter(label => label.type == "user");
                } else {
                    labels = [];
                }
            }

            labels.sort((a, b) => {
                if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
                if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
                return 0;
            });
        }

        return labels;
   }
   
   this.fetchSendAs = async function() {
        const data = await oAuthForEmails.send({
            userEmail: that.getEmail(),
            url: GmailAPI.URL + "settings/sendAs"
        });
        await that.saveSetting("sendAsData", data);
        return data;
   }
   
   this.hasSignature = async function() {
		const sendAsData = await that.getSetting("sendAsData");
		if (sendAsData) {
			return sendAsData.sendAs.some(sendAs => sendAs.signature);
		}
   }
   
   // for auto-detect just ignore, for oauth remove it
   this.remove = async function() {
       if (accountAddingMethod == "autoDetect") {
           await that.saveSetting("ignore", true);
       } else {
           const tokenResponse = await oAuthForEmails.findTokenResponse({ userEmail: that.getEmail() });
           if (tokenResponse) {
               removeCachedAuthToken(tokenResponse.access_token);
           }
           oAuthForEmails.removeTokenResponse({ userEmail: that.getEmail() });

           const foundAccount = accounts.some((account, i) => {
               console.log("account", account.getEmail());
               if (account.getEmail() == that.getEmail()) {
                   console.log("remove:", account);
                   account.stopWatchAlarm();
                   accounts.splice(i, 1);
                   return true;
               }
           });

           if (foundAccount) {
               await serializeAccounts(accounts);
           }
       }
   }
   
}