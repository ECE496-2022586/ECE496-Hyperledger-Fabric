/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');
const CryptoJS = require("crypto-js");

class AssetTransfer extends Contract {

    // CreatePatient issues a new patient to the world state with given details.
    async CreatePatient(ctx, firstName, lastName, email, username, password, identity, organization) {
        const hash = CryptoJS.SHA256(username+password).toString(CryptoJS.enc.Base64);

        const credentials = {
            firstName: firstName,
            lastName: lastName,
            email: email,
            username: username,
            password: hash,
            identity: identity,
            organization: organization,
            records: [],
            pendingRequests: [],
            approvedRequests: []
        }

        await ctx.stub.putState(username, Buffer.from(JSON.stringify(credentials)));
    }

    // CreateDoctor issues a new doctor to the world state with given details.
    async CreateDoctor(ctx, firstName, lastName, email, username, password, identity, organization) {
        const hash = CryptoJS.SHA256(username+password).toString(CryptoJS.enc.Base64);

        const credentials = {
            firstName: firstName,
            lastName: lastName,
            email: email,
            username: username,
            password: hash,
            identity: identity,
            organization: organization,
            patients: {}
        }

        await ctx.stub.putState(username, Buffer.from(JSON.stringify(credentials)));
    }

    // ValidateLogin validates login information for a user given the correct credentials.
    async ValidateLogin(ctx, username, password) {
        const credentials = await ctx.stub.getState(username);

        if (!credentials || credentials.toString().length <= 0) {
            const error = { "status": "error", "code": 401, "message": "Invalid username." };
            return JSON.stringify(error);
        } else {
            const credentialsJSON = JSON.parse(credentials);

            const hashedPassword = credentialsJSON.password;

            const hash = CryptoJS.SHA256(username+password).toString(CryptoJS.enc.Base64);

            if (hash != hashedPassword) {
                const error = { "status": "error", "code": 401, "message": "Invalid password." };
                return JSON.stringify(error);
            }
        }
        return JSON.stringify({ "status": "success", "data": null });
    }

    // QueryPatient returns the patient stored in the world state with given username.
    async QueryPatient(ctx, username) {
        const credentials = await ctx.stub.getState(username);

        if (!credentials || credentials.length === 0) {
            const error = { "status": "error", "code": 404, "message": "Patient does not exist." };
            return JSON.stringify(error);
        }

        const credentialsJSON = JSON.parse(credentials);

        const patient = {
            username: credentialsJSON.username,
            firstName: credentialsJSON.firstName,
            lastName: credentialsJSON.lastName,
            email: credentialsJSON.email,
            pendingRequests: credentialsJSON.pendingRequests,
            approvedRequests: credentialsJSON.approvedRequests,
            identity: credentialsJSON.identity,
            organization: credentialsJSON.organization,
            records: credentialsJSON.records,
        }

        return JSON.stringify({ "status": "success", "data": patient });
    }

    // QueryDoctor returns the doctor stored in the world state with given username.
    async QueryDoctor(ctx, username) {
        const credentials = await ctx.stub.getState(username);

        if (!credentials || credentials.length === 0) {
            const error = { "status": "error", "code": 404, "message": "Doctor does not exist." };
            return JSON.stringify(error);
        }

        const credentialsJSON = JSON.parse(credentials);

        const doctor = {
            username: credentialsJSON.username,
            firstName: credentialsJSON.firstName,
            lastName: credentialsJSON.lastName,
            email: credentialsJSON.email,
            patients: credentialsJSON.patients,
            identity: credentialsJSON.identity,
            organization: credentialsJSON.organization
        }

        return JSON.stringify({ "status": "success", "data": doctor });
    }

    async SubmitAccessRequest(ctx, patient, doctor) {
        const credentials = await ctx.stub.getState(patient);

        if (!credentials || credentials.length === 0) {
            const error = { "status": "error", "code": 404, "message": "Patient does not exist." };
            return JSON.stringify(error);
        }

        const credentialsJSON = JSON.parse(credentials);

        const index = credentialsJSON['pendingRequests'].findIndex(x => x == doctor);

        if (index < 0) {
            credentialsJSON['pendingRequests'].push(doctor)
        }

        await ctx.stub.putState(patient, Buffer.from(JSON.stringify(credentialsJSON)));
    }

