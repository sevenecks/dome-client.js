const assert = require('node:assert/strict');
const saveRoute = require('../routes/save');

function createSpy() {
  const calls = [];
  const fn = (...args) => {
    calls.push(args);
  };
  fn.calls = calls;
  return fn;
}

const buffer = '<p>hello</p>';
const filename = 'test.html';

const req = {
  ip: '127.0.0.1',
  params: { filename },
  body: { buffer }
};

const res = {
  setHeader: createSpy(),
  write: createSpy(),
  end: createSpy()
};

saveRoute.log(req, res);

assert.deepStrictEqual(
  res.setHeader.calls[0],
  ['Content-disposition', 'attachment; filename=' + filename]
);
assert.deepStrictEqual(
  res.setHeader.calls[1],
  ['Content-type', 'text/html']
);

const written = res.write.calls.map(call => call[0]).join('');
const expected = [
  '<html><head><title>Web Client Buffer</title>',
  '<link rel="stylesheet" href="http://fonts.googleapis.com/css?family=Source+Code+Pro|Quantico:400,400italic,700">',
  '<base href="http://play.sindome.org">',
  '<link rel="stylesheet" type="text/css" href="http://www.sindome.org/css/dome.css">',
  '<link rel="stylesheet" tyle="text/css" href="http://play.sindome.org/css/client.css">',
  '</head><body><div id="browser-client"><div id="lineBuffer">',
  buffer,
  '</div></div></body></html>'
].join('');

assert.strictEqual(written, expected);
assert.strictEqual(res.end.calls.length, 1);

console.log('All tests passed');
