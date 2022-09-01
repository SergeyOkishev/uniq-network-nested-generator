import { SdkSigner, SignatureType } from "@unique-nft/accounts";
import { KeyringProvider } from "@unique-nft/accounts/keyring";
import { Sdk } from "@unique-nft/sdk";
import {
  AttributeType,
  COLLECTION_SCHEMA_NAME,
  TokenIdArguments,
} from "@unique-nft/sdk/tokens";
import env from "./env.json";
import ImageGenerator from "./ImageGenerator";

const seed = env.seed;
const network = env.network;

// TODO: to config
const IPFSGateway = "https://ipfs.uniquenetwork.dev/ipfs";
const ipfsCid = "QmPVMVzh8yTERPVsGpnzh4XxXQfDMF7sdjxGPo1WFnJRyW";

class MyClient {
  // @ts-ignore || trust me, I'm engineer and it will be initialized after "init" call
  public sdk: Sdk;

  seed: string;
  // @ts-ignore || trust me, I'm engineer and it will be initialized after "init" call
  signer: SdkSigner;

  collectionId?: number;
  address: string; // no idea why, but it's mandatory to provide

  constructor(seed: string) {
    this.seed = seed;
    this.collectionId = 733;
    this.address = "5FNTBngp5E57ti1RYz7taHMChiqMvK2rQrSidH8nWwp1ALKW";
  }

  async init() {
    const keyringProvider = new KeyringProvider({
      type: SignatureType.Sr25519,
    });

    await keyringProvider.init();

    this.signer = keyringProvider.addSeed(this.seed).getSigner();

    this.sdk = await Sdk.create({ chainWsUrl: network, signer: this.signer });
  }

  async createCollection(
    name: string,
    description: string,
    tokenPrefix: string
  ): Promise<number> {
    const collectionSchema = {
      schemaName: COLLECTION_SCHEMA_NAME.unique as any, // typezation failes
      schemaVersion: "1.0.0",
      coverPicture: {
        ipfsCid,
      },
      attributesSchemaVersion: "1.0.0",
      attributesSchema: {
        "0": {
          type: AttributeType.string,
          name: { _: "name" }, // pain
          optional: false,
          isArray: false,
        },
        "1": {
          type: AttributeType.string,
          name: { _: "depth" },
          optional: false,
          isArray: false,
        },
        "2": {
          type: AttributeType.string,
          name: { _: "index" },
          optional: false,
          isArray: false,
        },
      },
      image: {
        urlTemplate: `${IPFSGateway}/{infix}` as any, // typization fails
      },
    };

    const createArgs = {
      name,
      description,
      tokenPrefix,
      schema: collectionSchema,
      address: this.address,
      permissions: {
        nesting: {
          tokenOwner: true,
          collectionAdmin: true,
        },
      },
    };
    const createResult =
      await this.sdk.collections.creation_new.submitWaitResult(createArgs);
    const { collectionId } = createResult.parsed;
    return collectionId;
  }

  public async createToken(
    depth: number,
    index: number,
    prefix: string,
    isFirst: boolean = false
  ): Promise<TokenIdArguments> {
    if (!this.collectionId)
      throw new Error("Forgot to create/specify collection");
    const name = isFirst ? 'TOPMOST' : `${prefix}-${index + 1}`;
    const attributes = {
      "0": { _: name },
      "1": { _: depth.toString() },
      "2": { _: index.toString() },
    };
    const image = await ImageGenerator.generateImage(depth, index, prefix);
    const createArgs = {
      owner: this.address,
      address: this.address,
      collectionId: this.collectionId,
      data: {
        encodedAttributes: attributes,
        image: {
          ipfsCid: image.cid,
        },
      },
    };
    const createResult = await this.sdk.tokens.create_new.submitWaitResult(
      createArgs
    );
    return createResult.parsed;
  }

  async nestToken(parentId: number, childId: number) {
    const res = await this.sdk.tokens.nest.submitWaitResult({
      address: this.address,
      parent: {
        tokenId: parentId,
        collectionId: this.collectionId!,
      },
      nested: {
        tokenId: childId,
        collectionId: this.collectionId!,
      },
    });
    return res.parsed;
  }

  async createNestedTokens(
    parent: TreeNode,
    tokensPerLevel: number,
    maxDepth: number
  ) {
    const currentDepth = parent.depth + 1;
    if (currentDepth > maxDepth) return;
    // let backgroundPromises = [];
    for (let i = 0; i < tokensPerLevel; i++) {
      const createTokenPromise = this.createToken(currentDepth, i, parent.prefix);
      const bgPromise = new Promise(async (resolve, reject) => {
        const createdToken = await createTokenPromise;
        console.log('Token created: ', createdToken.tokenId);
        await this.nestToken(parent.tokenId, createdToken.tokenId);
        console.log('Token nested: ', createdToken.tokenId);
        await this.createNestedTokens({ ...createdToken, depth: currentDepth, index: i, prefix: `${parent.prefix}-${i + 1}`}, tokensPerLevel, maxDepth);
        console.log('Finished creating childs for: ', createdToken.tokenId);
        resolve(true);
      });
      // backgroundPromises.push(bgPromise);
      // Priority is too low screws us here
      // Theoretically - we can use mint many instead
      await bgPromise;
    }
    // await Promise.all(backgroundPromises);
  }

  async magic(tokensPerLevel: number = 5, maxDepth: number = 5) {
    console.log('Begining magic');
    console.log('---------------')
    console.log(Date.now());
    console.time('magic')
    const depth = 0,
      index = 0,
      prefix = "S";
    const topmostParent = await this.createToken(depth, index, prefix, true);
    await this.createNestedTokens(
      {
        ...topmostParent,
        depth,
        index,
        prefix,
      },
      tokensPerLevel,
      maxDepth
    );
    console.log('Completed');
    console.log(Date.now());
    console.log(`Time elapsed: `, console.timeEnd('magic'));
  }
}

interface TreeNode {
  tokenId: number,
  collectionId: number,
  depth: number;
  index: number;
  prefix: string;
}

export default new MyClient(seed);
