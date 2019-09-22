import * as crypto from 'crypto';
import * as request from 'request-promise-native';
import { Utils } from '../Utils';
import { MINUTE_IN_SECONDS, ONE_SECOND } from '../Constants';
import {
    IStock,
    TStockOrder,
    TStockOrderID,
    TStockPosition,
    TStockLastError,
    TStockLastSync,
    TStockPrice,
    TStockValue,
} from './IStock';

const DOMAIN: string = 'https://www.bitmex.com';
const API_POINT: string = '/api/v1/';
const PING_SLEEP: number = 10000;
const REQUEST_RETRY_SLEEP: number = 5000;

type TAuthHeaders = {
    'content-type': 'application/json';
    Accept: 'application/json';
    'X-Requested-With': 'XMLHttpRequest';
    'api-expires': number;
    'api-key': string;
    'api-signature': string;
};

type THttpRequestData = {
    headers: TAuthHeaders;
    url: string;
    method: string;
    body: string;
};

type TRequestOptions = {
    point: string;
    method: string;
    params: unknown;
};

export class Bitmex implements IStock {
    private lastError?: TStockLastError;
    private lastSync?: TStockLastSync;
    private readonly publicKey: string;
    private readonly privateKey: string;

    constructor({ publicKey, privateKey }: { publicKey: string; privateKey: string }) {
        this.publicKey = publicKey;
        this.privateKey = privateKey;

        this.startPingLoop().catch();
    }

    private async startPingLoop(): Promise<void> {
        await this.getPosition();

        this.lastSync = new Date();

        await Utils.sleep(PING_SLEEP);
    }

    async getPosition(): Promise<TStockPosition> {
        const positions: TStockPosition[] = await this.request<TStockPosition[]>({
            point: 'position',
            method: 'GET',
            params: { filter: { symbol: 'XBTUSD' } },
        });

        return positions[0];
    }

    async hasPosition(): Promise<boolean> {
        const position: TStockPosition = await this.getPosition();

        return Boolean(position && position.avgEntryPrice);
    }

    async getOrders(): Promise<TStockOrder[]> {
        return await this.request<TStockOrder[]>({
            point: 'order',
            method: 'GET',
            params: { symbol: 'XBTUSD', filter: { open: true } },
        });
    }

    async placeOrder(price: TStockPrice, value: TStockValue): Promise<TStockOrder> {
        return await this.request<TStockOrder>({
            point: 'order',
            method: 'POST',
            params: {
                symbol: 'XBTUSD',
                type: 'Stop',
                stopPx: price,
                orderQty: value,
                timeInForce: 'GoodTillCancel',
                execInst: 'LastPrice',
            },
        });
    }

    async moveOrder(
        orderID: TStockOrderID,
        price: TStockPrice,
        value: TStockValue
    ): Promise<unknown> {
        return await this.request({
            point: 'order',
            method: 'PUT',
            params: { orderID, stopPx: price, orderQty: value },
        });
    }

    async cancelOrder(orderID: TStockOrderID): Promise<unknown> {
        return await this.request({
            point: 'order',
            method: 'DELETE',
            params: { orderID },
        });
    }

    getLastSync(): TStockLastSync {
        return this.lastSync;
    }

    getLastError(): TStockLastError {
        return this.lastError;
    }

    private async request<T>(args: TRequestOptions): Promise<T> {
        while (true) {
            try {
                return await this.tryRequest<T>(args);
            } catch (error) {
                const now: Date = new Date();

                console.log(now, error);
                this.lastError = `${now} :: ${error.message}`;

                await Utils.sleep(REQUEST_RETRY_SLEEP);
            }
        }
    }

    private async tryRequest<T>({ point, method, params }: TRequestOptions): Promise<T> {
        const path: string = `${API_POINT}${point}`;
        const expires: number = Math.round(new Date().getTime() / ONE_SECOND) + MINUTE_IN_SECONDS;
        const body: string = JSON.stringify(params);

        const signature: string = crypto
            .createHmac('sha256', this.privateKey)
            .update(`${method}${path}${expires}${body}`)
            .digest('hex');

        const headers: TAuthHeaders = {
            'content-type': 'application/json',
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'api-expires': expires,
            'api-key': this.publicKey,
            'api-signature': signature,
        };

        const requestOptions: THttpRequestData = {
            headers: headers,
            url: `${DOMAIN}${path}`,
            method,
            body: body,
        };

        return JSON.parse(await request(requestOptions));
    }
}
