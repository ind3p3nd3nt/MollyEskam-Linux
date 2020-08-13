/**
 * @author Dev
 */
$(document).ready(function() {
	var currentPage = '';
	google.load("feeds", "1");
	rssfeedsetup();
	// //applySlide();
	//  Set up initial extension window
	$(".stg").hide();
	resetView()
	//$("#stg_general").show();
	
	/*  Obtaining variables from manifest.json */
	chrome.manifest = (function() {
		var manifestObject = false;
		var xhr = new XMLHttpRequest();

		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				manifestObject = JSON.parse(xhr.responseText);
			}
		};
		xhr.open("GET", chrome.extension.getURL('/manifest.json'), false);

		try {
			xhr.send();
		} catch(e) {
			console.log('Couldn\'t load manifest.json');
		}
		return manifestObject;
	})();
	$("#extName").text(chrome.manifest.name.replace("CRM Science - ",""));
	$("#extVersion").text('v'+chrome.manifest.version);
	
	
	//  Tooltip Styling
	$( document ).tooltip({
      position: {
        my: "right bottom-20",
        at: "right top",
        using: function( position, feedback ) {
          $( this ).css( position );
          $( "<div>" )
            .addClass( "arrow" )
            .addClass( feedback.vertical )
            .addClass( feedback.horizontal )
            .appendTo( this );
        }
      }
    });
	
	//  Handle the toggling of settings divs upon the setting dropdown changing
	$("#settings").change(function() {
		if($(this).val() == 'Profile - Objects'){
			$(".stg").hide();
			$("#stg_profile_object").show();
		}
		else if($(this).val() == 'Profile - Fields'){
			$(".stg").hide();
			$("#stg_profile_field").show();
		}
		else if($(this).val() == 'Profile - Apps & Tabs'){
			$(".stg").hide();
			$("#stg_profile_apptabs").show();
		}
		else if($(this).val() == 'General'){
			$(".stg").hide();
			$("#stg_general").show();
		}
		else if($(this).val() == 'Permission Sets'){
			$(".stg").hide();
			$("#stg_permissiion_set").show();
		}
	});

///////////////////////////////////////////////////
//  General Settings
///////////////////////////////////////////////////	
	
	//  2013.11.09 - Known Issue - Not Persistent 
	$('#chatToggle').click (function () {
      	window.close();
      	chrome.tabs.executeScript(null,
      		{code:"$('#presence_widget').toggle();"});
	});
    
    //  2013.11.09
    $('#deleteSelected').click (function () {
      	window.close();
      	chrome.tabs.executeScript(null,
      		{code:"deleteSelected()"});
	});
    
    
    //  2013.11.09 - Show max # of results per page where "show more" is at the bottom  
    $("#More_Per_Page").click(function() {
		window.close();
		chrome.tabs.executeScript(null,
    		//{code: "window.location = window.location + '&entityType='+ $('select#entityType').val() +'&rowsperpage=99999'"}	
    		{code: "var newURL = document.URL; if (newURL.indexOf('&rowsperpage' != -1)) newURL = document.URL.replace(/&rowsperpage=[0-9]*/,''); newURL += '&rowsperpage=99998'; window.location = newURL;"}
    	);
		
	});  
	
	//  Take user to Apex Test History page
	$('#Test_View').click (function () {
      	window.close();
      	chrome.tabs.executeScript(null,
      		{code:"window.location='/ui/setup/apex/ApexTestQueuePage'"});
	});
	
	//  Clear History then take user to Test History page
	$('#Test_Clear').click(function() {
	    chrome.tabs.executeScript(null,
	    {code:"if(window.confirm('Are you sure?')) {window.location='/07M?retURL=%2F07M&ClearAllData=1'}"});
	});

	//  Toggle Profle - App Visibility
	$("#vis_apps").click(function() {
		if($(this).is(':checked')){
			chrome.tabs.executeScript(null,
    			{code: "appVisibility(true);"}	
    		);
		}
		else{
			chrome.tabs.executeScript(null,
    			{code: "appVisibility(false);"}	
    		);
		}
	});     	

	//  Take user to Apex Test History page
	$('#QL_Users').click (function () {
      	window.close();
      	chrome.tabs.executeScript(null,
      		{code:"window.location='/005'"});
	});
	$('#QL_Profiles').click (function () {
      	window.close();
      	chrome.tabs.executeScript(null,
      		{code:"window.location='/setup/ui/profilelist.jsp'"});
	});
	$('#QL_PermissionSets').click (function () {
      	window.close();
      	chrome.tabs.executeScript(null,
      		{code:"window.location='/0PS'"});
	});
	$('#QL_Objects').click (function () {
      	window.close();
      	chrome.tabs.executeScript(null,
      		{code:"window.location='/p/setup/custent/CustomObjectsPage'"});
	});
	
	//  Toggle Profile - Tab Visibility
	$("#vis_tabs").change(function() {
		if ($(this).val() != "-- Select --"){
			chrome.tabs.executeScript(null,
    			{code: "tabVisibility("+$(this).val()+");"}	
    		);
		}
	}); 
	
	// Toggle object level permissions
	$("input.objPerm,input.fieldPerm").click (function () {
      	if ($(this).attr("id") == 'crudCol'){
      		$("input.crudPerm").prop('checked',$(this).is(':checked'));
      	}
      	else if ($(this).attr("id") == 'marvarCol'){
      		$("input.vmPerm").prop('checked',$(this).is(':checked'));
      	}
      	chrome.tabs.executeScript(null,
      		{code: "togglePerms('"+$(this).attr("id")+ "'," + $(this).is(':checked')     + ");"}
      	);
	});
	
	$("span.stg_header").click(function(){
		$("#help_"+$(this).attr("id")).toggle("fast");
		$(this).toggleClass("active");
		return false;
	});
	$("span.stg_header_close").click(function(){
		$("#help"+$(this).attr("id").substring(5)).hide("fast");
		return false;
	});
	
	 $("img.help").hover(
     	function () {
        	$(this).fadeIn('fast', function(){
            $(this).attr("src", 'images/Cloud_On.png');
        });
      }, 
      function () {
        $(this).fadeIn('fast', function(){
            $(this).attr("src", 'images/Cloud_Off.png');
        });
      }
    );
	 function resetView(){
		 chrome.tabs.getSelected(null, function(tab) {
			 determineStg(tab.url);
		 });
	 }
	 function determineStg(tablink) {
		 $(".stg").hide();
		 console.log(tablink);
		 var s = tablink;
		 if((s.indexOf("salesforce.com/00e") !== -1 && s.indexOf("/e?retURL=") !== -1)){
			 $("#stg_profile_apptabs").show();
			 $("#settings").val("Profile - Apps & Tabs");
			 //currentPage = 'soql';
		 }
		 else if((s.indexOf("salesforce.com/00e") !== -1 && s.indexOf("/e?s=ObjectsAndTabs") !== -1)){
			 $("#stg_profile_objTabs2_0").show();
			 $("#settings").val("Profile - Fields");
		 }
		 else if(s.indexOf("salesforce.com/setup/layout/flsedit.jsp") !== -1){
			 $("#stg_profile_field").show();
			 $("#settings").val("Profile - Fields");
		 }
		 else{
			 $("#stg_general").show();
			 $("#settings").val("General");
			 //currentPage = 'script';
		 }
		 //loadTable();
	 }
});

