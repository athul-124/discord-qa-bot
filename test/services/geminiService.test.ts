import { expect } from 'chai';
import * as sinon from 'sinon';
import { GeminiService } from '../../src/services/geminiService';

describe('GeminiService', () => {
  let service: GeminiService;
  let dbStub: any;
  let collectionStub: any;
  let docStub: any;

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
    service = new GeminiService(mockApiKey, dbStub as any);
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
      expect(remaining).to.equal(400);
    });

    it('should return full limit when no data exists', async () => {
      docStub.get.resolves({
        exists: false,
      });

      const remaining = await service.getRemainingRequests();
      expect(remaining).to.equal(500);
    });

    it('should prevent requests when at daily limit', async () => {
      docStub.get.resolves({
        exists: true,
        data: () => ({ date: '2024-01-01', count: 500 }),
      });

      const remaining = await service.getRemainingRequests();
      expect(remaining).to.equal(0);
    });
  });

  describe('generateResponse', () => {
    it('should return fallback when no KB matches provided', async () => {
      const response = await service.generateResponse('test query', []);
      
      expect(response).to.be.a('string');
      expect(response).to.include('knowledge base');
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
      
      expect(response).to.be.a('string');
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
      expect(remaining).to.be.a('number');
    });
  });
});
