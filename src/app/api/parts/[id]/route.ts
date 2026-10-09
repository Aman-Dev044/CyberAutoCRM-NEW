import { itemRoutes } from '@/lib/crud';
import { partConfig } from '@/server/collections';

export const { GET, PATCH, DELETE } = itemRoutes(partConfig);
