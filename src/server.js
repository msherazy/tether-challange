'use strict';
const RPC = require('@hyperswarm/rpc');
const DHT = require('hyperdht');
const crypto = require('crypto');
const { initializeDB, db, getLatestData } = require('./db');
const { collectAndStoreData } = require('./data');
const { join } = require('path');

const DHT_STORAGE_PATH = join(__dirname, '../', '../dht_storage');

const main = async () => {
	await initializeDB();

	const dht = new DHT({
		keyPair: DHT.keyPair(crypto.randomBytes(32)),
		bootstrap: [{ host: '127.0.0.1', port: 30001 }],
		storage: DHT_STORAGE_PATH,
	});
	await dht.ready();

	// Setup RPC server
	const rpc = new RPC({ dht });
	const server = rpc.createServer();

	// Implement RPC methods
	server.respond('getLatestPrices', async (reqRaw) => {
		const { pairs } = JSON.parse(reqRaw.toString('utf-8'));
		const prices = {};
		for (const pair of pairs) {
			const data = await getLatestData(pair);
			prices[pair] = data ? data.averagePrice : null;
		}
		return Buffer.from(JSON.stringify(prices), 'utf-8');
	});

	server.respond('getHistoricalPrices', async (reqRaw) => {
		const { pairs, from, to } = JSON.parse(reqRaw.toString('utf-8'));
		const results = {};
		for (const pair of pairs) {
			const range = db.createReadStream({
				gte: `${pair}:${from}`,
				lte: `${pair}:${to}`,
			});

			const data = [];
			for await (const { value } of range) {
				data.push(value);
			}
			results[pair] = data;
		}
		return Buffer.from(JSON.stringify(results), 'utf-8');
	});

	await server.listen();
	console.log(
		'RPC Server is now listening.',
		'\nPublic Key: (Copy this):',
		server.publicKey.toString('hex'),
	);

	// Start data collection immediately and schedule it every 30 seconds
	await collectAndStoreData();
	setInterval(collectAndStoreData, 30000);
};

main().catch(console.error);
