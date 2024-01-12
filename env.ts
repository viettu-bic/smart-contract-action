import 'dotenv/config';

export type Environment = {
    API_KEY: string;
    PRIVATE_KEY: string;
    MNEMONIC: string;
    MNEMONIC_PASSPHRASE: string;
}

const env = (): Environment => {
    return {
        API_KEY: process.env.API_KEY as string,
        MNEMONIC: process.env.MNEMONIC as string,
        PRIVATE_KEY: process.env.PRIVATE_KEY as string,
        MNEMONIC_PASSPHRASE: process.env.MNEMONIC_PASSPHRASE as string,
    }
};

export default env();
