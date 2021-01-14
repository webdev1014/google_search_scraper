import { Application, Request, Response } from 'express';
import { ScrapeController } from '../controllers/scrape';

export class ScrapeRoutes {

    private scrape: ScrapeController = new ScrapeController();

    route(app: Application) {

        app.get('/scrape', (req: Request, res: Response) => {
            this.scrape.get(req, res);
        });

    }
}