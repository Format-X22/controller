import { Controller } from './server/Controller';
import { Web } from './server/Web';
import { IStock } from './stock/IStock';
import { Bitmex } from './stock/Bitmex';
import { Env } from './data/Env';

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
        break;

    default:
        console.error('Unknown stock');
        process.exit(1);
}

new Web(new Controller(stock));
