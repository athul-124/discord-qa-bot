"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = __importStar(require("sinon"));
const knowledgeBase_1 = require("../../src/services/knowledgeBase");
const knowledgeSearch_1 = require("../../src/services/knowledgeSearch");
const usageService_1 = require("../../src/services/usageService");
const spamDetection_1 = require("../../src/utils/spamDetection");
const subscriptionService_1 = require("../../src/services/subscriptionService");
describe('Integration: Message Flow', () => {
    let knowledgeBaseParser;
    let searchService;
    let usageService;
    let spamDetector;
    let subscriptionService;
    let mockDb;
    let mockDocRef;
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
        knowledgeBaseParser = new knowledgeBase_1.KnowledgeBaseParser();
        spamDetector = new spamDetection_1.SpamDetector();
        subscriptionService = new subscriptionService_1.SubscriptionService('test_key');
        usageService = new usageService_1.UsageService(mockDb);
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
        searchService = new knowledgeSearch_1.KnowledgeSearchService(knowledgeBase, 0.3);
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
            (0, chai_1.expect)(spamCheck.isSpam).to.be.false;
            // Step 2: Check usage limits
            const canSend = await usageService.canSendMessage(userId);
            (0, chai_1.expect)(canSend).to.be.true;
            // Step 3: Search knowledge base
            const searchResult = searchService.getBestMatch(message);
            (0, chai_1.expect)(searchResult).to.not.be.null;
            (0, chai_1.expect)(searchResult.entry.answer).to.include('invite link');
            // Step 4: Increment usage
            await usageService.incrementUsage(userId);
            (0, chai_1.expect)(mockDocRef.update.calledOnce).to.be.true;
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
            (0, chai_1.expect)(spamCheck.isSpam).to.be.false;
            // Check usage (should initialize)
            const canSend = await usageService.canSendMessage(userId);
            (0, chai_1.expect)(canSend).to.be.true;
            // Search knowledge base
            const searchResult = searchService.getBestMatch(message);
            (0, chai_1.expect)(searchResult).to.not.be.null;
            (0, chai_1.expect)(searchResult.entry.question).to.equal('What is Discord?');
            // Increment usage
            await usageService.incrementUsage(userId);
            (0, chai_1.expect)(mockDocRef.update.called).to.be.true;
        });
    });
    describe('Spam detection flow', () => {
        it('should reject spam messages before processing', async () => {
            const userId = 'user123';
            const spamMessage = 'Check out this link http://spam.com for free stuff!';
            // Check spam (should fail)
            const spamCheck = spamDetector.check(spamMessage);
            (0, chai_1.expect)(spamCheck.isSpam).to.be.true;
            (0, chai_1.expect)(spamCheck.reason).to.equal('Message contains URLs');
            // Should not proceed to usage check or knowledge search
            // This simulates early return in actual bot flow
        });
        it('should reject messages with excessive caps', async () => {
            const userId = 'user123';
            const capsMessage = 'PLEASE HELP ME WITH THIS URGENT PROBLEM NOW';
            const spamCheck = spamDetector.check(capsMessage);
            (0, chai_1.expect)(spamCheck.isSpam).to.be.true;
            (0, chai_1.expect)(spamCheck.reason).to.equal('Message contains excessive capital letters');
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
            (0, chai_1.expect)(spamCheck.isSpam).to.be.false;
            // Check usage (should fail)
            const canSend = await usageService.canSendMessage(userId);
            (0, chai_1.expect)(canSend).to.be.false;
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
            (0, chai_1.expect)(canSend).to.be.true;
            // Can proceed with message
            const searchResult = searchService.getBestMatch(message);
            (0, chai_1.expect)(searchResult).to.not.be.null;
        });
    });
    describe('Knowledge search flow', () => {
        it('should return no response for unmatched queries', () => {
            const message = 'xyz completely unrelated query abc123';
            const spamCheck = spamDetector.check(message);
            (0, chai_1.expect)(spamCheck.isSpam).to.be.false;
            const searchResult = searchService.getBestMatch(message);
            (0, chai_1.expect)(searchResult).to.be.null;
            // Bot would respond with "I don't know" message
        });
        it('should return best match for relevant queries', () => {
            const message = 'server invite';
            const searchResult = searchService.getBestMatch(message);
            (0, chai_1.expect)(searchResult).to.not.be.null;
            (0, chai_1.expect)(searchResult.entry.question).to.include('join');
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
                }
                else {
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
            (0, chai_1.expect)(canSend).to.be.true;
            // Verify reset was called
            (0, chai_1.expect)(mockDocRef.update.calledOnce).to.be.true;
            const updateCall = mockDocRef.update.firstCall.args[0];
            (0, chai_1.expect)(updateCall.messageCount).to.equal(0);
        });
    });
    describe('Subscription tier differences', () => {
        it('should respect free tier limitations', async () => {
            const subscription = await subscriptionService.getSubscription('free_user');
            (0, chai_1.expect)(subscription.tier).to.equal('free');
            (0, chai_1.expect)(subscription.features.monthlyMessageLimit).to.equal(10);
            (0, chai_1.expect)(subscription.features.prioritySupport).to.be.false;
        });
        it('should provide pro tier benefits', async () => {
            const freeFeatures = subscriptionService.getFeatures('free');
            const proFeatures = subscriptionService.getFeatures('pro');
            (0, chai_1.expect)(proFeatures.monthlyMessageLimit).to.be.greaterThan(freeFeatures.monthlyMessageLimit);
            (0, chai_1.expect)(proFeatures.prioritySupport).to.be.true;
            (0, chai_1.expect)(proFeatures.advancedFeatures).to.be.true;
        });
    });
    describe('Error handling', () => {
        it('should handle Firestore errors gracefully', async () => {
            const userId = 'user123';
            mockDocRef.get.rejects(new Error('Firestore error'));
            try {
                await usageService.getUsage(userId);
                chai_1.expect.fail('Should have thrown error');
            }
            catch (error) {
                (0, chai_1.expect)(error.message).to.include('Firestore');
            }
        });
        it('should handle empty search results', () => {
            const emptySearchService = new knowledgeSearch_1.KnowledgeSearchService([], 0.3);
            const result = emptySearchService.getBestMatch('any query');
            (0, chai_1.expect)(result).to.be.null;
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
            (0, chai_1.expect)(spamCheck.isSpam).to.be.false;
            // Stage 2: Subscription check
            const subscription = await subscriptionService.getSubscription(userId);
            (0, chai_1.expect)(subscription.isActive).to.be.true;
            // Stage 3: Usage check
            const canSend = await usageService.canSendMessage(userId);
            (0, chai_1.expect)(canSend).to.be.true;
            // Stage 4: Knowledge search
            const searchResult = searchService.getBestMatch(message);
            (0, chai_1.expect)(searchResult).to.not.be.null;
            // Stage 5: Increment usage
            await usageService.incrementUsage(userId);
            (0, chai_1.expect)(mockDocRef.update.calledOnce).to.be.true;
            // Stage 6: Return response
            (0, chai_1.expect)(searchResult.entry.answer).to.be.a('string');
        });
    });
});
//# sourceMappingURL=messageFlow.test.js.map