import { Request, Response, NextFunction } from 'express';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const serverId = req.headers['x-server-id'] as string;
  const apiToken = req.headers['x-api-token'] as string;
  
  if (!serverId || !apiToken) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Missing x-server-id or x-api-token headers',
    });
  }
  
  (req as any).serverId = serverId;
  (req as any).apiToken = apiToken;
  
  next();
}
