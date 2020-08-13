chrome.extension.sendRequest({}, function(response) {});

function appVisibility(setting){
	//  Old UI
	$("input[id^=tabSet_visible___	]").each(function(){
		$(this).prop('checked',setting);
	});
	//  New UI
	$("input[id$=app_visible]").each(function(){
		$(this).prop('checked',setting);
	});
}

function tabVisibility(setting){
	$("select[id^=tab__]").each(function(){
		$(this).val(setting);
	});
}

function togglePerms(field,setting){
	//  Toggle entire group of settings
	if (field == 'crudCol' || field == 'marvarCol'){
		$("."+field).children().each(function() {
			$(this).prop('checked',setting);
		});
	}
	//  Toggle individual settings
	else{
		$("input[id^=" + field +"]").each(function(){
			$(this).prop('checked',setting);
		});
	}
	if (field == 'display') {
		$("input[id$=fls_read_ck]").each(function(){
			$(this).prop('checked',setting);
		});
	}
	else if (field == 'edit') {
		$("input[id$=fls_edit_ck]").each(function(){
			$(this).prop('checked',setting);
		});
	}
	else if (field == 'crud20') {
		$("input[id$=olp_check]").each(function(){
			$(this).prop('checked',setting);
		});
	}
}

//  On Tab "Views" - this method gives Users the ability to mass delete selected items
function deleteSelected(){
	//  Create an array of the selected IDs
	var ids = [];
	$("input.checkbox").each( function(){
		if ($(this).prop('checked'))
			ids.push($(this).val());
	});
	
	//  If IDs are selected continue
	if (ids.length > 0){
		//  Prepare the selected IDs as a string for use in soql
		var selectedIDs=''; 
		for (var i=0;i < ids.length; i++)
			selectedIDs+="'"+ids[i]+"',";
		selectedIDs=selectedIDs.substring(0,selectedIDs.length - 1);
		
		//  Get the User's session Id
		sforce.connection.sessionId = readCookie("sid");
		var describeGlobalResult =  sforce.connection.describeGlobal();
		var objects = describeGlobalResult.sobjects;

		//  Determine the object based off of a selection
		var objPrefix = ids[0].substring(0,3);
		var obj;
		for (i = 0; i < objects.length; i++) 
			if (objects[i].keyPrefix == objPrefix) {
				obj = objects[i].name;
				break;
			}
		
		//  Retrieve selected records
		var soql = "select id from " + obj + " where ID in (" +selectedIDs + ")";
		var result = sforce.connection.query(soql);
		records = result.getArray("records");
		
		//  Delete selected records, prompting for confirmation first
		if (records.length > 0 ) {
			//  May be possible to return less than selected results from a stale page (other users deleted)
			var x;
			if (records.length == ids.length)
				x=window.confirm("Are you sure you want to delete " + records.length + " " + obj + " records?");
			else
				x=window.confirm("Only " + records.length + " of " + ids.length + ' selected ' + obj + " records were found.  Continue deleting?");	
			//  If user confirms - do delete
			if (x){
				sforce.connection.deleteIds(ids);
				//  Attempt record delete - store results in delResults; not currently processing them
				var delResult = sforce.connection.deleteIds(ids); 
				//  Reload the page
				window.location = document.URL;
			}
		}
		else
			alert('Delete Error:  Selected records do not exist!');
	}
	//  If no records are selected, alert the user and quit
	else
		alert("Delete Error:  Must select at least 1 record!");
}

function retrieveObject(prefix){

}

function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

function getURLParam(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.href);
    if (results == null)
        return "";
    else
        return results[1];
}
function openBlog(url1){
	chrome.browserAction.onClicked.addListener(function(activeTab)
{
    var newURL = url1;
    chrome.tabs.create({ url: newURL });
    
});
}
function permSet(setting){
	$("input[id*='objects']").each(function(){
		$(this).prop('checked',setting);
	});
}

$(document).ready(function() {
	
});