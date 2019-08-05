const sleep = require('then-sleep');

class Task {
    constructor(bitmex, { price, value, step5 }) {
        this._startDate = new Date();
        this._currentHours = this._startDate.getHours();
        this._price = price;
        this._value = value;
        this._step = step5 / 5;
        this._bitmex = bitmex;
        this._orderID = null;
        this._currentPrice = this._price;

        setImmediate(this._start.bind(this));
    }

    async _start() {
        await this._initOrder();

        while (true) {
            const hours = new Date().getHours();

            if (this._currentHours !== hours) {
                this._currentHours = hours;
                await this._iteration();
            }
            sleep(5000);
        }
    }

    async _initOrder() {
        const result = await this._bitmex.placeOrder(this._price, this._value);

        this._orderID = result.orderID;
    }

    async _iteration() {
        const hoursDiff = (new Date() - this._startDate) / 1000 / 60 / 60;
        const price = Math.round(this._price + this._step * hoursDiff);

        this._currentPrice = price;

        await this._bitmex.moveOrder(this._orderID, price, this._value);
    }

    async cancel() {
        await this._bitmex.cancelOrder(this._orderID);
    }

    explain() {
        return {
            startDate: this._startDate,
            initPrice: this._price,
            currentPrice: this._currentPrice,
            nextPrice: this._currentPrice + this._step,
            step: this._step,
        };
    }
}

module.exports = Task;
