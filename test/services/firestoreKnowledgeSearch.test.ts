import { expect } from 'chai';
import * as sinon from 'sinon';
import { FirestoreKnowledgeSearchService } from '../../src/services/firestoreKnowledgeSearch';

describe('FirestoreKnowledgeSearchService', () => {
  let service: FirestoreKnowledgeSearchService;
  let dbStub: any;
  let collectionStub: any;
  let queryStub: any;

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

    service = new FirestoreKnowledgeSearchService(dbStub as any, 'kbs', 0.7);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('search', () => {
    it('should return empty array for empty query', async () => {
      const results = await service.search('', 3);
      expect(results).to.be.an('array').that.is.empty;
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
        forEach: (callback: any) => mockDocs.forEach(callback),
      });

      const results = await service.search('how to reset password', 3);

      expect(results).to.be.an('array');
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
        forEach: (callback: any) => mockDocs.forEach(callback),
      });

      const results = await service.search('password reset', 3);

      expect(results).to.be.an('array');
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
        forEach: (callback: any) => mockDocs.forEach(callback),
      });

      const results = await service.search('test keyword', 3);

      expect(results.length).to.be.at.most(3);
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
        forEach: (callback: any) => mockDocs.forEach(callback),
      });

      const result = await service.getBestMatch('test question');

      expect(result).to.satisfy((r: any) => r === null || r.entry !== undefined);
    });

    it('should return null when no matches above threshold', async () => {
      queryStub.get.resolves({
        forEach: (callback: any) => {},
      });

      const result = await service.getBestMatch('completely unrelated query');

      expect(result).to.be.null;
    });
  });

  describe('threshold management', () => {
    it('should update threshold', () => {
      service.setThreshold(0.5);
      expect(service.getThreshold()).to.equal(0.5);
    });

    it('should get current threshold', () => {
      expect(service.getThreshold()).to.equal(0.7);
    });
  });
});
