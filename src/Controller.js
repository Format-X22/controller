const Bitmex = require('./Bitmex');
const sleep = require('then-sleep');
const Task = require('./Task');

class Controller {
    constructor() {
        this._bitmex = new Bitmex();
        this._tasks = new Set();
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

        status.tasks = [];

        for (const task of this._tasks) {
            if (task.isActive()) {
                status.tasks.push(task.explain());
            } else {
                setImmediate(() => this._tasks.delete(task));
            }
        }

        status.lastSync = this._bitmex.getLastSync();
        status.lastError = this._bitmex.getLastError();

        return JSON.stringify(status, null, 2);
    }

    async makeTask(params) {
        try {
            const task = new Task(this._bitmex, params);

            this._tasks.add(task);
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
        if (!this._tasks.size) {
            return 'No any tasks!';
        }

        for (const task of this._tasks) {
            await task.cancel();
            this._tasks.delete(task);
        }

        return await this.getStatus();
    }
}

module.exports = Controller;
