import { collectionRoutes } from '@/lib/crud';
import { partConfig } from '@/server/collections';

export const { GET, POST } = collectionRoutes(partConfig);
