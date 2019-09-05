import * as crypto from 'crypto';
import * as request from 'request-promise-native';
import { Utils } from './Utils';
import { MINUTE_IN_SECONDS, ONE_SECOND } from './Constants';

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

type TRequestOptions = {
    headers: TAuthHeaders;
    url: string;
    method: string;
    body: string;
};

export class Bitmex {
    private lastError?: string;
    private lastSync?: Date;

    constructor() {
        this.startPingLoop().catch();
    }

    async startPingLoop(): Promise<void> {
        await this.getPosition();

        this.lastSync = new Date();

        await Utils.sleep(PING_SLEEP);
    }

    async getPosition() {
        const positions = await this.request({
            point: 'position',
            method: 'GET',
            params: { filter: { symbol: 'XBTUSD' } },
        });

        return positions[0];
    }

    async hasPosition(): Promise<boolean> {
        const position = await this.getPosition();

        return Boolean(position && position.avgEntryPrice);
    }

    async getOrders() {
        return await this.request({
            point: 'order',
            method: 'GET',
            params: { symbol: 'XBTUSD', filter: { open: true } },
        });
    }

    async placeOrder(price: number, value: number) {
        return await this.request({
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

    async moveOrder(orderID, price, value) {
        return await this.request({
            point: 'order',
            method: 'PUT',
            params: { orderID, stopPx: price, orderQty: value },
        });
    }

    async cancelOrder(orderID) {
        return await this.request({
            point: 'order',
            method: 'DELETE',
            params: { orderID },
        });
    }

    getLastSync(): Bitmex['lastSync'] {
        return this.lastSync;
    }

    getLastError(): Bitmex['lastError'] {
        return this.lastError;
    }

    private async request(args) {
        while (true) {
            try {
                return await this.tryRequest(args);
            } catch (error) {
                const now: Date = new Date();

                console.log(now, error);
                this.lastError = `${now} :: ${error.message}`;

                await Utils.sleep(REQUEST_RETRY_SLEEP);
            }
        }
    }

    private async tryRequest({
        point,
        method,
        params,
    }: {
        point: string;
        method: string;
        params: any;
    }) {
        const path: string = `${API_POINT}${point}`;
        const expires: number = Math.round(new Date().getTime() / ONE_SECOND) + MINUTE_IN_SECONDS;
        const body: string = JSON.stringify(params);

        const signature: string = crypto
            .createHmac('sha256', process.env.bitmexPrivateKey)
            .update(`${method}${path}${expires}${body}`)
            .digest('hex');

        const headers: TAuthHeaders = {
            'content-type': 'application/json',
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'api-expires': expires,
            'api-key': process.env.bitmexPublicKey,
            'api-signature': signature,
        };

        const requestOptions: TRequestOptions = {
            headers: headers,
            url: `${DOMAIN}${path}`,
            method,
            body: body,
        };

        return JSON.parse(await request(requestOptions));
    }
}
