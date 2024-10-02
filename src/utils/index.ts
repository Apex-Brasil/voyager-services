export const durationMonthsByTimestamp = (timestamp: number) => {
  const now = new Date().getTime();
  const diff = now - timestamp;
  const duration = diff / (1000 * 60 * 60 * 24 * 30);
  return Math.round(duration);
};

export function vectorSlice<T>(arr: T[], size: number): T[][] {
  const tempArr = [];
  for (let i = 0; i < arr.length; i += size) {
    const tempSlice = arr.slice(i, i + size);
    tempArr.push(tempSlice);
  }
  return tempArr;
}

export const delay = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
