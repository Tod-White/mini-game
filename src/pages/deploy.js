import React, { useState } from 'react';
import { parseEther } from 'ethers';
import { deployToken } from '../services/tokenService';

export default function Deploy() {
    const [name, setName] = useState('');
    const [symbol, setSymbol] = useState('');
    const [totalSupply, setTotalSupply] = useState('');
    const [isDeploying, setIsDeploying] = useState(false);
    const [deployedAddress, setDeployedAddress] = useState('');
    const [error, setError] = useState('');

    const handleDeploy = async (e) => {
        e.preventDefault();
        setError('');
        setIsDeploying(true);
        setDeployedAddress('');

        try {
            // Convert total supply to wei (18 decimals)
            const totalSupplyInWei = parseEther(totalSupply);

            // Deploy the token
            const result = await deployToken(
                name,
                symbol,
                totalSupplyInWei
            );

            setDeployedAddress(result);
        } catch (err) {
            console.error('Deployment error:', err);
            setError(err.message || 'Failed to deploy token');
        } finally {
            setIsDeploying(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Deploy New Prayer Token</h1>
            
            <form onSubmit={handleDeploy} className="max-w-lg">
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Token Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="e.g., Peace Token, Love Token, Zen Token"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Token Symbol
                    </label>
                    <input
                        type="text"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="e.g., PEACE, LOVE, ZEN"
                        required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                        3-5 uppercase letters only
                    </p>
                </div>

                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Total Supply
                    </label>
                    <input
                        type="number"
                        value={totalSupply}
                        onChange={(e) => setTotalSupply(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="e.g., 1000000, 7777777, 8888888"
                        required
                        min="0"
                        step="any"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                        Total number of tokens to mint initially
                    </p>
                </div>

                <div className="mb-6">
                    <p className="text-sm text-gray-600">
                        Each prayer will earn 1 token
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={isDeploying}
                    className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                        isDeploying ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                    {isDeploying ? 'Deploying...' : 'Deploy Token'}
                </button>
            </form>

            {error && (
                <div className="mt-4 text-red-500">
                    {error}
                </div>
            )}

            {deployedAddress && (
                <div className="mt-4">
                    <h2 className="text-xl font-bold mb-2">Deployment Successful!</h2>
                    <p>Token Address: {deployedAddress}</p>
                </div>
            )}
        </div>
    );
} 