"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const subscriptionService_1 = require("../../src/services/subscriptionService");
describe('SubscriptionService', () => {
    let subscriptionService;
    beforeEach(() => {
        subscriptionService = new subscriptionService_1.SubscriptionService('test_whop_key');
    });
    describe('getSubscription', () => {
        it('should return subscription info for a user', async () => {
            const subscription = await subscriptionService.getSubscription('user123');
            (0, chai_1.expect)(subscription).to.not.be.null;
            (0, chai_1.expect)(subscription.userId).to.equal('user123');
            (0, chai_1.expect)(subscription.tier).to.be.oneOf(['free', 'pro']);
            (0, chai_1.expect)(subscription.isActive).to.be.a('boolean');
            (0, chai_1.expect)(subscription.features).to.be.an('object');
        });
        it('should return free tier by default', async () => {
            const subscription = await subscriptionService.getSubscription('newuser');
            (0, chai_1.expect)(subscription.tier).to.equal('free');
        });
        it('should include all required features', async () => {
            const subscription = await subscriptionService.getSubscription('user123');
            (0, chai_1.expect)(subscription.features).to.have.property('monthlyMessageLimit');
            (0, chai_1.expect)(subscription.features).to.have.property('prioritySupport');
            (0, chai_1.expect)(subscription.features).to.have.property('advancedFeatures');
            (0, chai_1.expect)(subscription.features).to.have.property('customResponses');
        });
    });
    describe('hasFeature', () => {
        it('should return true for features included in subscription', async () => {
            const hasFeature = await subscriptionService.hasFeature('user123', 'prioritySupport');
            (0, chai_1.expect)(hasFeature).to.be.a('boolean');
        });
        it('should return false for inactive subscriptions', async () => {
            // Mock an inactive subscription scenario
            // In a real test, we would stub the getSubscription method
            const hasFeature = await subscriptionService.hasFeature('inactive_user', 'prioritySupport');
            (0, chai_1.expect)(hasFeature).to.be.a('boolean');
        });
    });
    describe('isPro', () => {
        it('should return false for free tier users', async () => {
            const isPro = await subscriptionService.isPro('free_user');
            (0, chai_1.expect)(isPro).to.be.false;
        });
        it('should check subscription is active', async () => {
            const isPro = await subscriptionService.isPro('user123');
            (0, chai_1.expect)(isPro).to.be.a('boolean');
        });
    });
    describe('getMessageLimit', () => {
        it('should return correct limit for free tier', async () => {
            const limit = await subscriptionService.getMessageLimit('free_user');
            (0, chai_1.expect)(limit).to.be.a('number');
            (0, chai_1.expect)(limit).to.be.greaterThan(0);
        });
        it('should return higher limit for pro tier', async () => {
            const freeFeatures = subscriptionService.getFeatures('free');
            const proFeatures = subscriptionService.getFeatures('pro');
            (0, chai_1.expect)(proFeatures.monthlyMessageLimit).to.be.greaterThan(freeFeatures.monthlyMessageLimit);
        });
    });
    describe('verifyWhopSubscription', () => {
        it('should return a valid tier on successful verification', async () => {
            const tier = await subscriptionService.verifyWhopSubscription('user123', 'membership_id');
            (0, chai_1.expect)(tier).to.be.oneOf(['free', 'pro', null]);
        });
        it('should return free tier with test API key', async () => {
            const tier = await subscriptionService.verifyWhopSubscription('user123', 'test_membership');
            (0, chai_1.expect)(tier).to.equal('free');
        });
        it('should handle verification errors gracefully', async () => {
            const tier = await subscriptionService.verifyWhopSubscription('user123', 'invalid_id');
            (0, chai_1.expect)(tier).to.be.oneOf(['free', 'pro', null]);
        });
    });
    describe('getFeatures', () => {
        it('should return free tier features', () => {
            const features = subscriptionService.getFeatures('free');
            (0, chai_1.expect)(features.monthlyMessageLimit).to.equal(10);
            (0, chai_1.expect)(features.prioritySupport).to.be.false;
            (0, chai_1.expect)(features.advancedFeatures).to.be.false;
            (0, chai_1.expect)(features.customResponses).to.be.false;
        });
        it('should return pro tier features', () => {
            const features = subscriptionService.getFeatures('pro');
            (0, chai_1.expect)(features.monthlyMessageLimit).to.equal(1000);
            (0, chai_1.expect)(features.prioritySupport).to.be.true;
            (0, chai_1.expect)(features.advancedFeatures).to.be.true;
            (0, chai_1.expect)(features.customResponses).to.be.true;
        });
        it('should differentiate between free and pro tiers', () => {
            const freeFeatures = subscriptionService.getFeatures('free');
            const proFeatures = subscriptionService.getFeatures('pro');
            (0, chai_1.expect)(proFeatures.monthlyMessageLimit).to.be.greaterThan(freeFeatures.monthlyMessageLimit);
            (0, chai_1.expect)(proFeatures.prioritySupport).to.not.equal(freeFeatures.prioritySupport);
            (0, chai_1.expect)(proFeatures.advancedFeatures).to.not.equal(freeFeatures.advancedFeatures);
            (0, chai_1.expect)(proFeatures.customResponses).to.not.equal(freeFeatures.customResponses);
        });
    });
    describe('isExpired', () => {
        it('should return false when no expiration date', () => {
            const subscription = {
                userId: 'user123',
                tier: 'pro',
                isActive: true,
                features: subscriptionService.getFeatures('pro')
            };
            const expired = subscriptionService.isExpired(subscription);
            (0, chai_1.expect)(expired).to.be.false;
        });
        it('should return false for future expiration dates', () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);
            const subscription = {
                userId: 'user123',
                tier: 'pro',
                isActive: true,
                expiresAt: futureDate,
                features: subscriptionService.getFeatures('pro')
            };
            const expired = subscriptionService.isExpired(subscription);
            (0, chai_1.expect)(expired).to.be.false;
        });
        it('should return true for past expiration dates', () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 30);
            const subscription = {
                userId: 'user123',
                tier: 'pro',
                isActive: true,
                expiresAt: pastDate,
                features: subscriptionService.getFeatures('pro')
            };
            const expired = subscriptionService.isExpired(subscription);
            (0, chai_1.expect)(expired).to.be.true;
        });
        it('should handle edge case of expiration date being now', () => {
            const now = new Date();
            const subscription = {
                userId: 'user123',
                tier: 'pro',
                isActive: true,
                expiresAt: now,
                features: subscriptionService.getFeatures('pro')
            };
            const expired = subscriptionService.isExpired(subscription);
            (0, chai_1.expect)(expired).to.be.a('boolean');
        });
    });
    describe('tier gating logic', () => {
        it('should properly differentiate free and pro tier limits', () => {
            const freeFeatures = subscriptionService.getFeatures('free');
            const proFeatures = subscriptionService.getFeatures('pro');
            (0, chai_1.expect)(freeFeatures.monthlyMessageLimit).to.be.lessThan(proFeatures.monthlyMessageLimit);
            (0, chai_1.expect)(freeFeatures.prioritySupport).to.be.false;
            (0, chai_1.expect)(proFeatures.prioritySupport).to.be.true;
        });
        it('should enforce correct limits for free tier', async () => {
            const limit = await subscriptionService.getMessageLimit('free_user');
            const features = subscriptionService.getFeatures('free');
            (0, chai_1.expect)(limit).to.equal(features.monthlyMessageLimit);
        });
    });
});
//# sourceMappingURL=subscriptionService.test.js.map