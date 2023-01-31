const express = require('express');
const bodyParser = require('body-parser');
const { invokeTransaction } = require('./invoke');
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

// Register and enroll new user
app.post("/user", async (req, res) => {
    try {
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
