import { Contract } from 'ethers';
import { TokenFactoryABI, MineableTokenABI } from '../contracts/abis';
import { FACTORY_ADDRESS } from '../config/contracts';

export const deployToken = async (name, symbol, totalSupply) => {
    try {
        // Get the provider and signer
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        // Create factory contract instance
        const factory = new Contract(FACTORY_ADDRESS, TokenFactoryABI, signer);

        // Deploy new token
        const tx = await factory.deployToken(name, symbol, totalSupply);
        const receipt = await tx.wait();

        // Get the deployed token address from the event
        const event = receipt.logs.find(
            log => log.topics[0] === factory.interface.getEvent('TokenDeployed').topicHash
        );
        const parsedEvent = factory.interface.parseLog(event);
        const tokenAddress = parsedEvent.args.tokenAddress;

        return tokenAddress;
    } catch (error) {
        console.error('Error deploying token:', error);
        throw error;
    }
}; 