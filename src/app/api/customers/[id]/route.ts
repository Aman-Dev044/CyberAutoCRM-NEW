import { itemRoutes } from '@/lib/crud';
import { customerConfig } from '@/server/collections';

export const { GET, PATCH, DELETE } = itemRoutes(customerConfig);
