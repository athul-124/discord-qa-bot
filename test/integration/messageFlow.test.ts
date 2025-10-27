import { expect } from 'chai';
import * as sinon from 'sinon';
import { KnowledgeBaseParser } from '../../src/services/knowledgeBase';
import { KnowledgeSearchService } from '../../src/services/knowledgeSearch';
import { UsageService } from '../../src/services/usageService';
import { SpamDetector } from '../../src/utils/spamDetection';
import { SubscriptionService } from '../../src/services/subscriptionService';

describe('Integration: Message Flow', () => {
  let knowledgeBaseParser: KnowledgeBaseParser;
  let searchService: KnowledgeSearchService;
  let usageService: UsageService;
  let spamDetector: SpamDetector;
  let subscriptionService: SubscriptionService;
  let mockDb: any;
  let mockDocRef: any;

  beforeEach(async () => {
    // Setup mocked Firestore
    mockDocRef = {
      get: sinon.stub(),
      set: sinon.stub().resolves(),
      update: sinon.stub().resolves()
    };

    const mockCollection = {
      doc: sinon.stub().returns(mockDocRef)
    };

    mockDb = {
      collection: sinon.stub().returns(mockCollection)
    };

    // Initialize services
    knowledgeBaseParser = new KnowledgeBaseParser();
    spamDetector = new SpamDetector();
    subscriptionService = new SubscriptionService('test_key');
    usageService = new UsageService(mockDb);

    // Setup test knowledge base
    const knowledgeBase = [
      {
        question: 'What is Discord?',
        answer: 'Discord is a communication platform.',
        keywords: ['discord', 'communication', 'platform']
      },
      {
        question: 'How to join a server?',
        answer: 'Click on the invite link.',
        keywords: ['join', 'server', 'invite', 'link']
      }
    ];

    searchService = new KnowledgeSearchService(knowledgeBase, 0.3);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Valid message flow', () => {
    it('should process a valid user message end-to-end', async () => {
      const userId = 'user123';
      const message = 'How do I join a server?';

      // Setup user with available quota
      mockDocRef.get.resolves({
        exists: true,
        data: () => ({
          messageCount: 5,
          monthlyLimit: 10,
          resetDate: { toDate: () => new Date(Date.now() + 86400000) },
          tier: 'free'
        })
      });

      // Step 1: Check spam
      const spamCheck = spamDetector.check(message);
      expect(spamCheck.isSpam).to.be.false;

      // Step 2: Check usage limits
      const canSend = await usageService.canSendMessage(userId);
      expect(canSend).to.be.true;

      // Step 3: Search knowledge base
      const searchResult = searchService.getBestMatch(message);
      expect(searchResult).to.not.be.null;
      expect(searchResult!.entry.answer).to.include('invite link');

      // Step 4: Increment usage
      await usageService.incrementUsage(userId);
      expect(mockDocRef.update.calledOnce).to.be.true;
    });

    it('should handle new user message flow', async () => {
      const userId = 'newuser';
      const message = 'What is Discord?';

      // New user has no usage data
      mockDocRef.get.onFirstCall().resolves({ exists: false });
      mockDocRef.get.onSecondCall().resolves({
        exists: true,
        data: () => ({
          messageCount: 1,
          monthlyLimit: 10,
          resetDate: { toDate: () => new Date(Date.now() + 86400000) },
          tier: 'free'
        })
      });

      // Check spam
      const spamCheck = spamDetector.check(message);
      expect(spamCheck.isSpam).to.be.false;

      // Check usage (should initialize)
      const canSend = await usageService.canSendMessage(userId);
      expect(canSend).to.be.true;

      // Search knowledge base
      const searchResult = searchService.getBestMatch(message);
      expect(searchResult).to.not.be.null;
      expect(searchResult!.entry.question).to.equal('What is Discord?');

      // Increment usage
      await usageService.incrementUsage(userId);
      expect(mockDocRef.update.called).to.be.true;
    });
  });

  describe('Spam detection flow', () => {
    it('should reject spam messages before processing', async () => {
      const userId = 'user123';
      const spamMessage = 'Check out this link http://spam.com for free stuff!';

      // Check spam (should fail)
      const spamCheck = spamDetector.check(spamMessage);
      expect(spamCheck.isSpam).to.be.true;
      expect(spamCheck.reason).to.equal('Message contains URLs');

      // Should not proceed to usage check or knowledge search
      // This simulates early return in actual bot flow
    });

    it('should reject messages with excessive caps', async () => {
      const userId = 'user123';
      const capsMessage = 'PLEASE HELP ME WITH THIS URGENT PROBLEM NOW';

      const spamCheck = spamDetector.check(capsMessage);
      expect(spamCheck.isSpam).to.be.true;
      expect(spamCheck.reason).to.equal('Message contains excessive capital letters');
    });
  });

  describe('Usage limit enforcement', () => {
    it('should reject messages when limit reached', async () => {
      const userId = 'user123';
      const message = 'How to join?';

      // User at limit
      mockDocRef.get.resolves({
        exists: true,
        data: () => ({
          messageCount: 10,
          monthlyLimit: 10,
          resetDate: { toDate: () => new Date(Date.now() + 86400000) },
          tier: 'free'
        })
      });

      // Check spam (passes)
      const spamCheck = spamDetector.check(message);
      expect(spamCheck.isSpam).to.be.false;

      // Check usage (should fail)
      const canSend = await usageService.canSendMessage(userId);
      expect(canSend).to.be.false;

      // Should not proceed to knowledge search
    });

    it('should allow pro users with higher limits', async () => {
      const userId = 'prouser';
      const message = 'What is Discord?';

      // Pro user with high usage but within pro limits
      mockDocRef.get.resolves({
        exists: true,
        data: () => ({
          messageCount: 500,
          monthlyLimit: 1000,
          resetDate: { toDate: () => new Date(Date.now() + 86400000) },
          tier: 'pro'
        })
      });

      const canSend = await usageService.canSendMessage(userId);
      expect(canSend).to.be.true;

      // Can proceed with message
      const searchResult = searchService.getBestMatch(message);
      expect(searchResult).to.not.be.null;
    });
  });

  describe('Knowledge search flow', () => {
    it('should return no response for unmatched queries', () => {
      const message = 'xyz completely unrelated query abc123';

      const spamCheck = spamDetector.check(message);
      expect(spamCheck.isSpam).to.be.false;

      const searchResult = searchService.getBestMatch(message);
      expect(searchResult).to.be.null;

      // Bot would respond with "I don't know" message
    });

    it('should return best match for relevant queries', () => {
      const message = 'server invite';

      const searchResult = searchService.getBestMatch(message);
      expect(searchResult).to.not.be.null;
      expect(searchResult!.entry.question).to.include('join');
    });
  });

  describe('Monthly reset flow', () => {
    it('should reset usage when reset date passed', async () => {
      const userId = 'user123';

      // User at limit but past reset date
      let callCount = 0;
      mockDocRef.get = sinon.stub().callsFake(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            exists: true,
            data: () => ({
              messageCount: 10,
              monthlyLimit: 10,
              resetDate: { toDate: () => new Date(Date.now() - 86400000) },
              tier: 'free'
            })
          });
        } else {
          return Promise.resolve({
            exists: true,
            data: () => ({
              messageCount: 0,
              monthlyLimit: 10,
              resetDate: { toDate: () => new Date(Date.now() + 86400000) },
              tier: 'free'
            })
          });
        }
      });

      // Should reset and allow message
      const canSend = await usageService.canSendMessage(userId);
      expect(canSend).to.be.true;

      // Verify reset was called
      expect(mockDocRef.update.calledOnce).to.be.true;
      const updateCall = mockDocRef.update.firstCall.args[0];
      expect(updateCall.messageCount).to.equal(0);
    });
  });

  describe('Subscription tier differences', () => {
    it('should respect free tier limitations', async () => {
      const subscription = await subscriptionService.getSubscription('free_user');

      expect(subscription.tier).to.equal('free');
      expect(subscription.features.monthlyMessageLimit).to.equal(10);
      expect(subscription.features.prioritySupport).to.be.false;
    });

    it('should provide pro tier benefits', async () => {
      const freeFeatures = subscriptionService.getFeatures('free');
      const proFeatures = subscriptionService.getFeatures('pro');

      expect(proFeatures.monthlyMessageLimit).to.be.greaterThan(freeFeatures.monthlyMessageLimit);
      expect(proFeatures.prioritySupport).to.be.true;
      expect(proFeatures.advancedFeatures).to.be.true;
    });
  });

  describe('Error handling', () => {
    it('should handle Firestore errors gracefully', async () => {
      const userId = 'user123';
      mockDocRef.get.rejects(new Error('Firestore error'));

      try {
        await usageService.getUsage(userId);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).to.include('Firestore');
      }
    });

    it('should handle empty search results', () => {
      const emptySearchService = new KnowledgeSearchService([], 0.3);
      const result = emptySearchService.getBestMatch('any query');

      expect(result).to.be.null;
    });
  });

  describe('Complete message pipeline', () => {
    it('should process message through all validation stages', async () => {
      const userId = 'user123';
      const message = 'join server';

      mockDocRef.get.resolves({
        exists: true,
        data: () => ({
          messageCount: 3,
          monthlyLimit: 10,
          resetDate: { toDate: () => new Date(Date.now() + 86400000) },
          tier: 'free'
        })
      });

      // Stage 1: Spam check
      const spamCheck = spamDetector.check(message);
      expect(spamCheck.isSpam).to.be.false;

      // Stage 2: Subscription check
      const subscription = await subscriptionService.getSubscription(userId);
      expect(subscription.isActive).to.be.true;

      // Stage 3: Usage check
      const canSend = await usageService.canSendMessage(userId);
      expect(canSend).to.be.true;

      // Stage 4: Knowledge search
      const searchResult = searchService.getBestMatch(message);
      expect(searchResult).to.not.be.null;

      // Stage 5: Increment usage
      await usageService.incrementUsage(userId);
      expect(mockDocRef.update.calledOnce).to.be.true;

      // Stage 6: Return response
      expect(searchResult!.entry.answer).to.be.a('string');
    });
  });
});
