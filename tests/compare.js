'use strict';

/* global suite, test */

var fs = require('fs');
var path = require('path');
var assert = require('assert');

var cl = require('../lib/mozilla/compare-locales');
var serializeLangpackDiffToText =
  require('../lib/mozilla/diff/serializer/text').serializeLangpackDiff;

function getOutputPath(name) {
  return path.join(__dirname, 'fixtures', 'output', name + '.txt');
}

function checkOutput(done, fixtureName, output) {
  fs.readFile(getOutputPath(fixtureName), {encoding: 'utf8'},
    function(err, data) {
      if (err) {
        throw err;
      }

      assert.equal(output, data.slice(0, -1));
      done();
    });
}

function logError(e) {
  console.error(e.stack);
}

suite('Comparison modes', function() {
  var sourcePath = path.join(__dirname, 'fixtures', 'gaia');
  var l10nPath = path.join(__dirname, 'fixtures', 'locales');
  var enUSPath = path.join(__dirname, 'fixtures', 'locales', 'en-US');
  var frPath = path.join(__dirname, 'fixtures', 'locales', 'fr');

  test('compare l10n dir to source', function(done) {
    cl.compareL10nDirToSource(sourcePath, l10nPath, 'fr').then(
      serializeLangpackDiffToText).then(
        checkOutput.bind(null, done, 'compareL10nDirToSource'))
          .catch(logError);
  });

  test('compare dirs', function(done) {
    cl.compareDirs(enUSPath, frPath).then(
      serializeLangpackDiffToText).then(
        checkOutput.bind(null, done, 'compareDirs'))
          .catch(logError);
  });

});
