const Testrail = require("testrail-api");
const moment = require("moment");
const _ = require("lodash");

class TestrailClass {
  constructor(opts) {
    if (opts == null) {
      throw new Error("Missing --reporter-options in mocha.opts");
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
    this.validateOptions(opts);
    this.testrail = new Testrail({
      host: `https://${this.domain}`,
      user: this.username,
      password: this.password,
    });
  }

  validateOptions(options) {
    this.validateSingleOpt(options, "domain");
    this.validateSingleOpt(options, "username");
    this.validateSingleOpt(options, "password");
    this.validateSingleOpt(options, "projectId");
    if (this.milestoneId !== "") {
      this.validateSingleOpt(options, "milestoneId");
    }
    if (this.planId !== "") {
      this.validateSingleOpt(options, "planId");
    } else {
      if (this.createRun === "true") {
        this.validateSingleOpt(options, "createRun");
        this.validateSingleOpt(options, "runName");
        this.validateSingleOpt(options, "suiteId");
      } else {
        if (this.runId !== "") {
          this.validateSingleOpt(options, "runId");
          this.validateSingleOpt(options, "suiteId");
        }
      }
    }
  }

  validateSingleOpt(options, name) {
    if (options[name] == null) {
      throw new Error(
        `Missing ${name} value. Please update --reporter-options in mocha.opts`
      );
    }
  }

  // todo finish create run
  async createPlan() {
    return await this.testrail.addPlan(this.projectId, {
      name: "[#ccid - test plan]",
      milestone_id: this.milestone_id,
      entries: [
        { suite_id: 24, name: "[#ccid] - test suite config" },
        { suite_id: 25, name: "[#ccid] - test suite - user" },
      ],
    });
  }

  async getRunIdTestCase(caseId) {
    const planResponse = await this.testrail.getPlan(this.planId);
    const caseResponse = await this.testrail.getCase(caseId);
    const tcSuiteId = _.get(caseResponse.body, "suite_id");
    const planRunId = _.chain(
      _.find(planResponse.body.entries, (e) => e.suite_id === tcSuiteId)
    )
      .get("runs")
      .head()
      .get("id")
      .value();
    return planRunId;
  }

  async createNewRun() {
    console.log(
      `Creating run ${this.runName} - ${moment().format(
        "YYYY MMM DD, HH:MM:SS"
      )}`
    );
    let createBody = {
      name: `${this.runName} | ${moment().format("YYYY MMM DD, HH:MM:SS")}`,
      suite_id: this.suiteId,
      include_all: true,
    };
    if (this.milestoneId !== undefined && this.milestoneId !== 0) {
      createBody = {
        ...createBody,
        milestone_id: this.milestoneId,
      };
    }
    const addRunResponse = await this.testrail.addRun(
      this.projectId,
      createBody
    );
    console.log("Created run with ID ", addRunResponse.body.id);
    return addRunResponse.body.id;
  }

  async closeRun(runId) {
    try {
      console.log(`Closing run with id ${runId}`);
      await this.testrail.closeRun(runId);
    } catch (error) {
      console.log(`Could not close the run with id ${runId}`);
      console.log(error.message.error);
    }
  }

  async addResults(runId, results) {
    try {
      console.log(`Adding results to run with id ${runId}`);
      await this.testrail.addResultsForCases(runId, results ? results : {});
      console.log(
        `Results published to https://${this.domain}/index.php?/runs/view/${runId}`
      );
    } catch (err) {
      console.log(
        `Run with ID ${runId} is not valid run. (Run needs to be created and not closed)`
      );
    }
  }
}

module.exports = TestrailClass;
