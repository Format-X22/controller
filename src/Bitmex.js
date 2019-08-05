const crypto = require('crypto');
const request = require('request-promise-native');
const sleep = require('then-sleep');
const config = require('../config');

const DOMAIN = 'https://www.bitmex.com';
const API_POINT = '/api/v1/';

class Bitmex {
    constructor() {
        this._lastError = null;
        this._lastSync = null;

        this.startPingLoop().catch();
    }

    async startPingLoop() {
        await this.getPosition();

        this._lastSync = new Date();

        await sleep(10000);
    }

    async getPosition() {
        const positions = await this._request({
            point: 'position',
            method: 'GET',
            params: { filter: { symbol: 'XBTUSD' } },
        });

        return positions[0];
    }

    async hasPosition() {
        const position = await this.getPosition();

        return Boolean(position.avgEntryPrice);
    }

    async getOrder() {
        const orders = await this._request({
            point: 'order',
            method: 'GET',
            params: { symbol: 'XBTUSD', filter: { open: true } },
        });

        return orders[0];
    }

    async getPositionEnterPrice() {
        const position = await this.getPosition();

        return position.avgEntryPrice;
    }

    async placeOrder(price, value) {
        return await this._request({
            point: 'order',
            method: 'POST',
            params: { symbol: 'XBTUSD', type: 'Stop', stopPx: price, orderQty: value },
        });
    }

    async moveOrder(orderID, price, value) {
        return await this._request({
            point: 'order',
            method: 'PUT',
            params: { orderID, stopPx: price, orderQty: value },
        });
    }

    async cancelOrder(orderID) {
        return await this._request({
            point: 'order',
            method: 'DELETE',
            params: { orderID },
        });
    }

    async closePosition(price) {
        return await this._request({
            point: 'order/closePosition',
            method: 'POST',
            params: { symbol: 'XBTUSD', price },
        });
    }

    getLastSync() {
        return this._lastSync;
    }

    getLastError() {
        return this._lastError;
    }

    async _request(args) {
        while (true) {
            try {
                return await this._tryRequest(args);
            } catch (error) {
                const now = new Date();

                console.log(now, error.message);
                this._lastError = `${now} :: ${error.message}`;

                await sleep(5000);
            }
        }
    }

    async _tryRequest({ point, method, params }) {
        const path = `${API_POINT}${point}`;
        const expires = Math.round(new Date().getTime() / 1000) + 60;
        const body = JSON.stringify(params);

        const signature = crypto
            .createHmac('sha256', config.bitmexPrivateKey)
            .update(`${method}${path}${expires}${body}`)
            .digest('hex');

        const headers = {
            'content-type': 'application/json',
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'api-expires': expires,
            'api-key': config.bitmexPublicKey,
            'api-signature': signature,
        };

        const requestOptions = {
            headers: headers,
            url: `${DOMAIN}${path}`,
            method,
            body: body,
        };

        return JSON.parse(await request(requestOptions));
    }
}

module.exports = Bitmex;
