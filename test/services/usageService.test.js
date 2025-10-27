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
const usageService_1 = require("../../src/services/usageService");
describe('UsageService', () => {
    let usageService;
    let mockDb;
    let mockCollection;
    let mockDocRef;
    beforeEach(() => {
        // Create mock Firestore
        mockDocRef = {
            get: sinon.stub(),
            set: sinon.stub().resolves(),
            update: sinon.stub().resolves()
        };
        mockCollection = {
            doc: sinon.stub().returns(mockDocRef)
        };
        mockDb = {
            collection: sinon.stub().returns(mockCollection)
        };
        usageService = new usageService_1.UsageService(mockDb);
    });
    afterEach(() => {
        sinon.restore();
    });
    describe('getUsage', () => {
        it('should return usage data when document exists', async () => {
            const mockData = {
                messageCount: 5,
                monthlyLimit: 10,
                resetDate: { toDate: () => new Date('2024-02-01') },
                tier: 'free'
            };
            mockDocRef.get.resolves({
                exists: true,
                data: () => mockData
            });
            const usage = await usageService.getUsage('user123');
            (0, chai_1.expect)(usage).to.not.be.null;
            (0, chai_1.expect)(usage.userId).to.equal('user123');
            (0, chai_1.expect)(usage.messageCount).to.equal(5);
            (0, chai_1.expect)(usage.monthlyLimit).to.equal(10);
            (0, chai_1.expect)(usage.tier).to.equal('free');
        });
        it('should return null when document does not exist', async () => {
            mockDocRef.get.resolves({ exists: false });
            const usage = await usageService.getUsage('nonexistent');
            (0, chai_1.expect)(usage).to.be.null;
        });
    });
    describe('initializeUsage', () => {
        it('should initialize usage for free tier', async () => {
            await usageService.initializeUsage('user123', 'free');
            (0, chai_1.expect)(mockDocRef.set.calledOnce).to.be.true;
            const setCall = mockDocRef.set.firstCall.args[0];
            (0, chai_1.expect)(setCall.messageCount).to.equal(0);
            (0, chai_1.expect)(setCall.monthlyLimit).to.equal(10);
            (0, chai_1.expect)(setCall.tier).to.equal('free');
            (0, chai_1.expect)(setCall.resetDate).to.be.instanceOf(Date);
        });
        it('should initialize usage for pro tier', async () => {
            await usageService.initializeUsage('user123', 'pro');
            (0, chai_1.expect)(mockDocRef.set.calledOnce).to.be.true;
            const setCall = mockDocRef.set.firstCall.args[0];
            (0, chai_1.expect)(setCall.messageCount).to.equal(0);
            (0, chai_1.expect)(setCall.monthlyLimit).to.equal(1000);
            (0, chai_1.expect)(setCall.tier).to.equal('pro');
        });
        it('should default to free tier when tier not specified', async () => {
            await usageService.initializeUsage('user123');
            const setCall = mockDocRef.set.firstCall.args[0];
            (0, chai_1.expect)(setCall.tier).to.equal('free');
            (0, chai_1.expect)(setCall.monthlyLimit).to.equal(10);
        });
    });
    describe('canSendMessage', () => {
        it('should return true when user is within limits', async () => {
            mockDocRef.get.resolves({
                exists: true,
                data: () => ({
                    messageCount: 5,
                    monthlyLimit: 10,
                    resetDate: { toDate: () => new Date(Date.now() + 86400000) },
                    tier: 'free'
                })
            });
            const canSend = await usageService.canSendMessage('user123');
            (0, chai_1.expect)(canSend).to.be.true;
        });
        it('should return false when user has reached limit', async () => {
            mockDocRef.get.resolves({
                exists: true,
                data: () => ({
                    messageCount: 10,
                    monthlyLimit: 10,
                    resetDate: { toDate: () => new Date(Date.now() + 86400000) },
                    tier: 'free'
                })
            });
            const canSend = await usageService.canSendMessage('user123');
            (0, chai_1.expect)(canSend).to.be.false;
        });
        it('should return true for new users and initialize them', async () => {
            mockDocRef.get.resolves({ exists: false });
            const canSend = await usageService.canSendMessage('newuser');
            (0, chai_1.expect)(canSend).to.be.true;
            (0, chai_1.expect)(mockDocRef.set.calledOnce).to.be.true;
        });
        it('should reset usage if reset date has passed', async () => {
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
            const canSend = await usageService.canSendMessage('user123');
            (0, chai_1.expect)(canSend).to.be.true;
            (0, chai_1.expect)(mockDocRef.update.calledOnce).to.be.true;
        });
    });
    describe('incrementUsage', () => {
        it('should increment message count', async () => {
            mockDocRef.get.resolves({
                exists: true,
                data: () => ({
                    messageCount: 6,
                    monthlyLimit: 10,
                    resetDate: { toDate: () => new Date() },
                    tier: 'free'
                })
            });
            await usageService.incrementUsage('user123');
            (0, chai_1.expect)(mockDocRef.update.calledOnce).to.be.true;
        });
        it('should return updated usage data', async () => {
            mockDocRef.get.resolves({
                exists: true,
                data: () => ({
                    messageCount: 6,
                    monthlyLimit: 10,
                    resetDate: { toDate: () => new Date() },
                    tier: 'free'
                })
            });
            const usage = await usageService.incrementUsage('user123');
            (0, chai_1.expect)(usage).to.not.be.null;
            (0, chai_1.expect)(usage.userId).to.equal('user123');
        });
    });
    describe('resetUsage', () => {
        it('should reset message count to 0', async () => {
            mockDocRef.get.resolves({
                exists: true,
                data: () => ({
                    messageCount: 10,
                    monthlyLimit: 10,
                    resetDate: { toDate: () => new Date() },
                    tier: 'free'
                })
            });
            await usageService.resetUsage('user123');
            (0, chai_1.expect)(mockDocRef.update.calledOnce).to.be.true;
            const updateCall = mockDocRef.update.firstCall.args[0];
            (0, chai_1.expect)(updateCall.messageCount).to.equal(0);
            (0, chai_1.expect)(updateCall.resetDate).to.be.instanceOf(Date);
        });
        it('should set next reset date to first day of next month', async () => {
            mockDocRef.get.resolves({
                exists: true,
                data: () => ({
                    messageCount: 10,
                    monthlyLimit: 10,
                    resetDate: { toDate: () => new Date() },
                    tier: 'free'
                })
            });
            await usageService.resetUsage('user123');
            const updateCall = mockDocRef.update.firstCall.args[0];
            const resetDate = updateCall.resetDate;
            (0, chai_1.expect)(resetDate.getDate()).to.equal(1);
            (0, chai_1.expect)(resetDate.getTime()).to.be.greaterThan(Date.now());
        });
        it('should do nothing when user does not exist', async () => {
            mockDocRef.get.resolves({ exists: false });
            await usageService.resetUsage('nonexistent');
            (0, chai_1.expect)(mockDocRef.update.called).to.be.false;
        });
    });
    describe('updateTier', () => {
        it('should update tier to pro with correct limits', async () => {
            await usageService.updateTier('user123', 'pro');
            (0, chai_1.expect)(mockDocRef.update.calledOnce).to.be.true;
            const updateCall = mockDocRef.update.firstCall.args[0];
            (0, chai_1.expect)(updateCall.tier).to.equal('pro');
            (0, chai_1.expect)(updateCall.monthlyLimit).to.equal(1000);
        });
        it('should update tier to free with correct limits', async () => {
            await usageService.updateTier('user123', 'free');
            (0, chai_1.expect)(mockDocRef.update.calledOnce).to.be.true;
            const updateCall = mockDocRef.update.firstCall.args[0];
            (0, chai_1.expect)(updateCall.tier).to.equal('free');
            (0, chai_1.expect)(updateCall.monthlyLimit).to.equal(10);
        });
    });
    describe('getRemainingMessages', () => {
        it('should return correct remaining count', async () => {
            mockDocRef.get.resolves({
                exists: true,
                data: () => ({
                    messageCount: 7,
                    monthlyLimit: 10,
                    resetDate: { toDate: () => new Date() },
                    tier: 'free'
                })
            });
            const remaining = await usageService.getRemainingMessages('user123');
            (0, chai_1.expect)(remaining).to.equal(3);
        });
        it('should return 0 when limit reached', async () => {
            mockDocRef.get.resolves({
                exists: true,
                data: () => ({
                    messageCount: 10,
                    monthlyLimit: 10,
                    resetDate: { toDate: () => new Date() },
                    tier: 'free'
                })
            });
            const remaining = await usageService.getRemainingMessages('user123');
            (0, chai_1.expect)(remaining).to.equal(0);
        });
        it('should return 0 for non-existent users', async () => {
            mockDocRef.get.resolves({ exists: false });
            const remaining = await usageService.getRemainingMessages('nonexistent');
            (0, chai_1.expect)(remaining).to.equal(0);
        });
        it('should not return negative values', async () => {
            mockDocRef.get.resolves({
                exists: true,
                data: () => ({
                    messageCount: 15,
                    monthlyLimit: 10,
                    resetDate: { toDate: () => new Date() },
                    tier: 'free'
                })
            });
            const remaining = await usageService.getRemainingMessages('user123');
            (0, chai_1.expect)(remaining).to.equal(0);
        });
    });
});
//# sourceMappingURL=usageService.test.js.map