export declare type SchemaObject = {
  name: string;
  type: string;
  parent?: number;
};

export interface ILightCollection {
  contract: string;
  collection_name: string;
  name: string;
  img: string;
  author: string;
  allow_notify: boolean;
  authorized_accounts: string[];
  notify_accounts: string[];
  market_fee: number;
  data: {
    [key: string]: any;
  };
  created_at_block: string;
  created_at_time: string;
}
export interface ILightSchema {
  schema_name: string;
  format: SchemaObject[];
  created_at_block: string;
  created_at_time: string;
}
export interface ILightTemplate {
  template_id: string;
  max_supply: string;
  is_transferable: boolean;
  is_burnable: boolean;
  issued_supply: string;
  immutable_data: {
    [key: string]: any;
  };
  created_at_block: string;
  created_at_time: string;
}
export interface IAsset {
  contract: string;
  asset_id: string;
  owner: string | null;
  name: string;
  is_transferable: boolean;
  is_burnable: boolean;
  template_mint: string;
  collection: ILightCollection;
  schema: ILightSchema;
  template: ILightTemplate;
  backed_tokens: Array<{
    token_contract: string;
    token_symbol: string;
    token_precision: number;
    amount: string;
  }>;
  immutable_data: {
    [key: string]: any;
  };
  mutable_data: {
    [key: string]: any;
  };
  data: {
    [key: string]: any;
  };
  burned_by_account: string | null;
  burned_at_block: string | null;
  burned_at_time: string | null;
  updated_at_block: string;
  updated_at_time: string;
  transferred_at_block: string;
  transferred_at_time: string;
  minted_at_block: string;
  minted_at_time: string;
}
export interface ICollection extends ILightCollection {
  contract: string;
}
export interface ISchema extends ILightSchema {
  contract: string;
  collection: ILightCollection;
}
export interface ITemplate extends ILightTemplate {
  contract: string;
  collection: ILightCollection;
  schema: ILightSchema;
}

export interface IAssetRoot {
  asset_id: number;
  owner: string;
  schema_name: string;
  template_id: number;
  template_mint: number;
  data: any;
}
