/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable camelcase */

export const graphDataFormatter = (data: any) => {
  const groupedData: any = [];

  data.forEach((element: any) => {
    const tempObj = {
      time: Math.floor(+element.block_time / 1000),
      open: priceFormatter(element.price),
      high: priceFormatter(element.price),
      low: priceFormatter(element.price),
      close: priceFormatter(element.price),
      volume: 0,
    };

    groupedData.push(tempObj);
  });
  return groupedData;
};

export const interpolatedData = (data: any) => {
  const newData = [];

  for (let i = 0; i < data.length - 1; i++) {
    newData.push(data[i]);

    const currentTime = data[i].time;
    const nextTime = data[i + 1].time;
    const timeDifference = nextTime - currentTime;
    const numInterpolations = Math.floor(timeDifference / 300);

    for (let j = 1; j <= numInterpolations; j++) {
      const interpolatedTime = currentTime + j * 300;
      newData.push({
        time: interpolatedTime,
        open: data[i].close,
        high: data[i].close,
        low: data[i].close,
        close: data[i].close,
        volume: data[i].volume,
      });
    }
  }

  newData.push(data[data.length - 1]);

  return newData;
};

const priceFormatter = (price: number) => {
  const alpha = 100000000;

  let str = "";
  const result = (price / alpha).toString();
  str += result.split(".")[0] + ".";
  const resultSplit = result.split(".")[1];

  if (resultSplit) {
    for (let i = 0; i < resultSplit.length; i++) {
      const element = resultSplit[i];
      const nextElement = resultSplit[i + 1] || "";

      if (element === "0") {
        str += element;
      } else {
        str += element + nextElement;
        break;
      }
    }
  } else {
    str += "00";
  }

  return str;
};
