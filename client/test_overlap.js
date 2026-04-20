const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        // Go to auth to login or whatever, wait we don't know the credential
        // But Onboarding is a protected route.
        // Wait, we can just edit the code temporarily to disable protection?
        // Let's just output the Z-index and pointer-events of elements.
    } catch (e) {
        console.error(e);
    }
})();
