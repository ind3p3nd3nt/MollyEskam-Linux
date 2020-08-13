// Copyright Jason Savard

console.log('speechRecognition.js: ' + location.href);
// use $( document.activeElement ) instead :focus and others like it to optiimize

var HEADER_AND_MESSAGE_AND_FOOTER_AREA_SELECTOR = ".M9";
var MESSAGE_AND_FOOTER_AREA_SELECTOR = ".iN";
var SUBJECT_FIELD_SELECTOR = ".aoD.az6 input";
var COMPOSE_AREA_SELECTOR = ".Am.Al.editable.LW-avf";
var BOTTOM_AREA_SELECTOR = ".HE"; // Send button, mic etc.
var SEND_BUTTON_SELECTOR = ".T-I.J-J5-Ji.aoO.T-I-atl.L3";

var recognition = new webkitSpeechRecognition();	
recognition.continuous = true;
recognition.interimResults = true;
recognition.maxAlternatives = 7;

var $listeningNode;
var listeningNodeField;
var $newMessageBox;
var $interimNode;
var $talkButton;
var $lastFocusedNode;
var listening;
var listeningNodeBlurredTimer;
var lastSelection;
var lastSelectionBeforeDropDown;
var starts = 0;
var lastResultEvent;
var resultIndexToIgnore;
var speechDialogFadeOutTimer;
var interimWordsSpoken = false;
var lengthOfCurrentNodeBeforeInsertingInterimNode;
var prependText = "";
var appendText = "";
// must set to null because it seems to still exist upon re-injecting js
var $dropdown = null;
var hoveringOverPhrase = false;
var hoveringOverDropDown = false;
var viPhraseEnterTimeout;
var viPhraseLeaveTimeout;
var viDropDownLeaveTimeout;
var lastMousePosition;
var voiceInputSettings;
var lastRecognitionError;
var lastRecognitionErrorCount = 0;

var COMMAND_MESSAGE = "message";
var COMMAND_SEND_EMAIL = "send email";
var COMMAND_ERASE = "erase";
var COMMAND_ERASE_WORD = "erase word";
var COMMAND_ERASE_WORD_ALT1 = "erase work";
var COMMAND_ERASE_WORD_ALT2 = "race word";
var COMMAND_ERASE_ALL = "erase all";
var COMMAND_STOP_RECORDING = "stop recording";
var COMMAND_WHOS_YOUR_DADDY = "who's your daddy";
var voiceInputSuggestions;

jQuery.fn.extend({  
	rehook: function(eventName, handler) {
		return this.each(function() {
			$(this).off(eventName + ".jason").on(eventName + ".jason", handler);
		});
	}
});

String.prototype.startsWith = function(str) {
	return this.indexOf(str) == 0;
};

String.prototype.endsWith = function(suffix) {
	var indexOfSearchStr = this.indexOf(suffix, this.length - suffix.length); 
    return indexOfSearchStr != -1 && indexOfSearchStr == this.length - suffix.length;
};

String.prototype.ltrim = function() {
	return this.replace(/^\s+/,"");
}
String.prototype.rtrim = function() {
	return this.replace(/\s+$/,"");
}

String.prototype.capitalize = function() {
	for (var a=0; a<this.length; a++) {
		if (this.charAt(a) != " ") {
			return this.substring(0, a+1).toUpperCase() + this.slice(a+1);
		}
	}
	return this;
}

String.prototype.endsWith = function(suffix) {
	var indexOfSearchStr = this.indexOf(suffix, this.length - suffix.length); 
    return indexOfSearchStr != -1 && indexOfSearchStr == this.length - suffix.length;
};

String.prototype.sentenceEnd = function() {
	var str = $.trim(this);
	if (str.endsWith("\n") || str.endsWith(".") || str.endsWith("<br>")) {
		return true;
	}
}

String.prototype.replaceWord = function(word, replacementWord) {
	var regex = new RegExp("\\b" + word + "\\b", "g");
	var str = this.replace(regex, replacementWord);
	return str;
}

function isMac() {
	return navigator.userAgent.match("/mac/i") != null;
}

function removeLastWord(text) {
	if (text) {
		var lastSpace = text.lastIndexOf(" ");
		return text.substring(0, lastSpace);
	}
}

function getUrlValue(url, name, unescapeFlag) {
	if (url) {
	    var hash;
	    var hashes = url.slice(url.indexOf('?') + 1).split('&');
	    for(var i=0; i<hashes.length; i++) {
	        hash = hashes[i].split('=');
			if (hash[0] == name) {
				if (unescapeFlag) {
					return decodeURIComponent(hash[1]);
				} else {
					return hash[1];
				}
			}
	    }
	    return null;
	}
}

function removeInterim($node) {
	if (listeningNodeField == "subject") {
		$node.removeClass("interim");
		console.log("setinterim: " + $node.val())
		$node.data("withoutInterim", $node.val());
	} else {
		// compose area
		if ($interimNode) {
			$interimNode.remove();
			$interimNode = null;
		}
	}
}

