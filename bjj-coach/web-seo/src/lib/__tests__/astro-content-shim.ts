import { z } from 'zod';

export { z };

export function defineCollection<T>(opts: T): T {
  return opts;
}

export async function getEntry(_collection: string, _id: string): Promise<undefined> {
  return undefined;
}

export async function getCollection(_collection: string, _filter?: unknown): Promise<unknown[]> {
  return [];
}
