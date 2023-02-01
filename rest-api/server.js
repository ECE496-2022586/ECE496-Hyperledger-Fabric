'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const { invokeTransaction } = require('./invoke');
const { enrollAdmins, registerAndEnrollUser } = require('./registration');
const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../test-application/javascript/CAUtil.js');
const { buildCCPHospital, buildWallet, invoke} = require('../test-application/javascript/AppUtil.js');

const app = express()

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.listen(5001, () => { console.log("Server started on port 5001") })

const channelName = 'mychannel';
const chaincodeName = 'basic';

app.post("/inittest", (req, res) => {
    console.log('Post: committed');
    let response = {
       message: "Post: committed" 
    }
    res.json(response)
})

app.post('/registerUser', async (req, res) => {
    
    const ccp = buildCCPHospital();
    const caClient = buildCAClient(FabricCAServices, ccp, 'ca.hospital.example.com');
    const wallet = await buildWallet(Wallets, walletPath);
    await enrollAdmin(caClient, wallet, mspHospital);
    await registerAndEnrollUser(caClient, wallet, mspHospital, hospitalUserId, 'hospital.department1');
    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet,
        identity: hospitalUserId,
        discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
    });

    let username = "Mahshad";
    let password = "password";
    let identity = "patientId";
    let id = "2";
    const args = [username,password,identity,id];
    console.log(args)

    let response = await invoke(false, 'registerUser', args, gateway);

    console.log("done invoke")
    console.log(response)

    if (response.error) {
        res.send(response.error);
    } else {
        console.log('response: ');
        console.log(response);
        // let parsedResponse = await JSON.parse(response);
        res.send(response);
    }
});

app.post('/queryUser', async (req, res) => {
    
    const ccp = buildCCPHospital();
    const caClient = buildCAClient(FabricCAServices, ccp, 'ca.hospital.example.com');
    const wallet = await buildWallet(Wallets, walletPath);
    await enrollAdmin(caClient, wallet, mspHospital);
    await registerAndEnrollUser(caClient, wallet, mspHospital, hospitalUserId, 'hospital.department1');
    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet,
        identity: hospitalUserId,
        discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
    });

    let username = "ahoosa";
    const args = [username];
    let response = await invoke(true,'queryUser',args,gateway);
    if (response.error) {
      console.log('inside ERROR');
      res.send(response.error);
    } else {
      console.log('inside ELSE');
      res.send(response);
    }
});

// Enroll admins
app.post("/admins", async (req, res) => {
    try {
        await enrollAdmins()

        let response = {
            message: "SUCCESS: All admins were successfully enrolled."
        }

        res.json(response)
    }
    catch (error) {
        console.error(`FAILED: ${error}`);
    }
})

// Register and enroll new user
app.post("/user", async (req, res) => {
    try {
        // build an in memory object with the network configuration (also known as a connection profile)
        const ccp = buildCCPHospital();

        // build an instance of the fabric ca services client based on
        // the information in the network configuration
        const caClient = buildCAClient(FabricCAServices, ccp, 'ca.hospital.example.com');

        // setup the wallet to hold the credentials of the application user
        const wallet = await buildWallet(Wallets, walletPath);

        // in a real application this would be done on an administrative flow, and only once
        await enrollAdmin(caClient, wallet, mspHospital);

        // in a real application this would be done only when a new user was required to be added
        // and would be part of an administrative flow
        await registerAndEnrollUser(caClient, wallet, mspHospital, hospitalUserId, 'hospital.department1');

        // setup the gateway instance
        // The user will now be able to create connections to the fabric network and be able to
        // submit transactions and query. All transactions submitted by this gateway will be
        // signed by this user using the credentials stored in the wallet.
        await gateway.connect(ccp, {
            wallet,
            identity: hospitalUserId,
            discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
        });
        const username = req.body.username;
        const organization = req.body.organization;
        const affiliation = req.body.affiliation;

        await registerAndEnrollUser(username, organization, affiliation)

        const fcn = "CreateUser"
        const args = {
            username: username
        }

        await invokeTransaction(channelName, chaincodeName, fcn, args, username, organization)

        let response = {
            message: "SUCCESS: User has been successfully registered and enrolled."
        }

        res.json(response)
    }
    catch (error) {
        console.error(`FAILED: ${error}`);
    }
})

app.listen(3000, () => { console.log("Server started on port 3000") })
