import { expect } from 'chai';
import * as sinon from 'sinon';
import { MessageHandler } from '../../src/handlers/messageHandler';
import { FirestoreKnowledgeSearchService } from '../../src/services/firestoreKnowledgeSearch';
import { GeminiService } from '../../src/services/geminiService';
import { UsageService } from '../../src/services/usageService';
import { ConfigService } from '../../src/services/configService';

describe('MessageHandler', () => {
  let handler: MessageHandler;
  let knowledgeSearchStub: sinon.SinonStubbedInstance<FirestoreKnowledgeSearchService>;
  let geminiServiceStub: sinon.SinonStubbedInstance<GeminiService>;
  let usageServiceStub: sinon.SinonStubbedInstance<UsageService>;
  let configServiceStub: sinon.SinonStubbedInstance<ConfigService>;
  let messageStub: any;

  beforeEach(() => {
    knowledgeSearchStub = sinon.createStubInstance(FirestoreKnowledgeSearchService);
    geminiServiceStub = sinon.createStubInstance(GeminiService);
    usageServiceStub = sinon.createStubInstance(UsageService);
    configServiceStub = sinon.createStubInstance(ConfigService);

    messageStub = {
      author: {
        id: 'user123',
        bot: false,
      },
      guild: {
        id: 'guild123',
        name: 'Test Guild',
      },
      channel: {
        id: 'channel123',
        sendTyping: sinon.stub(),
      },
      content: 'How do I reset my password?',
      reply: sinon.stub(),
    };

    handler = new MessageHandler(
      knowledgeSearchStub as any,
      geminiServiceStub as any,
      usageServiceStub as any,
      configServiceStub as any,
      'owner123'
    );
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('handleMessage', () => {
    it('should ignore messages from bots', async () => {
      messageStub.author.bot = true;

      await handler.handleMessage(messageStub as any);

      sinon.assert.notCalled(configServiceStub.getConfig);
    });

    it('should ignore messages not from guilds', async () => {
      messageStub.guild = null;

      await handler.handleMessage(messageStub as any);

      sinon.assert.notCalled(configServiceStub.getConfig);
    });

    it('should skip when AI is disabled for server', async () => {
      configServiceStub.getConfig.resolves({
        guildId: 'guild123',
        aiEnabled: false,
        enabledChannels: [],
        confidenceThreshold: 0.7,
        notifyOnMiss: false,
      });

      await handler.handleMessage(messageStub as any);

      sinon.assert.notCalled(knowledgeSearchStub.search);
    });

    it('should skip when channel is not enabled', async () => {
      configServiceStub.getConfig.resolves({
        guildId: 'guild123',
        aiEnabled: true,
        enabledChannels: [],
        confidenceThreshold: 0.7,
        notifyOnMiss: false,
      });
      configServiceStub.isChannelEnabled.resolves(false);

      await handler.handleMessage(messageStub as any);

      sinon.assert.notCalled(knowledgeSearchStub.search);
    });

    it('should reply when user exceeds usage limit', async () => {
      configServiceStub.getConfig.resolves({
        guildId: 'guild123',
        aiEnabled: true,
        enabledChannels: [],
        confidenceThreshold: 0.7,
        notifyOnMiss: false,
      });
      configServiceStub.isChannelEnabled.resolves(true);
      usageServiceStub.canSendMessage.resolves(false);

      await handler.handleMessage(messageStub as any);

      sinon.assert.calledWith(
        messageStub.reply,
        sinon.match(/monthly message limit/)
      );
    });

    it('should handle query with high confidence match', async () => {
      configServiceStub.getConfig.resolves({
        guildId: 'guild123',
        aiEnabled: true,
        enabledChannels: [],
        confidenceThreshold: 0.7,
        notifyOnMiss: false,
      });
      configServiceStub.isChannelEnabled.resolves(true);
      usageServiceStub.canSendMessage.resolves(true);
      
      knowledgeSearchStub.search.resolves([
        {
          entry: {
            question: 'How do I reset my password?',
            answer: 'Click forgot password.',
            keywords: ['password', 'reset'],
          },
          score: 0.85,
        },
      ]);

      geminiServiceStub.generateResponse.resolves('Here is how you reset your password...');

      await handler.handleMessage(messageStub as any);

      sinon.assert.called(knowledgeSearchStub.search);
      sinon.assert.called(geminiServiceStub.generateResponse);
      sinon.assert.called(messageStub.reply);
      sinon.assert.calledWith(usageServiceStub.incrementUsage, 'user123');
    });

    it('should handle low confidence with fallback message', async () => {
      configServiceStub.getConfig.resolves({
        guildId: 'guild123',
        aiEnabled: true,
        enabledChannels: [],
        confidenceThreshold: 0.7,
        notifyOnMiss: false,
      });
      configServiceStub.isChannelEnabled.resolves(true);
      usageServiceStub.canSendMessage.resolves(true);
      
      knowledgeSearchStub.search.resolves([
        {
          entry: {
            question: 'Something else',
            answer: 'Different answer',
            keywords: ['different'],
          },
          score: 0.4,
        },
      ]);

      await handler.handleMessage(messageStub as any);

      sinon.assert.calledWith(
        messageStub.reply,
        sinon.match(/not confident enough/)
      );
    });

    it('should handle no matches', async () => {
      configServiceStub.getConfig.resolves({
        guildId: 'guild123',
        aiEnabled: true,
        enabledChannels: [],
        confidenceThreshold: 0.7,
        notifyOnMiss: false,
      });
      configServiceStub.isChannelEnabled.resolves(true);
      usageServiceStub.canSendMessage.resolves(true);
      
      knowledgeSearchStub.search.resolves([]);

      await handler.handleMessage(messageStub as any);

      sinon.assert.calledWith(
        messageStub.reply,
        sinon.match(/couldn't find relevant information/)
      );
    });
  });

  describe('miss tracking', () => {
    it('should track repeated misses', async () => {
      configServiceStub.getConfig.resolves({
        guildId: 'guild123',
        aiEnabled: true,
        enabledChannels: [],
        confidenceThreshold: 0.7,
        notifyOnMiss: false,
      });
      configServiceStub.isChannelEnabled.resolves(true);
      usageServiceStub.canSendMessage.resolves(true);
      knowledgeSearchStub.search.resolves([]);

      await handler.handleMessage(messageStub as any);
      await handler.handleMessage(messageStub as any);

      const missCount = handler.getMissCount('user123');
      expect(missCount).to.equal(2);
    });

    it('should reset miss count after successful response', async () => {
      configServiceStub.getConfig.resolves({
        guildId: 'guild123',
        aiEnabled: true,
        enabledChannels: [],
        confidenceThreshold: 0.7,
        notifyOnMiss: false,
      });
      configServiceStub.isChannelEnabled.resolves(true);
      usageServiceStub.canSendMessage.resolves(true);
      
      knowledgeSearchStub.search.resolves([]);
      await handler.handleMessage(messageStub as any);

      knowledgeSearchStub.search.resolves([
        {
          entry: {
            question: 'Test',
            answer: 'Answer',
            keywords: ['test'],
          },
          score: 0.8,
        },
      ]);
      geminiServiceStub.generateResponse.resolves('Good answer');
      
      await handler.handleMessage(messageStub as any);

      const missCount = handler.getMissCount('user123');
      expect(missCount).to.equal(0);
    });
  });

  describe('threshold management', () => {
    it('should allow setting miss threshold', () => {
      handler.setMissThreshold(5);
      expect(handler.getMissCount('user123')).to.equal(0);
    });
  });
});
