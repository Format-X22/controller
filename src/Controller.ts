import { Bitmex, TPosition } from './stock/Bitmex';
import { Utils } from './Utils';
import { LineBreak, TLineBreakTaskExplain, TLineBreakTaskOptions } from './task/LineBreak';
import { ONE_SECOND } from './Constants';
import { HttpCodes } from './HttpCodes';
import { ITask, ITaskExplain } from './task/ITask';

const STATUS_JSON_SPACES: number = 2;

type TStatus = {
    position:
        | {
              entry: number;
              timestamp: string;
              liquidation: number;
          }
        | 'None';
    tasks: ITaskExplain[];
    lastSync: Bitmex['lastSync'];
    lastError: Bitmex['lastError'];
};

export class Controller {
    private readonly bitmex: Bitmex;
    private readonly tasks: Set<ITask>;

    constructor() {
        this.bitmex = new Bitmex();
        this.tasks = new Set();
    }

    async getStatus(): Promise<string> {
        await Utils.sleep(ONE_SECOND);

        const status: TStatus = {
            position: 'None',
            tasks: [],
            lastSync: this.bitmex.getLastSync(),
            lastError: this.bitmex.getLastError(),
        };
        const position: TPosition = await this.bitmex.getPosition();

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

    async makeLineBreakTask(params: TLineBreakTaskOptions): Promise<string> {
        return await this.makeTask(new LineBreak(this.bitmex, params));
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

    private async makeTask(task: ITask): Promise<string> {
        try {
            this.tasks.add(task);
        } catch (error) {
            if (error.code === HttpCodes.invalidParams) {
                return error.message;
            } else {
                throw error;
            }
        }

        return await this.getStatus();
    }
}
