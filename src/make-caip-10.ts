import CeramicClient from "@ceramicnetwork/http-client";
import * as sha256 from "@stablelib/sha256";
import * as uint8arrays from "uint8arrays";
import KeyDidResolver from "key-did-resolver";
import ThreeIdResolver from "@ceramicnetwork/3id-did-resolver";
import { Resolver } from "did-resolver";
import ThreeIdProvider from "3id-did-provider";
import { DID } from "dids";
import { Caip10Link } from "@ceramicnetwork/stream-caip10-link";
import { AccountID } from "caip";
import * as linking from "@ceramicnetwork/blockchain-utils-linking";
import HDWalletProvider from "@truffle/hdwallet-provider";
import Web3 from "web3";

async function main() {
  // const ceramic = new CeramicClient("https://ceramic-dev.3boxlabs.com/");
  const ceramic = new CeramicClient("http://localhost:7007");
  // const ceramic = new CeramicClient("https://ceramic-clay.3boxlabs.com");
  const ceramicSeed = sha256.hash(uint8arrays.fromString(`first-seed`));
  const keyDidResolver = KeyDidResolver.getResolver();
  const threeIdResolver = ThreeIdResolver.getResolver(ceramic);
  const resolver = new Resolver({
    ...threeIdResolver,
    ...keyDidResolver,
  });
  const threeIdProvider = await ThreeIdProvider.create({
    getPermission: async () => [],
    authId: 'auth-0',
    authSecret: ceramicSeed,
    ceramic: ceramic,
  });
  const did = new DID({
    provider: threeIdProvider.getDidProvider(),
    resolver: resolver,
  });
  await did.authenticate();
  ceramic.did = did;
  console.log("did", did.id);

  const provider = new HDWalletProvider({
    privateKeys: [
      `0x${uint8arrays.toString(
        sha256.hash(uint8arrays.fromString("ethereum")),
        "base16"
      )}`,
    ],
    providerOrUrl:
      "https://rinkeby.infura.io/v3/b407db983da44def8a68e3fdb6bea776",
  });
  const web3 = new Web3(provider)
  const address = await web3.eth.getAccounts().then(addresses => addresses[0]!.toLowerCase())

  const chainIdReference = await web3.eth.getChainId()
  const account = new AccountID({
    address: address!,
    chainId: {
      namespace: "eip155",
      reference: chainIdReference.toString(),
    },
  });
  console.log('link', account)
  const link = await Caip10Link.fromAccount(ceramic, account);
  const authProvider = new linking.EthereumAuthProvider(
    provider,
    address!
  );
  console.log('li', link.id)
  console.log(link.did)
  await link.setDid(ceramic.did, authProvider);
  console.log('done linking', JSON.stringify(link.state, null, 4))
  console.log('l', link.did, link.controllers)
  await ceramic.close()
}

main();
