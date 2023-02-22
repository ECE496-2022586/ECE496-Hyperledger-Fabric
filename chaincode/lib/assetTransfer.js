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
    async CreatePatient(ctx, firstName, lastName, email, username, password, encryptionKey, identity, organization) {
        const hash = CryptoJS.SHA256(encryptionKey);

        const ciphertext = CryptoJS.AES.encrypt(password, hash, { mode: CryptoJS.mode.ECB }).toString();

        const credentials = {
            firstName: firstName,
            lastName: lastName,
            email: email,
            username: username,
            password: ciphertext,
            identity: identity,
            organization: organization,
            pendingRequests: [],
            approvedRequests: []
        }

        await ctx.stub.putState(username, Buffer.from(JSON.stringify(credentials)));
    }

    // CreateDoctor issues a new doctor to the world state with given details.
    async CreateDoctor(ctx, firstName, lastName, email, username, password, encryptionKey, identity, organization) {
        const hash = CryptoJS.SHA256(encryptionKey);

        const ciphertext = CryptoJS.AES.encrypt(password, hash, { mode: CryptoJS.mode.ECB }).toString();

        const credentials = {
            firstName: firstName,
            lastName: lastName,
            email: email,
            username: username,
            password: ciphertext,
            identity: identity,
            organization: organization,
            patients: {}
        }

        await ctx.stub.putState(username, Buffer.from(JSON.stringify(credentials)));
    }

    // ValidateLogin validates login information for a user given the correct credentials.
    async ValidateLogin(ctx, username, password, encryptionKey) {
        const credentials = await ctx.stub.getState(username);

        if (!credentials || credentials.toString().length <= 0) {
            throw new Error("Invalid username");
        } else {
            const credentialsJSON = JSON.parse(credentials);

            const encryptedPassword = credentialsJSON.password;

            const hash = CryptoJS.SHA256(encryptionKey)

            const bytes = CryptoJS.AES.decrypt(encryptedPassword, hash, { mode: CryptoJS.mode.ECB });

            const decrypted = bytes.toString(CryptoJS.enc.Utf8);

            if (password != decrypted) {
                throw new Error("Invalid password");
            }
        }
    }

    // QueryPatient returns the patient stored in the world state with given username.
    async QueryPatient(ctx, username) {
        const credentials = await ctx.stub.getState(username);

        if (!credentials || credentials.length === 0) {
            throw new Error('Patient does not exist');
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
            organization: credentialsJSON.organization
        }

        return JSON.stringify(patient);
    }

    // QueryDoctor returns the doctor stored in the world state with given username.
    async QueryDoctor(ctx, username) {
        const credentials = await ctx.stub.getState(username);

        if (!credentials || credentials.length === 0) {
            throw new Error('Doctor does not exist');
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

        return JSON.stringify(doctor);
    }

    async SubmitRequest(ctx, patient, doctor) {
        const credentials = await ctx.stub.getState(patient);

        if (!credentials || credentials.length === 0) {
            throw new Error('Patient does not exist');
        }

        const credentialsJSON = JSON.parse(credentials);

        const index = credentialsJSON['pendingRequests'].findIndex(x => x == doctor);

        if (index < 0) {
            credentialsJSON['pendingRequests'].push(doctor)
        }

        await ctx.stub.putState(patient, Buffer.from(JSON.stringify(credentialsJSON)));
    }

    async ApproveRequest(ctx, patient, doctor) {
        const credentials = await ctx.stub.getState(patient);

        if (!credentials || credentials.length === 0) {
            throw new Error('Patient does not exist');
        }

        const credentialsJSON = JSON.parse(credentials);

        const index = credentialsJSON['pendingRequests'].findIndex(x => x == doctor);

        if (index < 0) {
            throw new Error('Doctor has not submitted an access request.');
        }

        credentialsJSON['pendingRequests'].splice(index, 1);

        credentialsJSON['approvedRequests'].push(doctor);

        await ctx.stub.putState(patient, Buffer.from(JSON.stringify(credentialsJSON)));
    }

    async EnableAccess(ctx, patient, doctor, encryptionKey) {
        const credentials = await ctx.stub.getState(doctor);

        if (!credentials || credentials.length === 0) {
            throw new Error('Doctor does not exist');
        }

        const credentialsJSON = JSON.parse(credentials);

        const hash = CryptoJS.SHA256(doctor);

        const encryptedKey = CryptoJS.AES.encrypt(encryptionKey, hash, { mode: CryptoJS.mode.ECB }).toString();

        if (!(patient in credentialsJSON['patients'])) {
            credentialsJSON['patients'][patient] = encryptedKey
        }

        await ctx.stub.putState(doctor, Buffer.from(JSON.stringify(credentialsJSON)));
    }

    async RemoveRequest(ctx, patient, doctor) {
        const credentials = await ctx.stub.getState(patient);

        if (!credentials || credentials.length === 0) {
            throw new Error('User does not exist');
        }

        const credentialsJSON = JSON.parse(credentials);

        const index = credentialsJSON['approvedRequests'].findIndex(x => x == doctor);

        if (index < 0) {
            throw new Error('Cannot remove a request that has not been approved.');
        }

        credentialsJSON['approvedRequests'].splice(index, 1);

        await ctx.stub.putState(patient, Buffer.from(JSON.stringify(credentialsJSON)));
    }

    async RemoveAccess(ctx, patient, doctor) {
        const credentials = await ctx.stub.getState(doctor);

        if (!credentials || credentials.length === 0) {
            throw new Error('Doctor does not exist');
        }

        const credentialsJSON = JSON.parse(credentials);

        if (patient in credentialsJSON['patients']) {
            delete credentialsJSON['patients'][patient]
        }

        await ctx.stub.putState(doctor, Buffer.from(JSON.stringify(credentialsJSON)));
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
        return JSON.stringify(allResults);
    }

    // GetAssetHistory returns the modification history for the given asset.
    async GetAssetHistory(ctx, id) {
        const exists = await this.AssetExists(ctx, id);

        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }

        let iterator = await ctx.stub.getHistoryForKey(id);

        let result = [];
        let response = await iterator.next();

        while (!response.done) {
          if (response.value) {
            const transactionId = response.value.txId;
            const transaction = JSON.parse(response.value.value.toString('utf8'));
            const timestamp = new Date(response.value.timestamp.seconds * 1000 + response.value.timestamp.nanos/1000000);

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
        
        return result;  
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
