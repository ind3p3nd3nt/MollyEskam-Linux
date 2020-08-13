(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

var pageUrl = removeOrigin();
pageUrl = obscureEmails(pageUrl);

ga('create', 'UA-18469762-21', 'auto');
ga('set', 'checkProtocolTask', function(){/* just do not throw sth. here */}); // patch from extensions - http://stackoverflow.com/questions/16135000/how-do-you-integrate-universal-analytics-in-to-chrome-extensions
ga('set', 'page', pageUrl);

const inPopupPage = pageUrl && pageUrl.includes("popup.");

//analytics gave me a quota of 10M hits/month - so I had to reduce pageview hits by removing them for background.html and other pages
if (!window.inBackground && !inPopupPage) {
	ga('send', 'pageview'); // patch analytics doesn't accept chrome-extension:// in pageview so filter it out
}