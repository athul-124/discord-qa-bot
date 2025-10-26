import { expect } from 'chai';
import * as sinon from 'sinon';
import { ConfigService } from '../../src/services/configService';

describe('ConfigService', () => {
  let service: ConfigService;
  let dbStub: any;
  let collectionStub: any;
  let docStub: any;

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

    service = new ConfigService(dbStub as any);
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

      expect(config).to.deep.include({
        guildId: 'guild123',
        aiEnabled: true,
        confidenceThreshold: 0.7,
        notifyOnMiss: false,
      });
      expect(config.enabledChannels).to.be.an('array').that.is.empty;
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

      expect(config).to.deep.include({
        guildId: 'guild123',
        aiEnabled: false,
        confidenceThreshold: 0.8,
        notifyOnMiss: true,
      });
      expect(config.enabledChannels).to.deep.equal(['channel1', 'channel2']);
    });
  });

  describe('setAiEnabled', () => {
    it('should update AI enabled status', async () => {
      await service.setAiEnabled('guild123', false);

      sinon.assert.calledWith(
        docStub.set,
        { aiEnabled: false },
        { merge: true }
      );
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

      expect(isEnabled).to.be.true;
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

      expect(isEnabled).to.be.true;
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

      expect(isEnabled).to.be.false;
    });
  });

  describe('setConfidenceThreshold', () => {
    it('should update confidence threshold', async () => {
      await service.setConfidenceThreshold('guild123', 0.8);

      sinon.assert.calledWith(
        docStub.set,
        { confidenceThreshold: 0.8 },
        { merge: true }
      );
    });
  });

  describe('setNotifyOnMiss', () => {
    it('should update notify on miss setting', async () => {
      await service.setNotifyOnMiss('guild123', true);

      sinon.assert.calledWith(
        docStub.set,
        { notifyOnMiss: true },
        { merge: true }
      );
    });
  });
});