function initWarningDialog(message) {
	
	// save last focuses because we'll place the focus on the continue button
	saveLastFocusedNode();
	saveLastSelection();
	
	var $nodeToInsertDialogIn = $listeningNode.closest(HEADER_AND_MESSAGE_AND_FOOTER_AREA_SELECTOR);
	var $speechDialog =  $nodeToInsertDialogIn.find(".speechWarningDialog");
	if ($speechDialog.length) {
		$speechDialog.find(".dialogMessage").html(message);
		showWarningDialog($speechDialog);
	} else {
		// took the markup from the error dialog box when clicking send email that has no recipients
		$speechDialog = $("<div class='speechWarningDialog Kj-JD' tabindex=0 style='opacity: 1' role='alertdialog'><div class='Kj-JD-K7 Kj-JD-K7-GIHV4' ><span class='Kj-JD-K7-K0'>" + message + "</span> <a style='font-size:11px' target='_blank' href='https://jasonsavard.com/wiki/Voice_input#Speech_recognition_stopped'>Why?</a></div><!--div class='Kj-JD-Jz'>Please specify at least one recipient.</div--><div class='Kj-JD-Jl'><button data-tooltip='(Enter)' name='ok' class='speechWarningDialogContinue J-at1-auR'>Continue</button> <button data-tooltip='(Esc)' name='cancel' class='speechWarningDialogStop J-at1-auR'>Cancel</button></div></div>");
		
		$speechDialog.find(".speechWarningDialogStop")
			.rehook("click", function() {
				chrome.runtime.sendMessage({command: "chromeTTS", stop:true});
				$speechDialog.hide();
			})
		;
		
		$nodeToInsertDialogIn.append($speechDialog);
		$speechDialog.show();

		// *** need to add tabindex attribute to div or else setting focus doesn't work
		showWarningDialog($speechDialog);
		$speechDialog.find(".speechWarningDialogContinue")
			.rehook("keydown", function(e) {
				console.log(e);
				if (e.key == "Escape") {
					chrome.runtime.sendMessage({command: "chromeTTS", stop:true});
					$speechDialog.hide();
					event.stopPropagation();
					return false;
				} else if (e.key == "Enter" && !e.originalEvent.isComposing) {
					$(this).click();
					event.stopPropagation();
					return false;
				}
			})
			.rehook("click", function() {
				chrome.runtime.sendMessage({command: "chromeTTS", stop:true});
				$speechDialog.hide();
				$talkButton.click();
			})
		;
	}
	
	$speechDialog
		.rehook("mousemove", function() {
			if (!hoveringOverDropDown) {			
				clearTimeout(speechDialogFadeOutTimer);			
			}
		})
		.rehook("mouseenter", function() {
			if (!$speechDialog.hasClass("hoveringOverDropDown")) {
				$speechDialog.stop().css("opacity", 1);
			}
		})
	;

	if (document.hasFocus()) {
		if (hoveringOverDropDown) {			
			delayBeforFadeOut = 500;
			fadeOutDuration = 1000;			
		} else {
			delayBeforFadeOut = 6000;
			fadeOutDuration = 3000;
		}
		speechDialogFadeOutTimer = setTimeout(function() {
			$speechDialog.fadeOut(fadeOutDuration);
		}, delayBeforFadeOut);
	}

}

function showWarningDialog($speechDialog) {
	//$speechDialog.toggleClass("hoveringOverDropDown", hoveringOverDropDown);
	
	console.log("show dialog");
	$speechDialog.show();
	
	if (!hoveringOverDropDown) {
		$speechDialog.find(".speechWarningDialogContinue").focus();
	}
}

function commandEquals(str, command) {
	if (str) {
		if ($.trim(str).toLowerCase() == command) {
			return true;
		}
	}
}

function placeCursorBefore($node) {
	var sel = window.getSelection();
	if (sel.rangeCount) {
		var range = sel.getRangeAt(0);
		range.setStartBefore($node[0]);
		range.collapse(true);
		sel.removeAllRanges();
		sel.addRange(range);
	}
}

function placeCursorAfter($node) {
	var sel = window.getSelection();
	if (sel.rangeCount) {
		var range = sel.getRangeAt(0);
		range.setStartAfter($node[0]);
		range.collapse(true);
		sel.removeAllRanges();
		sel.addRange(range);
	}
}

function cleanPhrases(str) {
	if (voiceInputSettings.voiceInputDialect.includes("en-")) {
		str = str.replaceWord("1", "one");
		str = str.replaceWord("THIS", "this");
	}
	return str;
}

// starts
recognition.onstart = function() {
	console.log("onstart");
};
recognition.onaudiostart = function() {
	console.log("audiostart");
	listening = true;
	
	if (listeningNodeField == "composeArea") {
		// if there's already text in the area than let's append a space
		if ($listeningNode.text() != "") {
			console.log("prepend space");
			prependText = " ";
		}
	} else {
		$listeningNode.data("withoutInterim", $listeningNode.val());
		// if there's already text in the area than let's append a space
		if ($listeningNode.val() != "") {
			prependText = " ";
		}
	}

	// delay because recognition is accepting first words spoken
	$talkButton.addClass("counting");
	$countdown = $talkButton.find(".countdown");
	$countdown.text(3);
	setTimeout(function() {
		$countdown.text(2);
		setTimeout(function() {
			$countdown.text(1);
			setTimeout(function() {
				$talkButton.removeClass("counting");
				$talkButton.addClass("listening");
			}, 100)
		}, 100);
	}, 100);
}
recognition.onsoundstart = function() {
	console.log("soundstart");
}
recognition.onspeechstart = function() {
	console.log("speechstart");
}

