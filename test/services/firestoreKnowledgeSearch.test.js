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
const firestoreKnowledgeSearch_1 = require("../../src/services/firestoreKnowledgeSearch");
describe('FirestoreKnowledgeSearchService', () => {
    let service;
    let dbStub;
    let collectionStub;
    let queryStub;
    beforeEach(() => {
        queryStub = {
            limit: sinon.stub(),
            get: sinon.stub(),
        };
        queryStub.limit.returns(queryStub);
        collectionStub = {
            where: sinon.stub().returns(queryStub),
        };
        dbStub = {
            collection: sinon.stub().returns(collectionStub),
        };
        service = new firestoreKnowledgeSearch_1.FirestoreKnowledgeSearchService(dbStub, 'kbs', 0.7);
    });
    afterEach(() => {
        sinon.restore();
    });
    describe('search', () => {
        it('should return empty array for empty query', async () => {
            const results = await service.search('', 3);
            (0, chai_1.expect)(results).to.be.an('array').that.is.empty;
        });
        it('should return results above threshold', async () => {
            const mockDocs = [
                {
                    id: '1',
                    data: () => ({
                        question: 'How do I reset my password?',
                        answer: 'Click forgot password on the login page.',
                        keywords: ['password', 'reset', 'login'],
                    }),
                },
            ];
            queryStub.get.resolves({
                forEach: (callback) => mockDocs.forEach(callback),
            });
            const results = await service.search('how to reset password', 3);
            (0, chai_1.expect)(results).to.be.an('array');
            sinon.assert.calledWith(dbStub.collection, 'kbs');
        });
        it('should filter results below threshold', async () => {
            const mockDocs = [
                {
                    id: '1',
                    data: () => ({
                        question: 'Unrelated question',
                        answer: 'Unrelated answer',
                        keywords: ['unrelated'],
                    }),
                },
            ];
            queryStub.get.resolves({
                forEach: (callback) => mockDocs.forEach(callback),
            });
            const results = await service.search('password reset', 3);
            (0, chai_1.expect)(results).to.be.an('array');
        });
        it('should limit results to specified number', async () => {
            const mockDocs = Array.from({ length: 10 }, (_, i) => ({
                id: `${i}`,
                data: () => ({
                    question: `Question ${i}`,
                    answer: `Answer ${i}`,
                    keywords: ['test', 'keyword'],
                }),
            }));
            queryStub.get.resolves({
                forEach: (callback) => mockDocs.forEach(callback),
            });
            const results = await service.search('test keyword', 3);
            (0, chai_1.expect)(results.length).to.be.at.most(3);
        });
    });
    describe('getBestMatch', () => {
        it('should return best matching entry', async () => {
            const mockDocs = [
                {
                    id: '1',
                    data: () => ({
                        question: 'Test question',
                        answer: 'Test answer',
                        keywords: ['test'],
                    }),
                },
            ];
            queryStub.get.resolves({
                forEach: (callback) => mockDocs.forEach(callback),
            });
            const result = await service.getBestMatch('test question');
            (0, chai_1.expect)(result).to.satisfy((r) => r === null || r.entry !== undefined);
        });
        it('should return null when no matches above threshold', async () => {
            queryStub.get.resolves({
                forEach: (callback) => { },
            });
            const result = await service.getBestMatch('completely unrelated query');
            (0, chai_1.expect)(result).to.be.null;
        });
    });
    describe('threshold management', () => {
        it('should update threshold', () => {
            service.setThreshold(0.5);
            (0, chai_1.expect)(service.getThreshold()).to.equal(0.5);
        });
        it('should get current threshold', () => {
            (0, chai_1.expect)(service.getThreshold()).to.equal(0.7);
        });
    });
});
//# sourceMappingURL=firestoreKnowledgeSearch.test.js.map