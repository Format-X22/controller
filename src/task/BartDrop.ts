import { ITask, ITaskExplain } from './ITask';
import { Bitmex } from '../stock/Bitmex';
import { HttpCodes } from '../HttpCodes';

export type TBartDropTaskOptions = {
    value: number;
    enterPrice: number;
    exitPrice: number;
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
    private readonly bitmex: Bitmex;
    private orderID: string;
    private active: boolean;
    private inPosition: boolean;
    private readonly startDate: Date;
    private readonly value: number;
    private readonly enterPrice: number;
    private readonly exitPrice: number;
    private readonly fallbackPrice: number;
    private readonly side: 'long' | 'short';

    constructor(bitmex: Bitmex, { value, enterPrice, exitPrice, fallbackPrice, side }: TBartDropTaskOptions) {
        if (!Number(value) || !Number(enterPrice) || !Number(exitPrice) || !Number(fallbackPrice)) {
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
            this.value = Number(value);
        } else {
            this.value = -Number(value);
        }

        this.bitmex = bitmex;
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
            value: this.value,
            enterPrice: this.enterPrice,
            exitPrice: this.exitPrice,
            fallbackPrice: this.fallbackPrice,
            inPosition: this.inPosition,
            side: this.side,
            startDate: this.startDate,
        };
    }

    private async start(): Promise<void> {
        // TODO -
    }
}
