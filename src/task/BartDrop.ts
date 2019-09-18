import { ITask } from './ITask';

export class BartDrop implements ITask {
    constructor() {
        // TODO -
    }

    async cancel(): Promise<void> {
        // TODO -
    }

    isActive(): boolean {
        // TODO -
        return false;
    }

    explain(): object {
        // TODO -
        return {};
    }
}
