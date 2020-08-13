class Localize{
    constructor(){

    }
    replace_i18n(obj, tag) {
        let msg = tag.replace(/__MSG_(\w+)__/g, function(match, v1) {
            return v1 ? chrome.i18n.getMessage(v1) : '';
        }.bind(this));

        if(msg != tag) {
            obj.innerHTML = msg;
        }
    }
    localizeHtmlPage() {
        var data = document.querySelectorAll('[data-i18n]');

        for (let i in data)
            if (data.hasOwnProperty(i)) {
            let obj = data[i],
                tag = obj.getAttribute('data-i18n').toString();
            this.replace_i18n(obj, tag);
        }

        let page = document.getElementsByTagName('html');
        for (let j = 0; j < page.length; j++) {
            let obj = page[j],
                tag = obj.innerHTML.toString();
            this.replace_i18n(obj, tag);
        }
    }
}


$(function () {
    const localize = new Localize();
    localize.localizeHtmlPage();
});




