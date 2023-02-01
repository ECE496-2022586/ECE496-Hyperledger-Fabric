const path = require('path');
const { Gateway, Wallets } = require('fabric-network');
const { buildCCP, buildWallet, buildCAClient, enrollAdmin } = require('./helper');

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

exports.enrollAdmins = async () => {
    try {
        for (let organization in organizations) {
            const ccp = buildCCP(organization);
            const caClient = buildCAClient(ccp, organization);
            const walletPath = path.join(__dirname, 'wallet/' + organization);
            const wallet = await buildWallet(Wallets, walletPath);

            await enrollAdmin(caClient, wallet, organization)
        }
    } catch (error) {
        console.error(`FAILED: ${error}`);
    }
}

exports.registerAndEnrollUser = async (username, organization, affiliation) => {
    try {
        const ccp = buildCCP(organization);
        const caClient = buildCAClient(ccp, organization);
        const walletPath = path.join(__dirname, 'wallet/' + organization);
        const wallet = await buildWallet(Wallets, walletPath);

        // Check to see if we've already enrolled the user
        const userIdentity = await wallet.get(username);
        if (userIdentity) {
            console.log(`An identity for the user ${username} already exists in the wallet`);
            return;
        }

        // Must use an admin to register a new user
        const adminIdentity = await wallet.get(adminUserId);
        if (!adminIdentity) {
            console.log('An identity for the admin user does not exist in the wallet');
            console.log('Enroll the admin user before retrying');
            return;
        }

        // build a user object for authenticating with the CA
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, adminUserId);

        // Register the user, enroll the user, and import the new identity into the wallet.
        // if affiliation is specified by client, the affiliation value must be configured in CA
        const secret = await caClient.register({
            affiliation: affiliation,
            enrollmentID: username,
            role: 'client'
        }, adminUser);
        const enrollment = await caClient.enroll({
            enrollmentID: username,
            enrollmentSecret: secret
        });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: organizations[organization].msp,
            type: 'X.509',
        };
        await wallet.put(username, x509Identity);
        console.log(`Successfully registered and enrolled user ${username} and imported it into the wallet`);
    } catch (error) {
        console.error(`Failed to register user : ${error}`);
    }
};
