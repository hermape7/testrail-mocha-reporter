const TestrailClass = require("./testrail");
const Mocha = require("mocha");
const {
  EVENT_RUN_END,
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS,
} = Mocha.Runner.constants;
const { titleToCaseIds } = require("./utils");
const getenv = require("getenv");

async function done(results, testrail, options, failures, exit) {
  let runId = 0;
  try {
    if (results.length === 0) {
      console.log(`No results found.`);
      exit && exit(0);
    } else {
      if (options.planId !== "") {
        runId = await testrail.getRunIdTestCase(results[0].case_id);
      } else {
        if (options.runId !== "") {
          runId = options.runId;
        } else {
          runId = await testrail.createNewRun();
        }
      }
      if (runId === 0) {
        console.log("RunId cannot be 0");
        exit && exit(0);
      }
      await testrail.addResults(runId, results);
      if (options.createRun || options.createRun === "true") {
        await testrail.closeRun(runId);
      }
      exit && exit(failures > 0 ? 1 : 0);
    }
  } catch (error) {
    console.log(error);
    exit && exit(failures > 0 ? 1 : 0);
  }
}

function getReporterOptions(reporterOptions) {
  return {
    ...reporterOptions,
    domain: reporterOptions.domain
      ? reporterOptions.domain
      : getenv("TESTRAIL_DOMAIN", ""),
    username: reporterOptions.username
      ? reporterOptions.username
      : getenv("TESTRAIL_USERNAME", ""),
    password: reporterOptions.password
      ? reporterOptions.password
      : getenv("TESTRAIL_PASSWORD", ""),
    projectId: reporterOptions.projectId
      ? reporterOptions.projectId
      : getenv("TESTRAIL_PROJECT_ID", ""),
    milestoneId: reporterOptions.milestoneId
      ? reporterOptions.milestoneId
      : getenv("TESTRAIL_MILESTONE_ID", ""),
    suiteId: reporterOptions.suiteId
      ? reporterOptions.suiteId
      : getenv("TESTRAIL_SUITE_ID", ""),
    runId: reporterOptions.runId
      ? reporterOptions.runId
      : getenv("TESTRAIL_RUN_ID", ""),
    planId: reporterOptions.planId
      ? reporterOptions.planId
      : getenv("TESTRAIL_PLAN_ID", ""),
    runName: reporterOptions.runName
      ? reporterOptions.runName
      : getenv("TESTRAIL_RUN_NAME", ""),
    createRun: reporterOptions.createRun
      ? reporterOptions.createRun
      : getenv("TESTRAIL_CREATE_RUN", false),
    suiteIds: reporterOptions.suiteIds
      ? suiteIds
      : getenv("TESTRAIL_SUITE_IDS", []),
    ci: reporterOptions.ci ? reporterOptions.ci : getenv("TESTRAIL_CI", ""),
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

  if (reporterOptions.ci !== "") {
    if (
      reporterOptions.ci === "circle" ||
      `${reporterOptions.ci}`.toUpperCase() === "CCI"
    ) {
      reporterOptions = {
        ...reporterOptions,
        runName: `${reporterOptions.runName} | #${process.env.CIRCLE_BUILD_NUM}`,
      };
    } else if (reporterOptions.ci === "travis") {
      reporterOptions = {
        ...reporterOptions,
        runName: `${reporterOptions.runName} | #${process.env.TRAVIS_BUILD_NUMBER}`,
      };
    } else if (reporterOptions.ci === "jenkins") {
      reporterOptions = {
        ...reporterOptions,
        runName: `${reporterOptions.runName} | #${process.env.BUILD_NUMBER}`,
      };
    }
  }

  const testrail = new TestrailClass(reporterOptions);

  // Done function will be called before mocha exits
  // This is where we will save JSON and generate the HTML report
  this.done = (failures, exit) =>
    done(this.results, testrail, reporterOptions, failures, exit);

  // Call the Base mocha reporter
  Mocha.reporters.Base.call(this, runner);

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
      console.log(
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
      console.log(
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
      // required because thrown errors are not handled directly in the
      // event emitter pattern and mocha does not have an "on error"
      /* istanbul ignore next */
      console.log(`Problem with testrail reporter: ${e.stack}`, "error");
    }
  });
}

module.exports = testrailReporter;