// ends
recognition.onspeechend = function() {
	console.log("speechend");
}
recognition.onsoundend = function() {
	console.log("soundend");
}
recognition.onaudioend = function() {
	console.log("audioend");
}
recognition.onend = function() {
	console.log("onend");
	resultIndexToIgnore = -1;
	listening = false;
	interimWordsSpoken = false;
	
	if ($talkButton && $talkButton.length) {
		$talkButton.removeClass("listening");
	}

	// interimittent error (atleast on Mac) apparently just have to retry again and it works
	if (lastRecognitionErrorCount == 0 && lastRecognitionError && lastRecognitionError.error == "audio-capture") {
		console.log("Try again to start recognition")
		lastRecognitionErrorCount++;		
		startRecognition();
	}

};
recognition.onstop = function() {
	console.log("onstop");
};

recognition.onnomatch = function() {
	console.log("onnomatch!");
}

recognition.onerror = function(e) {
	console.log("error", e);
	removeInterim($listeningNode);

	if (e.error == "network" || e.error == "aborted") {
		initWarningDialog("Speech recognition stopped!");
		chrome.runtime.sendMessage({command: "chromeTTS", text:"Speech recognition stopped"}, function(response) {});
	} else if (e.error == "no-speech") {
		initWarningDialog("No speech was detected. <div style='font-size:11px'>You may need to adjust your <a href='https://support.google.com/chrome/bin/answer.py?answer=1407892' target='_blank'>microphone settings</a>.</div>");
		chrome.runtime.sendMessage({command: "chromeTTS", text:"No speech detected"}, function(response) {});
	}
	
	lastRecognitionError = e;
	lastRecognitionErrorCount++;
};


recognition.onresult = function (event) {
	console.log("onresult");
	lastResultEvent = event;
	
	if (!interimWordsSpoken) {
		// get any highlighted words
		var sel = window.getSelection();
		var range;
		if (sel.rangeCount) {		
			range = sel.getRangeAt(0);
			// if selected word
			if (!sel.isCollapsed) {
				var highlightedText = range.startContainer.nodeValue.substring(range.startOffset, range.endOffset);
				console.log("hightext: XX" + highlightedText + "YY");
				if (highlightedText.startsWith(" ")) {
					prependText = " ";
				}
				if (highlightedText.endsWith(" ")) {
					appendText = " ";
				}
			}
		}
	}
	
	interimWordsSpoken = true;
	
	if (event.resultIndex == resultIndexToIgnore) {
		console.log("ignore this result index: " + resultIndexToIgnore);
		interimWordsSpoken = false;
	} else {
		//var $focusedNode = $(document.activeElement);
		var listeningNodeIsInputTag = $listeningNode.length && $listeningNode[0].tagName == "INPUT";
	
		var phrase = "";
		var finalDetected = false;
		
		console.group("onresult");
		console.log("event:", event);
		for (var i = event.resultIndex; i < event.results.length; ++i) {
			console.log("res:", event.results[i]);
			if (event.results[i].isFinal) {
				phrase = event.results[i][0].transcript;
				finalDetected = true;
				console.log("final: " + phrase);
			} else {
				phrase += event.results[i][0].transcript;
			}
		}
		
		phrase = cleanPhrases(phrase);
		
		if (finalDetected) {
			console.log("finalized");
			interimWordsSpoken = false;			
		}
	  
		console.groupEnd();
	
		if (!finalDetected) {
			insertTextAtCursor({$node:$listeningNode, prependText:prependText, appendText:appendText, text:phrase, onResultEvent:event, interimFlag:true});
		}
		
		if (finalDetected && commandEquals(phrase, COMMAND_ERASE)) {
			console.log("erase word only detected")
			if (listeningNodeIsInputTag) {
				$listeningNode.data("withoutInterim", ""); 
				$listeningNode.val("");
			} else {
				console.log("erase");
				var sel = window.getSelection();
				removeInterim($listeningNode);
				
				var $lastPhrase = $(sel.focusNode).closest(".viPhrase")
				// must place cursor "before" and then delete to save correct cursor position
				placeCursorBefore($lastPhrase);
				$lastPhrase.remove();
				//newNode.parentNode.removeChild(newNode);
			}
		} else if (finalDetected && commandEquals(phrase, COMMAND_SEND_EMAIL)) {
			console.log("send email detected");
			stopRecognition();
			$listeningNode.closest(HEADER_AND_MESSAGE_AND_FOOTER_AREA_SELECTOR).find(SEND_BUTTON_SELECTOR).click();
		} else if (finalDetected && commandEquals(phrase, COMMAND_WHOS_YOUR_DADDY)) {
			console.log("daddy");
			removeInterim($listeningNode);
			chrome.runtime.sendMessage({command: "chromeTTS", text:"Jason of course"}, function(response) {});
		} else if (finalDetected && commandEquals(phrase, COMMAND_STOP_RECORDING)) {
			console.log("stop recording detected");
			stopRecognition(true);
		} else if (finalDetected && phrase.endsWith(" " + COMMAND_ERASE) && phrase.length > COMMAND_ERASE.length) {
			console.log("erase word found at end detected")
			removeInterim($listeningNode);
			//resultIndexToIgnore = lastResultEvent.resultIndex;
			// do nothing
		} else if (finalDetected && commandEquals(phrase, COMMAND_ERASE_ALL)) {
			console.log("erase all");
			if (listeningNodeIsInputTag) {
				$listeningNode.data("withoutInterim", "");
				$listeningNode.val( "" );
			} else {
				removeInterim($listeningNode);
				$listeningNode.html("");
			}			
		} else if ((finalDetected && commandEquals(phrase, COMMAND_ERASE_WORD)) || (finalDetected && commandEquals(phrase, COMMAND_ERASE_WORD_ALT1)) || (finalDetected && commandEquals(phrase, COMMAND_ERASE_WORD_ALT2))) {
			if (listeningNodeIsInputTag) {
				$listeningNode.val( removeLastWord($listeningNode.data("withoutInterim")) );
			} else {
				console.log("erase word detected");
				
				var sel = window.getSelection();
				removeInterim($listeningNode);
				var $viPhrase = $(sel.focusNode).closest(".viPhrase");
				$viPhrase.text( removeLastWord($viPhrase.text()) );

				placeCursorAfter($viPhrase);
				
				/*
				var sel = window.getSelection();
				
				// text node
				if (sel.focusNode.nodeType == Node.TEXT_NODE) {
					console.log("in text node");
					// if something before text
					console.log("sel", sel);
					if (sel.focusOffset >= 1) {
						// if nothing before look for parent
						if ($.trim(sel.focusNode.nodeValue.substring(0, sel.focusOffset)) == "") {
							// nothing before so look at previous sibling
							console.log("nothing before so look at previous sibling");
							var previousSibling = sel.focusNode.previousSibling;
							if (previousSibling) {
								console.log("previous sibling")
								previousSibling.nodeValue = removeLastWord(previousSibling.nodeValue);
							}
						} else {
							console.log("in or around node");
							sel.focusNode.nodeValue = removeLastWord(sel.focusNode.nodeValue);
							
							console.log("set cursor to where the word was deleted")
							var range = sel.getRangeAt(0);
							range.setStart(sel.focusNode, sel.focusNode.nodeValue.length);
							range.collapse(true);
							sel.removeAllRanges();
							sel.addRange(range);
						}
					} else {
						// nothing before so look at previous sibling
						var previousSibling = sel.focusNode.previousSibling;
						if (previousSibling) {
							console.log("previous sibling2")
							previousSibling.nodeValue = removeLastWord(previousSibling.nodeValue);
						}
					}
				} else {
					console.log("in or around node");
					sel.focusNode = removeLastWord(sel.focusNode);
				}
				*/
			}			
		} else if (listeningNodeField == "subject" && finalDetected && commandEquals(phrase, COMMAND_MESSAGE)) {
			console.log("message command");
			$listeningNode.val( $listeningNode.data("withoutInterim") );
			// had to call blur before calling focus, because it seems the onfocus event occurs before the blur event when setting it programmatically???
			$listeningNode.blur();
			$listeningNode.closest(HEADER_AND_MESSAGE_AND_FOOTER_AREA_SELECTOR).find(COMPOSE_AREA_SELECTOR).focus();
		} else {
			if (finalDetected && phrase) {
				insertTextAtCursor({$node:$listeningNode, prependText:prependText, appendText:appendText, text:phrase, onResultEvent:event});
			}
		}
		
		if (finalDetected && phrase) {
			// reset this
			prependText = "";
			appendText = "";
		}
	}
}

