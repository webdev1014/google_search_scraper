import { Request, Response } from 'express';
import { sendResponse, sendFailure } from '../modules/common/service';
import ScrapeService from '../modules/scrape/service';

export class ScrapeController {

    private scrapeService: ScrapeService = new ScrapeService();

    async post(req: Request, res: Response) {
        if (Array.isArray(req.body.urls)) {
            const before = new Date().getTime();
            const data = await this.scrapeService.get(req.body.urls);
            const after = new Date().getTime();
            console.log((after - before) / 1000);
            sendResponse(data, res);
        } else {
            sendFailure('invalid parameter', res);
        }
    }

}