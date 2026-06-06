import { rpc, TransactionBuilder, xdr, Networks, Address, nativeToScVal, Account } from '@stellar/stellar-sdk';
import { getNetworkConfig, signAndSubmitTransaction, getFreighterPublicKey } from './stellar';

const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || '';

function getServer(): rpc.Server {
    return new rpc.Server(getNetworkConfig().rpcUrl);
}

export async function getAllOffers(): Promise<any[]> {
    if (!CONTRACT_ID) return [];
    
    const server = getServer();
    const scVal = xdr.ScVal.scvSymbol('get_all_offers');
    
    // We can simulate the read-only transaction:
    
    try {
        const response = await server.simulateTransaction(
            new TransactionBuilder(new Account('GCNZRR3Y7BEMDXX6UHRZUDZAZCWWJ6YYG6YZKFYE7E7X3BZZY3Y6J5ZJ', '0'), {
                fee: '100',
                networkPassphrase: Networks.TESTNET
            })
            .addOperation(xdr.Operation.invokeHostFunction({
                hostFunction: xdr.HostFunction.hostFunctionTypeInvokeContract(
                    new xdr.InvokeContractArgs({
                        contractAddress: new Address(CONTRACT_ID).toScAddress(),
                        functionName: 'get_all_offers',
                        args: []
                    })
                )
            }))
            .setTimeout(30)
            .build()
        );

        if (rpc.Api.isSimulationSuccess(response) && response.result) {
            return response.result.retval; // The Vector of Offers (Raw ScVal)
        }
    } catch (e) {
        console.error('Failed to get offers:', e);
    }
    return [];
}

export async function createOffer(tokenA: string, amountA: number, tokenB: string, amountB: number): Promise<void> {
    const pubKey = await getFreighterPublicKey();
    if (!pubKey) throw new Error("Wallet not connected");

    const server = getServer();
    const account = await server.getAccount(pubKey);

    const tx = new TransactionBuilder(account, {
        fee: '1000',
        networkPassphrase: getNetworkConfig().networkPassphrase,
    })
    .addOperation(createInvokeOperation('create_offer', [
        new Address(pubKey).toScVal(),
        new Address(tokenA).toScVal(),
        nativeToScVal(amountA * 10_000_000, { type: 'i128' }),
        new Address(tokenB).toScVal(),
        nativeToScVal(amountB * 10_000_000, { type: 'i128' }),
    ]))
    .setTimeout(30)
    .build();

    const simulated = await server.simulateTransaction(tx);
    if (!rpc.Api.isSimulationSuccess(simulated)) {
        throw new Error('Transaction simulation failed');
    }

    const assembledTx = rpc.assembleTransaction(tx, simulated).build();
    const signedXdr = await signAndSubmitTransaction(assembledTx.toXDR());
    
    const submittedTx = TransactionBuilder.fromXDR(signedXdr, getNetworkConfig().networkPassphrase);
    await server.sendTransaction(submittedTx as any);
}

export async function fillOffer(offerId: number): Promise<void> {
    const pubKey = await getFreighterPublicKey();
    if (!pubKey) throw new Error("Wallet not connected");

    const server = getServer();
    const account = await server.getAccount(pubKey);

    const tx = new TransactionBuilder(account, {
        fee: '1000',
        networkPassphrase: getNetworkConfig().networkPassphrase,
    })
    .addOperation(createInvokeOperation('fill_offer', [
        new Address(pubKey).toScVal(),
        nativeToScVal(offerId, { type: 'u64' }),
    ]))
    .setTimeout(30)
    .build();

    const simulated = await server.simulateTransaction(tx);
    if (!rpc.Api.isSimulationSuccess(simulated)) {
        throw new Error('Transaction simulation failed');
    }

    const assembledTx = rpc.assembleTransaction(tx, simulated).build();
    const signedXdr = await signAndSubmitTransaction(assembledTx.toXDR());
    
    const submittedTx = TransactionBuilder.fromXDR(signedXdr, getNetworkConfig().networkPassphrase);
    await server.sendTransaction(submittedTx as any);
}

function createInvokeOperation(method: string, args: xdr.ScVal[]) {
    return xdr.Operation.invokeHostFunction({
        hostFunction: xdr.HostFunction.hostFunctionTypeInvokeContract(
            new xdr.InvokeContractArgs({
                contractAddress: new Address(CONTRACT_ID).toScAddress(),
                functionName: method,
                args: args
            })
        )
    });
}