function startRecognition() {
	chrome.runtime.sendMessage({command: "getVoiceInputSettings"}, function(response) {
		console.log("get settings", response);
		
		voiceInputSuggestions = response.voiceInputSuggestions;
		
		voiceInputSettings = response;
		recognition.lang = response.voiceInputDialect;
		lastRecognitionError = null;
		lastRecognitionErrorCount = 0;
		recognition.start();
	});
}

function stopRecognition(returnToLastFocus) {
	clearTimeout(listeningNodeBlurredTimer);
	recognition.stop();
	removeInterim($listeningNode);

	if (returnToLastFocus) {
		// return focus after probably losing focus from pushing stop button
		// must place focus before setting lastselection (or else it would be default to start of node)
		$listeningNode.focus();
		var sel = window.getSelection(); 
		sel.removeAllRanges();
		sel.addRange(lastSelection);
	}
}

function saveLastFocusedNode() {
	$lastFocusedNode = $(window.getSelection().focusNode);
}

function saveLastSelection() {
	var selection = window.getSelection();
    if (selection.rangeCount) {
        lastSelection = selection.getRangeAt(0);
    	//console.log("save last selection", lastSelection);
    }
}

function attachFocusEvents($node, listeningNodeField) {
	//console.log("attach: " + listeningNodeField + " " + $node.length);
	$node
		.rehook("mousemove", function(e) {
			lastMousePosition = e;
		})
		.rehook("mousedown", function() {
			console.log("listening node mousedown");
			if ($listeningNode) {
				$listeningNode.find(".selected").removeClass("selected");
				if ($dropdown) {
					$dropdown.hide();
				}
			}
		})
		.rehook("focusin", function() {
			console.log(listeningNodeField + " onfocus");
			clearTimeout(listeningNodeBlurredTimer);
			
			// already listening to change this to current listening node
			if (listening) {
				$listeningNode = $(this);
				window.listeningNodeField = listeningNodeField;
			}
		})
		.rehook("focusout", function() {
			console.log(listeningNodeField + " blur");
			listeningNodeBlurredTimer = setTimeout(function() {
				if (listening) {
					console.log("ABORT !!");
					recognition.abort();
				}
			}, 400);
			
			// remove interim/gray
			if (listening) {
				if (listeningNodeField == "subject") {
					// only ignore next results if interim words were spoken before finalized
					if (interimWordsSpoken && lastResultEvent) {
						console.log("set resultIndexToIgnore: " + lastResultEvent.resultIndex);
						resultIndexToIgnore = lastResultEvent.resultIndex;
					}
					removeInterim($node);
				}
			}
		})
	;
	return $node.length;
}

