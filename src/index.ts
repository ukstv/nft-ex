import CeramicClient from "@ceramicnetwork/http-client";
import * as sha256 from "@stablelib/sha256";
import * as uint8arrays from "uint8arrays";
import KeyDidResolver from "key-did-resolver";
import ThreeIdResolver from "@ceramicnetwork/3id-did-resolver";
import { Resolver } from "did-resolver";
import ThreeIdProvider from "3id-did-provider";
import { DID } from "dids";
import { ethers } from "ethers";
import { TileDocument } from "@ceramicnetwork/stream-tile";
import NftDidResolver from 'nft-did-resolver'
import { CeramicApi } from "@ceramicnetwork/common";

export async function main() {
  // const ceramic: CeramicApi = new CeramicClient("https://ceramic-dev.3boxlabs.com/");
  const ceramic = new CeramicClient("http://localhost:7007");
  // const ceramic = new CeramicClient("https://ceramic-clay.3boxlabs.com");
  const ceramicSeed = sha256.hash(uint8arrays.fromString(`first-seed`));
  const keyDidResolver = KeyDidResolver.getResolver();
  const threeIdResolver = ThreeIdResolver.getResolver(ceramic);
  const threeIdProvider = await ThreeIdProvider.create({
    getPermission: async () => [],
    authId: "auth-0",
    authSecret: ceramicSeed,
    ceramic: ceramic,
  });
  const provider = ethers.getDefaultProvider(
    "https://rinkeby.infura.io/v3/b407db983da44def8a68e3fdb6bea776",
    {
      projectId: "b407db983da44def8a68e3fdb6bea776",
      projectSecret: "82ee7bf1637e49ebbc02104a92efb0d4",
    }
  );
  const ethSeed = sha256.hash(uint8arrays.fromString("ethereum"));
  const signer = new ethers.Wallet(ethSeed, provider);

  const nftResolver = NftDidResolver.getResolver({
    // @ts-ignore
    ceramic: ceramic
  });
  const genResolver = new Resolver({
    ...threeIdResolver,
    ...keyDidResolver,
    // ...nftResolver,
  });
  const did = new DID({
    provider: threeIdProvider.getDidProvider(),
    resolver: genResolver,
  });
  await did.authenticate();
  // @ts-ignore
  ceramic.did = did;
  console.log("did", did.id);
  const dr = await did.resolve('did:3:kjzl6cwe1jw148odah4yhqwga5c8ch9yj91vkea7th3tk3ohyks8pnar3gd9806?version-id=0')
  console.log('resolve', JSON.stringify(dr, null, 4))
  const didNFT =
    "did:nft:eip155:4_erc721:0xe2a6a2da2408e1c944c045162852ef2056e235ab_1";
  const wrongDidNFT =
    "did:nft:eip155:4_erc721:0xe2a6a2da2408e1c944c045162852ef2056e235ab_33";
  // const result = await genResolver.resolve(didNFT)
  // console.log(JSON.stringify(result, null, 4))

  // @ts-ignore
  // const sig1 = await did.createJWS(
  //   { hello: "world" },
  //   // { protected: { iss: didNFT } }
  // );
  // console.log("sig1", sig1);
  // await did.verifyJWS(sig1, { issuer: didNFT });
  // await did.verifyJWS(sig1, {issuer: wrongDidNFT}) // This should fail
  // const sig2 = await did.createDagJWS(
  //   { hello: "world" },
    // { protected: { iss: didNFT } }
  // );
  // console.log('sig2', sig2)
  // await did.verifyJWS(sig2.jws, { issuer: didNFT });
  // await did.verifyJWS(sig2.jws, {issuer: wrongDidNFT}) // This should fail

  // Works!
  // const tile = await TileDocument.create(ceramic, {foo: "blah"}, {controllers: [didNFT]})
  const tile = await TileDocument.create(ceramic, {foo: "blah"}, {controllers: [didNFT]})
  console.log('t', tile.state)
  await tile.update({foo: 'bar'})
  console.log('t.2',  tile.state)

  await ceramic.close();
}

main();
