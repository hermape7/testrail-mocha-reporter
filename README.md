# testrail-mocha-reporter

This is custom mocha reporter for use with javascript framework, [mocha](https://mochajs.org/).

Inspired by [mochawesome](https://github.com/adamgruber/mochawesome) project.

## Installation

### npm

```Bash
npm install --save-dev testrail-mocha-reporter
```

### yarn

```Bash
yarn add -D testrail-mocha-reporter
```

## Usage



### Cypress integration

Reporter working well with [Cypress.io](https://www.cypress.io/).

To integrate reporter please read the Cypress [documentation](https://docs.cypress.io/guides/tooling/reporters.html) for adding custom reporters.

### Add reporter to jsou cypress.json

```json
{
  ...,
  "reporter": "testrail-mocha-reporter",
  "reporterOptions": {
    "domain": "domain.testrail.com",
    "username": "test@test.com",
    "password": "your password",
    "projectId": 1,  
    "planId": 1,
    "milestoneId": 1
  },
  ...
}
```

If you are using a `multi-custom-reporter` then you will need to add it like this: 

```json
{
  ...,
  "reporterOptions": {
    "reporterEnabled": "testrail-mocha-reporter,html",
    "testrailMochaReporterReporterOptions": {
      "domain": "domain.testrail.com",
      "username": "test@test.com",
      "password": "your password",
      "projectId": 1,  
      "planId": 1,
      "milestoneId": 1
    }
  },
  ...
}

```