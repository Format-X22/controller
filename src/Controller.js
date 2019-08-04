const sleep = require('then-sleep');
const Task = require('./Task');

class Controller {
    constructor(bitmex) {
        this._bitmex = bitmex;
        this._task = null;
    }

    async getStatus() {
        // TODO -
    }

    async makeTask(params) {
        if (this._task) {
            return 'Already have a task!';
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
        // TODO -

        return await this.getStatus();
    }
}

module.exports = Controller;
