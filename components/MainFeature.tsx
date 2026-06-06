"use client";
import React, { useState, useEffect } from 'react';
import { getAllOffers, createOffer, fillOffer } from '../lib/contract';
import WalletConnect from './WalletConnect';

export default function MainFeature() {
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [tokenA, setTokenA] = useState('');
    const [amountA, setAmountA] = useState('');
    const [tokenB, setTokenB] = useState('');
    const [amountB, setAmountB] = useState('');

    const loadOffers = async () => {
        setLoading(true);
        try {
            const res = await getAllOffers();
            setOffers(res);
        } catch (e: any) {
            setError(e.message);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadOffers();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await createOffer(tokenA, parseFloat(amountA), tokenB, parseFloat(amountB));
            alert("Offer created successfully!");
            loadOffers();
        } catch (e: any) {
            setError(e.message);
        }
        setLoading(false);
    };

    const handleFill = async (offerId: number) => {
        setLoading(true);
        setError(null);
        try {
            await fillOffer(offerId);
            alert("Offer filled successfully!");
            loadOffers();
        } catch (e: any) {
            setError(e.message);
        }
        setLoading(false);
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl text-white">
            <header className="flex justify-between items-center mb-10 border-b border-slate-700 pb-4">
                <h1 className="text-3xl font-bold text-primary">Swapbook</h1>
                <WalletConnect />
            </header>

            {error && (
                <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
                    {error}
                </div>
            )}

            <main className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Create Offer Form */}
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h2 className="text-2xl font-bold mb-6">Post Swap Offer</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Token A (You Give) Contract ID</label>
                            <input required value={tokenA} onChange={e => setTokenA(e.target.value)} type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" placeholder="C..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Amount A (You Give)</label>
                            <input required value={amountA} onChange={e => setAmountA(e.target.value)} type="number" step="any" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" placeholder="0.0" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Token B (You Want) Contract ID</label>
                            <input required value={tokenB} onChange={e => setTokenB(e.target.value)} type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" placeholder="C..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Amount B (You Want)</label>
                            <input required value={amountB} onChange={e => setAmountB(e.target.value)} type="number" step="any" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" placeholder="0.0" />
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-blue-400 text-slate-900 font-bold py-3 rounded-lg mt-4 transition">
                            {loading ? 'Processing...' : 'Post Offer'}
                        </button>
                    </form>
                </div>

                {/* Open Offers */}
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Open Offers</h2>
                        <button onClick={loadOffers} className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded">Refresh</button>
                    </div>

                    {offers.length === 0 ? (
                        <div className="text-slate-400 text-center py-10">No offers found.</div>
                    ) : (
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                            {offers.map((offer, idx) => (
                                <div key={idx} className="bg-slate-900 p-4 rounded-lg border border-slate-700 flex justify-between items-center">
                                    <div className="text-sm space-y-1">
                                        <p><span className="text-slate-500">Give:</span> {offer.amount_b} Token B</p>
                                        <p><span className="text-slate-500">Get:</span> {offer.amount_a} Token A</p>
                                    </div>
                                    <button 
                                        onClick={() => handleFill(offer.id)}
                                        disabled={loading}
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold"
                                    >
                                        Fill Offer
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
