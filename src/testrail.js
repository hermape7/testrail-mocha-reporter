const Testrail = require("testrail-api");
const moment = require("moment");
const _ = require("lodash");

class TestrailClass {
  constructor(opts) {
    this.projectId = opts.projectId;
    this.milestoneId = opts.milestoneId;
    this.suiteId = opts.suiteId;
    this.runId = opts.runId || 0;
    this.planId = opts.planId;
    this.testrail = new Testrail({
      host: `https://${opts.domain}`,
      user: opts.username,
      password: opts.password,
    });
  }

  get getRunId() {
    return this.runId;
  }

  async createPlan() {
    return await this.testrail.addPlan(this.projectId, {
      name: "[#ccid - test plan]",
      milestone_id: 3,
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

  async createRun() {
    return await this.testrail
      .addRun(this.projectId, {
        name: `TA RUN - ${moment().format("[#cciId]YY MMM DD HH:MM:ss")}`,
        suite_id: this.suiteId,
        milestone_id: this.milestoneId,
      })
      .then((resp) => (this.runId = resp.body.id));
  }

  async closeRun(runId) {
    return await this.testrail.closeRun(runId);
  }

  async addResults(runId, results) {
    try {
      return await this.testrail.addResultsForCases(
        runId,
        results ? results : {}
      );
    } catch (err) {
      console.log(
        `Run with ID ${runId} is not valid run. (Run needs to be created and not closed)`
      );
    }
  }
}

module.exports = TestrailClass;
