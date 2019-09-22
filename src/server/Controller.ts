import { EventLoop } from '../util/EventLoop';
import { LineBreak, TLineBreakTaskOptions } from '../task/LineBreak';
import { ONE_SECOND } from '../data/Constants';
import { HttpCodes } from '../data/HttpCodes';
import { ITask, ITaskExplain } from '../task/ITask';
import { BartDrop, TBartDropTaskExitValueOptions, TBartDropTaskOptions } from '../task/BartDrop';
import { IStock, TStockPosition, TStockLastError, TStockLastSync } from '../stock/IStock';

const STATUS_JSON_SPACES: number = 2;
const OK_MESSAGE: string = 'Ok';

type TStatus = {
    position:
        | {
              entry: number;
              timestamp: string;
              liquidation: number;
          }
        | 'None';
    tasks: ITaskExplain[];
    lastSync: TStockLastSync;
    lastError: TStockLastError;
};

type TStatusResult = string;

export class Controller {
    private readonly stock: IStock;
    private readonly tasks: Set<ITask>;

    constructor(stock: IStock) {
        this.stock = stock;
        this.tasks = new Set();
    }

    async getStatus(): Promise<TStatusResult> {
        await EventLoop.sleep(ONE_SECOND);

        const status: TStatus = {
            position: 'None',
            tasks: [],
            lastSync: this.stock.getLastSync(),
            lastError: this.stock.getLastError(),
        };
        const position: TStockPosition = await this.stock.getPosition();

        if (position && position.avgEntryPrice) {
            status.position = {
                entry: position.avgEntryPrice,
                timestamp: position.timestamp,
                liquidation: position.liquidationPrice,
            };
        }

        for (const task of this.tasks) {
            if (task.isActive()) {
                status.tasks.push(task.explain());
            } else {
                setImmediate(() => this.tasks.delete(task));
            }
        }

        return JSON.stringify(status, null, STATUS_JSON_SPACES);
    }

    async makeLineBreakTask(params: TLineBreakTaskOptions): Promise<TStatusResult> {
        return await this.makeTask((stock: IStock) => new LineBreak(stock, params), false);
    }

    async makeBartDropTask(params: TBartDropTaskOptions): Promise<TStatusResult> {
        return await this.makeTask((stock: IStock) => new BartDrop(stock, params), BartDrop);
    }

    async changeBartDropExitValue(params: TBartDropTaskExitValueOptions): Promise<TStatusResult> {
        const rawTask: ITask = this.getTaskByType(BartDrop);
        const task: BartDrop = rawTask as BartDrop;

        await task.changeExitValue(params.exitValue);

        return OK_MESSAGE;
    }

    async cancel(): Promise<string> {
        if (!this.tasks.size) {
            return 'No any tasks!';
        }

        for (const task of this.tasks) {
            await task.cancel();
            this.tasks.delete(task);
        }

        return await this.getStatus();
    }

    private async makeTask(
        taskFn: (stock: IStock) => ITask,
        uniqueAs: Function | false
    ): Promise<TStatusResult> {
        try {
            if (uniqueAs) {
                this.checkTaskAsUnique(uniqueAs);
            }

            this.tasks.add(taskFn(this.stock));
        } catch (error) {
            if (error.code === HttpCodes.invalidParams) {
                return error.message;
            } else {
                throw error;
            }
        }

        return OK_MESSAGE;
    }

    private getTaskByType(Type: Function): ITask {
        for (const task of this.tasks) {
            if (task instanceof Type) {
                return task;
            }
        }

        throw { code: HttpCodes.invalidParams, message: `No ${Type.name} task!` };
    }

    private checkTaskAsUnique(uniqueAs: Function): void {
        for (const task of this.tasks) {
            if (task instanceof uniqueAs) {
                throw {
                    code: HttpCodes.invalidParams,
                    message: `Already have ${uniqueAs.name} task!`,
                };
            }
        }
    }
}
