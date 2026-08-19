/** Runs uploads one at a time — the server assigns sort_order by reading
 * the current max, so concurrent requests can race and collide. */
export async function uploadSequentially<T, R>(items: T[], upload: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (const item of items) {
    results.push(await upload(item));
  }
  return results;
}
