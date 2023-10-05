import { readFileSync, writeFileSync } from "fs";
import axios from "axios";

import type { OutputItem } from "./types";
import { URLSearchParams } from "url";

const DST_BLOCKSCOUT = new URL("/api", process.env.DST_BLOCKSCOUT);
const INPUT = process.env.INPUT!;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const verified = async (address: string): Promise<boolean> => {
  const query = new URLSearchParams({
    module: "contract",
    action: "getsourcecode",
    address,
  });

  const res = await axios.get(DST_BLOCKSCOUT + "?" + query);
  if (res.data.status !== "1" || res.data.result.length !== 1) throw res.data;
  return res.data.result[0].SourceCode !== undefined;
};

const verifyWithStandardJson = async (
  contract: OutputItem
): Promise<{
  message: string;
  result: string;
  status: string;
}> => {
  const query = new URLSearchParams({
    module: "contract",
    action: "verifysourcecode",
  });

  const stdjson = {
    language: "Solidity",
    sources: { [contract.FileName]: { content: contract.SourceCode } },
    settings: {
      optimizer: { enabled: false, runs: 200 },
      outputSelection: {
        "*": {
          "*": [
            "abi",
            "evm.bytecode",
            "evm.deployedBytecode",
            "evm.methodIdentifiers",
            "metadata",
            "devdoc",
            "userdoc",
            "storageLayout",
            "evm.gasEstimates",
            "storageLayout",
          ],
          "": ["ast"],
        },
      },
    },
  };

  (contract.AdditionalSources ?? []).forEach(
    (x) => (stdjson.sources[x.Filename] = { content: x.SourceCode })
  );

  if (contract.OptimizationRuns) {
    stdjson.settings.optimizer = {
      enabled: true,
      runs: contract.OptimizationRuns,
    };
  }

  const data = {
    codeformat: "solidity-standard-json-input",
    contractaddress: contract.Address,
    contractname: contract.FileName + ":" + contract.ContractName,
    compilerversion: contract.CompilerVersion,
    sourceCode: JSON.stringify(stdjson),
  } as any;

  if (contract.ConstructorArguments) {
    data.constructorArguments = contract.ConstructorArguments;
  } else {
    data.autodetectConstructorArguments = true;
  }

  const res = await axios.post(DST_BLOCKSCOUT + "?" + query, data);
  if (res.data.status !== "1") throw res.data;

  return res.data;
};

const verifyWithFlatCode = async (contract: OutputItem) => {
  const query = new URLSearchParams({
    module: "contract",
    action: "verify",
  });

  const data = {
    addressHash: contract.Address,
    name: contract.ContractName,
    evmVersion: contract.EVMVersion ?? "default",
    compilerVersion: contract.CompilerVersion,
    contractSourceCode: contract.SourceCode,
    optimization: !!contract.OptimizationRuns,
  } as any;

  if (contract.OptimizationRuns) {
    data.optimizationRuns = contract.OptimizationRuns;
  }

  if (contract.ConstructorArguments) {
    data.constructorArguments = contract.ConstructorArguments;
  } else {
    data.autodetectConstructorArguments = true;
  }

  writeFileSync("/tmp/data.json", JSON.stringify(data, null, 2), "utf8");

  const res = await axios.post(DST_BLOCKSCOUT + "?" + query, data);
  if (res.data.status !== "1") throw res.data;

  return res.data;
};

const checkVerifyStatus = async (
  guid: string
): Promise<{
  message: string;
  result: string;
  status: string;
}> => {
  const query = new URLSearchParams({
    module: "contract",
    action: "checkverifystatus",
    guid,
  });

  const res = await axios.get(DST_BLOCKSCOUT + "?" + query);
  if (res.data.status !== "1") throw res.data;

  return res.data;
};

const main = async () => {
  const contracts = JSON.parse(readFileSync(INPUT, "utf8")) as OutputItem[];
  console.log(`Verify ${contracts.length} contracts in ${INPUT}`);

  for (const contract of contracts) {
    process.stdout.write(`${contract.Address}...`);

    if (await verified(contract.Address)) {
      console.log("verified");
      continue;
    }

    const start = Date.now() / 1000;
    try {
      if (!contract.AdditionalSources) {
        await verifyWithFlatCode(contract);
      } else {
        const res = await verifyWithStandardJson(contract);

        while (true) {
          await sleep(5000);
          const status = await checkVerifyStatus(res.result);

          if (/Pending/.test(status.result)) {
            process.stdout.write(".");
          } else if (/Fail/.test(status.result)) {
            throw status;
          } else if (/Pass/.test(status.result)) {
            break;
          }
        }
      }
    } catch (e) {
      console.log("error");
      console.error(e);
      // break;
    }

    const end = Date.now() / 1000;

    console.log("verified");
    console.log(`time: ${end - start} sec`);
  }
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
