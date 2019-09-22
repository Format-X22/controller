export interface ITask {
    cancel(): Promise<void>;
    isActive(): boolean;
    explain(): ITaskExplain;
}

export type ITaskExplain = {
    type: string;
};
