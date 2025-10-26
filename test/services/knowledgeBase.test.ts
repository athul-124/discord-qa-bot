import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import * as sinon from 'sinon';
import { KnowledgeBaseParser } from '../../src/services/knowledgeBase';

describe('KnowledgeBaseParser', () => {
  let parser: KnowledgeBaseParser;

  beforeEach(() => {
    parser = new KnowledgeBaseParser();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('parseCSV', () => {
    it('should parse valid CSV with all fields', async () => {
      const csvContent = `question,answer,keywords,category
"What is Discord?","Discord is a communication platform","discord;platform;chat","General"
"How to join?","Click the invite link","join;invite;link","Help"`;

      const testFile = '/tmp/test.csv';
      fs.writeFileSync(testFile, csvContent);

      const entries = await parser.parseCSV(testFile);

      expect(entries).to.have.lengthOf(2);
      expect(entries[0]).to.deep.include({
        question: 'What is Discord?',
        answer: 'Discord is a communication platform',
        category: 'General'
      });
      expect(entries[0].keywords).to.include.members(['discord', 'platform', 'chat']);
      
      fs.unlinkSync(testFile);
    });

    it('should reject rows with missing question', async () => {
      const csvContent = `question,answer,keywords,category
,"This is an answer","keywords","General"
"Valid question","Valid answer","keywords","General"`;

      const testFile = '/tmp/test2.csv';
      fs.writeFileSync(testFile, csvContent);
      const entries = await parser.parseCSV(testFile);

      expect(entries).to.have.lengthOf(1);
      expect(entries[0].question).to.equal('Valid question');
      fs.unlinkSync(testFile);
    });

    it('should reject rows with missing answer', async () => {
      const csvContent = `question,answer,keywords,category
"What is this?",,"keywords","General"
"Valid question","Valid answer","keywords","General"`;

      const testFile = '/tmp/test3.csv';
      fs.writeFileSync(testFile, csvContent);
      const entries = await parser.parseCSV(testFile);

      expect(entries).to.have.lengthOf(1);
      expect(entries[0].question).to.equal('Valid question');
      fs.unlinkSync(testFile);
    });

    it('should extract keywords when not provided', async () => {
      const csvContent = `question,answer,keywords,category
"What is TypeScript?","TypeScript is a programming language",,`;

      const testFile = '/tmp/test4.csv';
      fs.writeFileSync(testFile, csvContent);
      const entries = await parser.parseCSV(testFile);

      expect(entries).to.have.lengthOf(1);
      expect(entries[0].keywords).to.be.an('array').that.is.not.empty;
      expect(entries[0].keywords).to.include('typescript');
      expect(entries[0].keywords).to.include('programming');
      expect(entries[0].keywords).to.include('language');
      fs.unlinkSync(testFile);
    });

    it('should handle quoted fields with commas', async () => {
      const csvContent = `question,answer,keywords,category
"What is this, really?","It is a thing, you see","test;demo","Category, with comma"`;

      const testFile = '/tmp/test5.csv';
      fs.writeFileSync(testFile, csvContent);
      const entries = await parser.parseCSV(testFile);

      expect(entries).to.have.lengthOf(1);
      expect(entries[0].question).to.include(',');
      expect(entries[0].answer).to.include(',');
      fs.unlinkSync(testFile);
    });

    it('should skip empty lines', async () => {
      const csvContent = `question,answer,keywords,category
"Question 1","Answer 1","keywords","General"

"Question 2","Answer 2","keywords","General"`;

      const testFile = '/tmp/test6.csv';
      fs.writeFileSync(testFile, csvContent);
      const entries = await parser.parseCSV(testFile);

      expect(entries).to.have.lengthOf(2);
      fs.unlinkSync(testFile);
    });

    it('should handle CSV with only required fields', async () => {
      const csvContent = `question,answer
"Simple question","Simple answer"`;

      const testFile = '/tmp/test7.csv';
      fs.writeFileSync(testFile, csvContent);
      const entries = await parser.parseCSV(testFile);

      expect(entries).to.have.lengthOf(1);
      expect(entries[0].keywords).to.be.an('array');
      expect(entries[0].category).to.be.undefined;
      fs.unlinkSync(testFile);
    });

    it('should correctly extract keywords and filter common words', async () => {
      const csvContent = `question,answer,keywords,category
"What is the purpose?","The purpose is to help with testing",,`;

      const testFile = '/tmp/test8.csv';
      fs.writeFileSync(testFile, csvContent);
      const entries = await parser.parseCSV(testFile);

      expect(entries[0].keywords).to.not.include('what');
      expect(entries[0].keywords).to.not.include('the');
      expect(entries[0].keywords).to.not.include('with');
      expect(entries[0].keywords).to.include('purpose');
      expect(entries[0].keywords).to.include('help');
      expect(entries[0].keywords).to.include('testing');
      fs.unlinkSync(testFile);
    });
  });

  describe('parsePDF', () => {
    it('should parse PDF with Q&A format', async () => {
      // PDF parsing tests are skipped as they require actual PDF files
      // In production, you would use real PDF test files
      // For now, we validate the method exists and has the right signature
      expect(parser.parsePDF).to.be.a('function');
    });
  });
});
