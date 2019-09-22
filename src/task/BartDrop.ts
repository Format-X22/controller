import { ITask, ITaskExplain } from './ITask';
import { HttpCodes } from '../HttpCodes';
import { IStock } from '../stock/IStock';

export type TBartDropTaskExitValue = number;
export type TBartDropTaskExitValueOptions = {
    exitValue: TBartDropTaskExitValue;
};

export type TBartDropTaskOptions = {
    enterPrice: number;
    enterValue: number;
    exitPrice: number;
    exitValue: TBartDropTaskExitValue;
    fallbackPrice: number;
    side: 'long' | 'short';
};

export type TBartDropTaskExplain = ITaskExplain & {
    value: number;
    enterPrice: number;
    exitPrice: number;
    fallbackPrice: number;
    inPosition: boolean;
    side: 'long' | 'short';
    startDate: Date;
};

export class BartDrop implements ITask {
    private readonly stock: IStock;
    private orderID: string;
    private active: boolean;
    private inPosition: boolean;
    private readonly startDate: Date;
    private readonly enterPrice: number;
    private readonly enterValue: number;
    private readonly exitPrice: number;
    private readonly exitValue: number;
    private readonly fallbackPrice: number;
    private readonly side: 'long' | 'short';

    constructor(
        stock: IStock,
        { enterPrice, enterValue, exitPrice, exitValue, fallbackPrice, side }: TBartDropTaskOptions
    ) {
        if (
            !Number(enterPrice) ||
            !Number(enterValue) ||
            !Number(exitPrice) ||
            !Number(exitValue) ||
            !Number(fallbackPrice)
        ) {
            throw { code: HttpCodes.invalidParams, message: 'Invalid params' };
        }

        if (side !== 'long' && side !== 'short') {
            throw { code: HttpCodes.invalidParams, message: 'Invalid side' };
        }

        this.startDate = new Date();
        this.side = side;
        this.enterPrice = Number(enterPrice);
        this.exitPrice = Number(exitPrice);
        this.fallbackPrice = Number(fallbackPrice);

        if (side === 'long') {
            this.enterValue = Number(enterValue);
            this.exitValue = Number(exitValue);
        } else {
            this.enterValue = -Number(enterValue);
            this.exitValue = -Number(exitValue);
        }

        this.stock = stock;
        this.orderID = null;

        setImmediate(this.start.bind(this));
    }

    async cancel(): Promise<void> {
        // TODO -
    }

    isActive(): boolean {
        return this.active;
    }

    explain(): TBartDropTaskExplain {
        return {
            type: BartDrop.name,
            value: this.enterValue,
            enterPrice: this.enterPrice,
            exitPrice: this.exitPrice,
            fallbackPrice: this.fallbackPrice,
            inPosition: this.inPosition,
            side: this.side,
            startDate: this.startDate,
        };
    }

    async changeExitValue(exitValue: TBartDropTaskExitValue): Promise<void> {
        // TODO -
    }

    private async start(): Promise<void> {
        // TODO -
    }
}
