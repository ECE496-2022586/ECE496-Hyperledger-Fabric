const fs = require('fs');
const path = require('path');
const FabricCAServices = require('fabric-ca-client');

'use strict';

const adminUserId = 'admin';
const adminUserPasswd = 'adminpw';

const organizations = {
    hospital: {
        name: "hospital",
        peer: "hospital.example.com",
        msp: "HospitalMSP",
        caHostName: "ca.hospital.example.com",
        jsonCCP: "connection-hospital.json"
    },
    laboratory: {
        name: "laboratory",
        peer: "laboratory.example.com",
        msp: "LaboratoryMSP",
        caHostName: "ca.laboratory.example.com",
        jsonCCP: "connection-laboratory.json"
    }
}

exports.buildCCP = (organization) => {
	// load the common connection configuration file
	const ccpPath = path.resolve(__dirname, '..', 'test-network', 'organizations', 'peerOrganizations', organizations[organization].peer, organizations[organization].jsonCCP);
	const fileExists = fs.existsSync(ccpPath);
	if (!fileExists) {
		throw new Error(`no such file or directory: ${ccpPath}`);
	}
	const contents = fs.readFileSync(ccpPath, 'utf8');

	// build a JSON object from the file contents
	const ccp = JSON.parse(contents);

	console.log(`Loaded the network configuration located at ${ccpPath}`);
	return ccp;
};

exports.buildWallet = async (Wallets, walletPath) => {
	// Create a new  wallet : Note that wallet is for managing identities.
	let wallet;
	if (walletPath) {
		wallet = await Wallets.newFileSystemWallet(walletPath);
		console.log(`Built a file system wallet at ${walletPath}`);
	} else {
		wallet = await Wallets.newInMemoryWallet();
		console.log('Built an in memory wallet');
	}

	return wallet;
};

exports.buildCAClient = (ccp, organization) => {
	// Create a new CA client for interacting with the CA.
	const caInfo = ccp.certificateAuthorities[organizations[organization].caHostName]; //lookup CA details from config
	const caTLSCACerts = caInfo.tlsCACerts.pem;
	const caClient = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

	console.log(`Built a CA Client named ${caInfo.caName}`);
	return caClient;
};

exports.enrollAdmin = async (caClient, wallet, organization) => {
	try {
		// Check to see if we've already enrolled the admin user.
		const identity = await wallet.get(adminUserId);
		if (identity) {
			console.log('An identity for the admin user already exists in the wallet');
			return;
		}

		// Enroll the admin user, and import the new identity into the wallet.
		const enrollment = await caClient.enroll({ enrollmentID: adminUserId, enrollmentSecret: adminUserPasswd });
		const x509Identity = {
			credentials: {
				certificate: enrollment.certificate,
				privateKey: enrollment.key.toBytes(),
			},
			mspId: organizations[organization].msp,
			type: 'X.509',
		};
		await wallet.put(adminUserId, x509Identity);
		console.log('Successfully enrolled admin user and imported it into the wallet');
	} catch (error) {
		console.error(`Failed to enroll admin user : ${error}`);
	}
};

exports.prettyJSONString = (inputString) => {
	if (inputString) {
		 return JSON.stringify(JSON.parse(inputString), null, 2);
	}
	else {
		 return inputString;
	}
}