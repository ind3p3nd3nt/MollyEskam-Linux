google.load("feeds", "1");

var feedcontainer=document.getElementById("feed")
var feedurl="http://feeds.feedburner.com/CrmScience"
var feedlimit=5
var rssoutput="<ul id=\"blogSlide\">"


function rssfeedsetup(){
	/*
	var feedpointer=new google.feeds.Feed(feedurl)
	feedpointer.setNumEntries(feedlimit) 
	feedpointer.load(displayfeed) 
	applySlide();
	*/
}
function displayfeed(result){"a href"
	if (!result.error){
		var thefeeds=result.feed.entries
		for (var i=0; i<thefeeds.length; i++){
			//rssoutput+="<li><a href='" + thefeeds[i].link + " target=\"_parent\"'>" + thefeeds[i].title + " - " + thefeeds[i].contentSnippet +"</a></li>"
			rssoutput+="<li><a href='" + thefeeds[i].link + "' target=\"_parent\"'>" + thefeeds[i].title + " - " + thefeeds[i].contentSnippet +"</a></li>"
			//rssoutput+="<li><a onClick='openBlog(" + thefeeds[i].link + ");' target=\"_parent\"'>" + thefeeds[i].title + " - " + thefeeds[i].contentSnippet +"</a></li>"
			
		}
		rssoutput+="</ul>"
		
		feedcontainer.innerHTML=rssoutput
		
	}
	else
		alert("Error fetching feeds!")
}

function applySlide(){
	setTimeout( function(){ 
    $('#blogSlide').list_ticker({
		speed:6000,
		effect:'slide'
	});
  }
 , 300 );
}

$(document).ready(function(){
	//rssfeedsetup();
	
})

