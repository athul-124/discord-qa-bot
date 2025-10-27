"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const knowledgeSearch_1 = require("../../src/services/knowledgeSearch");
describe('KnowledgeSearchService', () => {
    let searchService;
    let knowledgeBase;
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
        searchService = new knowledgeSearch_1.KnowledgeSearchService(knowledgeBase, 0.3);
    });
    describe('search', () => {
        it('should return results in descending order by score', () => {
            const results = searchService.search('discord bots');
            (0, chai_1.expect)(results).to.be.an('array');
            (0, chai_1.expect)(results.length).to.be.greaterThan(0);
            // Verify descending order
            for (let i = 0; i < results.length - 1; i++) {
                (0, chai_1.expect)(results[i].score).to.be.at.least(results[i + 1].score);
            }
        });
        it('should return exact question match with highest score', () => {
            const results = searchService.search('What is Discord?');
            (0, chai_1.expect)(results).to.have.lengthOf.at.least(1);
            (0, chai_1.expect)(results[0].score).to.equal(1.0);
            (0, chai_1.expect)(results[0].entry.question).to.equal('What is Discord?');
        });
        it('should return only results above threshold', () => {
            searchService.setThreshold(0.5);
            const results = searchService.search('unrelated random words xyz');
            // Should have fewer or no results due to high threshold
            results.forEach(result => {
                (0, chai_1.expect)(result.score).to.be.at.least(0.5);
            });
        });
        it('should match based on keywords', () => {
            const results = searchService.search('automated programs');
            (0, chai_1.expect)(results).to.be.an('array');
            const botEntry = results.find(r => r.entry.question === 'What are Discord bots?');
            (0, chai_1.expect)(botEntry).to.exist;
            (0, chai_1.expect)(botEntry.score).to.be.greaterThan(0.3);
        });
        it('should return empty array when no matches above threshold', () => {
            searchService.setThreshold(0.9);
            const results = searchService.search('completely unrelated query xyz123');
            (0, chai_1.expect)(results).to.be.an('array');
            (0, chai_1.expect)(results).to.have.lengthOf(0);
        });
        it('should handle partial text matches', () => {
            const results = searchService.search('join server');
            (0, chai_1.expect)(results).to.be.an('array').that.is.not.empty;
            const joinEntry = results.find(r => r.entry.question === 'How do I join a server?');
            (0, chai_1.expect)(joinEntry).to.exist;
        });
        it('should be case-insensitive', () => {
            const results1 = searchService.search('DISCORD BOTS');
            const results2 = searchService.search('discord bots');
            (0, chai_1.expect)(results1).to.have.lengthOf(results2.length);
            (0, chai_1.expect)(results1[0].score).to.equal(results2[0].score);
        });
    });
    describe('getBestMatch', () => {
        it('should return the highest scoring entry', () => {
            const result = searchService.getBestMatch('discord communication');
            (0, chai_1.expect)(result).to.not.be.null;
            (0, chai_1.expect)(result.entry.question).to.equal('What is Discord?');
        });
        it('should return null when no matches above threshold', () => {
            searchService.setThreshold(0.9);
            const result = searchService.getBestMatch('xyz unrelated abc');
            (0, chai_1.expect)(result).to.be.null;
        });
        it('should return the same result as the first search result', () => {
            const query = 'create channel';
            const bestMatch = searchService.getBestMatch(query);
            const searchResults = searchService.search(query);
            if (bestMatch && searchResults.length > 0) {
                (0, chai_1.expect)(bestMatch.entry).to.deep.equal(searchResults[0].entry);
                (0, chai_1.expect)(bestMatch.score).to.equal(searchResults[0].score);
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
            (0, chai_1.expect)(lowThresholdResults.length).to.be.at.least(highThresholdResults.length);
        });
        it('should get and set threshold correctly', () => {
            (0, chai_1.expect)(searchService.getThreshold()).to.equal(0.3);
            searchService.setThreshold(0.7);
            (0, chai_1.expect)(searchService.getThreshold()).to.equal(0.7);
        });
        it('should filter results based on current threshold', () => {
            searchService.setThreshold(0.5);
            const results = searchService.search('discord');
            results.forEach(result => {
                (0, chai_1.expect)(result.score).to.be.at.least(0.5);
            });
        });
    });
    describe('scoring algorithm', () => {
        it('should score exact matches highest', () => {
            const exactResult = searchService.getBestMatch('What is Discord?');
            const partialResult = searchService.getBestMatch('Discord');
            (0, chai_1.expect)(exactResult.score).to.equal(1.0);
            (0, chai_1.expect)(partialResult.score).to.be.lessThan(1.0);
        });
        it('should give higher scores to entries with more keyword matches', () => {
            const results = searchService.search('discord server bots automated');
            const botsEntry = results.find(r => r.entry.question === 'What are Discord bots?');
            const generalEntry = results.find(r => r.entry.question === 'What is Discord?');
            // Bots entry has more matching keywords
            if (botsEntry && generalEntry) {
                (0, chai_1.expect)(botsEntry.score).to.be.greaterThan(generalEntry.score);
            }
        });
        it('should handle queries with special characters', () => {
            const results = searchService.search('What is Discord?!@#');
            (0, chai_1.expect)(results).to.be.an('array');
            (0, chai_1.expect)(results.length).to.be.greaterThan(0);
        });
        it('should handle empty query gracefully', () => {
            const results = searchService.search('');
            (0, chai_1.expect)(results).to.be.an('array');
            (0, chai_1.expect)(results).to.have.lengthOf(0);
        });
    });
});
//# sourceMappingURL=knowledgeSearch.test.js.map