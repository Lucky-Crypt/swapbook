"use client";
import React, { useState, useEffect } from 'react';
import { getFreighterPublicKey, fundWithFriendbot } from '../lib/stellar';

export default function WalletConnect() {
    const [address, setAddress] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkConnection();
    }, []);

    const checkConnection = async () => {
        const key = await getFreighterPublicKey();
        if (key) setAddress(key);
    };

    const handleConnect = async () => {
        setLoading(true);
        setError(null);
        try {
            const key = await getFreighterPublicKey();
            if (key) {
                setAddress(key);
            } else {
                setError("Freighter not found or connection rejected.");
            }
        } catch (e: any) {
            setError(e.message);
        }
        setLoading(false);
    };

    const handleFund = async () => {
        if (!address) return;
        setLoading(true);
        setError(null);
        try {
            const success = await fundWithFriendbot(address);
            if (!success) setError("Failed to fund via Friendbot.");
            else alert("Account funded on Testnet!");
        } catch (e: any) {
            setError(e.message);
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col items-end gap-2 p-4">
            {error && <div className="text-red-500 text-sm">{error}</div>}
            {address ? (
                <div className="flex gap-4 items-center flex-wrap">
                    <span className="bg-slate-800 text-primary px-4 py-2 rounded-lg font-mono text-sm">
                        {address.slice(0, 4)}...{address.slice(-4)}
                    </span>
                    <button 
                        onClick={handleFund} 
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
                    >
                        {loading ? 'Funding...' : 'Get Testnet XLM'}
                    </button>
                    <button 
                        onClick={() => setAddress(null)} 
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
                    >
                        Disconnect
                    </button>
                </div>
            ) : (
                <button 
                    onClick={handleConnect} 
                    disabled={loading}
                    className="bg-primary hover:bg-blue-400 text-slate-900 font-bold px-6 py-2 rounded-lg transition"
                >
                    {loading ? 'Connecting...' : 'Connect Wallet'}
                </button>
            )}
        </div>
    );
}
