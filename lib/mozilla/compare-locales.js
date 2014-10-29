'use strict';

var path = require('path');
var Promise = require('promise');

var utils = require('./utils');
var GaiaApp = require('./apps/gaia.js').GaiaApp;
var compareLangpacks =
  require('./diff/compare.js').compareLangpacks;
var getLangpackFromDir = require('./langpack.js').getLangpackFromDir;

exports.compareDirs = function(path1, path2) {
  var lp1 = getLangpackFromDir(path1);
  var lp2 = getLangpackFromDir(path2);

  return compareLangpacks(lp1, lp2);
};

exports.compareL10nTreeDirs = function(treePath, locale1, locale2) {
  if (!locale1) {
    locale1 = 'en-US';
  }

  var path1 = path.join(treePath, locale1);
  var path2 = path.join(treePath, locale2);
  var lp1 = getLangpackFromDir(path1, locale1);
  var lp2 = getLangpackFromDir(path2, locale2);

  return compareLangpacks(lp1, lp2);
};

exports.compareL10nDirToSource =
  function(appPath, sourceLocale, treePath, locale) {
  var app = new GaiaApp(appPath);

  if (!sourceLocale) {
    sourceLocale = app.defaultLocale;
  }

  return app.collectResources().then(function() {

    var lp2 = app.getLangpackFromPath(treePath, locale);

    return app.getLangpacks(sourceLocale).then(function() {
      var lp1 = app.langpacks[sourceLocale];
      return compareLangpacks(lp1, lp2);
    });
  });
};

exports.compareLangpacksInSource = function(appPath, sourceLocale, lang) {
  var app = new GaiaApp(appPath);

  if (sourceLocale) {
    sourceLocale = { defaultLocale: sourceLocale };
  } else {
    sourceLocale = app.getManifest();
  }

  return Promise.all([app.getLangpacks(), sourceLocale]).then(
    utils.zip.bind(null, ['langpacks', 'manifest'])).then(
      function(rv) {
        var lp1 = rv.langpacks[rv.manifest.defaultLocale];
        var lp2 = rv.langpacks[lang];
        return compareLangpacks(lp1, lp2);
      });
};