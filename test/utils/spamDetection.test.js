"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const spamDetection_1 = require("../../src/utils/spamDetection");
describe('SpamDetector', () => {
    let detector;
    beforeEach(() => {
        detector = new spamDetection_1.SpamDetector();
    });
    describe('URL detection', () => {
        it('should detect HTTP URLs', () => {
            const result = detector.check('Check out http://example.com for more info');
            (0, chai_1.expect)(result.isSpam).to.be.true;
            (0, chai_1.expect)(result.reason).to.equal('Message contains URLs');
        });
        it('should detect HTTPS URLs', () => {
            const result = detector.check('Visit https://example.com');
            (0, chai_1.expect)(result.isSpam).to.be.true;
            (0, chai_1.expect)(result.reason).to.equal('Message contains URLs');
        });
        it('should detect www URLs', () => {
            const result = detector.check('Go to www.example.com');
            (0, chai_1.expect)(result.isSpam).to.be.true;
            (0, chai_1.expect)(result.reason).to.equal('Message contains URLs');
        });
        it('should allow messages without URLs', () => {
            const result = detector.check('This is a clean message without any links');
            (0, chai_1.expect)(result.isSpam).to.be.false;
        });
        it('should detect multiple URLs', () => {
            const result = detector.check('Visit http://example.com and www.another.com');
            (0, chai_1.expect)(result.isSpam).to.be.true;
        });
    });
    describe('Suspicious patterns', () => {
        it('should detect Discord invite links', () => {
            const result = detector.check('Join our server: discord.gg/abc123');
            (0, chai_1.expect)(result.isSpam).to.be.true;
            (0, chai_1.expect)(result.reason).to.equal('Message contains suspicious content');
        });
        it('should detect bit.ly links', () => {
            const result = detector.check('Click here: bit.ly/abc123');
            (0, chai_1.expect)(result.isSpam).to.be.true;
            (0, chai_1.expect)(result.reason).to.equal('Message contains suspicious content');
        });
        it('should detect free nitro scams', () => {
            const result = detector.check('Get free nitro here!');
            (0, chai_1.expect)(result.isSpam).to.be.true;
            (0, chai_1.expect)(result.reason).to.equal('Message contains suspicious content');
        });
        it('should detect @everyone mentions', () => {
            const result = detector.check('Hey @everyone check this out');
            (0, chai_1.expect)(result.isSpam).to.be.true;
            (0, chai_1.expect)(result.reason).to.equal('Message contains suspicious content');
        });
        it('should detect @here mentions', () => {
            const result = detector.check('Important announcement @here');
            (0, chai_1.expect)(result.isSpam).to.be.true;
            (0, chai_1.expect)(result.reason).to.equal('Message contains suspicious content');
        });
        it('should detect click here patterns', () => {
            const result = detector.check('Click here to download');
            (0, chai_1.expect)(result.isSpam).to.be.true;
            (0, chai_1.expect)(result.reason).to.equal('Message contains suspicious content');
        });
        it('should detect download now patterns', () => {
            const result = detector.check('Download now for free stuff');
            (0, chai_1.expect)(result.isSpam).to.be.true;
            (0, chai_1.expect)(result.reason).to.equal('Message contains suspicious content');
        });
    });
    describe('Message length', () => {
        it('should reject messages exceeding maximum length', () => {
            const longMessage = 'a'.repeat(2001);
            const result = detector.check(longMessage);
            (0, chai_1.expect)(result.isSpam).to.be.true;
            (0, chai_1.expect)(result.reason).to.equal('Message exceeds maximum length');
        });
        it('should allow messages within length limit', () => {
            const normalMessage = 'a'.repeat(2000);
            const result = detector.check(normalMessage);
            (0, chai_1.expect)(result.isSpam).to.be.false;
        });
        it('should allow short messages', () => {
            const result = detector.check('Hello!');
            (0, chai_1.expect)(result.isSpam).to.be.false;
        });
    });
    describe('Excessive repetition', () => {
        it('should detect repeated words', () => {
            const result = detector.check('spam spam spam spam spam spam spam spam');
            (0, chai_1.expect)(result.isSpam).to.be.true;
            (0, chai_1.expect)(result.reason).to.equal('Message contains excessive repetition');
        });
        it('should allow normal repetition', () => {
            const result = detector.check('I really really like this feature');
            (0, chai_1.expect)(result.isSpam).to.be.false;
        });
        it('should not flag short messages with repetition', () => {
            const result = detector.check('test test');
            (0, chai_1.expect)(result.isSpam).to.be.false;
        });
        it('should detect case-insensitive repetition', () => {
            const result = detector.check('SPAM spam SpAm SPAM spam SpAm SPAM spam');
            (0, chai_1.expect)(result.isSpam).to.be.true;
            (0, chai_1.expect)(result.reason).to.equal('Message contains excessive repetition');
        });
    });
    describe('Excessive capitals', () => {
        it('should detect messages with excessive caps', () => {
            const result = detector.check('THIS IS VERY IMPORTANT MESSAGE');
            (0, chai_1.expect)(result.isSpam).to.be.true;
            (0, chai_1.expect)(result.reason).to.equal('Message contains excessive capital letters');
        });
        it('should allow normal capitalization', () => {
            const result = detector.check('This is a normal message with some CAPS');
            (0, chai_1.expect)(result.isSpam).to.be.false;
        });
        it('should allow short all-caps messages', () => {
            const result = detector.check('OK');
            (0, chai_1.expect)(result.isSpam).to.be.false;
        });
        it('should allow messages with mostly lowercase', () => {
            const result = detector.check('this is mostly lowercase with ONE word caps');
            (0, chai_1.expect)(result.isSpam).to.be.false;
        });
    });
    describe('Clean messages', () => {
        it('should allow clean simple messages', () => {
            const result = detector.check('Hello, how are you?');
            (0, chai_1.expect)(result.isSpam).to.be.false;
        });
        it('should allow questions', () => {
            const result = detector.check('What is the bot command for help?');
            (0, chai_1.expect)(result.isSpam).to.be.false;
        });
        it('should allow normal conversation', () => {
            const result = detector.check('Thanks for the help! That worked perfectly.');
            (0, chai_1.expect)(result.isSpam).to.be.false;
        });
        it('should allow technical discussions', () => {
            const result = detector.check('The async function returns a Promise that resolves when complete');
            (0, chai_1.expect)(result.isSpam).to.be.false;
        });
    });
    describe('Custom patterns', () => {
        it('should allow adding custom suspicious patterns', () => {
            detector.addSuspiciousPattern(/custom-spam-word/gi);
            const result = detector.check('This has custom-spam-word in it');
            (0, chai_1.expect)(result.isSpam).to.be.true;
            (0, chai_1.expect)(result.reason).to.equal('Message contains suspicious content');
        });
        it('should work with multiple custom patterns', () => {
            detector.addSuspiciousPattern(/badword1/gi);
            detector.addSuspiciousPattern(/badword2/gi);
            const result1 = detector.check('This has badword1');
            const result2 = detector.check('This has badword2');
            (0, chai_1.expect)(result1.isSpam).to.be.true;
            (0, chai_1.expect)(result2.isSpam).to.be.true;
        });
    });
    describe('Edge cases', () => {
        it('should handle empty messages', () => {
            const result = detector.check('');
            (0, chai_1.expect)(result.isSpam).to.be.false;
        });
        it('should handle messages with only whitespace', () => {
            const result = detector.check('     ');
            (0, chai_1.expect)(result.isSpam).to.be.false;
        });
        it('should handle messages with special characters', () => {
            const result = detector.check('!@#$%^&*()_+-=[]{}|;:,.<>?');
            (0, chai_1.expect)(result.isSpam).to.be.false;
        });
        it('should handle unicode characters', () => {
            const result = detector.check('Hello 👋 world 🌍');
            (0, chai_1.expect)(result.isSpam).to.be.false;
        });
    });
});
//# sourceMappingURL=spamDetection.test.js.map