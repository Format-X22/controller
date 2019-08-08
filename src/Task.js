const sleep = require('then-sleep');

class Task {
    constructor(bitmex, { price, value, after5, side, moveDirection }) {
        if (!Number(price) || !Number(value) || !Number(after5)) {
            throw { code: 400, message: 'Invalid params' };
        }

        if (side !== 'long' && side !== 'short') {
            throw { code: 400, message: 'Invalid side' };
        }

        if (moveDirection !== 'up' && moveDirection !== 'down') {
            throw { code: 400, message: 'Invalid direction' };
        }

        this._startDate = new Date();
        this._currentHours = this._startDate.getHours();
        this._price = Number(price);

        if (side === 'long') {
            this._value = Number(value);
        } else {
            this._value = -Number(value);
        }

        if (moveDirection === 'up') {
            this._step = (after5 - this._price) / 5;
        } else {
            this._step = -(this._price - after5) / 5;
        }

        this._bitmex = bitmex;
        this._orderID = null;
        this._currentPrice = this._price;
        this._active = true;

        setImmediate(this._start.bind(this));
    }

    async cancel() {
        this._active = false;
        await this._bitmex.cancelOrder(this._orderID);
    }

    isActive() {
        return this._active;
    }

    explain() {
        let after10Price = this._currentPrice;

        for (let i = 0; i < 10; i++) {
            after10Price += this._step;
        }

        return {
            startDate: this._startDate,
            initPrice: this._price,
            currentPrice: this._currentPrice,
            nextPrice: this._currentPrice + this._step,
            after10Price,
            step: this._step,
        };
    }

    async _start() {
        await this._initOrder();

        while (true) {
            if (!this._active) {
                return;
            }

            const orders = await this._bitmex.getOrders();
            let orderLive = false;

            for (const order of orders) {
                if (order.orderID === this._orderID) {
                    orderLive = true;
                    break;
                }
            }

            if (!orderLive) {
                this._active = false;
                return;
            }

            if (await this._bitmex.hasPosition()) {
                await this.cancel();
                return;
            }

            const hours = new Date().getHours();

            if (this._currentHours !== hours) {
                this._currentHours = hours;
                await this._iteration();
            }
            await sleep(5000);
        }
    }

    async _initOrder() {
        const result = await this._bitmex.placeOrder(this._price, this._value);

        this._orderID = result.orderID;
    }

    async _iteration() {
        const price = Math.round(this._currentPrice + this._step);

        this._currentPrice = price;

        await this._bitmex.moveOrder(this._orderID, price, this._value);
    }
}

module.exports = Task;
