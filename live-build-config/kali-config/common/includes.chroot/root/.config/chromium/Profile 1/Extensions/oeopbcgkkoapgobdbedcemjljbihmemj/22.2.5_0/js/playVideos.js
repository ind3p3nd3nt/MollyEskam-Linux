console.log("playVideos.js");

var PROCESSED_ATTRIBUTE = "jprocessed";

setInterval(function() {
	
	var videoAttachments = document.querySelectorAll(".hq span[download_url^='video/']");
	// using forEach to encapsulate the loop in a function (note we had to use [].forEach.call because videoAttachments is a NodeList and not an array
	[].forEach.call(videoAttachments, function(videoAttachment) {
		if (!videoAttachment.getAttribute(PROCESSED_ATTRIBUTE)) {
			videoAttachment.setAttribute(PROCESSED_ATTRIBUTE, "true");

			var downloadUrl = videoAttachment.getAttribute("download_url")
			if (downloadUrl) {
				var videoSrc = downloadUrl.match(/https.*/);
				if (videoSrc && videoSrc.length) {
					var videoAttachmentAnchor = videoAttachment.querySelector(".aQy.aZL.e:not(.aZI)"); // Exclude videos with .aZI class (those are Google Drive shared files and they already can play)
					if (videoAttachmentAnchor) {
						
						var videoThumbnail = document.createElement('video');
						videoThumbnail.setAttribute("preload", "metadata");
						videoThumbnail.setAttribute("style", "object-fit:cover;width:100%;height:100%");
						videoThumbnail.src = videoSrc;
						videoAttachmentAnchor.appendChild(videoThumbnail);
						
						var foregroundDiv = videoAttachmentAnchor.querySelector("* > div");
						if (foregroundDiv) {
							foregroundDiv.setAttribute("style", "opacity:0.6");
						}
						
						var videoIcon = videoAttachmentAnchor.querySelector(".aYw.aZA");
						if (videoIcon) {
							videoIcon.setAttribute("style", "background-position: -170px -88px; width:48px;height:48px");
						}
						
						videoAttachmentAnchor.addEventListener("click", function(e) {
							var video = document.createElement('video');
							video.setAttribute("controls", "");
							video.setAttribute("autoplay", "true");
							video.style = "max-height:460px";
							video.src = videoSrc;
							video.addEventListener("click", function(e) {
								if (video.paused == false) {
									video.pause();
								} else {
									video.play();
								}
								e.stopPropagation();
							});
							
							var outerDiv = document.createElement("div");
							outerDiv.style = "position: absolute;z-index:10;left:0;top:0;height:100%;width:100%;align-items: center;justify-content: center;display: flex;background-color:rgba(0,0,0,0.8)";
							outerDiv.addEventListener("click", function(e) {
								outerDiv.remove();
							});
							outerDiv.appendChild(video);
							document.body.appendChild(outerDiv);
							
							e.stopPropagation();
						});
					}
				}
			}
		}
	});
	
}, 1000);