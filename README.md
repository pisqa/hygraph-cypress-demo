# hygraph-cypress-demo
This project demonstrates analysis, design and implementation of a regression test suite for a complex enterprise Software as a Service (SaaS) product. It employs best-practice design and implementation techniques to ensure efficient delivery of a high coverage, maintainable automated test solution:
- Pairwise test generation to give comprehensive functional test coverage
- Combination of full end-to-end tests with stubbed UI tests to balance execution efficiency and robustness with e2e coverage requirements
- Abstraction of UI interactions and use of Data Driven testing to ensure highly maintainable, transparent, and easily extendible test suites.

## System Under Test (SUT)
The SUT chosen for this demo is [Hygraph](https://hygraph.com/), 
a federated content management platform. This has a free-forever community licence which makes it accessible for personal projects. Their documentation is excellent and the [Getting Started](https://hygraph.com/docs/getting-started/create-a-project) guide introduces the basic concepts quickly. For this demo we will focus on the [Schema](https://hygraph.com/docs/getting-started/app-walkthrough/schema-editor) and [Content](https://hygraph.com/docs/getting-started/app-walkthrough/content-editor) components.

## Test Objectives
The objectives of these regression tests are to verify the correct functioning of schema creation and content creation and publication, for the various field types available in the schema editor (text, number, date, etc). 

In particular, verify correct functioning of the content editor based on the options selected in the schema editor. For example, if a field is marked as unique in the schema, verify that the content editor correctly enforces that restriction.

The number of field types and the various options available within each type makes this an interesting challenge.

## Test Design
The attached [testDesign spreadsheet](/cypress/fixtures/testSuite.xlsx) (field-option sheet) gives a summary of the available schema field types and their options. The matrix is quite extensive and demands an efficient test design approach that delivers adequate coverage with reasonable effort.

Lets see if our old friend [All-pairs testing](https://en.wikipedia.org/wiki/All-pairs_testing) can help us. The matrix is quite irregular (not all options apply to all fields), so for the sake of simplicity for this demo, lets focus on the first three field types. We use the [Pairwise Pict Online](https://pairwise.yuuniworks.com/) tool (additional documentation at [PICT 3.3 User’s Guide](http://www.amibugshare.com/pict/help.html)).

Inputting the [testFactors](/cypress/fixtures/testFactors.txt), generates the 24 test cases at [testDesign spreadsheet](/cypress/fixtures/testSuite.xlsx) (all-pairs sheet). That’s still quite a high number for just 3 field types – a reasonable estimate for the full 20 field types (taking into account later fields have fewer options) would probably be at least 100 test cases. Way too many for full e2e test flows!

Remember, full e2e UI automated tests tend to have long execution times and higher risk of [flakiness](https://testing.googleblog.com/2020/12/test-flakiness-one-of-main-challenges.html). Best practice tells us to follow the famous [Test Pyramid](https://martinfowler.com/bliki/TestPyramid.html) and prefer fast and robust unit and service/integration tests over slow and flaky UI tests.

A comprise solution is to use stubbing to verify the correct behaviour of the UI in isolation from the backend. These tests should be significantly faster and more robust than full e2e tests. 

Combining full coverage (all 24 TCs) by stubbed tests, with a few full e2e test flows will provide adaquate coverage to comply with the test objectives.
