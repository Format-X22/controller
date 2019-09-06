import { Bitmex, TPosition } from './Bitmex';
import { Utils } from './Utils';
import { Task, TExplain, TTaskOptions } from './Task';
import { ONE_SECOND } from './Constants';
import { HttpCodes } from './HttpCodes';

const STATUS_JSON_SPACES: number = 2;

type TStatus = {
    position:
        | {
              entry: number;
              timestamp: string;
              liquidation: number;
          }
        | 'None';
    tasks: TExplain[];
    lastSync: Bitmex['lastSync'];
    lastError: Bitmex['lastError'];
};

export class Controller {
    private readonly bitmex: Bitmex;
    private readonly tasks: Set<Task>;

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

    async makeTask(params: TTaskOptions): Promise<string> {
        try {
            const task: Task = new Task(this.bitmex, params);

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
}
