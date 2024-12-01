'use strict';

const RPC = require('@hyperswarm/rpc');
const DHT = require('hyperdht');
const crypto = require('crypto');
const path = require('path');
const messages = require('../constants/messages');

const DHT_STORAGE_PATH = path.join(__dirname, '../', '../dht_storage');

const main = async () => {
	const dht = new DHT({
		keyPair: DHT.keyPair(crypto.randomBytes(32)),
		bootstrap: [{ host: '127.0.0.1', port: 30001 }],
		storage: DHT_STORAGE_PATH, // Uncomment if hyperdht supports the 'storage' option
	});
	await dht.ready();

	const serverPubKey = Buffer.from(
		'a10aa875346e13ae0d885f3bbca54cfd913c7af43419161502149a2fd6ac8540', // Replace with server's public key
		'hex',
	);

	// Setup RPC client
	const rpc = new RPC({ dht });
	const client = rpc.connect(serverPubKey);

	try {
		// Request latest prices
		const latestPricesPayload = { pairs: ['bitcoin', 'ethereum'] };
		const latestPricesRaw = await client.request(
			'getLatestPrices',
			Buffer.from(JSON.stringify(latestPricesPayload), 'utf-8'),
		);
		const latestPrices = JSON.parse(latestPricesRaw.toString('utf-8'));
		console.log('Latest Prices:', latestPrices);

		// Request historical prices
		const toTimestamp = Date.now();
		const fromTimestamp = toTimestamp - 3600000; // 1 hour ago

		const historicalPricesPayload = {
			pairs: ['bitcoin', 'ethereum'],
			from: fromTimestamp,
			to: toTimestamp,
		};
		const historicalPricesRaw = await client.request(
			'getHistoricalPrices',
			Buffer.from(JSON.stringify(historicalPricesPayload), 'utf-8'),
		);
		const historicalPrices = JSON.parse(historicalPricesRaw.toString('utf-8'));
		console.log('Historical Prices:', historicalPrices);
	} catch (error) {
		console.error(`${messages.ERROR_DURING_RPC_CALLS} ${error}`);
	} finally {
		// Clean up
		await client.end();
		await rpc.destroy();
		await dht.destroy();
	}
};

main().catch(console.error);
