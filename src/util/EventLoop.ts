export class EventLoop {
    static async sleep(ms: number): Promise<void> {
        await new Promise((resolve: () => void): void => {
            setTimeout(resolve, ms);
        });
    }
}
