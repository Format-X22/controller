import { Controller } from './Controller';
import { Server } from './Server';
import { IStock } from './stock/IStock';
import { Bitmex } from './stock/Bitmex';
import { Env } from './Env';

let stock: IStock;

switch (Env.STOCK) {
    case 'BITMEX':
        if (!Env.BITMEX_PUBLIC_KEY || !Env.BITMEX_PRIVATE_KEY) {
            console.error('Undefined Bitmex keys');
            process.exit(1);
        }

        stock = new Bitmex({
            publicKey: Env.BITMEX_PUBLIC_KEY,
            privateKey: Env.BITMEX_PRIVATE_KEY,
        });

    default:
        console.error('Unknown stock');
        process.exit(1);
}

new Server(new Controller(stock));
