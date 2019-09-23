import { IStock } from '../stock/IStock';
import { ITask, ITaskExplain } from './ITask';

export type TFlagFlowTaskExitValue = number;
export type TFlagFlowTaskExitValueOptions = {
    exitValue: TFlagFlowTaskExitValue;
};

export type TFlagFlowTaskOptions = {};

export type TBartDropTaskExplain = ITaskExplain & {};

export class FlagFlow implements ITask {
    constructor(stock: IStock, params: TFlagFlowTaskOptions) {
        // TODO -

        setImmediate(this.start.bind(this));
    }

    async cancel(): Promise<void> {
        // TODO -
    }

    explain(): TBartDropTaskExplain {
        // TODO -
        return;
    }

    isActive(): boolean {
        // TODO -
        return;
    }

    async changeExitValue(exitValue: TFlagFlowTaskExitValue): Promise<void> {
        // TODO -
    }

    private async start(): Promise<void> {
        // TODO -
    }
}
