import { collectionRoutes } from '@/lib/crud';
import { serviceConfig } from '@/server/collections';

export const { GET, POST } = collectionRoutes(serviceConfig);
