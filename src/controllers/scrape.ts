import { Request, Response } from 'express';
import { sendResponse } from '../modules/common/service';
import ScrapeService from '../modules/scrape/service';

export class ScrapeController {

    private scrapeService: ScrapeService = new ScrapeService();

    async get(req: Request, res: Response) {
        const data = await this.scrapeService.get(req.query.url as string);
        sendResponse(data, res);
    }

}