const userAgent = `Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1`;
// use iphone, on android seemore doesn't work

const navigatorWrapper = {
  platform: "Android",
  userAgent: userAgent
};

const urlFont = chrome.extension.getURL(
  "fonts/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2"
);

const mobileCss = `
<style media="screen">
    ::-webkit-scrollbar {
        width: 8px;
    }

    ::-webkit-scrollbar-thumb {
        background-color: #e1e1e1;
    }

    ::-webkit-scrollbar-track {
        background: transparent;
        border-left: 1px solid #dedede;
    }

    #story-open {
        display: block;
        position: fixed;
        top: 70px;
        left: 10px;
    }
    
    #story-download {
        display: block;
        position: fixed;
        top: 106px;
        left: 10px;
    }
    
    a.desc-photo {
        position: absolute;
        color: white !important;
        font-size: 20px;
        margin: 5px;
        border-radius: 4px;
        opacity: 0;
        top: 0;
        background:#7441A3;
        width: 28px;
        height: 28px;
        padding-top: 2px;
        padding-left: 4px;
        left: 4px;
    }
    
    a.desc-download-photo {
        top: 36px;
    }
    
    .desc-photo-ready:hover a.desc-photo {
        opacity: 0.8;
        z-index: 100 !important;
    }
    
    .desc-photo-ready:hover a.desc-photo:hover {
        opacity: 1;
    }

    @font-face {
        font-family: 'Material Icons';
        font-style: normal;
        font-weight: 400;
        src: url('${urlFont}') format('woff');
    }

    .material-icons {
        font-family: 'Material Icons';
        font-weight: normal;
        font-style: normal;
        font-size: 24px;
        line-height: 1;
        letter-spacing: normal;
        text-transform: none;
        display: inline-block;
        white-space: nowrap;
        word-wrap: normal;
        direction: ltr;
        -webkit-font-feature-settings: 'liga';
        -webkit-font-smoothing: antialiased;
    }

    
    /* show scroll for story navbar show scroll for story navbar */
    .ku8Bn {
        height: 104px;
    }
    
    .qf6s4 {
        height: 105px;
    }
    
    .zGtbP {
        padding: 10px 0 0;
    }

    .qf6s4::-webkit-scrollbar {
        min-width: 30px;
        height: 8px;
    }
</style>
`;

let firstTimeFixSuccess = false;
const mainXpath = "/html[1]/body[1]/span[1]/section[1]/main[1]";
const addXpath = "/div[1]/div[1]/article[*]/div[1]/div[1]/div[1]";
const headerXPath =
  mainXpath + "/section[1]/div[1]/div[1]/div[1]/article[*]/header[1]/div[2]";
const topicData = mainXpath + "/section[1]/div[1]" + addXpath;
const photoSaved = mainXpath + addXpath;
const photoFeed = mainXpath + "/div[1]/div[3 or 4]" + addXpath;
const firstPostHeader =
  mainXpath + "/section[1]/div[1]/div[1]/div[1]/article[1]/header[1]";
const instaStories =
  "/html/body//div[1]/section/div/div/section/div[1]/div/div/div/img";
const additionalVideos =
  mainXpath + "/section[1]/div[1]/div[1]/article[*]/div[1]/div[1]/div[1]";
const mainNavbarXpath = "/html[1]/body[1]/span[1]/section[1]";
const topNavbarXpath = "/html[1]/body[1]/span[1]/section[1]/nav[1]";
const bottomNavbarXpath = "/html[1]/body[1]/span[1]/section[1]/nav[2]";

