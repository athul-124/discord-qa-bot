export interface KnowledgeEntry {
  question: string;
  answer: string;
  keywords: string[];
  serverId: string;
  sourceFilePath: string;
  createdAt: Date;
}

export interface IngestionSummary {
  entriesCreated: number;
  entriesSkipped: number;
  errors: Array<{
    line?: number;
    chunk?: number;
    message: string;
  }>;
}

export interface AuthenticatedRequest extends Express.Request {
  serverId?: string;
  apiToken?: string;
}
