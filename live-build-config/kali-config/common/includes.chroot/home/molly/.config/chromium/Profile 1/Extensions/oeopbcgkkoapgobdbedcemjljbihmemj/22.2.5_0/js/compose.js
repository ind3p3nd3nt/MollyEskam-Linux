initUI();

$(document).ready(function() {
	$("#reply").click(function() {
		location.href = localStorage["_composeUrl"];
	});

	$("#replyAll").click(function() {
		location.href = localStorage["_composeUrlReplyAll"];
	});
});