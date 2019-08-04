const Bitmex = require('./Bitmex');
const sleep = require('then-sleep');
const Task = require('./Task');

class Controller {
    constructor() {
        this._bitmex = new Bitmex();
        this._task = null;
    }

    async getStatus() {
        const status = {};
        const position = await this._bitmex.getPosition();

        if (position) {
            status.position = position;
        } else {
            status.position = 'None';
        }

        if (this._task) {
            status.task = this._task.explain();
        } else {
            status.task = 'None';
        }

        status.lastSync = this._bitmex.getLastSync();

        return JSON.stringify(status, null, 2);
    }

    async makeTask(params) {
        if (this._task) {
            return 'Already have a task!';
        }

        if (await this._bitmex.hasPosition()) {
            return 'Already have a order!';
        }

        this._task = new Task(this._bitmex, params);

        return await this.getStatus();
    }

    async cancel() {
        if (!this._task) {
            return 'No any tasks!';
        }

        await this._task.cancel();
        this._task = null;

        return await this.getStatus();
    }

    async toZero() {
        const enterPrice = await this._bitmex.getPositionEnterPrice();

        await this._bitmex.closeOrder(enterPrice);

        return await this.getStatus();
    }
}

module.exports = Controller;
