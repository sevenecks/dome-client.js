const assert = require('node:assert/strict');
const dateFormat = require('../lib/dateformat');

assert.strictEqual(
  dateFormat('2023-01-02T03:04:05Z', 'isoDate', true),
  '2023-01-02'
);

assert.strictEqual(
  dateFormat('2023-01-02T03:04:05Z', 'isoUtcDateTime'),
  '2023-01-02T03:04:05Z'
);

console.log('All tests passed');
