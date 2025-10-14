#!/usr/bin/env node

/**
 * Test Report Generator for View Rush
 * 
 * This script generates comprehensive test reports in multiple formats:
 * - HTML Report (interactive, visual)
 * - JUnit XML (CI/CD integration) 
 * - JSON Report (programmatic access)
 * - Coverage Reports (HTML, LCOV, Cobertura)
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

const REPORTS_DIR = './testing/reports';
const COVERAGE_DIR = './testing/coverage';

// Ensure directories exist
if (!existsSync(REPORTS_DIR)) {
  mkdirSync(REPORTS_DIR, { recursive: true });
}

if (!existsSync(COVERAGE_DIR)) {
  mkdirSync(COVERAGE_DIR, { recursive: true });
}

console.log('Generating comprehensive test reports...\n');

try {
  // Run tests with all reports
  console.log('Running tests and generating reports...');
  execSync('npm run test:report:full', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log('\nTest reports generated successfully!');
  console.log('\nReport locations:');
  console.log(`   HTML Report: ${path.resolve(REPORTS_DIR, 'test-report.html')}`);
  console.log(`   JUnit XML:   ${path.resolve(REPORTS_DIR, 'junit.xml')}`);
  console.log(`   JSON Report: ${path.resolve(REPORTS_DIR, 'test-results.json')}`);
  console.log(`   Coverage:    ${path.resolve(COVERAGE_DIR, 'index.html')}`);

  console.log('\nOpen reports in browser:');
  console.log(`   file://${path.resolve(REPORTS_DIR, 'test-report.html')}`);
  console.log(`   file://${path.resolve(COVERAGE_DIR, 'index.html')}`);

} catch (error) {
  console.error('Failed to generate test reports:', error.message);
  process.exit(1);
}