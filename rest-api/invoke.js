const path = require('path');
const { Gateway, Wallets } = require('fabric-network');
const { buildCCP, buildWallet } = require('./helper');

exports.invokeTransaction = async (channelName, chaincodeName, organization, username, fcn, args) => {
    const ccp = buildCCP(organization);
    const walletPath = path.join(__dirname, 'wallet/' + organization);
    const wallet = await buildWallet(Wallets, walletPath);
    const adminUserId = 'admin';

    // Check to see if we've already enrolled an admin
    const identity = await wallet.get(adminUserId);
    if (!identity) {
        console.error('An identity for the admin user does not exist in the wallet');
        throw {code : 500, message : "Internal Server Error."};
    }

    // Check to see if we've already enrolled the user
    const userIdentity = await wallet.get(username);
    if (!userIdentity) {
        console.error(`No identity for the user ${username} exists in the wallet`);
        throw {code : 404, message : "User does not exist."};
    }

    // Create a new gateway instance for interacting with the fabric network.
    // In a real application this would be done as the backend server session is setup for
    // a user that has been verified.
    const gateway = new Gateway();

    // setup the gateway instance
    // The user will now be able to create connections to the fabric network and be able to
    // submit transactions and query. All transactions submitted by this gateway will be
    // signed by this user using the credentials stored in the wallet.
    await gateway.connect(ccp, {
        wallet,
        identity: username,
        discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
    });

    // Build a network instance based on the channel where the smart contract is deployed
    const network = await gateway.getNetwork(channelName);

    // Get the contract from the network.
    const contract = network.getContract(chaincodeName);

    // Perform transaction based on fcn
    console.log(`\n--> Submit Transaction: ${fcn}`);
    await contract.submitTransaction(fcn, ...args);

    gateway.disconnect();
}