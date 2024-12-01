'use strict';

const axios = require('axios');
const { storeData } = require('../db');
const { sleep } = require('../utils');
const messages = require('../constants/messages');
const { createLogger, transports, format } = require('winston');

const logger = createLogger({
	level: 'info',
	format: format.combine(
		format.timestamp(),
		format.printf(
			({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`,
		),
	),
	transports: [new transports.Console()],
});

const COINGECKO_API_URL =
	process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';
const RETRY_DELAY = parseInt(process.env.RETRY_DELAY, 10) || 2000;
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES, 10) || 3;

class FetchError extends Error {
	constructor(message, status) {
		super(message);
		this.name = 'FetchError';
		this.status = status;
	}
}

const fetchTopCryptocurrencies = async (retries = MAX_RETRIES) => {
	try {
		const response = await axios.get(`${COINGECKO_API_URL}/coins/markets`, {
			params: {
				vs_currency: 'usd',
				order: 'market_cap_desc',
				per_page: 5,
				page: 1,
				sparkline: false,
			},
		});
		return response.data.map((coin) => coin.id);
	} catch (error) {
		if (error.response && error.response.status === 429 && retries > 0) {
			logger.warn(messages.RATE_LIMIT_EXCEEDED);
			await sleep(RETRY_DELAY);
			return fetchTopCryptocurrencies(retries - 1);
		} else {
			logger.error(
				`${messages.ERROR_FETCHING_TOP_CRYPTOCURRENCIES} ${error.message}`,
			);
			throw new FetchError(
				messages.FAILED_TO_FETCH_TOP_CRYPTOCURRENCIES,
				error.response?.status,
			);
		}
	}
};

const fetchTopExchanges = async (coinId, retries = MAX_RETRIES) => {
	try {
		const response = await axios.get(
			`${COINGECKO_API_URL}/coins/${coinId}/tickers`,
		);
		const tickers = response.data.tickers.filter(
			(ticker) => ticker.target === 'USD',
		);
		return tickers
			.sort((a, b) => a.trust_score_rank - b.trust_score_rank)
			.slice(0, 1);
	} catch (error) {
		if (error.response && error.response.status === 429 && retries > 0) {
			logger.warn(`${messages.RATE_LIMIT_EXCEEDED} for ${coinId}`);
			await sleep(RETRY_DELAY);
			return fetchTopExchanges(coinId, retries - 1);
		} else {
			logger.error(
				`${messages.ERROR_FETCHING_EXCHANGES} ${coinId}: ${error.message}`,
			);
			throw new FetchError(
				`${messages.FAILED_TO_FETCH_EXCHANGES} ${coinId}`,
				error.response?.status,
			);
		}
	}
};

const collectAndStoreData = async () => {
	try {
		const coins = await fetchTopCryptocurrencies();
		for (const coinId of coins) {
			await sleep(1000);

			const exchanges = await fetchTopExchanges(coinId);
			const prices = exchanges.map((exchange) => parseFloat(exchange.last));
			const validPrices = prices.filter((price) => !isNaN(price));

			if (validPrices.length > 0) {
				const averagePrice =
					validPrices.reduce((sum, price) => sum + price, 0) /
					validPrices.length;
				const timestamp = Date.now();

				const data = {
					coinId,
					averagePrice,
					exchanges: exchanges.map((exchange) => ({
						name: exchange.market.name,
						price: exchange.last,
					})),
					timestamp,
				};

				const key = `${coinId}:${timestamp}`;
				await storeData(key, data);
				logger.info(
					`${messages.STORED_DATA} ${coinId} at ${new Date(timestamp).toISOString()}`,
				);
			} else {
				logger.warn(`${messages.NO_VALID_PRICES_FOUND} ${coinId}`);
			}
		}
	} catch (error) {
		logger.error(
			`${messages.ERROR_IN_COLLECT_AND_STORE_DATA} ${error.message}`,
		);
	}
};

module.exports = {
	collectAndStoreData,
};
