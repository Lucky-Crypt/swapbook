import { isConnected, getAddress, signTransaction } from '@stellar/freighter-api';

export const getNetworkConfig = () => {
    return {
        rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://soroban-testnet.stellar.org',
        networkPassphrase: process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
        horizonUrl: process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org',
    };
};

export async function getFreighterPublicKey(): Promise<string | null> {
    try {
        if (await isConnected()) {
            const address = await getAddress();
            return address.address;
        }
    } catch (e) {
        console.error('Error connecting Freighter:', e);
    }
    return null;
}

export async function fundWithFriendbot(publicKey: string): Promise<boolean> {
    try {
        const resp = await fetch(`https://friendbot.stellar.org/?addr=${publicKey}`);
        return resp.ok;
    } catch (e) {
        console.error('Friendbot error:', e);
        return false;
    }
}

export async function signAndSubmitTransaction(xdr: string): Promise<string> {
    const { networkPassphrase } = getNetworkConfig();
    try {
        const signedXdr = await signTransaction(xdr, { networkPassphrase, network: 'TESTNET' });
        return typeof signedXdr === 'string' ? signedXdr : signedXdr.transaction;
    } catch (e) {
        console.error("Sign error", e);
        throw e;
    }
}