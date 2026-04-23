# hygraph-cypress-demo
This project demonstrates analysis, design and implementation of a regression test suite for a complex enterprise Software as a Service (SaaS) product. It employs best-practice design and implementation techniques to ensure efficient delivery of a high coverage, maintainable automated test solution:
- Pairwise test generation to give comprehensive functional test coverage
- Combination of full end-to-end tests with stubbed UI tests to balance execution efficiency and robustness with e2e coverage requirements
- Abstraction of UI interactions and use of Data Driven testing to ensure highly maintainable, transparent, and easily extensible test suites.

## System Under Test (SUT)
The SUT chosen for this demo is [Hygraph](https://hygraph.com/), 
a federated content management platform. This has a free-forever community licence which makes it accessible for personal projects. Their documentation is excellent and the [Getting Started](https://hygraph.com/docs/getting-started/create-a-project) guide introduces the basic concepts quickly. For this demo we will focus on the [Schema](https://hygraph.com/docs/getting-started/app-walkthrough/schema-editor) and [Content](https://hygraph.com/docs/getting-started/app-walkthrough/content-editor) components.

## Test Objectives
The objectives of these regression tests are to verify the correct functioning of schema creation and content creation and publication, for the various field types available in the schema editor (text, number, date, etc). 

In particular, verify correct functioning of the content editor based on the options selected in the schema editor. For example, if a field is marked as unique in the schema, verify that the content editor correctly enforces that restriction.

The number of field types and the various options available within each type makes this an interesting challenge.

## Test Design
The attached [testDesign spreadsheet](/cypress/fixtures/testDesign.xlsx) (field-option review sheet) gives a summary of the available schema field types and their options. The matrix is quite extensive and demands an efficient test design approach that delivers adequate coverage with reasonable effort.

Lets see if our old friend [All-pairs testing](https://en.wikipedia.org/wiki/All-pairs_testing) can help us. The matrix is quite irregular (not all options apply to all fields), so for the sake of simplicity for this demo, lets focus on the first three field types. We use the [Pairwise Pict Online](https://pairwise.yuuniworks.com/) tool (additional documentation at [PICT 3.3 User’s Guide](http://www.amibugshare.com/pict/help.html)).

Inputting the [testFactors](/cypress/fixtures/allPairsFactors.txt) to Pict Online generates the 24 test cases at [testDesign spreadsheet](/cypress/fixtures/testDesign.xlsx) (all-pairs sheet). That’s still quite a high number for just 3 field types – a reasonable estimate for the full 20 field types (taking into account later fields have fewer options) would probably be at least 100 test cases. Way too many for full e2e test flows!

Remember, full e2e UI automated tests tend to have long execution times and higher risk of [flakiness](https://testing.googleblog.com/2020/12/test-flakiness-one-of-main-challenges.html). Best practice tells us to follow the famous [Test Pyramid](https://martinfowler.com/bliki/TestPyramid.html) and prefer fast and robust unit and service/integration tests over slow and flaky UI tests.

A comprise approach is to use stubbing to verify the correct behaviour of the UI in isolation from the backend. These tests should be significantly faster and more robust than full e2e tests. 

Combining full coverage (all 24 TCs) by stubbed tests, with a few full e2e test flows will provide adaquate coverage to comply with the test objectives.

## Test Implementation
We implement two categories of test case: Stubbed test cases which will provide full coverage of the All-pairs generated cases, and full end-to-end scenarios.

In general we abstract UI interactions as much as possible (cypress Commands) to ensure the test code is maintainable, readable, and easily extensible. These abstractions are implemented in the e2e/helpers folder.

### Stubbed Tests
For the purposes of this demo, we limit the scope to intercepting and verifying the *schema* creation action. In reality, we would also stub *content* creation to provide coverage for that functionality.

The basic flow for each test case is the same:
1.	create a new schema
2.	add the field under test, applying various options
3.	intercept the createSimpleFieldMutation API call 
4.	verify correctness of the request body

See saveFieldStubbed() function in schemaHelpers [schemaHelpers.js](/cypress/e2e/helpers/schemaHelpers.js)
for details of request interception and verification. Note the call to constructExpectedAddFieldRq() to dynamically generate the expected request body based on the tc data.

Because the basic flow is the same for each test case, we can apply Data Driven test techniques to make the code more maintainable and facilitate easy addition of new testcases.
Test case data is defined in [allPairsTests.json](/cypress/fixtures/allPairsTests.json).
The core engine for loading the test suite and executing the test steps is at [stubbedTests.cy.js](/cypress/e2e/stubbedTests.cy.js)

The first 10 test cases of the planned 24 have been implemented.

### End-to-end tests
The basic flow for each test case is similar, though the exact sequence of steps will vary for each case:
1.	create a new schema
2.	add the field under test, applying various options
3.	add content and verify any restrictions are correctly imposed by the editor
4.	publish the content
5.	make an API  request to the public content endpoint and verify response

Following the Agile Test Pyramid approach, we would include only a few e2e tests. Three example test cases are documented in [testDesign spreadsheet](/cypress/fixtures/testDesign.xlsx) (e2e sheet) and implemented in [e2eTests.cy.js](/cypress/e2e/e2eTests.cy.js)

## Test Execution
A basic familiarty with Cypress is assumed. Two external packages are required:

- npm install lodash --save-dev
- npm install deep-object-diff --save-dev

In [cypress.config.js](/cypress.config.js) configure **hygraphUser** & **hygraphPassword**.
Creating a test user specifically for these tests is recommended. Otherwise modify **hygraphProjectName: 'Cypress Demo'** if required.

Currently there are random test failures running from the commandline. Until that is resolved, please execute from the Cypress Application.

