const Bitmex = require('./Bitmex');
const sleep = require('then-sleep');
const Task = require('./Task');

class Controller {
    constructor() {
        this._bitmex = new Bitmex();
        this._task = null;
    }

    async getStatus() {
        sleep(1000);

        const status = {};
        const position = await this._bitmex.getPosition();

        if (position.avgEntryPrice) {
            status.position = {
                entry: position.avgEntryPrice,
                timestamp: position.timestamp,
                liquidation: position.liquidationPrice,
            };
        } else {
            status.position = 'None';
        }

        if (this._task && !this._task.isActive()) {
            this._task = null;
        }

        if (this._task) {
            status.task = this._task.explain();
        } else {
            status.task = 'None';
        }

        status.lastSync = this._bitmex.getLastSync();
        status.lastError = this._bitmex.getLastError();

        return JSON.stringify(status, null, 2);
    }

    async makeTask(params) {
        if (this._task) {
            return 'Already have a task!';
        }

        if (await this._bitmex.hasPosition()) {
            return 'Already have a order!';
        }

        try {
            this._task = new Task(this._bitmex, params);
        } catch (error) {
            if (error.code === 400) {
                return error.message;
            } else {
                throw error;
            }
        }

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
        if (!(await this._bitmex.hasPosition())) {
            return 'No any positions!';
        }

        const enterPrice = await this._bitmex.getPositionEnterPrice();

        await this._bitmex.closePosition(enterPrice);

        return await this.getStatus();
    }
}

module.exports = Controller;
