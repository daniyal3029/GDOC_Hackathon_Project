import { ICacheService } from '../interfaces/ICacheService';
import { ILogger } from '../interfaces/ILogger';
import { InvalidationEntity, InvalidationAction } from '../types/cache.types';
import { CachePrefixes } from '../config/cacheConfig';

export class CacheInvalidationService {
  constructor(
    private cacheService: ICacheService,
    private logger: ILogger
  ) {}

  async invalidate(entity: InvalidationEntity, action: InvalidationAction, id?: string): Promise<void> {
    this.logger.debug(`Invalidating cache: ${entity} ${action} ${id || ''}`);

    const promises: Promise<void>[] = [];

    switch (entity) {
      case 'meeting':
        // Delete specific meeting cache
        if (id) promises.push(this.cacheService.delPattern(`*${CachePrefixes.MEETING}${id}*`));
        // Delete all meeting list caches
        promises.push(this.cacheService.delPattern(`*${CachePrefixes.MEETINGS_LIST}*`));
        // Delete generic page caches for meetings
        promises.push(this.cacheService.delPattern(`*page:GET:*:*/api/meetings*`));
        break;

      case 'task':
        // Delete related meeting cache as task count changed
        // if (metadata?.meetingId) promises.push(this.cacheService.delPattern(`*${CachePrefixes.MEETING}${metadata.meetingId}*`));
        
        // Delete all task list caches
        promises.push(this.cacheService.delPattern(`*${CachePrefixes.TASKS_LIST}*`));
        promises.push(this.cacheService.delPattern(`*${CachePrefixes.PENDING_GROUPED}*`));
        promises.push(this.cacheService.delPattern(`*page:GET:*:*/api/tasks*`));
        break;

      case 'query':
        // Invalidate all query results as context might have changed
        promises.push(this.cacheService.delPattern(`*${CachePrefixes.QUERY}*`));
        promises.push(this.cacheService.delPattern(`*page:GET:*:*/api/query*`));
        break;
        
      case 'notification':
        if (id) promises.push(this.cacheService.delPattern(`*${CachePrefixes.USER_NOTIFICATIONS}${id}*`));
        promises.push(this.cacheService.delPattern(`*page:GET:*:*/api/notifications*`));
        break;
    }

    await Promise.all(promises);
  }
}
