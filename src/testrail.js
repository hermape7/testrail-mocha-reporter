const Testrail = require("testrail-api");
const moment = require("moment");
const _ = require("lodash");
const { logger } = require("./utils");
const getenv = require("getenv");
const chalk = require("chalk");

require("dotenv").config();

function addCiInfo(opts) {
  let reporterOptions = opts;
  if (getenv.bool("CIRCLECI", false)) {
    reporterOptions = {
      ...reporterOptions,
      runName: `${reporterOptions.runName} | #${process.env.CIRCLE_BUILD_NUM}`
    };
  } else if (reporterOptions.ci === "travis") {
    reporterOptions = {
      ...reporterOptions,
      runName: `${reporterOptions.runName} | #${process.env.TRAVIS_BUILD_NUMBER}`
    };
  } else if (reporterOptions.ci === "jenkins") {
    reporterOptions = {
      ...reporterOptions,
      runName: `${reporterOptions.runName} | #${process.env.BUILD_NUMBER}`
    };
  }
  return reporterOptions;
}

function checkOpts(opts) {
  return {
    ...opts,
    domain:
      opts.domain !== undefined
        ? opts.domain
        : getenv("TESTRAIL_DOMAIN", "n/a"),
    username:
      opts.username !== undefined
        ? opts.username
        : getenv("TESTRAIL_USERNAME", "n/a"),
    password:
      opts.password !== undefined
        ? opts.password
        : getenv("TESTRAIL_PASSWORD", "n/a"),
    projectId:
      opts.projectId !== undefined
        ? opts.projectId
        : getenv("TESTRAIL_PROJECT_ID", "n/a"),
    milestoneId:
      opts.milestoneId !== undefined
        ? opts.milestoneId
        : getenv("TESTRAIL_MILESTONE_ID", "n/a"),
    suiteId:
      opts.suiteId !== undefined
        ? opts.suiteId
        : getenv("TESTRAIL_SUITE_ID", "n/a"),
    runId:
      opts.runId !== undefined ? opts.runId : getenv("TESTRAIL_RUN_ID", "n/a"),
    planId:
      opts.planId !== undefined
        ? opts.planId
        : getenv("TESTRAIL_PLAN_ID", "n/a"),
    runName:
      opts.runName !== undefined
        ? opts.runName
        : getenv("TESTRAIL_RUN_NAME", "n/a"),
    createRun:
      opts.createRun !== undefined
        ? opts.createRun
        : getenv("TESTRAIL_CREATE_RUN", false),
    suiteIds:
      opts.suiteIds !== undefined
        ? suiteIds
        : getenv("TESTRAIL_SUITE_IDS", "n/a"),
    ci: opts.ci !== undefined ? opts.ci : getenv("TESTRAIL_CI", "n/a")
  };
}

class TestrailClass {
  constructor(opts) {
    if (Object.keys(opts).length === 0) {
      logger("Missing --reporter-options in mocha.opts");
      process.exit(1);
    }
    opts = checkOpts(opts);
    this.validateOptions(opts);
    if (opts.ci) {
      addCiInfo(opts);
    }
    this.domain = opts.domain;
    this.username = opts.username;
    this.password = opts.password;
    this.projectId = opts.projectId;
    this.milestoneId = opts.milestoneId;
    this.planId = opts.planId;
    this.createRun = opts.createRun;
    this.runId = opts.runId;
    this.suiteId = opts.suiteId;
    this.runName = opts.runName;
    this.suiteIds = opts.suiteIds;
    this.testrail = new Testrail({
      host: `https://${this.domain}`,
      user: this.username,
      password: this.password
    });
  }

  validateOptions(options) {
    this.validateSingleOpt(options, "domain");
    this.validateSingleOpt(options, "username");
    this.validateSingleOpt(options, "password");
    this.validateSingleOpt(options, "projectId");
    if (this.milestoneId !== "n/a") {
      this.validateSingleOpt(options, "milestoneId");
    }
    if (this.planId !== "n/a") {
      this.validateSingleOpt(options, "planId");
    } else if (this.runId !== "n/a") {
      this.validateSingleOpt(options, "runId");
      this.validateSingleOpt(options, "suiteId");
    } else if (this.createRun !== "n/a") {
      this.validateSingleOpt(options, "createRun");
      this.validateSingleOpt(options, "runName");
      this.validateSingleOpt(options, "suiteId");
    } else {
      logger(
        "Missing values in opts. There are three options:\n\t planId\n\t runId + suiteId\n\t createRun + runName + suiteId"
      );
    }
  }