function addTalkButtons() {
	var $messageAndFooterAreas = $(HEADER_AND_MESSAGE_AND_FOOTER_AREA_SELECTOR);
	
	if ($messageAndFooterAreas.length) {
		$messageAndFooterAreas.each(function(index, messageAndFooterArea) {
			
			var $messageAndFooterArea = $(messageAndFooterArea);
			
			var $bottomArea = $messageAndFooterArea.find(BOTTOM_AREA_SELECTOR); // bottom left area
			
			// make sure not already added
			if ($bottomArea.find(".talkButton").length == 0) {
			
				attachFocusEvents($messageAndFooterArea.find(SUBJECT_FIELD_SELECTOR), "subject");
				
				// try once and then retry at intervals again because it seems that in compose popup window the compose area dom takes a while to be created
				var nodeFound = attachFocusEvents($messageAndFooterArea.find(COMPOSE_AREA_SELECTOR), "composeArea");					
				var attachFocusEventsToComposeAreaInterval = setInterval(function() {
					if (nodeFound) {
						clearInterval(attachFocusEventsToComposeAreaInterval);
					} else {
						nodeFound = attachFocusEvents($messageAndFooterArea.find(COMPOSE_AREA_SELECTOR), "composeArea");
					}
				}, 500);
				
				// hook key combos
				$messageAndFooterArea.rehook("keydown", function(e) {
					//console.log("key:", e);
					// key combo: Ctrl+Shift+.(period)
					if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key == ".") {
						saveLastSelection();
						$talkButton.click();
					}
				});
				
				// find Send button
				$messageAndFooterArea.find(".T-I.J-J5-Ji.aoO.T-I-atl.L3").rehook("click", function() {
					stopRecognition();
				});
				
				
				var shortcutText = isMac() ? "⌘-Shift-." : "Ctrl+Shift+.";
				$talkButton = $("<td class='talkButton oc gU'><div data-tooltip='Speech recognition (" + shortcutText + ")' aria-label='Speech recognition'><div class='J-Z-I J-J5-Ji' aria-selected='false' role='button' style='-webkit-user-select: none;'><div class='J-J5-Ji J-Z-I-Kv-H'><div class='J-J5-Ji J-Z-I-J6-H'><div class='countdown'>3</div><div class='dv speechImage'></div></div></div></div></div></td>");
				
				$talkButton
					.rehook("mousemove", function() {
						//console.log("last selection")
						if (listeningNodeField == "composeArea") {
							if ($(document.activeElement).filter(COMPOSE_AREA_SELECTOR).length) {
								saveLastSelection();
							}
						}
					})
					.rehook("mousedown", function() {
						saveLastFocusedNode();
					})
					.rehook("click", function() {
						
						if (listening) {
							stopRecognition(true);
						} else {
							// jason todo remove
							$newMessageBox = $bottomArea.closest(HEADER_AND_MESSAGE_AND_FOOTER_AREA_SELECTOR);
							var $composeArea = $lastFocusedNode.closest(COMPOSE_AREA_SELECTOR);

							clearTimeout(listeningNodeBlurredTimer);
							
							console.log("who had focus:", $lastFocusedNode);
							// if subject field
							if ($lastFocusedNode.filter(SUBJECT_FIELD_SELECTOR).length || $lastFocusedNode.parent().filter(SUBJECT_FIELD_SELECTOR).length) {
								console.log("regain focus to input:", $lastFocusedNode);
								// the input field is actually one descendant down
								$listeningNode = $lastFocusedNode.find("input");
								listeningNodeField = "subject";
							} else if ($composeArea.length) {
								$listeningNode = $composeArea;
								listeningNodeField = "composeArea";
							} else {
								console.log("no input field recognized defaulting...");
								var $subjectField = $newMessageBox.find(SUBJECT_FIELD_SELECTOR);
								
								if ($subjectField.is(":visible")) {
									if ($subjectField.val() == "") { // never intialized so assume we go here
										console.log("to subject:", $listeningNode);
										$listeningNode = $subjectField;
										listeningNodeField = "subject";
									} else { // subject already filled so assume we want to continue in the compose area...
										console.log("subject already filled so focus compose area instead...", $listeningNode);
										$listeningNode = $(this).closest(HEADER_AND_MESSAGE_AND_FOOTER_AREA_SELECTOR).find(COMPOSE_AREA_SELECTOR);
										console.log("listeningnode: ", $listeningNode);
										listeningNodeField = "composeArea";
										lastSelection = null;
									}
								} else {
									console.log("subject not visible so focus compose area");
									$listeningNode = $(this).closest(HEADER_AND_MESSAGE_AND_FOOTER_AREA_SELECTOR).find(COMPOSE_AREA_SELECTOR);
									listeningNodeField = "composeArea";
									lastSelection = null;
								}
							}

							// must do this after attaching onfocus evens
							console.log("set focus");
							$listeningNode.focus();

							if (listeningNodeField == "composeArea") {
								// patch: seems that calling focus() doesn't place the cursor to the last selection spot (unless the user manually placed the cursor vs programmatically placing the cursor)
								// make sure the last selection was within a compose area
								if (lastSelection && $(lastSelection.startContainer).closest(COMPOSE_AREA_SELECTOR).length) {
									console.log("last selection: ", lastSelection);
									window.getSelection().removeAllRanges();
					                window.getSelection().addRange(lastSelection);
								}
							}
							startRecognition();
						}
					})
				;		
				$bottomArea.find(".oc.gU").after($talkButton);
			}
		});
	}
}

