#!/usr/bin/env node

'use strict';

var program = require('commander');

var serializeLangpackDiffToText =
  require('../lib/mozilla/diff/serializer/text').serializeLangpackDiff;

var cl = require('../lib/mozilla/compare-locales');

function logError(e) {
  console.log(e.stack);
}

function compareL10nDirToSource(sourcePath, treePath, lang) {
  cl.compareL10nDirToSource(sourcePath, treePath, lang)
    .then(
    serializeLangpackDiffToText).then(
      console.log, logError);
}

function compareDirs(path1, path2, output) {
  var serializerPath = '../lib/mozilla/diff/serializer/'+output+'.js';
  var serializeLangpackDiff =
    require(serializerPath).serializeLangpackDiff;
  cl.compareDirs(path1, path2).then(
    serializeLangpackDiff).then(
      console.log, logError);
}

program
  .version('0.0.1')
  .usage('[options] locale[, locale]')
  .option('-t, --type <gaia|gecko>', 'Test type (default: gaia)')
  .option('-s, --source <dir>', 'App source repository')
  .option('-l, --l10n-tree <dir>', 'L10n Tree directory')
  .option('-o, --output <json|text>', 'Output type (default: text)')
  .parse(process.argv);

var sourcePath = program.source;
var l10nTreePath = program.l10nTree;
var locales = program.args;
var output = program.output || 'text';

if (l10nTreePath) {
  compareL10nDirToSource(sourcePath, l10nTreePath, locales[0]);
} else {
  compareDirs(locales[0], locales[1], output);
}
