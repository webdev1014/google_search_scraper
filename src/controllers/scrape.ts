import { Request, Response } from 'express';
import { successResponse, failureResponse } from '../modules/common/service';
import ScrapeService from '../modules/scrape/service';

export class ScrapeController {

    private scrapeService: ScrapeService = new ScrapeService();

    async get(req: Request, res: Response) {
        try {
            const data = await this.scrapeService.get(req.query.url as string);
            successResponse('Getting HTML successful', data, res);
        } catch (err) {
            console.log(err);
            failureResponse('Failed in getting HTML', err, res);
        }
    }

}