function showDropDown($viPhrase, params) {
	
	clearTimeout(viPhraseEnterTimeout);
	
	viPhraseEnterTimeout = setTimeout(function() {

		console.log("show dropdown: " + $viPhrase.text());
		// make sure user hasn't selected or is not selecting any text (because it's annoying to see the dropdowns while doing that)
		if (getSelection().isCollapsed) { //!$viPhrase.hasClass("selected") 
			var selection = window.getSelection();
		    if (selection.rangeCount) {
		    	lastSelectionBeforeDropDown = selection.getRangeAt(0);
		    	//console.log("save selection before dd:", lastSelectionBeforeDropDown)
		    }
		    
			if (!$dropdown || !$dropdown.length) {
				console.log("create dropdown");
				$dropdown = $("<div id='viDropDown'></div>");
				$dropdown.css("font-size", $listeningNode.css("font-size"));
				$dropdown
					.rehook("mouseenter", function() {
						console.log("dropdown enter");
						clearTimeout(viPhraseLeaveTimeout);
					})
					.rehook("mouseleave", function() {
						console.log("dropdown leave");
						hoveringOverDropDown = false;
						viDropDownLeaveTimeout = setTimeout(function() {
							console.log("dropdown timeout");
							var $viPhrase = $dropdown.data("viPhrase");
							if ($viPhrase) {
								$viPhrase.removeClass("selected");
							}
							$dropdown.stop(true, true).hide();												
						}, 20);
					})
					.rehook("mousemove", function() {
						hoveringOverDropDown = true;
					})
				;
			}
			$dropdown.stop(true, true).hide();
			
			var alts = $viPhrase.data("alternatives");
			$dropdown.empty();
			$dropdown.data("viPhrase", $viPhrase);
			if (alts) {
				$.each(alts, function(index, alt) {
					// ignore first one, it should already be the default one
					if (index != 0) {
						var $alt = $("<div class='viDropDownItem'>");
						
						var text = params.prependText + alt.transcript + params.appendText;
						text = cleanPhrases(text);
						if ($viPhrase.data("capitalize")) {
							text = text.capitalize();
						}
						
						$alt.data("text", text);
						$alt.text(text); // .replace(" ", "&nbsp;")
						
						$alt.rehook("mousedown", function(e) {													
							$viPhrase.text($(this).data("text"));
							
							// common code
							$viPhrase.removeClass("selected");
							$dropdown.stop(true, true).hide();												
	
							placeCursorAfter($viPhrase);
	
							return false;
						});
						$dropdown.append($alt);
					}
				});
			}
			var $alt = $("<div class='viDropDownItem erase'>");
			$alt.text("Erase");
			$alt.rehook("mousedown", function() {
				console.log("alt click")
				placeCursorBefore($viPhrase);
				$viPhrase.remove();										
				
				// common code
				$dropdown.stop(true, true).hide();	
				return false;
			});
			$dropdown.append($alt);

			//var $area = $viPhrase.closest(COMPOSE_AREA_SELECTOR);
			var $area = $newMessageBox;
			
			// if has aO9 then we are in the reply area (vs the compose new message area) so place dropdown there because the reply area is smaller
			var inReplyArea;
			if ($area.hasClass("aO9")) {
				inReplyArea = true;
				//$area = $newMessageBox;
				buffer = 30;
			} else {
				//buffer = 10;
				buffer = 30;
			}
			
			$area.append($dropdown);										
			var ddHeight = $dropdown.height();
			$dropdown.stop(true, true).hide();
			
			console.log("compose height: ", $area.height() + " " + ddHeight);
			console.log("offset:", $viPhrase.offset())
			console.log("position:", $viPhrase.position())
			console.log("rects:", $viPhrase[0].getClientRects());
			
			// place the dropdown below selected phrase
			var MARGIN_LEFT_WIDTH = 2;
			var top;
			if ($viPhrase[0].getClientRects().length == 1) { // 1 box = not wrapped so place it just at the bottom of this text
				top = $viPhrase[0].getClientRects()[0].bottom;
				left = $viPhrase[0].getClientRects()[0].left;
			} else { // 2+ means it is wrapped so place it "before" the last rectangle
				//top = $viPhrase[0].getClientRects()[$viPhrase[0].getClientRects().length-2].bottom;
				top = lastMousePosition.clientY + 7; // + $viPhrase[0].getClientRects()[0].height;
				left = lastMousePosition.clientX - ($dropdown.width() / 2);
				
				// if off screen to right
				if (left+$dropdown.width() > $(document).width()) {
					left = $(document).width() - $dropdown.width() - 10;
				}
				// if off screen to left
				if (left < 0) {
					left = 10;
				}
			}
			console.log("mouseY: " + lastMousePosition.clientY);
			console.log("top", top);
			
			var offsetTop;
			if ($viPhrase.offset().top < $(document).height() - ddHeight - buffer) {
				$dropdown.slideDown();
				//offsetTop = top + $viPhrase.height()
			} else {
				$dropdown.show();
				top -= ddHeight;
			}
			
			$dropdown.offset({top:top, left:left - MARGIN_LEFT_WIDTH});
			
			/*
			if (inReplyArea) {
				if ($viPhrase.offset().top < $(document).height() - ddHeight - buffer) {
					$dropdown.slideDown();
					offsetTop = $viPhrase.offset().top + $viPhrase.height()
				} else {
					$dropdown.show();
					offsetTop = $viPhrase.offset().top - ddHeight;
				}
			} else { // new message area
				if ($viPhrase.position().top < $area.height() - ddHeight - buffer) {
					$dropdown.slideDown();
					offsetTop = $viPhrase.offset().top + $viPhrase.height();
				} else {
					$dropdown.show();
					offsetTop = $viPhrase.offset().top - ddHeight;
				}
			}
			//$dropdown.offset({top:offsetTop, left:$viPhrase.offset().left});
			$dropdown.offset({top:offsetTop, left:$viPhrase[0].getClientRects()[0].left});
			*/
		}
	
	}, 100);
}

