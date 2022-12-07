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


  
  for(let i = 0; i < 1; i++) { // update 'i < 1' accordingly if you need to get more than 1 token
    const res = await MyClient.magic(2, 2);
    console.dir(res, { depth: 5 }); // to fix because this step returns undefined
    console.log('The token has been created');
    console.log('-------------------------')
  }
  // !!! uncomment required block of the code below to create tokens with another depth

  // for(let i = 0; i < 1; i++) { // update 'i < 1' accordingly if you need to get more than 1 token
  //   const res = await MyClient.magic(3, 3);
  //   console.dir(res, { depth: 5 }); // to fix because this step returns undefined
  //   console.log('The token has been created');
  //   console.log('-------------------------')
  // }

  // for(let i = 0; i < 1; i++) { // update 'i < 1' accordingly if you need to get more than 1 token
  //   const res = await MyClient.magic(4, 4);
  //   console.dir(res, { depth: 5 }); // to fix because this step returns undefined
  //   console.log('The token has been created');
  //   console.log('-------------------------')
  // }

  // for(let i = 0; i < 1; i++) { // update 'i < 1' accordingly if you need to get more than 1 token
  //   const res = await MyClient.magic(5, 5);
  //   console.dir(res, { depth: 5 }); // to fix because this step returns undefined
  //   console.log('The token has been created');
  //   console.log('-------------------------')
  // }

  console.timeEnd("magic1");
  
})();
