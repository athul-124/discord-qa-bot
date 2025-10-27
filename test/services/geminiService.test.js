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
const geminiService_1 = require("../../src/services/geminiService");
describe('GeminiService', () => {
    let service;
    let dbStub;
    let collectionStub;
    let docStub;
    beforeEach(() => {
        docStub = {
            get: sinon.stub(),
            set: sinon.stub(),
            update: sinon.stub(),
        };
        collectionStub = {
            doc: sinon.stub().returns(docStub),
        };
        dbStub = {
            collection: sinon.stub().returns(collectionStub),
        };
        const mockApiKey = 'test-api-key';
        service = new geminiService_1.GeminiService(mockApiKey, dbStub);
    });
    afterEach(() => {
        sinon.restore();
    });
    describe('rate limiting', () => {
        it('should allow requests when under daily limit', async () => {
            docStub.get.resolves({
                exists: true,
                data: () => ({ date: '2024-01-01', count: 100 }),
            });
            const remaining = await service.getRemainingRequests();
            (0, chai_1.expect)(remaining).to.equal(400);
        });
        it('should return full limit when no data exists', async () => {
            docStub.get.resolves({
                exists: false,
            });
            const remaining = await service.getRemainingRequests();
            (0, chai_1.expect)(remaining).to.equal(500);
        });
        it('should prevent requests when at daily limit', async () => {
            docStub.get.resolves({
                exists: true,
                data: () => ({ date: '2024-01-01', count: 500 }),
            });
            const remaining = await service.getRemainingRequests();
            (0, chai_1.expect)(remaining).to.equal(0);
        });
    });
    describe('generateResponse', () => {
        it('should return fallback when no KB matches provided', async () => {
            const response = await service.generateResponse('test query', []);
            (0, chai_1.expect)(response).to.be.a('string');
            (0, chai_1.expect)(response).to.include('knowledge base');
        });
        it('should handle timeout gracefully', async () => {
            docStub.get.resolves({
                exists: false,
            });
            const mockMatches = [
                {
                    entry: {
                        question: 'Test question',
                        answer: 'Test answer',
                        keywords: ['test'],
                    },
                    score: 0.8,
                },
            ];
            const response = await service.generateResponse('test', mockMatches, 100);
            (0, chai_1.expect)(response).to.be.a('string');
        });
    });
    describe('queue processing', () => {
        it('should handle empty queue gracefully', async () => {
            docStub.get.resolves({
                exists: true,
                data: () => ({ date: '2024-01-01', count: 499 }),
            });
            await service.processQueue();
            const remaining = await service.getRemainingRequests();
            (0, chai_1.expect)(remaining).to.be.a('number');
        });
    });
});
//# sourceMappingURL=geminiService.test.js.map