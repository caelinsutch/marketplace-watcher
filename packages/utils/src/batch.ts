export const processBatches = async <T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>,
): Promise<R[]> => {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
  }

  return results;
};

export const processInParallel = async <T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
): Promise<R[]> => {
  return Promise.all(items.map(processor));
};
