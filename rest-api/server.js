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
            message: "SUCCESS: All admins are enrolled."
        }

        res.json(response)
    }
    catch (error) {
        console.error(`FAILED: ${error}`);
    }
})

// Register and enroll new patient
app.post("/patient", async (req, res) => {
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

        let fcn = "CreatePatient";
        let args = [firstName, lastName, email, username, password, encryptionKey, identity, organization];

        await invokeTransaction(channelName, chaincodeName, organization, username, fcn, args);

        fcn = "QueryPatient";
        args = [username];

        const response = await evaluateTransaction(channelName, chaincodeName, organization, username, fcn, args);

        res.json(response);
    }
    catch (error) {
        console.error(`FAILED: ${error}`);
    }
})

// Register and enroll new doctor
app.post("/doctor", async (req, res) => {
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

        let fcn = "CreateDoctor";
        let args = [firstName, lastName, email, username, password, encryptionKey, identity, organization];

        await invokeTransaction(channelName, chaincodeName, organization, username, fcn, args);

        fcn = "QueryDoctor";
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
        const identity = req.body.identity;

        let fcn = "ValidateLogin";
        let args = [username, password, encryptionKey];

        await invokeTransaction(channelName, chaincodeName, organization, username, fcn, args);

        if (identity == "patient")
            fcn = "QueryPatient";
        else if (identity == "doctor")
            fcn = "QueryDoctor";

        args = [username];

        const response = await evaluateTransaction(channelName, chaincodeName, organization, username, fcn, args);

        res.json(response);
    }
    catch (error) {
        console.error(`FAILED: ${error}`);
    }
})

// Get patient information
app.get("/patients/:patient", async (req, res) => {
    try {
        const username = req.params.patient;
        const organization = req.body.organization;

        const fcn = "QueryPatient";
        const args = [username];

        const response = await evaluateTransaction(channelName, chaincodeName, organization, username, fcn, args);

        res.json(response);
    }
    catch (error) {
        console.error(`FAILED: ${error}`);
    }
})

// Get doctor information
app.get("/doctors/:doctor", async (req, res) => {
    try {
        const username = req.params.doctor;
        const organization = req.body.organization;

        const fcn = "QueryDoctor";
        const args = [username];

        const response = await evaluateTransaction(channelName, chaincodeName, organization, username, fcn, args);

        res.json(response);
    }
    catch (error) {
        console.error(`FAILED: ${error}`);
    }
})

// Send access request
app.post("/patients/:patient/pendingRequests/:doctor", async (req, res) => {
    try {
        const patient = req.params.patient;
        const doctor = req.params.doctor;
        const organization = req.body.organization;

        let fcn = "SubmitRequest";
        let args = [patient, doctor];

        await invokeTransaction(channelName, chaincodeName, organization, doctor, fcn, args);

        fcn = "QueryPatient";
        args = [patient];

        const response = await evaluateTransaction(channelName, chaincodeName, organization, patient, fcn, args);

        res.json(response);
    }
    catch (error) {
        console.error(`FAILED: ${error}`);
    }
})

// Approve access request
app.post("/patients/:patient/approvedRequests/:doctor", async (req, res) => {
    try {
        const patient = req.params.patient;
        const doctor = req.params.doctor;
        const organization = req.body.organization;
        const encryptionKey = req.body.encryptionKey;

        let fcn = "ApproveRequest";
        let args = [patient, doctor];

        await invokeTransaction(channelName, chaincodeName, organization, patient, fcn, args);

        fcn = "EnableAccess";
        args = [patient, doctor, encryptionKey];

        await invokeTransaction(channelName, chaincodeName, organization, patient, fcn, args);

        fcn = "QueryPatient";
        args = [patient];

        const response = await evaluateTransaction(channelName, chaincodeName, organization, patient, fcn, args);

        res.json(response);
    }
    catch (error) {
        console.error(`FAILED: ${error}`);
    }
})

// Delete access request
app.delete("/patients/:username/approvedRequests/:doctor", async (req, res) => {
    try {
        const patient = req.params.username;
        const doctor = req.params.doctor;
        const organization = req.body.organization;

        let fcn = "RemoveRequest";
        let args = [patient, doctor];

        await invokeTransaction(channelName, chaincodeName, organization, patient, fcn, args);

        fcn = "RemoveAccess";
        args = [patient, doctor];

        await invokeTransaction(channelName, chaincodeName, organization, patient, fcn, args);

        fcn = "QueryPatient";
        args = [patient];

        const response = await evaluateTransaction(channelName, chaincodeName, organization, patient, fcn, args);

        res.json(response);
    }
    catch (error) {
        console.error(`FAILED: ${error}`);
    }
})

app.get("/assets", async (req, res) => {
    try {
        const organization = req.body.organization;
        const username = req.body.username;

        fcn = "GetAllAssets";
        args = [];

        const response = await evaluateTransaction(channelName, chaincodeName, organization, username, fcn, args);

        res.json(response);
    }
    catch (error) {
        console.error(`FAILED: ${error}`);
    }
})

app.get("/assets/:id/history", async (req, res) => {
    try {
        const id = req.params.id;
        const organization = req.body.organization;
        const username = req.body.username;

        fcn = "GetAssetHistory";
        args = [id];

        const response = await evaluateTransaction(channelName, chaincodeName, organization, username, fcn, args);

        res.json(response);
    }
    catch (error) {
        console.error(`FAILED: ${error}`);
    }
})
