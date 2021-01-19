import { BrowserContext, Page } from 'puppeteer';
import { Cluster } from 'puppeteer-cluster';
import puppeteer from 'puppeteer-extra';
import RecaptchaPlugin from 'puppeteer-extra-plugin-recaptcha';
import StealthPlugin = require('puppeteer-extra-plugin-stealth');

export default class ScrapeService {
    private option: any = {
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
            '--window-size=1600,900',
        ],
        headless: true,
    };
    private token = '293843ef93997824c8d45dd102cf9452';
    private cluster: Cluster = null;

    async get(urls: [string]): Promise<string[]> {
        puppeteer.use(StealthPlugin());
        puppeteer.use(
            RecaptchaPlugin({
                provider: {
                    id: '2captcha',
                    token: this.token
                }
            })
        );
        this.cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_PAGE,
            maxConcurrency: 40,
            puppeteer: puppeteer,
            puppeteerOptions: this.option,
            timeout: 300000,
            retryLimit: 3,
        });
        this.cluster.on('taskerror', (err, data) => {
            console.log(`Error crawling ${data}: ${err.message}`);
        });

        const contents = [];
        await this.cluster.task(async ({ page, data: url }) => {
            const content = await this.scrape(page, url);
            contents.push(content);
        });


        for (const url of urls) {
            this.cluster.queue(url);
        }

        await this.cluster.idle();
        await this.cluster.close();
        
        return contents;
    }

    async scrape(page: Page, url: string): Promise<any> {
        await page.setViewport({width: 1600, height: 900});
        const context: BrowserContext = page.browserContext();
        context.overridePermissions('https://search.google.com', ['clipboard-read']);

        try {
            await page.goto(url, {waitUntil: 'load', timeout: 0});
            await page.solveRecaptchas();
            await page.waitForSelector('span[data-event-action="source-code-tab-clicked"]');
            await page.evaluate(() => {
                const tab: any = document.querySelector('span[data-event-action="source-code-tab-clicked"]');
                if (tab) {
                    tab.click();
                }
            });
            await page.waitForTimeout(2000);
            await page.waitForSelector('div[role="button"][data-tooltip="Copy"]');
            await page.evaluate(() => {
                const btnCopy: any = document.querySelector('div[role="button"][data-tooltip="Copy"]');
                if (btnCopy) {
                    btnCopy.click();
                }
            });
            await page.waitForTimeout(2000);
            const content = await page.evaluate(async () => await navigator.clipboard.readText());
            await page.close();

            return { success: true, content };
        } catch (error) {
            console.log(error.message);
            await page.close();

            return { success: false, content: error.message }
        } 
    }

}