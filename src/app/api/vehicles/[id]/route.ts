import { itemRoutes } from '@/lib/crud';
import { vehicleConfig } from '@/server/collections';

export const { GET, PATCH, DELETE } = itemRoutes(vehicleConfig);
