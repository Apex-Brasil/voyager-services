import { IPFS_URL } from "./constants";

export const collectionStatusFormatter = (data: any) => {
  const collectionData = data.data;

  const imagesJSON =
    collectionData.data.images && JSON.parse(collectionData.data.images);
  const formated = {
    collection_name: collectionData.collection_name,
    name: collectionData.name,
    img: IPFS_URL + collectionData.img,
    author: collectionData.author,
    data: {
      ...collectionData.data,
      img: IPFS_URL + collectionData.data.img,
      socials: collectionData.data.socials
        ? JSON.parse(collectionData.data.socials)
        : undefined,
      images: imagesJSON && {
        banner:
          imagesJSON?.banner_1920x500 && IPFS_URL + imagesJSON?.banner_1920x500,
        logo: imagesJSON?.logo_512x512 && IPFS_URL + imagesJSON?.logo_512x512,
      },
      creator_info:
        collectionData.data.creator_info &&
        JSON.parse(collectionData.data.creator_info),
    },
    created_at_time: collectionData.created_at_time,
  };

  return formated;
};

export const assetFormatter = (data: any) => {
  if (!data) {
    return [];
  }
  if (data.length) {
    const assets = data.map((asset: any) => {
      const formated = {
        asset_id: +asset.asset_id,
        template_id: +asset.template.template_id,
        owner: asset.owner,
        is_transferable: asset.is_transferable,
        is_burnable: asset.is_burnable,
        collection_name: asset.collection.collection_name,
        schema: asset.schema.schema_name,
        mutable_data: asset.mutable_data,
        immutable_data: asset.immutable_data,
        template_mint: +asset.template_mint,
        data: asset.data,
        name: asset.name,
      };

      if (formated.data.img) {
        formated.data.img = IPFS_URL + formated.data.img;
      }

      return formated;
    });

    return assets;
  } else {
    const formated = {
      asset_id: +data.asset_id,
      template_id: +data.template.template_id,
      owner: data.owner,
      is_transferable: data.is_transferable,
      is_burnable: data.is_burnable,
      collection_name: data.collection.collection_name,
      schema: data.schema.schema_name,
      mutable_data: data.mutable_data,
      immutable_data: data.immutable_data,
      template_mint: +data.template_mint,
      data: data.data,
      name: data.name,
    };

    return formated;
  }
};

export function transformStringOnTimestamp(time: string): number {
  if (!time.endsWith("m") && !time.endsWith("h") && !time.endsWith("d")) {
    return 0;
  }

  const millisecondsPerSecond = 1000;
  const secondsPerMinute = 60;
  const minutesPerHour = 60;
  const hoursPerDay = 24;

  const millisecondsPerMinute = millisecondsPerSecond * secondsPerMinute;
  const millisecondsPerHour = millisecondsPerMinute * minutesPerHour;
  const millisecondsPerDay = millisecondsPerHour * hoursPerDay;

  const regex = /^(\d+)([mhd])$/; // Regular expression to match the input format

  const match = regex.exec(time); // Match the input against the regular expression

  if (!match) {
    return 0;
  }

  const value = parseInt(match[1]); // Extract the numeric value from the input
  const unit = match[2]; // Extract the unit from the input

  switch (unit) {
    case "m":
      return value * millisecondsPerMinute;
    case "h":
      return value * millisecondsPerHour;
    case "d":
      return value * millisecondsPerDay;
    default:
      return 0;
  }
}
