export type TEnv = {
    PASSWORD: string;
    BITMEX_PUBLIC_KEY: string;
    BITMEX_PRIVATE_KEY: string;
    STOCK: string;
};

export const Env: TEnv = {
    PASSWORD: String(process.env.PASSWORD),
    BITMEX_PUBLIC_KEY: String(process.env.BITMEX_PUBLIC_KEY),
    BITMEX_PRIVATE_KEY: String(process.env.BITMEX_PRIVATE_KEY),
    STOCK: String(process.env.STOCK),
};