function shouldCapitalize(range, text) {
	// detect if should capitalize
	// if focued node is the contented editable than it's probably empty so let's capitalize
	var capitalize = false;
	
	// Sep. 28, 2016 - I was getting capitization (again) after pauses - weird cause I had just fixed this much earlier in time in v19.2.4 on May 13
	if (false) { // range.startContainer.hasAttribute && range.startContainer.hasAttribute("contenteditable")
		capitalize = true;
		console.log("capitalize: " + text);
	} else if (range.startContainer.nodeType == Node.TEXT_NODE) {
		if (range.startOffset <= 1) {
			if (range.startContainer.previousSibling == null) {
				console.log("range:", range);
				capitalize = true;
				console.log("capitalize2: " + text);
			} else {
				if (range.startContainer.previousSibling.nodeType == Node.TEXT_NODE) {
					if (range.startContainer.previousSibling.nodeValue.sentenceEnd()) {
						console.log("range:", range);
						capitalize = true;
						console.log("capitalize4: " + text);
					} else {
						console.log("nocap2");
					}
				} else if (range.startContainer.previousSibling.innerText.sentenceEnd()) {
					console.log("range:", range);
					capitalize = true;
					console.log("capitalize6: " + text);							
				} else {
					console.log("nocap3");
				}
			}
		} else if (range.startContainer.nodeValue.substring(0, range.startOffset).sentenceEnd()) {
			console.log("range:", range);
			capitalize = true;
			console.log("capitalize5: " + text);
		} else {
			console.log("nocap21", range)
			console.log("nocap21" + text);
		}
	} else { // DOM node				
		var previousNode;
		var $previousPhrase = $(range.startContainer).find(".viPhrase").last();
		if ($previousPhrase.length) {
			previousNode = $previousPhrase[0];
		} else {
			// might be old code, it was always returning null and so it was capitalizing words when pausing refer to https://jasonsavard.com/forum/discussion/comment/9884#Comment_9884
			previousNode = range.startContainer.previousSibling;
		}
		
		if (previousNode == null) {
			capitalize = true;
			console.log("capitalize3: " + text);
		} else if (previousNode.nodeType == Node.TEXT_NODE) {
			if (previousNode.nodeValue.sentenceEnd()) {
				capitalize = true;
				console.log("capitalize7: " + text);
			} else {
				console.log("range:", range);
				console.log("nocap5");
			}
		} else {
			if (previousNode.innerText == "" || previousNode.innerHTML.sentenceEnd()) {
				capitalize = true;
				console.log("capitalize8: " + text);
			} else {
				console.log("html: " + previousNode.innerHTML);
				console.log("text: " + previousNode.innerText);
				console.log("range:", range);
				console.log("nocap4");
			}
		}
	}
	return capitalize;
}

