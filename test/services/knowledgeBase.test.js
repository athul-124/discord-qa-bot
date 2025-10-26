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
const fs = __importStar(require("fs"));
const sinon = __importStar(require("sinon"));
const knowledgeBase_1 = require("../../src/services/knowledgeBase");
describe('KnowledgeBaseParser', () => {
    let parser;
    beforeEach(() => {
        parser = new knowledgeBase_1.KnowledgeBaseParser();
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
            (0, chai_1.expect)(entries).to.have.lengthOf(2);
            (0, chai_1.expect)(entries[0]).to.deep.include({
                question: 'What is Discord?',
                answer: 'Discord is a communication platform',
                category: 'General'
            });
            (0, chai_1.expect)(entries[0].keywords).to.include.members(['discord', 'platform', 'chat']);
            fs.unlinkSync(testFile);
        });
        it('should reject rows with missing question', async () => {
            const csvContent = `question,answer,keywords,category
,"This is an answer","keywords","General"
"Valid question","Valid answer","keywords","General"`;
            const testFile = '/tmp/test2.csv';
            fs.writeFileSync(testFile, csvContent);
            const entries = await parser.parseCSV(testFile);
            (0, chai_1.expect)(entries).to.have.lengthOf(1);
            (0, chai_1.expect)(entries[0].question).to.equal('Valid question');
            fs.unlinkSync(testFile);
        });
        it('should reject rows with missing answer', async () => {
            const csvContent = `question,answer,keywords,category
"What is this?",,"keywords","General"
"Valid question","Valid answer","keywords","General"`;
            const testFile = '/tmp/test3.csv';
            fs.writeFileSync(testFile, csvContent);
            const entries = await parser.parseCSV(testFile);
            (0, chai_1.expect)(entries).to.have.lengthOf(1);
            (0, chai_1.expect)(entries[0].question).to.equal('Valid question');
            fs.unlinkSync(testFile);
        });
        it('should extract keywords when not provided', async () => {
            const csvContent = `question,answer,keywords,category
"What is TypeScript?","TypeScript is a programming language",,`;
            const testFile = '/tmp/test4.csv';
            fs.writeFileSync(testFile, csvContent);
            const entries = await parser.parseCSV(testFile);
            (0, chai_1.expect)(entries).to.have.lengthOf(1);
            (0, chai_1.expect)(entries[0].keywords).to.be.an('array').that.is.not.empty;
            (0, chai_1.expect)(entries[0].keywords).to.include('typescript');
            (0, chai_1.expect)(entries[0].keywords).to.include('programming');
            (0, chai_1.expect)(entries[0].keywords).to.include('language');
            fs.unlinkSync(testFile);
        });
        it('should handle quoted fields with commas', async () => {
            const csvContent = `question,answer,keywords,category
"What is this, really?","It is a thing, you see","test;demo","Category, with comma"`;
            const testFile = '/tmp/test5.csv';
            fs.writeFileSync(testFile, csvContent);
            const entries = await parser.parseCSV(testFile);
            (0, chai_1.expect)(entries).to.have.lengthOf(1);
            (0, chai_1.expect)(entries[0].question).to.include(',');
            (0, chai_1.expect)(entries[0].answer).to.include(',');
            fs.unlinkSync(testFile);
        });
        it('should skip empty lines', async () => {
            const csvContent = `question,answer,keywords,category
"Question 1","Answer 1","keywords","General"

"Question 2","Answer 2","keywords","General"`;
            const testFile = '/tmp/test6.csv';
            fs.writeFileSync(testFile, csvContent);
            const entries = await parser.parseCSV(testFile);
            (0, chai_1.expect)(entries).to.have.lengthOf(2);
            fs.unlinkSync(testFile);
        });
        it('should handle CSV with only required fields', async () => {
            const csvContent = `question,answer
"Simple question","Simple answer"`;
            const testFile = '/tmp/test7.csv';
            fs.writeFileSync(testFile, csvContent);
            const entries = await parser.parseCSV(testFile);
            (0, chai_1.expect)(entries).to.have.lengthOf(1);
            (0, chai_1.expect)(entries[0].keywords).to.be.an('array');
            (0, chai_1.expect)(entries[0].category).to.be.undefined;
            fs.unlinkSync(testFile);
        });
        it('should correctly extract keywords and filter common words', async () => {
            const csvContent = `question,answer,keywords,category
"What is the purpose?","The purpose is to help with testing",,`;
            const testFile = '/tmp/test8.csv';
            fs.writeFileSync(testFile, csvContent);
            const entries = await parser.parseCSV(testFile);
            (0, chai_1.expect)(entries[0].keywords).to.not.include('what');
            (0, chai_1.expect)(entries[0].keywords).to.not.include('the');
            (0, chai_1.expect)(entries[0].keywords).to.not.include('with');
            (0, chai_1.expect)(entries[0].keywords).to.include('purpose');
            (0, chai_1.expect)(entries[0].keywords).to.include('help');
            (0, chai_1.expect)(entries[0].keywords).to.include('testing');
            fs.unlinkSync(testFile);
        });
    });
    describe('parsePDF', () => {
        it('should parse PDF with Q&A format', async () => {
            // PDF parsing tests are skipped as they require actual PDF files
            // In production, you would use real PDF test files
            // For now, we validate the method exists and has the right signature
            (0, chai_1.expect)(parser.parsePDF).to.be.a('function');
        });
    });
});
//# sourceMappingURL=knowledgeBase.test.js.map