const Koa = require('koa');
const bodyParser = require('koa-bodyparser');

class Server {
    constructor(controller) {
        this._controller = controller;
        this._server = new Koa();

        this._initServerPlugins();
        this._makeRoutes();
        this._startServerListen();
    }

    _initServerPlugins() {
        this._server.use(bodyParser());
        this._server.use(this._checkAuth.bind(this));
        this._server.use(this._checkMethod.bind(this));
    }

    _startServerListen() {
        this._server.listen(3000, () => {
            console.log('Started...');
        });
    }

    async _checkAuth(context, next) {
        if (context.request.body.password !== process.env.password) {
            context.response.status = 403;
            return;
        }

        await next();
    }

    async _checkMethod(context, next) {
        if (context.request.method !== 'POST') {
            context.response.status = 405;
            return;
        }

        await next();
    }

    _makeRoutes() {
        this._server.use(async context => {
            const path = context.path.slice(1);
            const response = context.response;
            const params = context.request.body;

            switch (path) {
                case 'status':
                    response.body = await this._controller.getStatus();
                    break;

                case 'task':
                    response.body = await this._controller.makeTask(params);
                    break;

                case 'cancel':
                    response.body = await this._controller.cancel();
                    break;

                case 'zero':
                    response.body = await this._controller.toZero();
                    break;

                default:
                    context.response.status = 404;
                    context.response.body = `Undefined path ${path}`;
            }
        });
    }
}

module.exports = Server;
