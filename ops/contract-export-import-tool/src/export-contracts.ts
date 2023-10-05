import { writeFileSync } from "fs";
import axios from "axios";

import type { Contracts, Codes, OutputItem } from "./types";

const SRC_BLOCKSCOUT = new URL("/api", process.env.SRC_BLOCKSCOUT);
const OUTPUT = process.env.OUTPUT!;

const listContracts = async (): Promise<Contracts> => {
  const query = new URLSearchParams({
    module: "contract",
    action: "listcontracts",
    filter: "verified",
    offset: "50",
  });

  const contracts = {} as Contracts;
  for (let page = 1; ; page++) {
    query.set("page", "" + page);

    const res = await axios.get(SRC_BLOCKSCOUT + "?" + query);
    if (res.data.status !== "1") throw res.data;
    if (res.data.result.length === 0) break;

    res.data.result.forEach((x: any) => (contracts[x.Address] = x));
  }

  return contracts;
};

const getSourceCodes = async (contracts: Contracts): Promise<Codes> => {
  const query = new URLSearchParams({
    module: "contract",
    action: "getsourcecode",
  });

  const codes = {} as Codes;
  for (const address of Object.keys(contracts)) {
    query.set("address", address);

    const res = await axios.get(SRC_BLOCKSCOUT + "?" + query);
    if (res.data.status !== "1" || res.data.result.length !== 1) throw res.data;

    codes[address] = res.data.result[0];
  }

  return codes;
};

const main = async () => {
  const contracts = await listContracts();
  const codes = await getSourceCodes(contracts);
  const outputs = Object.entries(contracts).map(([addr, item]) => ({
    ...item,
    ...codes[addr],
  })) as OutputItem[];

  writeFileSync(OUTPUT, JSON.stringify(outputs, null, 2), "utf8");
  console.log(`${outputs.length} contracts exported to ${OUTPUT}`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
