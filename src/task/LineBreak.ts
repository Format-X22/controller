import { EventLoop } from '../util/EventLoop';
import { HttpCodes } from '../data/HttpCodes';
import { ITask, ITaskExplain } from './ITask';
import { IStock, TStockOrder } from '../stock/IStock';

const AFTER_5: number = 5;
const AFTER_10: number = 10;
const LOOP_SLEEP: number = 5000;

export type TLineBreakTaskExplain = ITaskExplain & {
    startDate: Date;
    initPrice: number;
    currentPrice: number;
    nextPrice: number;
    after10Price: number;
    step: number;
};

export type TLineBreakTaskOptions = {
    price: number;
    value: number;
    after5: number;
    side: 'long' | 'short';
    moveDirection: 'up' | 'down';
};

export class LineBreak implements ITask {
    private readonly startDate: Date;
    private readonly price: number;
    private readonly value: number;
    private readonly step: number;
    private readonly stock: IStock;
    private orderID: string;
    private currentPrice: number;
    private active: boolean;
    private currentHours: number;

    constructor(
        stock: IStock,
        { price, value, after5, side, moveDirection }: TLineBreakTaskOptions
    ) {
        if (!Number(price) || !Number(value) || !Number(after5)) {
            throw { code: HttpCodes.invalidParams, message: 'Invalid params' };
        }

        if (side !== 'long' && side !== 'short') {
            throw { code: HttpCodes.invalidParams, message: 'Invalid side' };
        }

        if (moveDirection !== 'up' && moveDirection !== 'down') {
            throw { code: HttpCodes.invalidParams, message: 'Invalid direction' };
        }

        this.startDate = new Date();
        this.currentHours = this.startDate.getHours();
        this.price = Number(price);

        if (side === 'long') {
            this.value = Number(value);
        } else {
            this.value = -Number(value);
        }

        if (moveDirection === 'up') {
            this.step = (after5 - this.price) / AFTER_5;
        } else {
            this.step = -(this.price - after5) / AFTER_5;
        }

        this.stock = stock;
        this.orderID = null;
        this.currentPrice = this.price;
        this.active = true;

        setImmediate(this.start.bind(this));
    }

    async cancel(): Promise<void> {
        this.active = false;
        await this.stock.cancelOrder(this.orderID);
    }

    isActive(): LineBreak['active'] {
        return this.active;
    }

    explain(): TLineBreakTaskExplain {
        let after10Price: number = this.currentPrice;

        for (let i: number = 0; i < AFTER_10; i++) {
            after10Price += this.step;
        }

        return {
            type: LineBreak.name,
            startDate: this.startDate,
            initPrice: this.price,
            currentPrice: this.currentPrice,
            nextPrice: this.currentPrice + this.step,
            after10Price,
            step: this.step,
        };
    }

    private async start(): Promise<void> {
        await this.initOrder();

        while (true) {
            if (!this.active) {
                return;
            }

            const orders: TStockOrder[] = await this.stock.getOrders();
            let orderLive: boolean = false;

            for (const order of orders) {
                if (order.orderID === this.orderID) {
                    orderLive = true;
                    break;
                }
            }

            if (!orderLive) {
                this.active = false;
                return;
            }

            if (await this.stock.hasPosition()) {
                await this.cancel();
                return;
            }

            const hours: number = new Date().getHours();

            if (this.currentHours !== hours) {
                this.currentHours = hours;
                await this.iteration();
            }
            await EventLoop.sleep(LOOP_SLEEP);
        }
    }

    private async initOrder(): Promise<void> {
        const result: TStockOrder = await this.stock.placeOrder(this.price, this.value);

        this.orderID = result.orderID;
    }

    private async iteration(): Promise<void> {
        const price: number = Math.round(this.currentPrice + this.step);

        this.currentPrice = price;

        await this.stock.moveOrder(this.orderID, price, this.value);
    }
}
