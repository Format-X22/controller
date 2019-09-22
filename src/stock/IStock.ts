export interface IStock {
    getPosition(): Promise<TStockPosition>;
    hasPosition(): Promise<boolean>;
    getOrders(): Promise<TStockOrder[]>;
    placeOrder(price: TStockPrice, value: TStockValue): Promise<TStockOrder>;
    moveOrder(orderID: TStockOrderID, price: TStockPrice, value: TStockValue): Promise<unknown>;
    cancelOrder(orderID: TStockOrderID): Promise<unknown>;
    getLastSync(): TStockLastSync;
    getLastError(): TStockLastError;
}

export type TStockOrderID = string;
export type TStockLastSync = Date | null;
export type TStockLastError = string | null;
export type TStockPrice = number;
export type TStockValue = number;

export type TStockOrder = {
    orderID: TStockOrderID;
};

export type TStockPosition = {
    timestamp: string;
    avgEntryPrice: number;
    liquidationPrice: number;
};
