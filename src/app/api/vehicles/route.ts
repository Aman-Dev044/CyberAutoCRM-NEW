import { collectionRoutes } from '@/lib/crud';
import { vehicleConfig } from '@/server/collections';

export const { GET, POST } = collectionRoutes(vehicleConfig);