    async DenyAccessRequest(ctx, patient, doctor) {
        const credentials = await ctx.stub.getState(patient);

        if (!credentials || credentials.length === 0) {
            const error = { "status": "error", "code": 404, "message": "Patient does not exist." };
            return JSON.stringify(error);
        }

        const credentialsJSON = JSON.parse(credentials);

        const index = credentialsJSON['pendingRequests'].findIndex(x => x == doctor);

        if (index < 0) {
            const error = { "status": "error", "code": 400, "message": "Cannot deny this request." };
            return JSON.stringify(error);
        }

        credentialsJSON['pendingRequests'].splice(index, 1);

        await ctx.stub.putState(patient, Buffer.from(JSON.stringify(credentialsJSON)));
    }

    async ApproveAccessRequest(ctx, patient, doctor) {
        const credentials = await ctx.stub.getState(patient);

        if (!credentials || credentials.length === 0) {
            const error = { "status": "error", "code": 404, "message": "Patient does not exist." };
            return JSON.stringify(error);
        }

        const credentialsJSON = JSON.parse(credentials);

        const index = credentialsJSON['pendingRequests'].findIndex(x => x == doctor);

        if (index < 0) {
            const error = { "status": "error", "code": 400, "message": "Cannot approve this request." };
            return JSON.stringify(error);
        }

        credentialsJSON['pendingRequests'].splice(index, 1);

        credentialsJSON['approvedRequests'].push(doctor);

        await ctx.stub.putState(patient, Buffer.from(JSON.stringify(credentialsJSON)));
    }

    async EnableAccess(ctx, patient, doctor, password) {
        const credentials = await ctx.stub.getState(doctor);

        if (!credentials || credentials.length === 0) {
            const error = { "status": "error", "code": 404, "message": "Doctor does not exist." };
            return JSON.stringify(error);
        }

        const credentialsJSON = JSON.parse(credentials);

        const hash = CryptoJS.SHA256(doctor);

        const encryptedKey = CryptoJS.AES.encrypt(password, hash, { mode: CryptoJS.mode.ECB }).toString();

        if (!(patient in credentialsJSON['patients'])) {
            credentialsJSON['patients'][patient] = encryptedKey
        }

        await ctx.stub.putState(doctor, Buffer.from(JSON.stringify(credentialsJSON)));
    }

    async RemoveAccessRequest(ctx, patient, doctor) {
        const credentials = await ctx.stub.getState(patient);

        if (!credentials || credentials.length === 0) {
            const error = { "status": "error", "code": 404, "message": "Patient does not exist." };
            return JSON.stringify(error);
        }

        const credentialsJSON = JSON.parse(credentials);

        const index = credentialsJSON['approvedRequests'].findIndex(x => x == doctor);

        if (index < 0) {
            const error = { "status": "error", "code": 400, "message": "Cannot remove this request." };
            return JSON.stringify(error);
        }

        credentialsJSON['approvedRequests'].splice(index, 1);

        await ctx.stub.putState(patient, Buffer.from(JSON.stringify(credentialsJSON)));
    }

    async RemoveAccess(ctx, patient, doctor) {
        const credentials = await ctx.stub.getState(doctor);

        if (!credentials || credentials.length === 0) {
            const error = { "status": "error", "code": 404, "message": "Doctor does not exist." };
            return JSON.stringify(error);
        }

        const credentialsJSON = JSON.parse(credentials);

        if (patient in credentialsJSON['patients']) {
            delete credentialsJSON['patients'][patient]
        }

        await ctx.stub.putState(doctor, Buffer.from(JSON.stringify(credentialsJSON)));
    }

