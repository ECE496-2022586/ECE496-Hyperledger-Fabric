#!/bin/bash

function createHospital() {
  infoln "Enrolling the CA admin"
  mkdir -p organizations/peerOrganizations/hospital.example.com/

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/hospital.example.com/

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@localhost:7054 --caname ca-hospital --tls.certfiles ${PWD}/organizations/fabric-ca/hospital/tls-cert.pem
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-hospital.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-hospital.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-hospital.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-hospital.pem
    OrganizationalUnitIdentifier: orderer' >${PWD}/organizations/peerOrganizations/hospital.example.com/msp/config.yaml

  infoln "Registering peer0"
  set -x
  fabric-ca-client register --caname ca-hospital --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles ${PWD}/organizations/fabric-ca/hospital/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Registering user"
  set -x
  fabric-ca-client register --caname ca-hospital --id.name user1 --id.secret user1pw --id.type client --tls.certfiles ${PWD}/organizations/fabric-ca/hospital/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Registering the org admin"
  set -x
  fabric-ca-client register --caname ca-hospital --id.name hospitaladmin --id.secret hospitaladminpw --id.type admin --tls.certfiles ${PWD}/organizations/fabric-ca/hospital/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Generating the peer0 msp"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:7054 --caname ca-hospital -M ${PWD}/organizations/peerOrganizations/hospital.example.com/peers/peer0.hospital.example.com/msp --csr.hosts peer0.hospital.example.com --tls.certfiles ${PWD}/organizations/fabric-ca/hospital/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/hospital.example.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/hospital.example.com/peers/peer0.hospital.example.com/msp/config.yaml

  infoln "Generating the peer0-tls certificates"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:7054 --caname ca-hospital -M ${PWD}/organizations/peerOrganizations/hospital.example.com/peers/peer0.hospital.example.com/tls --enrollment.profile tls --csr.hosts peer0.hospital.example.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/hospital/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/hospital.example.com/peers/peer0.hospital.example.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/hospital.example.com/peers/peer0.hospital.example.com/tls/ca.crt
  cp ${PWD}/organizations/peerOrganizations/hospital.example.com/peers/peer0.hospital.example.com/tls/signcerts/* ${PWD}/organizations/peerOrganizations/hospital.example.com/peers/peer0.hospital.example.com/tls/server.crt
  cp ${PWD}/organizations/peerOrganizations/hospital.example.com/peers/peer0.hospital.example.com/tls/keystore/* ${PWD}/organizations/peerOrganizations/hospital.example.com/peers/peer0.hospital.example.com/tls/server.key

  mkdir -p ${PWD}/organizations/peerOrganizations/hospital.example.com/msp/tlscacerts
  cp ${PWD}/organizations/peerOrganizations/hospital.example.com/peers/peer0.hospital.example.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/hospital.example.com/msp/tlscacerts/ca.crt

  mkdir -p ${PWD}/organizations/peerOrganizations/hospital.example.com/tlsca
  cp ${PWD}/organizations/peerOrganizations/hospital.example.com/peers/peer0.hospital.example.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/hospital.example.com/tlsca/tlsca.hospital.example.com-cert.pem

  mkdir -p ${PWD}/organizations/peerOrganizations/hospital.example.com/ca
  cp ${PWD}/organizations/peerOrganizations/hospital.example.com/peers/peer0.hospital.example.com/msp/cacerts/* ${PWD}/organizations/peerOrganizations/hospital.example.com/ca/ca.hospital.example.com-cert.pem

  infoln "Generating the user msp"
  set -x
  fabric-ca-client enroll -u https://user1:user1pw@localhost:7054 --caname ca-hospital -M ${PWD}/organizations/peerOrganizations/hospital.example.com/users/User1@hospital.example.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/hospital/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/hospital.example.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/hospital.example.com/users/User1@hospital.example.com/msp/config.yaml

  infoln "Generating the org admin msp"
  set -x
  fabric-ca-client enroll -u https://hospitaladmin:hospitaladminpw@localhost:7054 --caname ca-hospital -M ${PWD}/organizations/peerOrganizations/hospital.example.com/users/Admin@hospital.example.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/hospital/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/hospital.example.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/hospital.example.com/users/Admin@hospital.example.com/msp/config.yaml
}

function createLaboratory() {
  infoln "Enrolling the CA admin"
  mkdir -p organizations/peerOrganizations/laboratory.example.com/

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/laboratory.example.com/

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@localhost:8054 --caname ca-laboratory --tls.certfiles ${PWD}/organizations/fabric-ca/laboratory/tls-cert.pem
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-laboratory.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-laboratory.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-laboratory.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-laboratory.pem
    OrganizationalUnitIdentifier: orderer' >${PWD}/organizations/peerOrganizations/laboratory.example.com/msp/config.yaml

  infoln "Registering peer0"
  set -x
  fabric-ca-client register --caname ca-laboratory --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles ${PWD}/organizations/fabric-ca/laboratory/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Registering user"
  set -x
  fabric-ca-client register --caname ca-laboratory --id.name user1 --id.secret user1pw --id.type client --tls.certfiles ${PWD}/organizations/fabric-ca/laboratory/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Registering the org admin"
  set -x
  fabric-ca-client register --caname ca-laboratory --id.name laboratoryadmin --id.secret laboratoryadminpw --id.type admin --tls.certfiles ${PWD}/organizations/fabric-ca/laboratory/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Generating the peer0 msp"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:8054 --caname ca-laboratory -M ${PWD}/organizations/peerOrganizations/laboratory.example.com/peers/peer0.laboratory.example.com/msp --csr.hosts peer0.laboratory.example.com --tls.certfiles ${PWD}/organizations/fabric-ca/laboratory/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/laboratory.example.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/laboratory.example.com/peers/peer0.laboratory.example.com/msp/config.yaml

  infoln "Generating the peer0-tls certificates"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:8054 --caname ca-laboratory -M ${PWD}/organizations/peerOrganizations/laboratory.example.com/peers/peer0.laboratory.example.com/tls --enrollment.profile tls --csr.hosts peer0.laboratory.example.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/laboratory/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/laboratory.example.com/peers/peer0.laboratory.example.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/laboratory.example.com/peers/peer0.laboratory.example.com/tls/ca.crt
  cp ${PWD}/organizations/peerOrganizations/laboratory.example.com/peers/peer0.laboratory.example.com/tls/signcerts/* ${PWD}/organizations/peerOrganizations/laboratory.example.com/peers/peer0.laboratory.example.com/tls/server.crt
  cp ${PWD}/organizations/peerOrganizations/laboratory.example.com/peers/peer0.laboratory.example.com/tls/keystore/* ${PWD}/organizations/peerOrganizations/laboratory.example.com/peers/peer0.laboratory.example.com/tls/server.key

  mkdir -p ${PWD}/organizations/peerOrganizations/laboratory.example.com/msp/tlscacerts
  cp ${PWD}/organizations/peerOrganizations/laboratory.example.com/peers/peer0.laboratory.example.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/laboratory.example.com/msp/tlscacerts/ca.crt

  mkdir -p ${PWD}/organizations/peerOrganizations/laboratory.example.com/tlsca
  cp ${PWD}/organizations/peerOrganizations/laboratory.example.com/peers/peer0.laboratory.example.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/laboratory.example.com/tlsca/tlsca.laboratory.example.com-cert.pem

  mkdir -p ${PWD}/organizations/peerOrganizations/laboratory.example.com/ca
  cp ${PWD}/organizations/peerOrganizations/laboratory.example.com/peers/peer0.laboratory.example.com/msp/cacerts/* ${PWD}/organizations/peerOrganizations/laboratory.example.com/ca/ca.laboratory.example.com-cert.pem

  infoln "Generating the user msp"
  set -x
  fabric-ca-client enroll -u https://user1:user1pw@localhost:8054 --caname ca-laboratory -M ${PWD}/organizations/peerOrganizations/laboratory.example.com/users/User1@laboratory.example.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/laboratory/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/laboratory.example.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/laboratory.example.com/users/User1@laboratory.example.com/msp/config.yaml

  infoln "Generating the org admin msp"
  set -x
  fabric-ca-client enroll -u https://laboratoryadmin:laboratoryadminpw@localhost:8054 --caname ca-laboratory -M ${PWD}/organizations/peerOrganizations/laboratory.example.com/users/Admin@laboratory.example.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/laboratory/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/laboratory.example.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/laboratory.example.com/users/Admin@laboratory.example.com/msp/config.yaml
}

function createOrderer() {
  infoln "Enrolling the CA admin"
  mkdir -p organizations/ordererOrganizations/example.com

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/ordererOrganizations/example.com

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@localhost:9054 --caname ca-orderer --tls.certfiles ${PWD}/organizations/fabric-ca/ordererOrg/tls-cert.pem
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: orderer' >${PWD}/organizations/ordererOrganizations/example.com/msp/config.yaml

  infoln "Registering orderer"
  set -x
  fabric-ca-client register --caname ca-orderer --id.name orderer --id.secret ordererpw --id.type orderer --tls.certfiles ${PWD}/organizations/fabric-ca/ordererOrg/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Registering the orderer admin"
  set -x
  fabric-ca-client register --caname ca-orderer --id.name ordererAdmin --id.secret ordererAdminpw --id.type admin --tls.certfiles ${PWD}/organizations/fabric-ca/ordererOrg/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Generating the orderer msp"
  set -x
  fabric-ca-client enroll -u https://orderer:ordererpw@localhost:9054 --caname ca-orderer -M ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp --csr.hosts orderer.example.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/ordererOrg/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/ordererOrganizations/example.com/msp/config.yaml ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/config.yaml

  infoln "Generating the orderer-tls certificates"
  set -x
  fabric-ca-client enroll -u https://orderer:ordererpw@localhost:9054 --caname ca-orderer -M ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls --enrollment.profile tls --csr.hosts orderer.example.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/ordererOrg/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/tlscacerts/* ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt
  cp ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/signcerts/* ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt
  cp ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/keystore/* ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.key

  mkdir -p ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts
  cp ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/tlscacerts/* ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

  mkdir -p ${PWD}/organizations/ordererOrganizations/example.com/msp/tlscacerts
  cp ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/tlscacerts/* ${PWD}/organizations/ordererOrganizations/example.com/msp/tlscacerts/tlsca.example.com-cert.pem

  infoln "Generating the admin msp"
  set -x
  fabric-ca-client enroll -u https://ordererAdmin:ordererAdminpw@localhost:9054 --caname ca-orderer -M ${PWD}/organizations/ordererOrganizations/example.com/users/Admin@example.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/ordererOrg/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/ordererOrganizations/example.com/msp/config.yaml ${PWD}/organizations/ordererOrganizations/example.com/users/Admin@example.com/msp/config.yaml
}
