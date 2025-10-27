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
const messageHandler_1 = require("../../src/handlers/messageHandler");
const firestoreKnowledgeSearch_1 = require("../../src/services/firestoreKnowledgeSearch");
const geminiService_1 = require("../../src/services/geminiService");
const usageService_1 = require("../../src/services/usageService");
const configService_1 = require("../../src/services/configService");
describe('MessageHandler', () => {
    let handler;
    let knowledgeSearchStub;
    let geminiServiceStub;
    let usageServiceStub;
    let configServiceStub;
    let messageStub;
    beforeEach(() => {
        knowledgeSearchStub = sinon.createStubInstance(firestoreKnowledgeSearch_1.FirestoreKnowledgeSearchService);
        geminiServiceStub = sinon.createStubInstance(geminiService_1.GeminiService);
        usageServiceStub = sinon.createStubInstance(usageService_1.UsageService);
        configServiceStub = sinon.createStubInstance(configService_1.ConfigService);
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
        handler = new messageHandler_1.MessageHandler(knowledgeSearchStub, geminiServiceStub, usageServiceStub, configServiceStub, 'owner123');
    });
    afterEach(() => {
        sinon.restore();
    });
    describe('handleMessage', () => {
        it('should ignore messages from bots', async () => {
            messageStub.author.bot = true;
            await handler.handleMessage(messageStub);
            sinon.assert.notCalled(configServiceStub.getConfig);
        });
        it('should ignore messages not from guilds', async () => {
            messageStub.guild = null;
            await handler.handleMessage(messageStub);
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
            await handler.handleMessage(messageStub);
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
            await handler.handleMessage(messageStub);
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
            await handler.handleMessage(messageStub);
            sinon.assert.calledWith(messageStub.reply, sinon.match(/monthly message limit/));
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
            await handler.handleMessage(messageStub);
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
            await handler.handleMessage(messageStub);
            sinon.assert.calledWith(messageStub.reply, sinon.match(/not confident enough/));
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
            await handler.handleMessage(messageStub);
            sinon.assert.calledWith(messageStub.reply, sinon.match(/couldn't find relevant information/));
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
            await handler.handleMessage(messageStub);
            await handler.handleMessage(messageStub);
            const missCount = handler.getMissCount('user123');
            (0, chai_1.expect)(missCount).to.equal(2);
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
            await handler.handleMessage(messageStub);
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
            await handler.handleMessage(messageStub);
            const missCount = handler.getMissCount('user123');
            (0, chai_1.expect)(missCount).to.equal(0);
        });
    });
    describe('threshold management', () => {
        it('should allow setting miss threshold', () => {
            handler.setMissThreshold(5);
            (0, chai_1.expect)(handler.getMissCount('user123')).to.equal(0);
        });
    });
});
//# sourceMappingURL=messageHandler.test.js.map