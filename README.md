# Assesment ( Cryptocurrency Data Gathering Application ) - Muhammad Sheraz Yaseen

---

## Prerequisites

- **Node.js** (version 14 or higher)
- **npm** (comes with Node.js)
- **hyperdht** (installed globally)
  - Install by running: `npm install -g hyperdht`

---

## Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/msherazy/tether-challange.git
   cd tether-challange
   ```

2. **Install Project Dependencies**

   ```bash
   npm install
   ```
3. **Environment Variables ( Will be shared on the email)**

```
COINGECKO_API_URL=
RETRY_DELAY=
MAX_RETRIES=
```

---

## Running the Application

### Step 1: Start the Bootstrap DHT Node

Open a terminal window and run:

```bash
npm run start:db
```

This command starts the bootstrap node for the Distributed Hash Table (DHT) network, which is essential for service
discovery in Hyperswarm.

---

### Step 2: Start the Server

Open a second terminal window, navigate to the project directory, and run:

```bash
npm run start:server
```

This will start the server, which:

- Initializes the Hyperbee database.
- Starts collecting data from the CoinGecko API at regular intervals (every 30 seconds).
- Exposes RPC methods for clients to retrieve data.

**Server Output**

You should see output similar to:

```
Database initialized and ready to use!
RPC Server is now listening.
Public Key: (Copy this): YOUR_SERVER_PUBLIC_KEY
```

**Important:** Copy the public key displayed in the output. You'll need it for the client setup in the next step.

---

### Step 3: Update the Client with the Server's Public Key

Before running the client, you need to update it with the server's public key to enable proper communication.

1. **Open `client.js`**

   ```bash
   nano src/client.js
   ```

   Or use your preferred code editor.

2. **Locate the `serverPubKey` Variable**

   Find the following code snippet (around line 19):

   ```javascript
   const serverPubKey = Buffer.from(
   	'ce4f02ad03894b108c6dac470b79eab741c14deb5750ee9fc299730f9ea29c98', // <-- replace this
   	'hex',
   );
   ```

3. **Replace the Public Key**

   Replace `'ce4f02ad03894b108c6dac470b79eab741c14deb5750ee9fc299730f9ea29c98'` with the public key you copied from the
   server output.

   For example:

   ```javascript
   const serverPubKey = Buffer.from(
   	'48bdb0c92c96052e54d885ddbc7ee89d1e8f990f6dfd700402be15b90e1c1553', // <-- your server's public key
   	'hex',
   );
   ```

   **Save and close the file.**

---

### Step 4: Run the Client

In the same terminal where you edited the client or a new one, run:

```bash
npm run start:client
```

This will start the client, which will:

- Connect to the server using the provided public key.
- Request the latest prices for specified cryptocurrency pairs.
- Request historical prices within a specified time range.

**Client Output**

You should see output similar to:

```
Latest Prices: { bitcoin: 50000, ethereum: 4000 }
Historical Prices:
{
  bitcoin: [
    {
      coinId: 'bitcoin',
      averagePrice: 50000,
      exchanges: [Array],
      timestamp: 1733036156647
    },
    ...
  ],
  ethereum: [
    {
      coinId: 'ethereum',
      averagePrice: 4000,
      exchanges: [Array],
      timestamp: 1733036157135
    },
    ...
  ]
}
```

---

## Project Structure

```
tether-challenge/
├── db/                    # Database files
├── node_modules/          # Dependencies
├── src/                   # Application source code
│   ├── constants/         # Application constants
│   ├── data/              # Data-related logic
│   ├── db/                # Database-related logic
│   ├── services/          # Client and server-side service logic
│   ├── utils/             # Helper functions
│   └── index.js           # Main entry point for the application
├── .env                   # Environment variables
├── .gitignore             # Files to ignore in version control
├── package.json           # Project metadata and dependencies
└── README.md              # Documentation for the project
```

---

## Notes

- **Server Public Key Changes:** The server's public key will change each time it restarts. Always update the client
  with the new public key after restarting the server.
- **Data Collection Interval:** The server collects data every 30 seconds. You might need to wait a bit before
  historical data is available.
- **API Rate Limits:** Be mindful of CoinGecko's API rate limits. The code includes retry logic and delays to handle
  rate limiting.

---

## Troubleshooting

- **Port Conflicts:** Ensure no other services are running on the same ports used by the bootstrap node or your
  application.
- **Network Issues:** If running on different machines, ensure they can reach each other over the network and that
  firewall settings allow the necessary ports.
- **Error Logs:** Check server and client logs for detailed error messages.

---
