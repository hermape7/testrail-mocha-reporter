const TestrailClass = require("./testrail");
const Mocha = require("mocha");
const {
  EVENT_RUN_END,
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS,
} = Mocha.Runner.constants;
const { titleToCaseIds, logger } = require("./utils");
// const getenv = require("getenv");

function consoleReporter(reporter) {
  if (reporter) {
    try {
      // eslint-disable-next-line import/no-dynamic-require
      return require(`mocha/lib/reporters/${reporter}`);
    } catch (e) {
      log(`Unknown console reporter '${reporter}', defaulting to spec`);
    }
  }

  return require("mocha/lib/reporters/spec");
}

async function done(results, testrail, options, failures, exit) {
  try {
    if (results.length === 0) {
      logger(`No results found.`);
      exit && exit(failures > 0 ? 1 : 0);
    } else {
      await testrail.sendResults(results, failures, exit);
    }
  } catch (error) {
    logger(error);
    exit && exit(failures > 0 ? 1 : 0);
  }
}

function getReporterOptions(reporterOptions) {
  return {
    ...reporterOptions,
  };
}

function testrailReporter(runner, options) {
  this.results = [];
  // Ensure stats collector has been initialized
  if (!runner.stats) {
    const createStatsCollector = require("mocha/lib/stats-collector");
    createStatsCollector(runner);
  }

  // Reporter options
  let reporterOptions = getReporterOptions(options.reporterOptions);

  const testrail = new TestrailClass(reporterOptions);

  // Done function will be called before mocha exits
  // This is where we will save JSON and generate the HTML report
  this.done = (failures, exit) =>
    done(this.results, testrail, reporterOptions, failures, exit);

  // Call the Base mocha reporter
  Mocha.reporters.Base.call(this, runner);

  const reporterName = reporterOptions.consoleReporter;
  if (reporterName !== "none") {
    const ConsoleReporter = consoleReporter(reporterName);
    new ConsoleReporter(runner); // eslint-disable-line
  }

  let endCalled = false;

  runner.on(EVENT_TEST_PASS, (test) => {
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
    } else {
      logger(
        `No test case found. Please check naming of the test - must include (C|T)xxxx`
      );
    }
  });

  runner.on(EVENT_TEST_FAIL, (test) => {
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
    } else {
      logger(
        `No test case found. Please check naming of the test - must include (C|T)xxxx`
      );
    }
  });

  // Process the full suite
  runner.on(EVENT_RUN_END, () => {
    try {
      if (!endCalled) {
        // end gets called more than once for some reason
        // so we ensure the suite is processed only once
        endCalled = true;

        const { failures } = this.stats;
        this.failures = failures;
      }
    } catch (e) {
      logger(`Problem with testrail reporter: ${e.stack}`);
    }
  });
}

module.exports = testrailReporter;
