import { Sdk } from "@unique-nft/substrate-client";
import "@unique-nft/substrate-client/tokens";
import {
  TokenByIdResult,
  TokenChildrenArguments,
  TokenChildrenResult,
} from "@unique-nft/substrate-client/tokens";
import env from "./env.json";
import MyClient from "./MyClient";

(async function main() {
  console.log("Started", env);
  await MyClient.init();
  console.log("connected");
  console.time("magic1");

  const res = await MyClient.magic(env.tokensPerLevel, env.depth);
  console.dir(res, { depth: 5 }); // to fix because this step returns undefined
  console.log('The token has been created');
  console.log('-------------------------')

  console.timeEnd("magic1");
  
})();
