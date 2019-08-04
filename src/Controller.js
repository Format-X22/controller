const sleep = require('then-sleep');
const config = require('../config');
const Telegram = require('./Telegram');
const Bitmex = require('./Bitmex');

class Controller {
    constructor() {
        this._bitmex = new Bitmex();
        this._telegram = new Telegram();
    }

    async start() {
        while (true) {
            //
            await sleep(config.controllerTimeoutInterval);
        }
    }
}

module.exports = Controller;
