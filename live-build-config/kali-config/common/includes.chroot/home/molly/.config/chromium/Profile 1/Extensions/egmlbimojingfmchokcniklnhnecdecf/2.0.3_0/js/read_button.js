(function () {
    chrome.runtime.sendMessage({action: "getUid"}, function (response) {
    });
})();

function matching_brackets(data, open_bracket, close_bracket) {
    var open_brackets = 0;
    for (var i = 0; i < data.length; i++) {
        if (data[i] == open_bracket) {
            open_brackets++;
        } else if (data[i] == close_bracket) {
            open_brackets--;
        }
        if (open_brackets == 0) {
            return data.slice(0, i + 1);
        }
    }
}

function isAGroupConversation(urlEnd) {
    return (urlEnd.match(/^conversation-/) != null);
}

function getFullConversationURL(url) {
    return "https://www.facebook.com/messages/" + url.split(/\//).pop();
}

function getParticipantIdFromVanity(vanity, participants) {
    var length = participants.length;
    for (var i = 0; i < length; i++) {
        if (participants[i].vanity == vanity) {
            return participants[i].fbid;
        }
    }
}

function onConversationLinkAdded(chtWindow, addButtonToChatWindow) {
    var intervalId = setInterval(function () {
        var conversationLink = $(chtWindow).parents('.fbNubFlyoutInner').find(".titlebarLabel").find("a").get(0);
        if (conversationLink != undefined) {
            clearInterval(intervalId);
            addButtonToChatWindow(chtWindow, getFullConversationURL(conversationLink.href));
        }
    }, 100);
}

function getPartnerIdForNoneGroupChat(urlEnd, participants) {
    return urlEnd.match(/^[0-9]*$/) != null ? urlEnd : getParticipantIdFromVanity(urlEnd, participants);
}

function getConversationDataObject(convesationPageHtml) {
    var exp = /bigPipe\.onPageletArrive\((.*threads:(.*))\)/m;
    exp.exec(convesationPageHtml);
    return RJSON.parse(matching_brackets(RegExp.$1, "{", "}").replace(/\\[xX][0-9a-fA-F]+/g, ""));
}

function getPartnerId(conversationUrl, allParticipants) {
    var urlEnd = conversationUrl.split(/\//).pop();
    return isAGroupConversation(urlEnd) ? urlEnd.replace(/^conversation-/, "") : getPartnerIdForNoneGroupChat(urlEnd, allParticipants);
}

function getReadUrl(partnerId, threads) {
    var readUrl = 'https://m.facebook.com/messages/read/?tid=';
    for (var i = 0; i < threads.length; i++) {
        if (partnerId == threads[i].thread_fbid) {
            return readUrl + threads[i].thread_id;
        }
    }
}

function addButtonToChatWindow(chtWindow, conversationUrl) {
    var chtWindowFooter = $(chtWindow).parents(".fbNubFlyout").find(".fbNubFlyoutFooter");
    if (chtWindowFooter.find('.mark_as_read').length > 0) {
        return
    }
    $.ajax({
        type: 'GET',
        url: conversationUrl
    }).done(function (response) {
        if (chtWindowFooter.find('.mark_as_read').length > 0) {
            return
        }
        chtWindowFooter.prepend('<div class="mark_as_read">Mark as read</div>');
        var conversationData = getConversationDataObject(response),
            threads = conversationData.jsmods.instances[1][2][1].threads,
            allParticipants = conversationData.jsmods.instances[1][2][1].participants,
            partnerId = getPartnerId(conversationUrl, allParticipants),
            readUrl = getReadUrl(partnerId, threads);
        chtWindowFooter.find('.mark_as_read').click(function () {
            chrome.runtime.sendMessage({action: 'trackMarkAsRead'});
            var button = $(this);
            button.addClass('inactive');
            setTimeout(function () {
                $.ajax({
                    type: 'GET',
                    url: readUrl
                });
                button.removeClass('inactive');
            }, 1000);
        });
    });
}

function add_read_buttons() {
    $('.vBot').each(function () {
        onConversationLinkAdded(this, addButtonToChatWindow);
    });
}

$(document).ready(function () {
    chrome.runtime.sendMessage({action: 'getSettings'}, function (settings) {
        if (settings.show_mark_as_read) {
            $('#ChatTabsPagelet').bind('DOMNodeInserted', function () {
                add_read_buttons();
            });
            add_read_buttons();
        }
    })
});


