import { SSTConfig } from "sst";
import { Stack } from "./stacks/MyStack";

export default {
  config(_input) {
    return {
      name: "ban-bot",
      region: "us-east-1",
    };
  },
  stacks(app) {    app.stack(Stack)
},
} satisfies SSTConfig;
