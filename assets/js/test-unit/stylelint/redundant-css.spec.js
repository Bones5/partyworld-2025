/**
 * Tests for redundant CSS detection using stylelint
 * 
 * These tests verify that stylelint correctly identifies redundant CSS patterns:
 * - Duplicate properties within the same rule
 * - Shorthand properties overriding longhand properties
 * - Duplicate selectors
 * - Duplicate mixin definitions
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

describe('Redundant CSS Detection', () => {
    // Use process.cwd() to get the project root
    const projectRoot = process.cwd();
    const configFile = path.join(projectRoot, '.stylelintrc');
    const invalidFixture = path.join(projectRoot, 'assets/scss/test-fixtures/redundant-css-invalid.scss');
    const validFixture = path.join(projectRoot, 'assets/scss/test-fixtures/redundant-css-valid.scss');

    describe('Invalid redundant CSS patterns', () => {
        let output;
        let exitCode;

        beforeAll(() => {
            try {
                output = execSync(
                    `npx stylelint "${invalidFixture}" --formatter json --ignore-path /dev/null 2>&1`,
                    { encoding: 'utf8', cwd: projectRoot }
                );
                exitCode = 0;
            } catch (error) {
                // When stylelint finds errors, it uses stderr for the JSON output
                output = error.output ? error.output.join('') : (error.stdout || error.stderr || '');
                exitCode = error.status;
            }
        });

        it('should detect errors in invalid fixture', () => {
            expect(exitCode).not.toBe(0);
        });

        it('should detect duplicate properties', () => {
            const results = JSON.parse(output);
            const warnings = results[0].warnings;
            const duplicatePropertyWarning = warnings.find(
                w => w.rule === 'declaration-block-no-duplicate-properties'
            );
            expect(duplicatePropertyWarning).toBeDefined();
            expect(duplicatePropertyWarning.text).toContain('color');
        });

        it('should detect shorthand overriding longhand', () => {
            const results = JSON.parse(output);
            const warnings = results[0].warnings;
            const shorthandWarning = warnings.find(
                w => w.rule === 'declaration-block-no-shorthand-property-overrides'
            );
            expect(shorthandWarning).toBeDefined();
            expect(shorthandWarning.text).toContain('margin');
        });

        it('should detect duplicate selectors', () => {
            const results = JSON.parse(output);
            const warnings = results[0].warnings;
            const duplicateSelectorWarning = warnings.find(
                w => w.rule === 'no-duplicate-selectors'
            );
            expect(duplicateSelectorWarning).toBeDefined();
            expect(duplicateSelectorWarning.text).toContain('duplicate-selector');
        });

        it('should detect duplicate mixins', () => {
            const results = JSON.parse(output);
            const warnings = results[0].warnings;
            const duplicateMixinWarning = warnings.find(
                w => w.rule === 'scss/no-duplicate-mixins'
            );
            expect(duplicateMixinWarning).toBeDefined();
            expect(duplicateMixinWarning.text).toContain('test-mixin');
        });
    });

    describe('Valid CSS patterns (no false positives)', () => {
        let output;
        let exitCode;

        beforeAll(() => {
            try {
                output = execSync(
                    `npx stylelint "${validFixture}" --formatter json --ignore-path /dev/null 2>&1`,
                    { encoding: 'utf8', cwd: projectRoot }
                );
                exitCode = 0;
            } catch (error) {
                output = error.output ? error.output.join('') : (error.stdout || error.stderr || '');
                exitCode = error.status;
            }
        });

        it('should not detect errors in valid fixture', () => {
            expect(exitCode).toBe(0);
        });

        it('should have no warnings for valid patterns', () => {
            const results = JSON.parse(output);
            expect(results[0].warnings.length).toBe(0);
        });

        it('should allow consecutive duplicates with different values (fallbacks)', () => {
            const css = fs.readFileSync(validFixture, 'utf8');
            expect(css).toContain('display: inline-block');
            expect(css).toContain('display: flex');
            
            const results = JSON.parse(output);
            const warnings = results[0].warnings;
            const displayWarnings = warnings.filter(
                w => w.text.includes('display')
            );
            expect(displayWarnings.length).toBe(0);
        });

        it('should allow longhand refining shorthand', () => {
            const css = fs.readFileSync(validFixture, 'utf8');
            expect(css).toContain('margin: 10px');
            expect(css).toContain('margin-top: 20px');
            
            const results = JSON.parse(output);
            const warnings = results[0].warnings;
            const marginWarnings = warnings.filter(
                w => w.text.includes('margin') && w.rule === 'declaration-block-no-shorthand-property-overrides'
            );
            expect(marginWarnings.length).toBe(0);
        });
    });

    describe('Rule configuration', () => {
        it('should have redundant CSS rules enabled in config', () => {
            const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
            
            expect(config.rules['declaration-block-no-duplicate-properties']).toBeDefined();
            expect(config.rules['declaration-block-no-shorthand-property-overrides']).toBe(true);
            expect(config.rules['no-duplicate-selectors']).toBe(true);
            expect(config.rules['scss/no-duplicate-mixins']).toBe(true);
        });

        it('should allow consecutive duplicates with different values', () => {
            const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
            const rule = config.rules['declaration-block-no-duplicate-properties'];
            
            expect(Array.isArray(rule)).toBe(true);
            expect(rule[0]).toBe(true);
            expect(rule[1].ignore).toContain('consecutive-duplicates-with-different-values');
        });
    });
});
