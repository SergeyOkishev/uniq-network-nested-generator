import { Sdk } from "@unique-nft/substrate-client";
import "@unique-nft/substrate-client/tokens";
import {
  TokenByIdResult,
  TokenChildrenArguments,
  TokenChildrenResult,
} from "@unique-nft/substrate-client/tokens";
import env from "./env.json";
import MyClient from "./MyClient";

type NestedToken = Omit<TokenByIdResult, "nestingChildTokens"> & {
  nestingChildTokens: NestedToken[];
};

const MAX_BUNDLE_DEPTH = 5;

async function getTopmostParent(
  this: Sdk,
  collectionId: number,
  tokenId: number
): Promise<NestedToken> {
  const parent = await this.tokens.parent({ collectionId, tokenId });
  if (parent)
    return getTopmostParent.call(this, parent.collectionId, parent.tokenId);
  const token = await this.tokens.get_new({ collectionId, tokenId });
  if (!token) throw new Error("Token was not found");
  return { ...token, nestingChildTokens: [] };
}

async function getChildTokens(
  this: Sdk,
  childrenResult: TokenChildrenResult,
  depth = 0
): Promise<NestedToken[]> {
  if (depth > MAX_BUNDLE_DEPTH)
    throw new Error(
      "Recursion depth exceeded, aborting NestedToken generation"
    );
  if (!childrenResult?.children?.length) return [];
  // fetch every child token using recursion in parallel
  const childTokens = await Promise.all<NestedToken>(
    childrenResult.children.map(async (children: TokenChildrenArguments) => {
      const childToken = await this.tokens.get_new(children);
      if (!childToken)
        throw new Error("Token not found during search for nested childs");
      const nestedChildToken = childToken as NestedToken;
      const childChildren = await this.tokens.children(children);
      if (childChildren?.children?.length)
        nestedChildToken.nestingChildTokens = await getChildTokens.call(
          this,
          childChildren,
          depth + 1
        );
      return nestedChildToken;
    })
  );

  return childTokens;
}

async function getBundleFn(this: Sdk, args: any): Promise<NestedToken> {
  // CAN BE OPTIMIZED HERE
  // Just to simplify algorithm and readability - we are going to always start from top of the bundle
  // In case we want to improve performance - we can start from original point (and fetch tokens both - up and down the tree)
  const topMostParent = await getTopmostParent.call(
    this,
    args.collectionId,
    args.tokenId
  );
  const topMostParentChildren = await this.tokens.children({
    tokenId: topMostParent.tokenId,
    collectionId: topMostParent.collectionId,
  });
  if (!topMostParentChildren)
    throw new Error("Topmost token of a bundle has no nested tokens");
  topMostParent.nestingChildTokens = await getChildTokens.call(
    this,
    topMostParentChildren
  );
  return topMostParent;
}

(async function main() {
  console.log("Started", env);
  await MyClient.init();
  console.log("connected");
  console.time("magic1");
  // const res = await MyClient.sdk.collections.get_new({ collectionId: 756 });
  // const res = await MyClient.sdk.tokens.get_new({ collectionId: 883, tokenId: 4 });
  const res = await MyClient.magic(5, 5);
  // const res = ((await MyClient.sdk.api.query.system.account('5FNTBngp5E57ti1RYz7taHMChiqMvK2rQrSidH8nWwp1ALKW')) as any).nonce.toNumber()
  // const res = await MyClient.sdk.collections.get_new({ collectionId: 735 });
  // const res = await MyClient.sdk.tokens.getBundle({ collectionId: 735, tokenId: 456 });
  console.dir(res, { depth: 5 });
  console.log('-------------------------')
  console.timeEnd("magic1");
  console.log("Done");
})();