  validateSingleOpt(options, name) {
    if (options[name] == null) {
      logger(
        `Missing ${chalk.red(
          name.toUpperCase()
        )} value. Please update --reporter-options in mocha.opts`
      );
      process.exit(1);
    }
  }

  // todo finish create run
  async createPlan() {
    return await this.testrail.addPlan(this.projectId, {
      name: "[#ccid - test plan]",
      milestone_id: this.milestone_id,
      entries: [
        { suite_id: 24, name: "[#ccid] - test suite config" },
        { suite_id: 25, name: "[#ccid] - test suite - user" }
      ]
    });
  }

  async getRunIdTestCase(caseId) {
    try {
      const planResponse = await this.testrail.getPlan(this.planId);
      try {
        const caseResponse = await this.testrail.getCase(caseId);
        const tcSuiteId = _.get(caseResponse.body, "suite_id");
        const planRunId = _.chain(
          _.find(planResponse.body.entries, e => e.suite_id === tcSuiteId)
        )
          .get("runs")
          .head()
          .get("id")
          .value();
        return planRunId;
      } catch (error) {
        logger(
          `Error when trying to get ${chalk.red(
            `testCase ${testCase}`
          )} from TR api`
        );
        logger(`${error.stack}`);
      }
    } catch (error) {
      logger(
        `Error when trying to get testPlan with ${chalk.red(
          `planId ${this.planId}`
        )} from TR api`
      );
      logger(`${error.stack}`);
    }
  }

  async createNewRun() {
    logger(
      `Creating run ${this.runName} - ${moment().format(
        "YYYY MMM DD, HH:MM:SS"
      )}`
    );
    let createBody = {
      name: `${this.runName} | ${moment().format("YYYY MMM DD, HH:MM:SS")}`,
      suite_id: this.suiteId,
      include_all: true
    };
    if (this.milestoneId !== "n/a" && this.milestoneId !== 0) {
      createBody = {
        ...createBody,
        milestone_id: this.milestoneId
      };
    }
    try {
      const addRunResponse = await this.testrail.addRun(
        this.projectId,
        createBody
      );
      logger(`Created run with ID ${addRunResponse.body.id}`);
      return addRunResponse.body.id;
    } catch (error) {
      logger("Error when creating a test Run");
      logger(error);
      return 0;
    }
  }

  async closeRun(runId) {
    try {
      logger(`Closing run with id ${runId}`);
      await this.testrail.closeRun(runId);
    } catch (error) {
      logger(`Could not close the run with id ${runId}`);
    }
  }

  async addResults(runId, results) {
    try {
      logger(`Adding results to run with id ${runId}`);
      await this.testrail.addResultsForCases(runId, results ? results : {});
      logger(
        `Results published to https://${this.domain}/index.php?/runs/view/${runId}`
      );
    } catch (err) {
      logger(
        `
        Adding results failed with err
        ${err}
        `
      );
      throw new Error(`${err}`);
    }
  }

  async sendResults(results, failures, exit) {
    let runId = 0;
    if (this.planId !== "n/a") {
      runId = await this.getRunIdTestCase(results[0].case_id);
    } else {
      if (this.runId !== "n/a") {
        runId = this.runId;
      } else {
        runId = await this.createNewRun();
      }
    }
    if (runId === "0" || runId === 0 || runId === "n/a") {
      logger("RunId cannot be 0");
      exit && exit(failures > 0 ? 1 : 0);
    } else {
      await this.addResults(runId, results);
      if (this.createRun === true || this.createRun === "true") {
        await this.closeRun(runId);
      }
      exit && exit(failures > 0 ? 1 : 0);
    }
  }
}

module.exports = TestrailClass;
