// Copyright Jason Savard

class Mail {
    constructor() {
        var that = this;
        this.allFiles = [];
        this.queueFile = function (messageId, file) {
            var queuedFile = { filename: file.filename, size: file.body.size };
            queuedFile.fetchPromise = that.account.fetchAttachment({ messageId: messageId, attachmentId: file.body.attachmentId, size: file.body.size });
            that.allFiles.push(queuedFile);
            return queuedFile;
        };
        this.getName = function (parsedAddress) {
            var name;
            var email;
            // if message is passed used the 
            if (parsedAddress) {
                name = parsedAddress.name;
                email = parsedAddress.email;
            }
            else {
                name = that.authorName;
                email = that.authorMail;
            }
            if (name == null || name.length < 1) {
                if (email) {
                    name = email.split("@")[0];
                }
                else {
                    name = email;
                }
                return name;
            }
            else {
                if (name) {
                    return name.trim();
                }
            }
        };
        this.getShortName = function () {
            var name = that.getName();
            if (name) {
                name = name.split(" ")[0];
            }
            return name;
        };
        this.getDate = function () {
            return that.issued.displayDate({ relativeDays: true });
        };
        this.open = function (params = {}) {
            params.mail = that;
            that.account._openMailInBrowser(params);
        };
        this.getUrl = function () {
            return that.account.getMailUrl({ mail: that, useGmailUI: true });
        };
        this.markAsRead = function (params = {}) {
            const executeMailActionParams = shallowClone(params);
            executeMailActionParams.mail = that;
            executeMailActionParams.action = MailAction.MARK_AS_READ;
            return that.account.executeMailAction(executeMailActionParams);
        };
        this.markAsUnread = function () {
            return that.account.executeMailAction({ mail: that, action: MailAction.MARK_AS_UNREAD });
        };
        this.deleteEmail = async (params = {}) => {
            // must clone it because i stuck in a loop below because params was modified in .markAsRead and it in turn modified executeMailActionParams later
            const executeMailActionParams = shallowClone(params);
            executeMailActionParams.mail = that;
            executeMailActionParams.action = MailAction.DELETE;
            if (await storage.get("deletingMarksAsRead")) {
                await that.markAsRead(params);
                // 2 scenarios: instantlyUpdatedCount was already executed before this method was called or markasread above should have updated the count so let's not update it again with the that.account.executeMailAction
                executeMailActionParams.instantlyUpdatedCount = true;
            }
            return that.account.executeMailAction(executeMailActionParams);
        };
        this.archive = async (params = {}) => {
            const executeMailActionParams = shallowClone(params);
            executeMailActionParams.mail = that;
            executeMailActionParams.action = MailAction.ARCHIVE;
            if (await storage.get("archive_read")) {
                await that.markAsRead(params);
                // 2 scenarios: instantlyUpdatedCount was already executed before this method was called or markasread above should have updated the count so let's note update it again with the executeMailAction
                executeMailActionParams.instantlyUpdatedCount = true;
            }
            return that.account.executeMailAction(executeMailActionParams);
        };
        this.markAsSpam = (params = {}) => {
            const executeMailActionParams = shallowClone(params);
            executeMailActionParams.mail = that;
            executeMailActionParams.action = MailAction.MARK_AS_SPAM;
            return that.account.executeMailAction(executeMailActionParams);
        };
        this.moveLabel = async (params) => {
            console.log("move label", that.labels);
            if (that.labels.length) {
                // find "possibly" inbox label: archive it first and then label it										   
                let emailMightBeInInbox = that.labels.some(label => {
                    console.log("label: ", label);
                    if (isSystemLabel(label)) { // possibly inbox email
                        console.log("system label: ", label);
                        return true;
                    }
                });

                if (emailMightBeInInbox) {
                    await that.archive();
                } else if (that.labels.length == 1) { // if only 1 label (and not possibly in inbox) then remove it and apply new label
                    await that.removeLabel(that.labels.first());
                }
            } else {
                const error = "no labels for email";
                logError(error);
                throw error;
            }
            return that.applyLabel(params.newLabel);
        };
        this.untrash = function (params = {}) {
            console.log("untrash");
            const executeMailActionParams = shallowClone(params);
            executeMailActionParams.mail = that;
            executeMailActionParams.action = MailAction.UNTRASH;
            return that.account.executeMailAction(executeMailActionParams);
        };
        this.applyLabel = function (label) {
            const mail = that;
            if (mail.account.getAccountAddingMethod() == "oauth") {
                label = getGmailAPILabelId(label);
            }
            return that.account.executeMailAction({ mail: mail, action: MailAction.APPLY_LABEL, label: label });
        };
        this.removeLabel = function (label) {
            console.log("remove label");
            return that.account.executeMailAction({ mail: that, action: MailAction.REMOVE_LABEL, label: label });
        };
        this.star = async function () {
            const executeMailActionParams = {};
            executeMailActionParams.mail = that;
            executeMailActionParams.action = MailAction.STAR;
            if (await storage.get("starringAppliesInboxLabel") && that.account.getAccountAddingMethod() == "oauth" && !await that.hasLabel(SYSTEM_INBOX)) {
                await that.applyLabel(SYSTEM_INBOX);
                // 2 scenarios: instantlyUpdatedCount was already executed before this method was called or markasread above should have updated the count so let's note update it again with the executeMailAction
                executeMailActionParams.instantlyUpdatedCount = true;
            }
            return that.account.executeMailAction(executeMailActionParams);
        };
        this.removeStar = function () {
            return that.account.executeMailAction({ mail: that, action: MailAction.REMOVE_STAR });
        };
        this.starAndArchive = async () => {
            await that.star();
            return that.archive();
        };
        this.postReply = async function (params) {
            if (params.markAsRead) {
                that.account.executeMailAction({ mail: that, action: MailAction.MARK_AS_READ });
            }
            return that.account.executeMailAction({ mail: that, action: MailAction.REPLY, message: params.message, replyAllFlag: params.replyAllFlag });
        };
        this.generateReplyObject = async function (params = {}) {
            var replyObj = { replyAction: true };
            var quotedContent;
            console.log("generatereplyobj:", that);
            let lastMessage = that.messages.last();
            if (lastMessage) { // added the check for that.messages because of this bug when using manual add https://jasonsavard.com/forum/discussion/4476/uncaught-typeerror-cannot-read-property-alreadyrepliedto-of-undefined-js-mailaccount-js-3988
                // user might be doing a 2nd immediate reply so use the previous/original message to build the reply
                if (lastMessage.alreadyRepliedTo && that.messages.length >= 2) {
                    lastMessage = that.messages[that.messages.length - 2];
                }
                if (that.deliveredTo && that.deliveredTo.length) {
                    replyObj.from = {};
                    replyObj.from = addressparser(that.deliveredTo.last()).first();
                    // let's override the alias if it's same email as manually added then let's use the alias, else assume it's a different "send mail as"
                    if (that.account.getEmail() == replyObj.from.email) {
                        var profileInfo = await that.account.getSetting("profileInfo");
                        if (profileInfo && profileInfo.displayName) {
                            replyObj.from.name = profileInfo.displayName;
                        }
                    }
                    else {
                        // let's try to use the name/email from the sender's to field
                        function findMatchingAddress(ary, email) {
                            for (var a = 0; ary && a < ary.length; a++) {
                                if (ary[a].email == email) {
                                    return ary[a];
                                }
                            }
                        }
                        var matchingAddress = findMatchingAddress(lastMessage.to, replyObj.from.email);
                        if (!matchingAddress) {
                            matchingAddress = findMatchingAddress(lastMessage.cc, replyObj.from.email);
                        }
                        if (!matchingAddress) {
                            matchingAddress = findMatchingAddress(lastMessage.bcc, replyObj.from.email);
                        }
                        if (matchingAddress) {
                            replyObj.from.name = matchingAddress.name;
                        }
                    }
                }
                // always use the name from the from field, but will try to identify the email from either the reply-to or the from field
                var fromObj = { name: lastMessage.from.name, email: lastMessage.from.email };
                // if alternate reply-to email then override the from email
                if (that.replyTo) {
                    //fromObj.email = that.replyTo;
                    fromObj = addressparser(that.replyTo).first();
                }
                replyObj.tos = [fromObj];
                // save replyall object for possible use later when choosing reply or reply all
                replyObj.replyAll = {};
                replyObj.replyAll.tos = replyObj.tos.concat(removeSelf(lastMessage.to));
                replyObj.replyAll.ccs = removeSelf(lastMessage.cc);
                function removeSelf(ary) {
                    if (ary) {
                        // must clone it
                        ary = ary.concat();
                        for (var a = 0; a < ary.length; a++) {
                            if (ary[a].email == that.account.getEmail()) {
                                ary.splice(a, 1);
                                break;
                            }
                        }
                    }
                    else {
                        ary = [];
                    }
                    return ary;
                }
                console.log("replyallobj:", replyObj.replyAll);
                if (params.replyAllFlag) {
                    replyObj.tos = replyObj.replyAll.tos;
                    replyObj.ccs = replyObj.replyAll.ccs;
                }
                // used to group replies by converstion in Gmail etc.
                var inReplyTo = lastMessage["message-id"];
                if (inReplyTo) {
                    replyObj.inReplyTo = inReplyTo;
                }
                quotedContent = lastMessage.content;
            }
            else {
                var toObj = {};
                toObj.email = that.authorMail;
                toObj.name = that.getName();
                replyObj.tos = [toObj];
                quotedContent = that.summary;
            }
            if (params.type == "text") {
                // text
                var subject = that.title;
                if (subject) {
                    subject = subject.htmlToText();
                }
                else {
                    subject = "";
                }
                subject = (subject.search(/^Re: /i) > -1) ? subject : "Re: " + subject; // Add 'Re: ' if not already there
                replyObj.subject = subject;
                // warning: $.trim removes \r\n (and this trim was is used in the .summarize
                replyObj.message = "\r\n\r\n" + that.issued.toString() + " <" + that.authorMail + ">:\r\n" + that.getLastMessageText().htmlToText().summarize(600); // summarize body because or else we get a 414 or 413 too long url parameters etc.;
            }
            else {
                // html
                replyObj.subject = that.title;
                replyObj.message = "";
                if (params.message) {
                    replyObj.message += params.message;
                }
                replyObj.message += "<blockquote type='cite' style='border-left:1px solid #ccc;margin-top:20px;margin-bottom:10px;margin-left:50px;padding-left:9px'>" + quotedContent + "</blockquote>";
            }
            return replyObj;
        };
        this.reply = async function () {
            const replyObject = await that.generateReplyObject({ type: "text" });
            console.log("reply:", replyObject);
            that.account.openCompose(replyObject);
            if (await storage.get("replyingMarksAsRead")) {
                that.markAsRead();
            }
        };
        this.getThread = async function (params = {}) {
            let mail = that;
            // for auto-detect - if already fetched thread/messages
            // for oauth - should have aleady been fetched so just return it
            const hasMessages = mail.messages.length;
            if (hasMessages || mail.account.getAccountAddingMethod() == "oauth") {
                if (!hasMessages) {
                    const message = {
                        id: mail.threadId
                    }
                    const mailObjects = await mail.account.getMailObjectsForMessageIds([message]);
                    mail = mailObjects.first();
                }
            } else {
                // refresh thread
                console.log("getThread: " + mail.title);

                // th opens all thread msg only the last message i think,  dsqt=1 expand the text and removes quoted hidden text ... [Texte des messages précédents masqué]
                let data;
                try {
                    data = await fetchText(mail.account.getMailUrl({ useStandardGmailUrl: true, urlParams: "ui=2&view=pt&search=all&th=" + mail.id }))
                } catch (error) {
                    throw error;
                }

                // patch 101 to not load any images because apparently $("<img src='abc.gif'");  will load the image even if not displayed
                if (!params.forceDisplayImages) {
                    // just remove img altogether
                    if (data) {
                        data = data.replace(/<img /g, "<imghidden ");
                        data = data.replace(/\/img>/g, "/imghidden>");
                    }
                }
                // need to add wrapper so that this jquery call workes "> table" ???
                // patch for error "Code generation from strings disallowed for this context"
                // the error would occur if I use jQuery's .append but not!!! if I initially set the content with $()
                // now using safe parseHtmlToJQuery
                const responseWrapper = parseHtml(data);
                const tables = Array.from(responseWrapper.querySelectorAll(".maincontent .message"));
                if (tables.length && tables.forEach) {
                    tables.forEach(messageNode => {
                        const message = {};
                        message.to = [];
                        message.cc = [];
                        message.bcc = [];
                        // get from via by parsing this string:  John Poon <blah@hotmail.com>
                        const fromNode = messageNode.querySelector("tr").querySelector("td");
                        if (fromNode) {
                            message.from = addressparser(fromNode.textContent).first();
                        } else {
                            console.warn("Couldn't parse from node");
                        }
                        // get date from first line ex. Chloe De Smet Allègre via LinkedIn <member@linkedin.com>	 Sun, Jan 8, 2012 at 12:14 PM
                        const tds = messageNode.querySelector("tr").querySelectorAll("td");
                        if (tds.length) {
                            message.dateStr = tds[tds.length - 1].textContent.trim();
                            if (message.dateStr) {
                                message.date = parseGoogleDate(message.dateStr); // "Thu, Mar 8, 2012 at 12:58 AM";
                            }
                        }
                        // get to/CC
                        var divs = messageNode.querySelectorAll("tr")[1].querySelectorAll("td div");
                        divs.forEach((emailNode, i) => {
                            // if 2 divs the first line is usually the reply-to line so ignore it
                            if (i == 0 && divs.length >= 2 && !divs[1].textContent.toLowerCase().includes("cc:")) {
                                return;
                            }
                            // remove to:, cc: etc...
                            var emails = emailNode.textContent;
                            emails = emails.replace(/.*:/, "");
                            if (emailNode.textContent.toLowerCase().includes("bcc:")) {
                                message.bcc = addressparser(emails);
                            }
                            else if (emailNode.textContent.toLowerCase().includes("to:")) {
                                message.to = addressparser(emails);
                            }
                            else if (emailNode.textContent.toLowerCase().includes("cc:")) {
                                message.cc = addressparser(emails);
                            }
                            else {
                                // could not detect to or cc, could be in another language like chinese "收件者："
                                message.to = addressparser(emails);
                            }
                        });
                        var gmailPrintContent = messageNode.querySelector("tbody > tr:last-child table td");
                        // remove some styling
                        if (gmailPrintContent) {
                            gmailPrintContent.querySelector("div").removeAttribute("style");
                            gmailPrintContent.querySelector("font").removeAttribute("size");
                            message.content = gmailPrintContent.innerHTML;
                            message.textContent = convertGmailPrintHtmlToText(gmailPrintContent);
                            // cut the summary to lines before the [Quoted text hidden] (in any language)
                            var quotedTextHiddenArray = ["Quoted text hidden", "Texte des messages précédents masqué"];
                            for (var a = 0; a < quotedTextHiddenArray.length; a++) {
                                var idx = message.textContent.indexOf("[" + quotedTextHiddenArray[a] + "]");
                                if (idx != -1) {
                                    message.textContent = message.textContent.substring(0, idx);
                                    break;
                                }
                            }
                        }

                        message.textContent = mail.account.filterEmailBody({
                            subject: mail.title,
                            body: message.textContent
                        });
                        message.textContent = html_sanitize(message.textContent);
                        mail.messages.push(message);
                    });
                } else {
                    const message = {};
                    console.warn("Could not parse body from print page: ", responseWrapper);
                    message.from = { name: mail.getName(), email: mail.authorMail };
                    message.content = responseWrapper.innerHTML;
                    // remove script tags to bypass content_security_policy
                    message.content = message.content.replaceAll("<script", "<div style='display:none'");
                    message.content = message.content.replaceAll("</script>", "</div>");
                    message.textContent = convertGmailPrintHtmlToText(responseWrapper);
                    message.textContent = html_sanitize(mail.textContent);
                    mail.messages.push(message);
                }
            }

            return mail;
        };
        this.getMessageById = function (id) {
            for (var a = 0; a < that.messages.length; a++) {
                if (that.messages[a].id == id) {
                    return that.messages[a];
                }
            }
        };
        this.removeMessageById = function (id) {
            for (var a = 0; a < that.messages.length; a++) {
                if (that.messages[a].id == id) {
                    that.messages.splice(a, 1);
                    return true;
                }
            }
        };
        // params... {maxSummaryLetters:170, htmlToText:true, EOM_Message:" [" + getMessage("EOM") + "]"}
        this.getLastMessageText = function (params = {}) {
            var appendEOM;
            var lastMessageText;
            // if we are getting the summary from whole message than we can use the EOM, else if we use the brief summary from the atom feed we don't know for sure if it's cut off etc.
            if (that.messages.length) {
                lastMessageText = that.messages.last().textContent;
                if (lastMessageText) {
                    if (params.htmlToText) {
                        lastMessageText = lastMessageText.htmlToText();
                    }
                    if (params.maxSummaryLetters) {
                        if (params.targetNode) {
                            // append EOM to node at the end only
                            if (that.account.showEOM && params.EOM_Message && lastMessageText.length <= params.maxSummaryLetters) {
                                appendEOM = true;
                            }
                            lastMessageText = lastMessageText.summarize(params.maxSummaryLetters);
                        }
                        else {
                            lastMessageText = lastMessageText.summarize(params.maxSummaryLetters, that.account.showEOM ? params.EOM_Message : null);
                        }
                    }
                }
            }
            // can happen when could not parse body from print page
            if (!lastMessageText) {
                lastMessageText = that.summary;
                if (lastMessageText) {
                    if (params.htmlToText) {
                        lastMessageText = lastMessageText.htmlToText();
                    }
                    if (lastMessageText && params.maxSummaryLetters) {
                        // seems like ... doesn't always exist in atom feed? so cant be sure there more text
                        lastMessageText = lastMessageText.summarize(params.maxSummaryLetters);
                    }
                }
            }
            if (!lastMessageText) {
                lastMessageText = "";
            }
            if (params.targetNode) {
                params.targetNode.text(lastMessageText);
                if (appendEOM) {
                    params.targetNode.append(params.EOM_Message);
                }
                return params.targetNode;
            }
            else {
                return lastMessageText;
            }
        };
        this.hasAttachments = function () {
            if (that.messages.length) {
                if (that.account.getAccountAddingMethod() == "oauth") {
                    if (that.messages.last().files && that.messages.last().files.length) {
                        return true;
                    }
                }
                else { // auto-detect
                    // ISSUE, see we don't preload content of email in auto-detect we can't detect attachments, and might not want to preload for optimization
                }
            }
        };
        this.removeFromArray = function () {
            for (var a = 0; a < mailArray.length; a++) {
                if (that.id == mailArray[a].id) {
                    mailArray.splice(a, 1);
                    break;
                }
            }
        };
        this.sortMessages = function () {
            that.messages.sort(function (message1, message2) {
                var date1 = message1.date;
                var date2 = message2.date;
                if (date1.getTime() == date2.getTime()) {
                    return 0;
                }
                else {
                    return date1.getTime() < date2.getTime() ? -1 : 1;
                }
            });
        };
        this.generateAuthorsNode = function ($) {
            var $node = $("<span/>");
            if (that.account.getAccountAddingMethod() == "autoDetect") {
                const useMessages = that.messages.length;
                const entry = parseXML(that.entryXML);
                const contributors = entry.querySelectorAll("contributor");
                if (contributors.length) {
                    // the feed does not put the original author as first contributor if they have replied in the thread (ie. last author) so make sure they're first if so
                    var name = "someone";
                    var nextContributorIndex = 0;
                    if (useMessages) {
                        const lastContributor = contributors[contributors.length - 1];
                        if (that.messages.first().from.email == lastContributor.querySelector("email").textContent) {
                            //console.log("last contr is valid original author: " + that.messages.first().from.email);
                            name = lastContributor.querySelector("name").textContent.split(" ")[0];
                            nextContributorIndex = 0;
                        }
                        else {
                            name = that.getName(that.messages.first().from).getFirstName();
                            nextContributorIndex = 1;
                        }
                    }
                    else {
                        name = contributors[0].querySelector("name").textContent.getFirstName();
                    }
                    $node.append(name);
                    // if more conversations than contributors (happens when several exchanges are done from the original author)
                    if (useMessages && that.messages.length > contributors.length + 1) {
                        $node.append(" .. ");
                    }
                    else {
                        if (useMessages) {
                            if (contributors.length == 2) {
                                $node.append(", ", $("<span>").text(contributors[nextContributorIndex].querySelector("name").textContent.split(" ")[0]));
                            }
                            else if (contributors.length >= 3) {
                                $node.append(" .. ", $("<span>").text(contributors[0].querySelector("name").textContent.split(" ")[0]));
                            }
                            $node.append(", ");
                        }
                        else {
                            if (contributors.length == 2) {
                                $node.append(", ");
                            }
                            else {
                                $node.append(" .. ");
                            }
                        }
                    }
                    $node.append($("<span class='unread'>").text(that.getShortName()));
                    if (useMessages) {
                        $node.append(" (" + (that.messages.length) + ")");
                    }
                }
                else {
                    $node
                        .text(that.getName())
                        .addClass("unread")
                        .attr("title", that.authorMail);
                }
            }
            else {
                // using <= because seems .messages might have been zero length
                if (that.messages.length <= 1) {
                    $node
                        .text(that.getName())
                        .addClass("unread")
                        .attr("title", that.authorMail);
                }
                else {
                    var separator;
                    if (that.messages.length == 2) {
                        separator = ", ";
                    }
                    else {
                        separator = " .. ";
                    }
                    var firstSender;
                    var lastSender;
                    try {
                        firstSender = that.getName(that.messages.first().from).getFirstName();
                        lastSender = that.getName(that.messages.last().from).getFirstName();
                        $node.append($("<span class='unread'>").text(firstSender), separator, $("<span class='unread'>").text(lastSender));
                    }
                    catch (e) {
                        $node.append($("<span class='unread'>").text(that.getName()));
                        console.warn("problem parsing author name: " + e);
                    }
                    $node.append(" (" + (that.messages.length) + ")");
                }
            }
            return $node;
        };
        // pass in system_ label
        this.hasLabel = async function (labelId) {
            for (var a = 0; a < that.labels.length; a++) {
                if (getJSystemLabelId(that.labels[a], that.account.getAccountAddingMethod()) == labelId) {
                    return true;
                }
            }
        };
        this.getDisplayLabels = function (excludeInbox) {
            var labels = [];
            that.labels.forEach(function (labelId) {
                var labelObj = { id: labelId };
                var systemLabelId = getJSystemLabelId(labelId);
                if (systemLabelId == SYSTEM_INBOX) {
                    if (excludeInbox) {
                        return;
                    }
                    else {
                        labelObj.name = getMessage("inbox");
                    }
                }
                else if (systemLabelId == SYSTEM_PRIMARY || systemLabelId == SYSTEM_ALL_MAIL || systemLabelId == SYSTEM_IMPORTANT || systemLabelId == SYSTEM_IMPORTANT_IN_INBOX || systemLabelId == SYSTEM_STARRED) {
                    // don't add this, continue loop
                    return;
                }
                else if (systemLabelId == SYSTEM_PURCHASES) {
                    labelObj.name = getMessage("purchases");
                }
                else if (systemLabelId == SYSTEM_FINANCE) {
                    labelObj.name = getMessage("finance");
                }
                else if (systemLabelId == SYSTEM_SOCIAL) {
                    labelObj.name = getMessage("social");
                }
                else if (systemLabelId == SYSTEM_PROMOTIONS) {
                    labelObj.name = getMessage("promotions");
                }
                else if (systemLabelId == SYSTEM_UPDATES) {
                    labelObj.name = getMessage("updates");
                }
                else if (systemLabelId == SYSTEM_FORUMS) {
                    labelObj.name = getMessage("forums");
                }
                else if (labelId == GmailAPI.labels.SENT || labelId == GmailAPI.labels.UNREAD || labelId == GmailAPI.labels.IMPORTANT) {
                    // Note using labeId here instead of systemLabelId
                    // don't add this, continue loop
                    return;
                }
                else {
                    labelObj.name = that.account.getLabelName(labelId);
                }
                labelObj.color = that.account.getLabelColor(labelId);
                labels.push(labelObj);
            });
            labels.sort(function (a, b) {
                if (a.name && b.name) {
                    if (a.name.toLowerCase() < b.name.toLowerCase())
                        return -1;
                    if (a.name.toLowerCase() > b.name.toLowerCase())
                        return 1;
                }
                return 0;
            });
            return labels;
        };
    }
}
;