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

module.exports = { titleToCaseIds };
