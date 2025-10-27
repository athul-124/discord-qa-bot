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
const configService_1 = require("../../src/services/configService");
describe('ConfigService', () => {
    let service;
    let dbStub;
    let collectionStub;
    let docStub;
    beforeEach(() => {
        docStub = {
            get: sinon.stub(),
            set: sinon.stub(),
        };
        collectionStub = {
            doc: sinon.stub().returns(docStub),
        };
        dbStub = {
            collection: sinon.stub().returns(collectionStub),
        };
        service = new configService_1.ConfigService(dbStub);
    });
    afterEach(() => {
        sinon.restore();
    });
    describe('getConfig', () => {
        it('should return default config when document does not exist', async () => {
            docStub.get.resolves({
                exists: false,
            });
            const config = await service.getConfig('guild123');
            (0, chai_1.expect)(config).to.deep.include({
                guildId: 'guild123',
                aiEnabled: true,
                confidenceThreshold: 0.7,
                notifyOnMiss: false,
            });
            (0, chai_1.expect)(config.enabledChannels).to.be.an('array').that.is.empty;
        });
        it('should return stored config when document exists', async () => {
            docStub.get.resolves({
                exists: true,
                data: () => ({
                    aiEnabled: false,
                    enabledChannels: ['channel1', 'channel2'],
                    confidenceThreshold: 0.8,
                    notifyOnMiss: true,
                }),
            });
            const config = await service.getConfig('guild123');
            (0, chai_1.expect)(config).to.deep.include({
                guildId: 'guild123',
                aiEnabled: false,
                confidenceThreshold: 0.8,
                notifyOnMiss: true,
            });
            (0, chai_1.expect)(config.enabledChannels).to.deep.equal(['channel1', 'channel2']);
        });
    });
    describe('setAiEnabled', () => {
        it('should update AI enabled status', async () => {
            await service.setAiEnabled('guild123', false);
            sinon.assert.calledWith(docStub.set, { aiEnabled: false }, { merge: true });
        });
    });
    describe('channel management', () => {
        it('should add enabled channel', async () => {
            docStub.get.resolves({
                exists: true,
                data: () => ({
                    aiEnabled: true,
                    enabledChannels: ['channel1'],
                }),
            });
            await service.addEnabledChannel('guild123', 'channel2');
            sinon.assert.called(docStub.set);
        });
        it('should not add duplicate channel', async () => {
            docStub.get.resolves({
                exists: true,
                data: () => ({
                    aiEnabled: true,
                    enabledChannels: ['channel1'],
                }),
            });
            await service.addEnabledChannel('guild123', 'channel1');
            sinon.assert.notCalled(docStub.set);
        });
        it('should remove enabled channel', async () => {
            docStub.get.resolves({
                exists: true,
                data: () => ({
                    aiEnabled: true,
                    enabledChannels: ['channel1', 'channel2'],
                }),
            });
            await service.removeEnabledChannel('guild123', 'channel1');
            sinon.assert.called(docStub.set);
        });
    });
    describe('isChannelEnabled', () => {
        it('should return true when no channels are configured', async () => {
            docStub.get.resolves({
                exists: true,
                data: () => ({
                    aiEnabled: true,
                    enabledChannels: [],
                }),
            });
            const isEnabled = await service.isChannelEnabled('guild123', 'channel1');
            (0, chai_1.expect)(isEnabled).to.be.true;
        });
        it('should return true when channel is in enabled list', async () => {
            docStub.get.resolves({
                exists: true,
                data: () => ({
                    aiEnabled: true,
                    enabledChannels: ['channel1', 'channel2'],
                }),
            });
            const isEnabled = await service.isChannelEnabled('guild123', 'channel1');
            (0, chai_1.expect)(isEnabled).to.be.true;
        });
        it('should return false when channel is not in enabled list', async () => {
            docStub.get.resolves({
                exists: true,
                data: () => ({
                    aiEnabled: true,
                    enabledChannels: ['channel1', 'channel2'],
                }),
            });
            const isEnabled = await service.isChannelEnabled('guild123', 'channel3');
            (0, chai_1.expect)(isEnabled).to.be.false;
        });
    });
    describe('setConfidenceThreshold', () => {
        it('should update confidence threshold', async () => {
            await service.setConfidenceThreshold('guild123', 0.8);
            sinon.assert.calledWith(docStub.set, { confidenceThreshold: 0.8 }, { merge: true });
        });
    });
    describe('setNotifyOnMiss', () => {
        it('should update notify on miss setting', async () => {
            await service.setNotifyOnMiss('guild123', true);
            sinon.assert.calledWith(docStub.set, { notifyOnMiss: true }, { merge: true });
        });
    });
});
//# sourceMappingURL=configService.test.js.map