chrome.runtime.sendMessage("isInstaHelperEnabled", msg => {
  if (msg && msg.isInstaHelperEnabled) {
    function createScriptTag() {
      let scriptTag = document.createElement("script");
      scriptTag.innerText = Object.keys(navigatorWrapper)
        .map(
          key =>
            `Object.defineProperty(window.navigator, '${key}', { get: function(){ return '${navigatorWrapper[key]}'; } });`
        )
        .join("");

      scriptTag.type = "text/javascript";
      return scriptTag;
    }

    document.addEventListener(
      "beforeload",
      function() {
        Object.keys(navigatorWrapper).forEach(key => {
          Object.defineProperty(window.navigator, key, {
            get: function() {
              return navigatorWrapper[key];
            }
          });
        });
      },
      true
    );

    $(() => {
      if ($("body").length) {
        $("body").append(mobileCss);
      }
    });

    function verifyInstaReadyClass() {
      $('div[img-ready="_ready"]').each(function() {
        let div = $(this);
        if (!div.hasClass("desc-photo-ready")) {
          div.addClass("desc-photo-ready");
        }
      });
    }

    function fixPostHeaderLine() {
      let header = $(_xpth(firstPostHeader));
      if (header.attr("header-fixed") != "_fixed") {
        header.css("background", "white").attr("header-fixed", "_fixed");
      }
    }

    function fixNavbarStyle() {
      let topNavbar = _xpth(topNavbarXpath);
      let bottomNavbar = _xpth(bottomNavbarXpath);
      $(topNavbar).css("z-index", "101");
      $(bottomNavbar).css("z-index", "101");
    }

    function attachsBtns() {
      let arrayImage = getImageFromTagged();
      let elems4 = _xpth(instaStories);

      for (let i = 0; i < elems4.length; i++) {
        elems4[i].isStory = true;
      }

      let allElementArray = [].concat(arrayImage).concat(elems4);

      allElementArray.forEach(elem => {
        let elems = [];

        if (elem.isStory === true) {
          let e = elem.parentNode;
          e.isStory = true;
          elems = [e];
        } else {
          let postImages = $(elem)
            .closest("article")
            .find('div[role*="button"]');
          if (postImages.length > 0) {
            postImages.splice(0, 1);
          }
          elems = postImages;
        }

        for (let i = 0; i < elems.length; i++) {
          let elem = $(elems[i]);
          initBtns(elem);
        }
      });
    }

    function initBtns(elem) {
      if (elem.attr("img-ready") != "_ready") {
        elem
          .attr("img-ready", "_ready")
          .addClass("desc-photo-ready")
          .append(
            $(`
                            <a ${
                              elem[0].isStory ? 'id="story-open"' : ""
                            } href="#" data-type="open" target='_blank'
                            class="desc-photo ${
                              elem[0].isStory ? "story" : ""
                            }">
                                <i class="material-icons">
                                    launch
                                </i>
                            </a>
                            <a ${
                              elem[0].isStory ? 'id="story-download"' : ""
                            } href="#" data-type="download"
                            class="desc-photo desc-download-photo ${
                              elem[0].isStory ? "story" : ""
                            }">
                                <i class="material-icons">
                                    cloud_download
                                </i>
                            </a>
                        `)
          );
      }
    }

    function getImageFromTagged() {
      let array = [];
      array.push(
        ...$(document)
          .find("article")
          .find("img")
          .toArray()
      );

      _removeFromArray(
        array,
        $(document)
          .find("article")
          .find('img[alt*="profile picture"]')
          .toArray()
      );

      _removeFromArray(
        array,
        $(document)
          .find("article")
          .find("img.ignore")
          .toArray()
      );

      _removeFromArray(
        array,
        $(document)
          .find("article")
          .find("header")
          .find("img")
          .toArray()
      );

      _removeFromArray(
        array,
        $(document)
          .find("article")
          .find("header")
          .find("img")
          .toArray()
      );

      _removeFromArray(
        array,
        $(document)
          .find("article")
          .find('img[src*="static/images"]')
          .toArray()
      );

      return array;
    }

    function _removeFromArray(arr, needToRemove) {
      needToRemove.forEach(a => {
        let index = arr.findIndex(x => x == a);
        if (index != -1) {
          arr.splice(index, 1);
        }
      });

      return arr;
    }

    $(document).on("click", ".desc-photo", function(e) {
      e.preventDefault();
      chrome.runtime.sendMessage("download", response => {
        if (response.download === true) {
          let elements = $(this)
            .parent()
            .find("div");
          let number = 0;
          let photoWidth = $(this)
            .parent()
            .closest("body")
            .width();
          elements.each(function() {
            let style = window.getComputedStyle(this);
            let transform = style.getPropertyValue("transform");
            if (transform != "none") {
              let numbers = Math.abs(+transform.split(",")[4]);
              number = numbers > 1 ? numbers / photoWidth : 0;
              return false;
            }
          });

          let type = $(this).data("type");

          //let elementsLi = $(this).parent().find("li");
          let url = null;
          let itIsVideo = false;


          //check: on this is video
          let video = $(this.parentNode.parentNode).find('video')[0];
          if (video){

            if (video.src && video.src.length > 0){
              url = video.src
            } else if (video.currentSrc && video.currentSrc.length > 0){
              url = video.currentSrc
            }

            itIsVideo = true;
          }

          let photo = null;
          if (itIsVideo === false){
            photo = $(this.parentNode).find("img").attr("src");
            url = photo;
          }



          if (type === "open") window.open(url, "_blank").focus();
          else if (type === "download") {
            let name = url.split("?")[0].split("/").pop();

            if (itIsVideo) downloadVideo(url, name);
            else downloadPhoto(url, name);
          }

          /*if (!url)
            url = $(this)
              .parent()
              .find("img")
              .attr("src");*/
          
          /*if (video.length == 0 && !url)
            video = $(this)
              .parent()
              .find("video");*/

          

          /*if (video) {
            let src = video.attr("src");
            if (src) {
              url = src;
              itIsVideo = true;
            } else {
              try {
                let children = video.children();
                if (children.length > 0) {
                  url = $(children[0]).attr("src");
                  itIsVideo = true;
                }
              } catch (error) {
                console.log(error);
              }
            }
          }*/

         
        }
      });
    });

    function _xpth(STR_XPATH) {
      let xresult = document.evaluate(
        STR_XPATH,
        document,
        null,
        XPathResult.ANY_TYPE,
        null
      );
      let xnodes = [];
      let xres;
      while ((xres = xresult.iterateNext())) {
        xnodes.push(xres);
      }

      return xnodes;
    }

    function downloadPhoto(url, name) {
      let src = `${url}${url.indexOf("?") === -1 ? "?" : "&"}_t=${Date.now()}`;
      let img = new Image();

      img.setAttribute("crossOrigin", "anonymous");
      img.onload = function() {
        let _canv =
          $("#desc-photo-canvas").length > 0
            ? $("#desc-photo-canvas")[0]
            : $(
                '<canvas id="desc-photo-canvas" style="display:none" />'
              ).appendTo("body")[0];
        let { width, height } = this;
        _canv.setAttribute("width", width);
        _canv.setAttribute("height", height);
        _canv.getContext("2d").drawImage(img, 0, 0);
        _canv.toBlob(blob => window.saveAs(blob, name, width, height));
      };
      img.src = src;
    }

    function downloadVideo(url, name) {
      let xhr = new XMLHttpRequest();
      xhr.overrideMimeType("application/octet-stream");
      xhr.open("GET", url, true);
      xhr.responseType = "arraybuffer";
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
          let res = xhr.response;
          if (res) {
            let byteArray = new Uint8Array(res);

            let blob = new Blob([byteArray.buffer]);
            window.saveAs(blob, name);
            delete blob;
          }
        }
      };
      xhr.send(null);
    }

    setInterval(attachsBtns, 900);
    setInterval(verifyInstaReadyClass, 700);
    setInterval(fixPostHeaderLine, 500);
    setInterval(fixNavbarStyle, 600);

    document.documentElement.insertBefore(
      createScriptTag(),
      document.documentElement.firstChild
    );
  }
});
