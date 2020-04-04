const Base = require("mocha/lib/reporters/base");

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

function done(results, testrail, options, failures, exit) {
  if (!results) {
    console.log("No results found");
    return;
  }
  testrail.getRunIdTestCase(results[0].case_id).then((runId) => {
    testrail
      .addResults(runId, results)
      .then(() => {})
      .catch((err) => {
        console.log(err);
        exit(1);
      })
      .then(() => {
        exit(failures > 0 ? 1 : 0);
        process.exit(failures > 0 ? 1 : 0);
      });
  });
}

function testrailReporter(runner, options) {
  this.results = [];
  this.failures = 0;
  failures = 0;
  // Ensure stats collector has been initialized
  if (!runner.stats) {
    const createStatsCollector = require("mocha/lib/stats-collector");
    createStatsCollector(runner);
  }

  // Reporter options
  const reporterOptions = {
    ...options.reporterOptions,
  };

  const testrail = new TestrailClass(reporterOptions);

  // Done function will be called before mocha exits
  // This is where we will save JSON and generate the HTML report
  this.done = (failures, exit) =>
    done(this.results, testrail, reporterOptions, this.failures, exit);

  // Call the Base mocha reporter
  Base.call(this, runner);

  let endCalled = false;

  runner.on("pass", (test) => {
    const caseIds = titleToCaseIds(test.title);
    if (caseIds.length > 0) {
      const results = caseIds.map((caseId) => {
        return {
          case_id: caseId,
          status_id: 1,
          comment: `Execution time: ${test.duration}ms`,
        };
      });
      this.results.push(...results);
    }
  });

  runner.on("fail", (test) => {
    this.failures++;
    const caseIds = titleToCaseIds(test.title);
    if (caseIds.length > 0) {
      const results = caseIds.map((caseId) => {
        return {
          case_id: caseId,
          status_id: 5,
          comment: `${test.err.message}`,
        };
      });
      this.results.push(...results);
    }
  });

  // Process the full suite
  runner.on("end", () => {
    try {
      if (!endCalled) {
        // end gets called more than once for some reason
        // so we ensure the suite is processed only once
        endCalled = true;
      }
    } catch (e) {
      // required because thrown errors are not handled directly in the
      // event emitter pattern and mocha does not have an "on error"
      /* istanbul ignore next */
      log(`Problem with mochawesome: ${e.stack}`, "error");
    }
  });
}

module.exports = testrailReporter;
