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

### Mocha

```bash
mocha test --reporter testrail-mocha-reporter --reporter-options domain=domain.testrail.com,username=test@test.com,password=12345678,...
```

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

## TestRail Settings

To increase security, the TestRail team suggests using an API key instead of a password. You can see how to generate an API key [here](http://docs.gurock.com/testrail-api2/accessing#username_and_api_key).

If you maintain your own TestRail instance on your own server, it is recommended to [enable HTTPS for your TestRail installation](http://docs.gurock.com/testrail-admin/admin-securing#using_https).

For TestRail hosted accounts maintained by [Gurock](http://www.gurock.com/), all accounts will automatically use HTTPS.

You can read the whole TestRail documentation [here](http://docs.gurock.com/).

## Author

Petr Heřmanský - [github](https://github.com/mickosav)

## License

This project is licensed under the [MIT license](/LICENSE.md).

## Acknowledgments

* [Pierre Awaragi](https://github.com/awaragi), owner of the [mocha-testrail-reporter](https://github.com/awaragi/mocha-testrail-reporter) repository that was forked.
* [Valerie Thoma](https://github.com/ValerieThoma) and [Aileen Santos](https://github.com/asantos3026) for proofreading the README.md file and making it more understandable.