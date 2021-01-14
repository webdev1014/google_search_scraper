import puppeteer from 'puppeteer-extra';
import StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

export default class ScrapeService {
    private option:any = {
        ignoreDefaultArgs: [
            '--disable-extensions',
            '--disable-infobars',
            '--window-position=0,0',
            '--ignore-certifcate-errors',
            '--ignore-certifcate-errors-spki-list',
            '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"',
            '--start-maximized',
        ],
        args: [
            '--no-sandbox',
        ],
        headless: true,
    };
    
    async get(url: string): Promise<string> {
        const browser = await puppeteer.launch(this.option);
        const page    = await browser.newPage();
        
        await page.setViewport({width: 1600, height: 900});
        await page.setBypassCSP(true);

        try {
            await page.goto(url);
            await page.waitForSelector('span[data-event-action="source-code-tab-clicked"]');
            await page.click('span[data-event-action="source-code-tab-clicked"]');
            await page.waitForSelector('div.CodeMirror .CodeMirror-scroll');
            await page.waitForTimeout(3000);

            const content = await page.evaluate(async () => {
                const distance    = 600;
                const delay       = 500;
                const codeLines   = [];
                const tabContents = document.querySelectorAll('div.CodeMirror .CodeMirror-scroll');
                const tabHTML     = tabContents[tabContents.length - 1];
                
                while (tabHTML.scrollTop + tabHTML.clientHeight < tabHTML.scrollHeight) {
                    const elements = document
                        .querySelectorAll('div.CodeMirror .CodeMirror-scroll .CodeMirror-line');

                    for (const element of elements) {
                        const elNumber = element
                            .parentElement
                            .querySelector('.CodeMirror-gutter-wrapper');
                        
                        if (!elNumber) {
                            continue;
                        }
                        
                        const number = elNumber.textContent
                        const content = element.textContent;
                        const isExist = codeLines.findIndex(codeLine => {
                            return codeLine.number === number;
                        }) > -1;

                        if (isExist) {
                            continue;
                        }

                        codeLines.push({ number, content });
                    }
                    
                    tabHTML.scrollTop += distance;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                
                let content = '';
                for (const codeLine of codeLines) {
                    content += codeLine.content;
                }
                
                return content;
            });

            await page.close();
            await browser.close();

            return content;
        } catch (error) {
            await page.close();
            await browser.close();

            return error.message;
        }
    }

}