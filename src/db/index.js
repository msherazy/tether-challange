'use strict';

const Hypercore = require('hypercore');
const Hyperbee = require('hyperbee');
const path = require('path');

// Define the database directory outside of src
const DB_PATH = path.join(__dirname, '../../db/prices');

// Create or open a Hypercore-based database
const hypercoreInstance = new Hypercore(DB_PATH, { valueEncoding: 'json' });
const db = new Hyperbee(hypercoreInstance, {
	keyEncoding: 'utf-8',
	valueEncoding: 'json',
});

// Function to initialize the database
const initializeDB = async () => {
	try {
		await db.ready();
		console.log('Database initialized and ready to use!');
	} catch (error) {
		console.error('Error initializing database:', error.message);
	}
};

// Function to store data
const storeData = async (key, value) => {
	try {
		await db.put(key, value);
		console.log(`Data stored successfully for key: ${key}`);
	} catch (error) {
		console.error(`Error storing data for key ${key}:`, error.message);
	}
};

// Function to retrieve data
const getData = async (key) => {
	try {
		const data = await db.get(key);
		if (data) {
			return data.value;
		} else {
			return null;
		}
	} catch (error) {
		console.error(`Error retrieving data for key ${key}:`, error.message);
		return null;
	}
};

// Function to retrieve the latest data for a coin
const getLatestData = async (coinId) => {
	try {
		const node = await db.peek({
			gte: `${coinId}:`,
			lte: `${coinId}:\xFF`,
			reverse: true,
		});
		if (node) {
			return node.value;
		} else {
			return null;
		}
	} catch (error) {
		console.error(`Error retrieving latest data for ${coinId}:`, error.message);
		return null;
	}
};

module.exports = {
	db,
	initializeDB,
	storeData,
	getData,
	getLatestData,
};
