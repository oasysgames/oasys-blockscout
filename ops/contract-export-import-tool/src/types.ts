export type Contract = {
  Address: string;
  ContractName: string;
  CompilerVersion: string;
  SourceCode: string;
};

export type Code = {
  Address: string;
  CompilerVersion: string;
  ConstructorArguments?: string;
  ContractName: string;
  EVMVersion: null | string;
  FileName: string;
  IsProxy: "false" | "true";
  OptimizationUsed: "false" | "true";
  OptimizationRuns?: number;
  SourceCode: string;
  AdditionalSources?: {
    Filename: string;
    SourceCode: string;
  }[];
};

export type OutputItem = Contract & Code;

export type Contracts = { [address: string]: Contract };

export type Codes = { [address: string]: Code };
