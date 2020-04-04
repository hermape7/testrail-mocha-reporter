const Base = require("mocha/lib/reporters/base");
const TestrailClass = require("./testrail");

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

async function done(results, testrail, options, failures, exit) {
  try {
    if (results.length === 0) {
      console.log("No results found");
      return;
    }
    const runId = await testrail.getRunIdTestCase(results[0].case_id);
    await testrail.addResults(runId, results);
    console.log("DONE");
    exit && exit(failures > 0 ? 1 : 0);
  } catch (error) {
    console.log(error);
    exit(1);
  }
}

function testrailReporter(runner, options) {
  this.results = [];
  this.testFailures = 0;
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
  this.done = (exit) =>
    done(this.results, testrail, reporterOptions, this.testFailures, exit);

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

        const { failures } = this.stats;
        this.testFailures = failures;
      }
    } catch (e) {
      // required because thrown errors are not handled directly in the
      // event emitter pattern and mocha does not have an "on error"
      /* istanbul ignore next */
      console.log(`Problem with testrail reporter: ${e.stack}`, "error");
    }
  });
}

module.exports = testrailReporter;
