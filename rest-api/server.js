const express = require('express');
const bodyParser = require('body-parser');
const { invokeTransaction } = require('./invoke');
const { evaluateTransaction } = require('./query');
const { enrollAdmins, registerAndEnrollUser } = require('./registration');

const app = express()

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.listen(5001, () => { console.log("Server started on port 5001") })

'use strict';

const channelName = 'mychannel';
const chaincodeName = 'basic';

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

// Register and enroll new patient
app.post("/user", async (req, res) => {
    try {
        const firstName = req.body.firstName;
        const lastName = req.body.lastName;
        const email = req.body.email;
        const username = req.body.username;
        const password = req.body.password;
        const encryptionKey = req.body.encryptionKey;
        const identity = req.body.identity;
        const organization = req.body.organization;

        await registerAndEnrollUser(username, organization);

        let fcn = "CreateUser";
        let args = [firstName, lastName, email, username, password, encryptionKey, identity, organization];

        await invokeTransaction(channelName, chaincodeName, organization, username, fcn, args);

        fcn = "QueryUser";
        args = [username];

        const response = await evaluateTransaction(channelName, chaincodeName, organization, username, fcn, args);

        res.json(response);
    }
    catch (error) {
        console.error(`FAILED: ${error}`);
    }
})

// Login
app.post("/login", async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;
        const encryptionKey = req.body.encryptionKey;
        const organization = req.body.organization;

        let fcn = "ValidateLogin";
        let args = [username, password, encryptionKey];

        await invokeTransaction(channelName, chaincodeName, organization, username, fcn, args);

        fcn = "QueryUser";
        args = [username];

        const response = await evaluateTransaction(channelName, chaincodeName, organization, username, fcn, args);

        res.json(response);
    }
    catch (error) {
        console.error(`FAILED: ${error}`);
    }
})

// Get user information
app.get("/user/:username", async (req, res) => {
    try {
        const username = req.params.username;
        const organization = req.body.organization;

        const fcn = "QueryUser";
        const args = [username];

        const response = await evaluateTransaction(channelName, chaincodeName, organization, username, fcn, args);

        res.json(response);
    }
    catch (error) {
        console.error(`FAILED: ${error}`);
    }
})
