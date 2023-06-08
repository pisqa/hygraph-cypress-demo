import { testSuite } from '../fixtures/allPairsTests.json';

describe('hygraph stubbed tests', () => {

    before(() => {
        cy.login()
        cy.createProject()

    })

    beforeEach(() => {

        // we dont really login for each test case
        // the login command uses cy.session() so actual login is only performed once
        cy.login()
        cy.visit('/')
        cy.get(`[data-cy="${Cypress.config('hygraphProjectName')}"]`).click()

        // close the quickstart-checklist pop-up
        cy.get('button[data-testid="close-quickstart-checklist"]', { timeout: 10000 }).click();
        cy.createModel()

        // cy.goToModel()

    })

    testSuite.forEach((tc, k) => {
        it(`test case ${k + 1}: ${tc.tcTitle}`, function () {
            cy.log(JSON.stringify(tc, null, 4))
            cy.createFieldAndVerify(tc)
            cy.wait(10000)
        })
    })
})