import { ITask, ITaskExplain } from './ITask';
import { HttpCodes } from '../data/HttpCodes';
import { IStock, TStockOrder } from '../stock/IStock';
import { EventLoop } from '../util/EventLoop';

const ITERATION_SLEEP_MS: number = 5000;

export type TBartDropTaskExitValue = number;
export type TBartDropTaskExitValueOptions = {
    exitValue: TBartDropTaskExitValue;
};

export type TBartDropTaskOptions = {
    enterPrice: number;
    enterValue: number;
    exitPrice: number;
    exitValue: TBartDropTaskExitValue;
    stopPrice: number;
    fallbackPrice: number;
    side: 'long' | 'short';
};

export type TBartDropTaskExplain = ITaskExplain & {
    enterPrice: number;
    enterValue: number;
    exitPrice: number;
    exitValue: number;
    stopPrice: number;
    fallbackPrice: number;
    side: 'long' | 'short';
    startDate: Date;
    inPosition: boolean;
};

export class BartDrop implements ITask {
    private active: boolean = true;
    private inPosition: boolean = false;

    private readonly stock: IStock;
    private enterOrderID: string;
    private exitOrderID: string;
    private readonly startDate: Date;
    private readonly enterPrice: number;
    private readonly enterValue: number;
    private readonly exitPrice: number;
    private exitValue: number;
    private stopPrice: number;
    private readonly fallbackPrice: number;
    private readonly side: 'long' | 'short';
    private enterTimeByCandle: Date;

    constructor(
        stock: IStock,
        {
            enterPrice,
            enterValue,
            exitPrice,
            exitValue,
            stopPrice,
            fallbackPrice,
            side,
        }: TBartDropTaskOptions
    ) {
        enterPrice = Number(enterPrice);
        enterValue = Number(enterValue);
        exitPrice = Number(exitPrice);
        exitValue = Number(exitValue);
        stopPrice = Number(stopPrice);
        fallbackPrice = Number(fallbackPrice);

        this.validateParams({
            enterPrice,
            enterValue,
            exitPrice,
            exitValue,
            stopPrice,
            fallbackPrice,
            side,
        });

        this.startDate = new Date();
        this.side = side;
        this.enterPrice = enterPrice;
        this.exitPrice = exitPrice;
        this.stopPrice = stopPrice;
        this.fallbackPrice = fallbackPrice;

        if (side === 'long') {
            this.enterValue = enterValue;
            this.exitValue = exitValue;
        } else {
            this.enterValue = -enterValue;
            this.exitValue = -exitValue;
        }

        this.stock = stock;

        setImmediate(this.start.bind(this));
    }

    private validateParams({
        enterPrice,
        enterValue,
        exitPrice,
        exitValue,
        stopPrice,
        fallbackPrice,
        side,
    }: TBartDropTaskOptions): void {
        const code: HttpCodes.invalidParams = HttpCodes.invalidParams;

        if (
            !enterPrice ||
            !enterValue ||
            !exitPrice ||
            !exitValue ||
            !stopPrice ||
            !fallbackPrice
        ) {
            throw { code, message: 'Invalid params' };
        }

        if (side !== 'long' && side !== 'short') {
            throw { code, message: 'Invalid side' };
        }

        if (side === 'long' && exitPrice < enterPrice) {
            throw { code, message: 'Exit < Enter' };
        }

        if (side === 'short' && exitPrice > enterPrice) {
            throw { code, message: 'Exit > Enter' };
        }
    }

    async cancel(): Promise<void> {
        const hasEnterOrder: boolean = await this.stock.hasOrder(this.enterOrderID);
        const hasExitOrder: boolean = await this.stock.hasOrder(this.exitOrderID);

        if (hasEnterOrder) {
            await this.stock.cancelOrder(this.enterOrderID);
        }

        if (hasExitOrder) {
            await this.stock.cancelOrder(this.exitOrderID);
        }

        this.active = false;
    }

    isActive(): boolean {
        return this.active;
    }

    explain(): TBartDropTaskExplain {
        return {
            type: BartDrop.name,
            enterPrice: this.enterPrice,
            enterValue: this.enterValue,
            exitPrice: this.exitPrice,
            exitValue: this.exitValue,
            stopPrice: this.stopPrice,
            fallbackPrice: this.fallbackPrice,
            inPosition: this.inPosition,
            side: this.side,
            startDate: this.startDate,
        };
    }

    async changeExitValue(exitValue: TBartDropTaskExitValue): Promise<void> {
        await this.stock.moveOrder(this.exitOrderID, this.exitPrice, exitValue);

        this.exitValue = exitValue;
    }

    private async start(): Promise<void> {
        await this.placeInitOrders();

        while (true) {
            await EventLoop.sleep(ITERATION_SLEEP_MS);

            if (!this.active) {
                break;
            }

            await this.iteration();
        }
    }

    private async placeInitOrders(): Promise<void> {
        const enter: TStockOrder = await this.stock.placeOrder(this.enterPrice, this.enterValue);
        const exit: TStockOrder = await this.stock.placeOrder(this.exitPrice, this.exitValue);

        this.enterOrderID = enter.orderID;
        this.exitOrderID = exit.orderID;
    }

    private async iteration(): Promise<void> {
        const hasExitOrder: boolean = await this.stock.hasOrder(this.exitOrderID);

        if (!hasExitOrder) {
            this.active = false;
            return;
        }

        const hasPosition: boolean = await this.stock.hasPosition();

        if (hasPosition && !this.inPosition) {
            this.inPosition = true;

            // TODO Calc enter time by candle
        }

        // TODO Handle fallback time end
        // TODO Handle fallback price guard
        // TODO Add stop with "one cancel other"
    }
}