    // CreateMedicalRecord issues a new record to the world state with given details.
    async CreateMedicalRecord(ctx, patient, doctor, hash) {
        const id = hash;

        const timestamp = new Date();

        const record = {
            hash: hash,
            issuer: doctor,
            patient: patient,
            timestamp: timestamp.toLocaleDateString()
        }

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(record)));
    }

    async SubmitMedicalRecord(ctx, patient, hash) {
        const credentials = await ctx.stub.getState(patient);

        if (!credentials || credentials.length === 0) {
            const error = { "status": "error", "code": 404, "message": "Patient does not exist." };
            return JSON.stringify(error);
        }

        const record = await ctx.stub.getState(hash);

        if (!record || record.length === 0) {
            const error = { "status": "error", "code": 404, "message": "Record does not exist." };
            return JSON.stringify(error);
        }

        const credentialsJSON = JSON.parse(credentials);
        const recordJSON = JSON.parse(record);

        credentialsJSON['records'].push(recordJSON)

        await ctx.stub.putState(patient, Buffer.from(JSON.stringify(credentialsJSON)));
    }

    // QueryMedicalRecord returns the record stored in the world state with given hash.
    async QueryMedicalRecord(ctx, hash) {
        const record = await ctx.stub.getState(hash);

        if (!record || record.length === 0) {
            const error = { "status": "error", "code": 404, "message": "Record does not exist." };
            return JSON.stringify(error);
        }

        const recordJSON = JSON.parse(record);

        return JSON.stringify({ "status": "success", "data": recordJSON });
    }

    // GetAllAssets returns all assets found in the world state.
    async GetAllAssets(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({ Key: result.value.key, Record: record });
            result = await iterator.next();
        }
        return JSON.stringify({ "status": "success", "data": allResults });
    }

    // GetAssetHistory returns the modification history for the given asset.
    async GetAssetHistory(ctx, id) {
        const exists = await this.AssetExists(ctx, id);

        if (!exists) {
            const error = { "status": "error", "code": 404, "message": "Asset does not exist." };
            return JSON.stringify(error);
        }

        let iterator = await ctx.stub.getHistoryForKey(id);

        let result = [];
        let response = await iterator.next();

        while (!response.done) {
            if (response.value) {
                const transactionId = response.value.txId;
                const transaction = JSON.parse(response.value.value.toString('utf8'));
                const timestamp = new Date(response.value.timestamp.seconds * 1000 + response.value.timestamp.nanos / 1000000);

                const record = {
                    'transactionId': transactionId,
                    'transaction': transaction,
                    'timestamp': timestamp.toLocaleString()
                }

                result.push(record);
            }
            response = await iterator.next();
        }

        await iterator.close();

        return JSON.stringify({ "status": "success", "data": result });
    }

    // CreateAsset issues a new asset to the world state with given details.
    async CreateAsset(ctx, id, color, size, owner, appraisedValue) {
        const asset = {
            ID: id,
            Color: color,
            Size: size,
            Owner: owner,
            AppraisedValue: appraisedValue,
        };
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
        return JSON.stringify(asset);
    }

    // ReadAsset returns the asset stored in the world state with given id.
    async ReadAsset(ctx, id) {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return assetJSON.toString();
    }

    // UpdateAsset updates an existing asset in the world state with provided parameters.
    async UpdateAsset(ctx, id, color, size, owner, appraisedValue) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }

        // overwriting original asset with new asset
        const updatedAsset = {
            ID: id,
            Color: color,
            Size: size,
            Owner: owner,
            AppraisedValue: appraisedValue,
        };
        return ctx.stub.putState(id, Buffer.from(JSON.stringify(updatedAsset)));
    }

    // DeleteAsset deletes an given asset from the world state.
    async DeleteAsset(ctx, id) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    // AssetExists returns true when asset with given ID exists in world state.
    async AssetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    // TransferAsset updates the owner field of asset with given id in the world state.
    async TransferAsset(ctx, id, newOwner) {
        const assetString = await this.ReadAsset(ctx, id);
        const asset = JSON.parse(assetString);
        asset.Owner = newOwner;
        return ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
    }

}

module.exports = AssetTransfer;
