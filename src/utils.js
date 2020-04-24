const stringify = require("json-stringify-safe");
const chalk = require("chalk");

const LOG_LEVELS = ["info", "warning", "debug", "error"];

function titleToCaseIds(title) {
  let caseIds = [];

  let testCaseIdRegExp = /\bT?C(\d+)\b/g;
  let m;
  while ((m = testCaseIdRegExp.exec(title)) !== null) {
    let caseId = parseInt(m[1]);
    caseIds.push(caseId);
  }
  return caseIds;
}

function logger(msg) {
  let msgOut = typeof msg === Object ? stringify(msg, null, 2) : msg;
  console.log(`[${chalk.cyan("testrail")}] ${msgOut}`);
}

module.exports = { titleToCaseIds, logger };
