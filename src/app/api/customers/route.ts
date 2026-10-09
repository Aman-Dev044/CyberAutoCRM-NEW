import { collectionRoutes } from '@/lib/crud';
import { customerConfig } from '@/server/collections';

export const { GET, POST } = collectionRoutes(customerConfig);
