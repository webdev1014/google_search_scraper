import { Page } from 'puppeteer';
import { Cluster } from 'puppeteer-cluster';
import puppeteer from 'puppeteer-extra';
import { read } from 'clipboardy';
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
            '--no-sandbox',
            '--disable-gpu',
        ],
        args: [
            '--no-sandbox',
        ],
        headless: false,
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
            retryLimit: 5,
        });
        this.cluster.on('taskerror', (err, data) => {
            console.log(`Error crawling ${data}: ${err.message}`);
        });

        const contents = [];
        await this.cluster.task(async ({ page, data: url }) => {
            const content = await this.scrape(page, url);
            contents.push({ content });
        });


        for (const url of urls) {
            this.cluster.queue(url);
        }

        await this.cluster.idle();
        await this.cluster.close();
        
        return contents;
    }

    async scrape(page: Page, url: string): Promise<string> {
        await page.setViewport({width: 1600, height: 900});

        try {
            await page.goto(url);
            await page.solveRecaptchas();
            await page.waitForSelector('span[data-event-action="source-code-tab-clicked"]');
            await page.click('span[data-event-action="source-code-tab-clicked"]');
            await page.waitForSelector('div[role="button"][data-tooltip="Copy"]');
            await page.click('div[role="button"][data-tooltip="Copy"]');
            
            const content = await read();

            await page.close();
            return content; 
        } catch (error) {
            console.log(error.message);
            await page.close();
            return error.message;
        }
    }

}