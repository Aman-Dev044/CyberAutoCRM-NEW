import { itemRoutes } from '@/lib/crud';
import { serviceConfig } from '@/server/collections';

export const { GET, PATCH, DELETE } = itemRoutes(serviceConfig);
