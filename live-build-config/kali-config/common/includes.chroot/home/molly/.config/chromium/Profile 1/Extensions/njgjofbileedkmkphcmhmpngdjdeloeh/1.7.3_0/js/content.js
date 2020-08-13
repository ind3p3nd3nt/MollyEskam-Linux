class Content {
    constructor() {
        const a = document.documentElement.classList.contains("mobile_mode");
        if (a && "/tv/upload/" !== location.pathname) {
            this.storage = {
                darkTheme: false
            };
            this.headSelector = ".b5itu";
            this.leftHeadSelector = ".mXkkY.HOQT4";
            this.rightHeadSelector = ".mXkkY.KDuQp";
            this.initHandlers();
            this.initStorage();
            this.renderBtns();
            setInterval(function () {
                this.renderBtns()
            }.bind(this), 100);
            setInterval(function () {
                this.search()
            }.bind(this), 1000);
        }
    }

    initHandlers() {
        const a = $(document.body);
        $(document.body).on("click", ".icon-back", function () {
            history.back()
        }.bind(this));
        $(document.body).on("click", ".icon-forward", function () {
            history.forward()
        });
        $(document.body).on("click", ".icon-refresh", function () {
            location.reload()
        });
        $(document.body).on("click", ".icon-tv", function () {
            this.openTvPopup()
        }.bind(this));
        $(document.body).on("click", ".icon-moon", function () {
            this.changeTheme()
        }.bind(this));
        $(document.body).on("click", ".inst-dwn", function (a) {
            a.stopPropagation();
            a.preventDefault();
            const b = this.getAttribute("url");
            chrome.runtime.sendMessage({action: "download", url: b});
        });
    }

    initStorage() {
        chrome.storage.local.get(this.storage, function (items) {
            this.storage = items;
            this.applyTheme()
        }.bind(this));
    }

    renderBtns() {
        const a = $(this.headSelector);
        if (!a.find(".icon-moon").length) {
            a.find(".coreSpriteNavBack").remove();
            if (a.find(".mXkkY").length) {
                this.$refreshTpl.prependTo(this.leftHeadSelector);
                this.$forwardTpl.prependTo(this.leftHeadSelector);
                this.$backTpl.prependTo(this.leftHeadSelector);
                this.$tvTpl.prependTo(this.rightHeadSelector);
                this.$moonTpl.appendTo(this.rightHeadSelector);
            } else {
                this.$refreshTpl.prependTo(this.headSelector);
                this.$forwardTpl.prependTo(this.headSelector);
                this.$backTpl.prependTo(this.headSelector);
                this.$tvTpl.appendTo(this.headSelector);
                this.$moonTpl.appendTo(this.headSelector);
            }

        }

    }

    get $refreshTpl() {
        return $(`<button class="icon icon-refresh"></button>`)
    }

    get $forwardTpl() {
        return $(`<button class="icon icon-forward"></button>`)
    }

    get $backTpl() {
        return $(`<button class="icon icon-back"></button>`)
    }

    get $tvTpl() {
        return $(`<button class="icon icon-tv"></button>`)
    }

    get $moonTpl() {
        return $(`<button class="icon icon-moon"></button>`)
    }

    applyTheme() {
        let b = this.storage.darkTheme ? "add" : "remove";
        document.documentElement.classList[b]("dark_mode")
    }

    saveStorage() {
        chrome.storage.local.set(this.storage)
    }

    openTvPopup() {
        open("https://www.instagram.com/tv/upload/", "", "toolbar=0, status=0, width=800, height=600")
    }

    changeTheme() {
        this.storage.darkTheme = !this.storage.darkTheme;
        this.saveStorage();
        this.applyTheme();
    }

    search() {
        $("img.FFVAD").not('.inst-dwn-init').each(function (a, b) {
            let c = $(b);
            let d = this.getImgUrl(c);
            if (c.siblings(".inst-dwn").length) {

            } else {
                this.$downloadBtn(d).insertAfter(c);
                c.addClass('inst-dwn-init');
            }
        }.bind(this));

        $("article video").not("." + 'inst-dwn-init').each(function (a, b) {
            let c = $(b);
            let d = c.attr("src") || c[0].currentSrc;
            if (c.siblings(".inst-dwn").length) {
            } else {
                this.$downloadBtn(d).insertAfter(c);
                c.addClass('inst-dwn-init')
            }
        }.bind(this));

        $("section._9eogI._01nki video").not("." + 'inst-dwn-init').each(function (a, b) {
            const c = $(b),
                d = c.attr("src") || c[0].currentSrc,
                e = $("section.xIOBI.xcV9j");
            if (e.find(".inst-dwn").length) {

            } else {
                this.$downloadBtn(d).prependTo(e);
                c.addClass('inst-dwn-init')
            }

        }.bind(this));
        $("section._9eogI._01nki img.y-yJ5").not("." + 'inst-dwn-init').each(function (a, b) {
            const c = $(b), d = this.getImgUrl(c), e = $("section.xIOBI.xcV9j");
            if (e.find(".inst-dwn").length) {

            } else {
                this.$downloadBtn(d).prependTo(e);
                c.addClass('inst-dwn-init')
            }
        }.bind(this));

    }

    $downloadBtn(a) {
        return $(`<div class="inst-dwn" url="${a}"><div class="inst-dwn-icon"></div><div class="inst-dwn-text">Download</div></div>`)
    }

    getImgUrl(a) {
        let b = a.attr("srcset"), c = b.split(",").pop().replace(/ \w+/g, "")
        return c
    }
}

(function () {
    new Content()
})();
