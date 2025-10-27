import { Router, Request, Response } from 'express';
import { authenticateRequest, AuthRequest } from '../middleware/auth';
import { whopService } from '../services/whopService';
import { configService } from '../services/configService';
import { usageService } from '../services/usageService';
import { discordService } from '../services/discordService';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    bot: discordService.isReady() ? 'ready' : 'not ready',
  });
});

router.post('/link-server', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { whopToken, serverId } = req.body;

    if (!whopToken || !serverId) {
      res.status(400).json({ error: 'whopToken and serverId are required' });
      return;
    }

    const validation = await whopService.validateToken(whopToken);
    
    if (!validation.valid) {
      res.status(401).json({ error: 'Invalid or expired Whop token' });
      return;
    }

    const config = configService.getConfig(serverId);
    if (!config) {
      res.status(404).json({ error: 'Server not found. Please add the bot to your Discord server first.' });
      return;
    }

    const isOwner = await discordService.verifyServerOwnership(serverId, config.ownerId);
    if (!isOwner) {
      res.status(403).json({ error: 'Only the server owner can link a subscription' });
      return;
    }

    const tier = await whopService.getSubscriptionTier(whopToken);
    const customerId = await whopService.getCustomerId(whopToken);
    const expiresAt = await whopService.getSubscriptionExpiration(whopToken);

    const updatedConfig = configService.linkServer(
      serverId,
      config.ownerId,
      tier,
      customerId || undefined,
      whopToken,
      expiresAt || undefined
    );

    res.json({
      success: true,
      config: {
        serverId: updatedConfig.serverId,
        tier: updatedConfig.tier,
        expiresAt: updatedConfig.expiresAt,
        linkedAt: updatedConfig.linkedAt,
      },
    });
  } catch (error) {
    console.error('Error linking server:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/upload-kb', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { serverId, knowledgeBase } = req.body;

    if (!serverId || !knowledgeBase) {
      res.status(400).json({ error: 'serverId and knowledgeBase are required' });
      return;
    }

    const config = configService.getConfig(serverId);
    if (!config) {
      res.status(404).json({ error: 'Server not found' });
      return;
    }

    configService.updateKnowledgeBase(serverId, knowledgeBase);

    res.json({
      success: true,
      message: 'Knowledge base updated successfully',
    });
  } catch (error) {
    console.error('Error uploading knowledge base:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/usage/:serverId', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { serverId } = req.params;

    const config = configService.getConfig(serverId);
    if (!config) {
      res.status(404).json({ error: 'Server not found' });
      return;
    }

    const usage = usageService.getUsage(serverId);
    const tier = configService.getTier(serverId);

    res.json({
      serverId,
      tier,
      usage: {
        messageCount: usage.messageCount,
        limitReached: usage.limitReached,
        lastReset: usage.lastReset,
        remaining: tier === 'free' ? usageService.getRemainingMessages(serverId) : null,
      },
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/subscription/:serverId', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { serverId } = req.params;

    const config = configService.getConfig(serverId);
    if (!config) {
      res.status(404).json({ error: 'Server not found' });
      return;
    }

    const tier = configService.getTier(serverId);

    res.json({
      serverId,
      tier,
      whopCustomerId: config.whopCustomerId,
      expiresAt: config.expiresAt,
      linkedAt: config.linkedAt,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/config/:serverId', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { serverId } = req.params;

    const config = configService.getConfig(serverId);
    if (!config) {
      res.status(404).json({ error: 'Server not found' });
      return;
    }

    res.json({
      serverId: config.serverId,
      tier: config.tier,
      settings: config.settings,
      linkedAt: config.linkedAt,
    });
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/config', authenticateRequest, async (req: AuthRequest, res: Response) => {
  try {
    const { serverId, settings } = req.body;

    if (!serverId) {
      res.status(400).json({ error: 'serverId is required' });
      return;
    }

    const config = configService.getConfig(serverId);
    if (!config) {
      res.status(404).json({ error: 'Server not found' });
      return;
    }

    const updatedConfig = configService.setConfig(serverId, { settings });

    res.json({
      success: true,
      config: {
        serverId: updatedConfig.serverId,
        settings: updatedConfig.settings,
      },
    });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
