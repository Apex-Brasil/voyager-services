import { IAsset, IAssetRoot } from "../common/@types/asset.types";
import { IPFS_URL } from "../utils/constants";

export class AssetFormatterService {
  assetFormat(data: IAsset[]): IAssetRoot[] {
    const formattedData: IAssetRoot[] = data.map(asset => {
      const immutableData = asset.template?.immutable_data || {};
      const mutableData = asset?.mutable_data || {};

      const formattedObj: IAssetRoot = {
        asset_id: +asset.asset_id,
        owner: asset.owner ?? "",
        schema_name: asset.schema.schema_name,
        template_id: asset.template?.template_id
          ? +asset.template.template_id
          : 0,
        data: {
          img: mutableData.img ? IPFS_URL + mutableData.img : "",
          video: mutableData.video ? IPFS_URL + mutableData.video : "",
          ...mutableData,
          ...immutableData,
        },
        template_mint: +asset.template_mint,
      };
      return formattedObj;
    });
    return formattedData;
  }
}
