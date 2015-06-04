'use strict';

var path = require('path');

var calculateStatsForLangpackDiff =
  require('../stats').calculateStatsForLangpackDiff;
var levels = require('../levels');

function sortEntries(a, b) {
  if (a[2] < b[2]) {
    return -1;
  }
  if (a[2] > b[2]) {
    return 1;
  }
  return 0;
}

function isEntryEmpty(entry) {
  if (entry[1] !== 'present') {
    return false;
  }

  for (var i in entry[3].entries) {
    var entity = entry[3].entries[i];
    if (entity[1] !== 'present') {
      return false;
    }
    if (entity[3].messages.length !== 0) {
      return false;
    }
  }
  return true;
}

function collapseCommon(struct) {
  //console.log(struct);
  for (var key in struct) {
  }
  return struct;
}

function createStructuredDiff(entries) {
  var struct = {};

  entries = entries.filter(function(entry) {
    return !isEntryEmpty(entry);
  });

  var prev;
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];

    var chunks = entry[2].split(path.sep);

    if (i > 0) {
      for (var j = 0; j < chunks.length; j++) {
        if (prev[j] !== chunks[j]) {
          break;
        }
      }
      var common = chunks.slice(0, j);
      if (common.length === 0) {
        console.log('common == 0')
        struct[chunks] = entry;
        prev = chunks;
      } else {
        var uniq1 = prev.slice(j);
        var uniq2 = chunks.slice(j);
        if (uniq1.length === 0) {
          struct[common][uniq2] = entry;
        } else {
          var substr = {};
          substr[uniq1] = struct[prev];
          substr[uniq2] = entry;
          struct[common] = substr;
          delete struct[prev];
          prev = common;
        }
      }
    } else {
      struct[chunks] = entry;
      prev = chunks;
    }
    console.log(struct);
    console.log('----');
  }

  return collapseCommon(struct);
}

function buildIndent(indent) {
  var str = '';
  for (var i = 0; i < indent; i++) {
    str += '  ';
  }
  return str;
}

function printStructuredDiff(diff, indent) {
  if (!indent) {
    indent = 0;
  }
  var str = '';
  for (var key in diff) {
    var val = diff[key];
    if (Array.isArray(val)) {
      str += printEntryDiff(key, val, indent);
    } else if (typeof val === 'object') {
      var str2 = printStructuredDiff(val, indent + 1);
      str += buildIndent(indent) + key + '\n';
      str += str2;
    }
  }
  return str;
}

function printEntryDiff(key, entry, indent) {
  var str = buildIndent(indent) + key.replace('.{locale}', '') + '\n';

  if (entry[1] === 'missing') {
    str += buildIndent(indent + 2) + '// add and localize this file\n';
  } else if (entry[1] === 'obsolete') {
    str += buildIndent(indent + 2) + '// remove this file\n';
  } else {
    var str2 = serializeResourceDiffToText(entry[3], indent);
    str += buildIndent(indent + 2) +
      str2.replace(/\n/g, '\n' + buildIndent(indent)).trim() + '\n';
  }
  return str;
}

function serializeLangpackDiff(lpDiff) {
  var str = '';

  var stats = calculateStatsForLangpackDiff(lpDiff);

  lpDiff.entries.sort(sortEntries);

  var structuredDiff = createStructuredDiff(lpDiff.entries);

  str = printStructuredDiff(structuredDiff);

  if (stats.unchanged) {
    str += 'unchanged: ' + stats.unchanged + '\n';
  }
  if (stats.changed) {
    str += 'changed: ' + stats.changed + '\n';
  }
  if (stats.obsolete) {
    str += 'obsolete: ' + stats.obsolete + '\n';
  }
  if (stats.missing) {
    str += 'missing: ' + stats.missing + '\n';
  }
  if (stats.missingInFiles) {
    str += 'missingInFiles: ' + stats.missingInFiles + '\n';
  }

  if (stats.infos) {
    str += 'infos: ' + stats.infos + '\n';
  }
  if (stats.warnings) {
    str += 'warnings: ' + stats.warnings + '\n';
  }
  if (stats.errors) {
    str += 'errors: ' + stats.errors + '\n';
  }
  if (stats.critical) {
    str += 'critical: ' + stats.critical + '\n';
  }

  var goodEntries = stats.unchanged + stats.changed + stats.missing + stats.missingInFiles;
  var changePerc = parseInt(stats.changed / goodEntries * 100);
  str += changePerc + '% of entries changed';

  return str;
}

function serializeResourceDiffToText(resDiff) {
  var str = '';

  resDiff.entries.sort(sortEntries);
  resDiff.entries.forEach(function (entry) {
    if (entry[1] === 'missing') {
      str += '    +' +entry[2]+ '\n';
    } else if (entry[1] === 'obsolete') {
      str += '    -' +entry[2]+ '\n';
    } else {
      str += serializeEntryDiffToText(entry[3]);
    }
  });

  return str;
}

function serializeEntryDiffToText(entryDiff) {
  var str = '';

  var entityIdDisplayed = false;

  entryDiff.messages.forEach(function(msg) {
    var key = msg[3] ? '.' + msg[3] : 'value';
    if (!entityIdDisplayed) {
      str += '    ~' + entryDiff.id + '\n';
      entityIdDisplayed = true;
    }
    str += '        ' + levels.getLabel(msg[1]) + ': ' +
      msg[4] + '\n';
  });

  return str;
}

exports.serializeLangpackDiff = serializeLangpackDiff;
