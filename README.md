# ECE496-Hyperledger-Fabric


**Capstone Team 2022586:**

Alexandre Gouveia Rodrigues  
Mahshad Jalali  
Maha Mukhtar  
Ahoo Saeifar  

This repo is a clone of https://github.com/hyperledger/fabric-samples

**Pre-requisites**
Linux OS  
Python 2.7  
NPM (latest)  
cURL (latest)  
Go (version 1.12.0 or greater)  
Hyperledger Fabric 2.2 binaries  
Node (version 10.15.3 or greater)  
Docker (version 17.06.2 or greater)  
Docker Compose (version 1.14.0 or greater)   

**Getting Started**
1. Cd into the 'test-network' folder
2. Run: './network.sh up createChannel -c mychannel -ca'
3. Run: './network.sh deployCC -ccn basic -ccp ../chaincode -ccl javascript'
4. Cd into the 'rest-api' folder
5. Run: 'npm install'
6. Run: 'node server.js'

Once you are finished, make sure to turn off the network by changing the directory back to 'test-network' and running './network.sh down'
