require('dotenv').config()

const express = require('express');
const bodyParser = require('body-parser');
const { invokeTransaction } = require('./invoke');
const { evaluateTransaction } = require('./query');
const { enrollAdmins, registerAndEnrollUser } = require('./registration');
const { authenticateToken } = require('./helper');

const jwt = require('jsonwebtoken')

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
        console.error(`FAILED: ${error.message}`);
        return res.status(error.code).send({ status: error.code, message: error.message });
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
        console.error(`FAILED: ${error.message}`);
        return res.status(error.code).send({ status: error.code, message: error.message });
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
        console.error(`FAILED: ${error.message}`);
        return res.status(error.code).send({ status: error.code, message: error.message });
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

        const accessToken = jwt.sign(response, process.env.JWT_SECRET);

        res.json(accessToken);
    }
    catch (error) {
        console.error(`FAILED: ${error.message}`);
        return res.status(error.code).send({ status: error.code, message: error.message });
    }
})

// Get patient information
app.get("/patients/:patient", authenticateToken, async (req, res) => {
    try {
        const username = req.params.patient;

        const user = req.user;

        if (user.identity != "doctor" && user.username != username){
            throw {code : 403, message : "User not Authorized."};
        }

        const organization = user.organization;

        const fcn = "QueryPatient";
        const args = [username];

        const response = await evaluateTransaction(channelName, chaincodeName, organization, username, fcn, args);

        res.json(response);
    }
    catch (error) {
        console.error(`FAILED: ${error.message}`);
        return res.status(error.code).send({ status: error.code, message: error.message });
    }
})

// Get doctor information
app.get("/doctors/:doctor", authenticateToken, async (req, res) => {
    try {
        const username = req.params.doctor;

        const user = req.user;

        if (user.identity != "doctor" || user.username != username){
            throw {code : 403, message : "User not Authorized."};
        }

        const organization = user.organization;

        const fcn = "QueryDoctor";
        const args = [username];

        const response = await evaluateTransaction(channelName, chaincodeName, organization, username, fcn, args);

        res.json(response);
    }
    catch (error) {
        console.error(`FAILED: ${error.message}`);
        return res.status(error.code).send({ status: error.code, message: error.message });
    }
})

// Send access request
app.post("/patients/:patient/pendingRequests/:doctor", authenticateToken, async (req, res) => {
    try {
        const patient = req.params.patient;
        const doctor = req.params.doctor;

        const user = req.user;

        if (user.identity != "doctor" || user.username != doctor){
            throw {code : 403, message : "User not Authorized."};
        }

        const organization = user.organization;

        let fcn = "SubmitRequest";
        let args = [patient, doctor];

        await invokeTransaction(channelName, chaincodeName, organization, doctor, fcn, args);

        fcn = "QueryPatient";
        args = [patient];

        const response = await evaluateTransaction(channelName, chaincodeName, organization, doctor, fcn, args);

        res.json(response);
    }
    catch (error) {
        console.error(`FAILED: ${error.message}`);
        return res.status(error.code).send({ status: error.code, message: error.message });
    }
})

// Approve access request
app.post("/patients/:patient/approvedRequests/:doctor", authenticateToken, async (req, res) => {
    try {
        const patient = req.params.patient;
        const doctor = req.params.doctor;
        const encryptionKey = req.body.encryptionKey;

        const user = req.user;

        if (user.identity != "patient" || user.username != patient){
            throw {code : 403, message : "User not Authorized."};
        }

        const organization = user.organization;

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
        console.error(`FAILED: ${error.message}`);
        return res.status(error.code).send({ status: error.code, message: error.message });
    }
})

// Delete access request
app.delete("/patients/:username/approvedRequests/:doctor", authenticateToken, async (req, res) => {
    try {
        const patient = req.params.username;
        const doctor = req.params.doctor;

        const user = req.user;

        if (user.identity != "patient" || user.username != patient){
            throw {code : 403, message : "User not Authorized."};
        }

        const organization = user.organization;

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
        console.error(`FAILED: ${error.message}`);
        return res.status(error.code).send({ status: error.code, message: error.message });
    }
})

app.get("/assets", authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        const organization = user.organization;
        const username = user.username;

        fcn = "GetAllAssets";
        args = [];

        const response = await evaluateTransaction(channelName, chaincodeName, organization, username, fcn, args);

        res.json(response);
    }
    catch (error) {
        console.error(`FAILED: ${error.message}`);
        return res.status(error.code).send({ status: error.code, message: error.message });
    }
})

app.get("/assets/:id/history", authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        const user = req.user;
        const organization = user.organization;
        const username = user.username;

        fcn = "GetAssetHistory";
        args = [id];

        const response = await evaluateTransaction(channelName, chaincodeName, organization, username, fcn, args);

        res.json(response);
    }
    catch (error) {
        console.error(`FAILED: ${error.message}`);
        return res.status(error.code).send({ status: error.code, message: error.message });
    }
})
