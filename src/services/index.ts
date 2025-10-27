// Firebase configuration
export * from '../config/firebase';

// Service exports
export { ConfigService, configService } from './configService';
export { KnowledgeBaseService, knowledgeBaseService } from './knowledgeBaseService';
export { UsageService, usageService, UsageCheckResult } from './usageService';
export { TrendService, trendService, TrendStats, TrendQuery } from './trendService';

// Legacy exports for backward compatibility
export { usageServiceLegacy, UsageServiceLegacy } from './usageService';
