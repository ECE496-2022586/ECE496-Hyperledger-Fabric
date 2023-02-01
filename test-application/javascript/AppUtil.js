/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const fs = require('fs');
const path = require('path');
const channelName = 'mychannel';
const chaincodeName = 'basic';

exports.buildCCPHospital = () => {
	// load the common connection configuration file
	const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'hospital.example.com', 'connection-hospital.json');
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

exports.buildCCPLaboratory = () => {
	// load the common connection configuration file
	const ccpPath = path.resolve(__dirname, '..', '..', 'test-network',
		'organizations', 'peerOrganizations', 'laboratory.example.com', 'connection-laboratory.json');
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

exports.prettyJSONString = (inputString) => {
	if (inputString) {
		 return JSON.stringify(JSON.parse(inputString), null, 2);
	}
	else {
		 return inputString;
	}
}


exports.evaluateTransaction = async (contractName, functionName, args, gateway) => {
    const network = await gateway.getNetwork(channelName);
    let contract;
    if (contractName !== '') {
        contract = await network.getContract(chaincodeName, contractName);
    } else {
        contract = await network.getContract(chaincodeName);
    }
    const responseBuffer = await contract.evaluateTransaction(functionName, ...args);
    return responseBuffer;
}

exports.submitTransaction = async (contractName, functionName, args, gateway) => {
    const network = await gateway.getNetwork(channelName);
    let contract;
    if (contractName !== '') {
        contract = await network.getContract(chaincodeName, contractName);
    } else {
        contract = await network.getContract(chaincodeName);
    }
    const responseBuffer = await contract.submitTransaction(functionName, ...args);
    return responseBuffer;
}

exports.invoke = async (isQuery, func, args,gateway)=> {
  
  try {
    console.log(`isQuery: ${isQuery}, func: ${func}, args: ${args}`);
    if (isQuery === true) {
      if (args) {
        console.log('inside isQuery, args');
        let response1 = await this.evaluateTransaction('AssetTransfer', func, args, gateway);
        console.log(response1);
        console.log(`Transaction ${func} with args ${args} has been evaluated`);
        await gateway.disconnect();
        return response1;

      } else {
        let response = await this.evaluateTransaction(func,gateway);
        console.log(`Transaction ${func} without args has been evaluated`);
        await gateway.disconnect();

        return response;
      }
    } else {
      console.log('notQuery');
      if (args) {
        console.log('notQuery, args');
        console.log(args);
        console.log('before submit');
        let response = await this.submitTransaction('AssetTransfer', func, args, gateway);
        console.log('after submit');
        console.log(response);
        console.log(`Transaction ${func} with args ${args} has been submitted`);

        await gateway.disconnect();

        return response;


      } else {
        let response = await this.submitTransaction(func,gateway);
        console.log(response);
        console.log(`Transaction ${func} with args has been submitted`);

        await gateway.disconnect();

        return response;
      }
    }

  } catch (error) {
    console.error(`Failed to submit transaction: ${error}`);
    return error;
  }
};