function insertTextAtCursor(params) {
	
	var sel = window.getSelection();
	var range;
	if (sel.rangeCount) {
		range = sel.getRangeAt(0);
	}
	
	var text = params.prependText + params.text + params.appendText;
	var $node = params.$node;
	var node = $node[0];
	if (node && node.tagName == "INPUT") {
		console.log("flag: " + params.interimFlag + " _ " + text);
		if (text && params.interimFlag) {
			$node.addClass("interim");
			var withoutInterim = $node.data("withoutInterim");
			console.log("write input:" + withoutInterim);
			
			var oldtext = withoutInterim;
			var curposS = node.selectionStart;
			var curposF = node.selectionEnd;
			if (oldtext) {
				pretext = oldtext.substring(0,curposS);
				posttest = oldtext.substring(curposF,oldtext.length);
			} else {
				pretext = "";
				posttest = "";
			}
			console.log("pretext: " + pretext + "_old tex: "+ posttest);
			node.value = ((pretext + text).ltrim()).capitalize() + posttest;
			node.selectionStart=curposS+text.length;
			node.selectionEnd=curposS+text.length;
		} else if (!params.interimFlag) {
			removeInterim($node);
		}
	} else {
		if (sel.rangeCount) {
			
			range.deleteContents();

			if ($interimNode && $interimNode.data("capitalize")) {
				text = text.capitalize();
			}

			//if (text.includes("\n")) {
				//text = text.replace(/\n/g, "<br>");
			//}
			
			if (params.interimFlag) {
				console.log("interim", $interimNode);
				if ($interimNode) {
					$interimNode.text(text);
				} else {
					// save spot to see if we inserted interim text in the middle of a text node
					//lengthOfCurrentNodeBeforeInsertingInterimNode = sel.focusNode.length; 
					
					$interimNode = $("<span class='viPhrase interimText'/>");
					
					//console.log("selfocusnode: ", sel.focusNode);
					
					var capitalize = shouldCapitalize(range, text);
					if (capitalize) {
						text = text.capitalize();
						$interimNode.data("capitalize", capitalize);
					}
					
					$interimNode.text(text);

					if ($.trim($interimNode[0].innerHTML) == "") {
						console.log("empty span", $interimNode);
					} else {
						// patch: length of current text still the same as before interting any interim node - so assume we are at the end of a node and want to insert another span after the current
						//console.log("focus: " + sel.focusOffset + "_" + sel.focusNode.length)
						if (sel.focusNode.nodeType == Node.TEXT_NODE && sel.focusOffset == sel.focusNode.length) {
							console.log("at end so parent.after")
							console.log("sel", sel.focusNode.nodeType + " "+ sel.focusOffset + " len: "+ sel.focusNode.length);						
							
							var $parent = $(sel.focusNode).parent();
							// make sure the parent is not the compose area
							if ($parent.filter(COMPOSE_AREA_SELECTOR).length) {
								console.log("in compose")
								$(sel.focusNode).after($interimNode);
							} else if ($parent[0].tagName == "DIV") { // this happens without starting mic and we enter text on several lines and contenteditable area wraps lines with DIVs
								console.log("in div")
								range.insertNode( $interimNode[0] );
							} else {
								console.log("insert after")
								$parent.after($interimNode);
							}
						} else {
							range.insertNode( $interimNode[0] );
						}
						
						if (params.onResultEvent && voiceInputSuggestions) {
							$interimNode
								.rehook("mouseenter", function() {
									$(this).data("mouseEntered", true);
									console.log("phrase enter: " + $(this).text())
									hoveringOverPhrase = true;
									clearTimeout(viDropDownLeaveTimeout);
									
									var alreadySelected = $(this).hasClass("selected");
									if (!$(this).hasClass("selected") && getSelection().isCollapsed) {
									    $(this).closest(COMPOSE_AREA_SELECTOR).find(".selected").removeClass("selected");
									    $(this).addClass("selected");
									}
									if (!alreadySelected && !$(this).hasClass("interimText")) {
										showDropDown($(this), params);
									}
									
								})
								.rehook("mousemove", function() {
									console.log("phrase move")
									if ((!$dropdown || (!$dropdown.is(":visible")) && $(this).hasClass("selected"))) {
										if (!$(this).hasClass("interimText")) {
											showDropDown($(this), params);
										}
									}
								})
								.rehook("mouseleave", function() {
									$(this).removeData("mouseEntered");
									clearTimeout(viPhraseEnterTimeout);
									clearTimeout(viPhraseLeaveTimeout);
									
									hoveringOverPhrase = false;
									var $viPhrase = $(this);
									console.log("phrase leave: ", $viPhrase.text());
									
									viPhraseLeaveTimeout = setTimeout(function() {
										console.log("phrase leavetimeout: " + $viPhrase.text());
										$viPhrase.removeClass("selected");
										
										if ($dropdown) {
											$dropdown.hide();
											
											if (!hoveringOverPhrase) {
												//$dropdown.stop(true, true).slideUp();
												$dropdown.hide();
											}
										}
									}, 20);
								})
							;
						}
					}
				}

				range.collapse(true);
				sel.removeAllRanges();
				sel.addRange(range);

			} else {
				console.log("final insert: " + text);

				$interimNode.empty();
				var textNodes = text.split("\n");
				textNodes.forEach((textNode, index) => {
					$interimNode.append(textNode);
					if (index+1 < textNodes.length) {
						$interimNode.append("<br>");
					}
				});
				//$interimNode.text(text);
				placeCursorAfter($interimNode);
				$interimNode.removeClass("interimText");
				if (params.onResultEvent) {
					$interimNode.data("alternatives", params.onResultEvent.results[params.onResultEvent.resultIndex]);
				}
				
				// if already hovering over than popup out the dropdown
				if ($interimNode.data("mouseEntered")) {
					$interimNode.mousemove();
				}
				
				$interimNode = null;
				
				//removeInterim();
			}
		}
	}
}

$(document).ready(function() {
	
	$(window).blur(function() {
		//console.log("window blur: " + new Date());
		// cancel the abort because we want user to be able to keeping talking from another window!
		clearTimeout(listeningNodeBlurredTimer);
	});

	$(window).focus(function() {
		//console.log("window focus: " + new Date());
	});

	setInterval(function() {
		addTalkButtons();
	}, 1000);
	
});