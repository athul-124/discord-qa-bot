import { expect } from 'chai';
import { KnowledgeSearchService } from '../../src/services/knowledgeSearch';
import { KnowledgeBaseEntry } from '../../src/services/knowledgeBase';

describe('KnowledgeSearchService', () => {
  let searchService: KnowledgeSearchService;
  let knowledgeBase: KnowledgeBaseEntry[];

  beforeEach(() => {
    knowledgeBase = [
      {
        question: 'What is Discord?',
        answer: 'Discord is a communication platform for communities.',
        keywords: ['discord', 'communication', 'platform', 'communities'],
        category: 'General'
      },
      {
        question: 'How do I join a server?',
        answer: 'Click on the invite link to join a Discord server.',
        keywords: ['join', 'server', 'invite', 'link', 'discord'],
        category: 'Help'
      },
      {
        question: 'What are Discord bots?',
        answer: 'Discord bots are automated programs that can perform tasks on Discord servers.',
        keywords: ['discord', 'bots', 'automated', 'programs', 'tasks', 'servers'],
        category: 'Bots'
      },
      {
        question: 'How to create a channel?',
        answer: 'Right-click on the server name and select "Create Channel".',
        keywords: ['create', 'channel', 'server', 'right-click'],
        category: 'Help'
      }
    ];

    searchService = new KnowledgeSearchService(knowledgeBase, 0.3);
  });

  describe('search', () => {
    it('should return results in descending order by score', () => {
      const results = searchService.search('discord bots');

      expect(results).to.be.an('array');
      expect(results.length).to.be.greaterThan(0);

      // Verify descending order
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].score).to.be.at.least(results[i + 1].score);
      }
    });

    it('should return exact question match with highest score', () => {
      const results = searchService.search('What is Discord?');

      expect(results).to.have.lengthOf.at.least(1);
      expect(results[0].score).to.equal(1.0);
      expect(results[0].entry.question).to.equal('What is Discord?');
    });

    it('should return only results above threshold', () => {
      searchService.setThreshold(0.5);
      const results = searchService.search('unrelated random words xyz');

      // Should have fewer or no results due to high threshold
      results.forEach(result => {
        expect(result.score).to.be.at.least(0.5);
      });
    });

    it('should match based on keywords', () => {
      const results = searchService.search('automated programs');

      expect(results).to.be.an('array');
      const botEntry = results.find(r => r.entry.question === 'What are Discord bots?');
      expect(botEntry).to.exist;
      expect(botEntry!.score).to.be.greaterThan(0.3);
    });

    it('should return empty array when no matches above threshold', () => {
      searchService.setThreshold(0.9);
      const results = searchService.search('completely unrelated query xyz123');

      expect(results).to.be.an('array');
      expect(results).to.have.lengthOf(0);
    });

    it('should handle partial text matches', () => {
      const results = searchService.search('join server');

      expect(results).to.be.an('array').that.is.not.empty;
      const joinEntry = results.find(r => r.entry.question === 'How do I join a server?');
      expect(joinEntry).to.exist;
    });

    it('should be case-insensitive', () => {
      const results1 = searchService.search('DISCORD BOTS');
      const results2 = searchService.search('discord bots');

      expect(results1).to.have.lengthOf(results2.length);
      expect(results1[0].score).to.equal(results2[0].score);
    });
  });

  describe('getBestMatch', () => {
    it('should return the highest scoring entry', () => {
      const result = searchService.getBestMatch('discord communication');

      expect(result).to.not.be.null;
      expect(result!.entry.question).to.equal('What is Discord?');
    });

    it('should return null when no matches above threshold', () => {
      searchService.setThreshold(0.9);
      const result = searchService.getBestMatch('xyz unrelated abc');

      expect(result).to.be.null;
    });

    it('should return the same result as the first search result', () => {
      const query = 'create channel';
      const bestMatch = searchService.getBestMatch(query);
      const searchResults = searchService.search(query);

      if (bestMatch && searchResults.length > 0) {
        expect(bestMatch.entry).to.deep.equal(searchResults[0].entry);
        expect(bestMatch.score).to.equal(searchResults[0].score);
      }
    });
  });

  describe('threshold behavior', () => {
    it('should respect threshold changes', () => {
      const query = 'server';

      searchService.setThreshold(0.2);
      const lowThresholdResults = searchService.search(query);

      searchService.setThreshold(0.6);
      const highThresholdResults = searchService.search(query);

      expect(lowThresholdResults.length).to.be.at.least(highThresholdResults.length);
    });

    it('should get and set threshold correctly', () => {
      expect(searchService.getThreshold()).to.equal(0.3);

      searchService.setThreshold(0.7);
      expect(searchService.getThreshold()).to.equal(0.7);
    });

    it('should filter results based on current threshold', () => {
      searchService.setThreshold(0.5);
      const results = searchService.search('discord');

      results.forEach(result => {
        expect(result.score).to.be.at.least(0.5);
      });
    });
  });

  describe('scoring algorithm', () => {
    it('should score exact matches highest', () => {
      const exactResult = searchService.getBestMatch('What is Discord?');
      const partialResult = searchService.getBestMatch('Discord');

      expect(exactResult!.score).to.equal(1.0);
      expect(partialResult!.score).to.be.lessThan(1.0);
    });

    it('should give higher scores to entries with more keyword matches', () => {
      const results = searchService.search('discord server bots automated');

      const botsEntry = results.find(r => r.entry.question === 'What are Discord bots?');
      const generalEntry = results.find(r => r.entry.question === 'What is Discord?');

      // Bots entry has more matching keywords
      if (botsEntry && generalEntry) {
        expect(botsEntry.score).to.be.greaterThan(generalEntry.score);
      }
    });

    it('should handle queries with special characters', () => {
      const results = searchService.search('What is Discord?!@#');

      expect(results).to.be.an('array');
      expect(results.length).to.be.greaterThan(0);
    });

    it('should handle empty query gracefully', () => {
      const results = searchService.search('');

      expect(results).to.be.an('array');
      expect(results).to.have.lengthOf(0);
    });
  });
});
