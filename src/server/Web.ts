import * as Koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import { Controller } from './Controller';
import { HttpCodes } from '../data/HttpCodes';

const DEFAULT_PORT: number = 3000;

export class Web {
    private server: Koa;
    private controller: Controller;

    constructor(controller: Controller) {
        this.controller = controller;
        this.server = new Koa();

        this.initServerPlugins();
        this.makeRoutes();
        this.startServerListen();
    }

    private initServerPlugins(): void {
        this.server.use(bodyParser());
        this.server.use(this.checkAuth.bind(this));
        this.server.use(this.checkMethod.bind(this));
    }

    private startServerListen(): void {
        this.server.listen(process.env.PORT || DEFAULT_PORT, () => {
            console.log('Started...');
        });
    }

    private async checkAuth(context: Koa.Context, next: Function): Promise<void> {
        if (context.request.body.password !== process.env.password) {
            context.response.status = HttpCodes.accessDenied;
            return;
        }

        await next();
    }

    private async checkMethod(context: Koa.Context, next: Function): Promise<void> {
        if (context.request.method !== 'POST') {
            context.response.status = HttpCodes.notAcceptable;
            return;
        }

        await next();
    }

    private makeRoutes(): void {
        this.server.use(async (context: Koa.Context) => {
            const path: string = context.path.slice(1);
            const response: Koa.Response = context.response;
            const params: Koa.Request['body'] = context.request.body;

            switch (path) {
                case 'status':
                    response.body = await this.controller.getStatus();
                    break;

                case 'line-break-task':
                    response.body = await this.controller.makeLineBreakTask(params);
                    break;

                case 'bart-drop-task':
                    response.body = await this.controller.makeBartDropTask(params);
                    break;

                case 'bart-drop-exit-value':
                    response.body = await this.controller.changeBartDropExitValue(params);
                    break;

                case 'flag-flow-task':
                    response.body = await this.controller.makeFlagFlowTask(params);
                    break;

                case 'flag-flow-exit-value':
                    response.body = await this.controller.changeFlagFlowExitValue(params);
                    break;

                case 'cancel':
                    response.body = await this.controller.cancel();
                    break;

                default:
                    context.response.status = HttpCodes.notFound;
                    context.response.body = `Undefined path ${path}`;
            }
        });
    }
}
