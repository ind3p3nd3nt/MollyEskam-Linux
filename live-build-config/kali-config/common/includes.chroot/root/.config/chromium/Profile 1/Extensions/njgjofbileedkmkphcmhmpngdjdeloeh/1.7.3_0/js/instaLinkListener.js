class InstaLinkListener {


    constructor() {
        this.setInstaLinksLinsteners();
        this.observer = new MutationObserver((e) => {
            this.setInstaLinksLinsteners();
            // observer.disconnect();
        });
        this.observer.observe(document.body, {
            attributes: true,
            childList: true,
            characterData: true
        });
    }

    setInstaLinksLinsteners() {
        let links = document.body.querySelectorAll('a[href*="instagram.com"]');
        links.forEach((link) => {
            link.removeEventListener('click', this.instaLinkListener)
            link.addEventListener('click', this.instaLinkListener)
        })
    }

    instaLinkListener(e) {
        e.preventDefault();
        let target = e.target;
        for (let i = 0; i < 7; i++) {
            if(target.tagName == 'A') {
                
                chrome.runtime.sendMessage({
                    action: 'open_insta_link',
                    url: target.href
                })
                break;
            } else {
                target = target.parentNode;
            }
        }
        
    }
}

const i = new InstaLinkListener;