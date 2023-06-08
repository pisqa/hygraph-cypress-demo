//
// general helper functions
//

//
// Login to hygraph
// Use session so don't have to repeat login for each test case
//
Cypress.Commands.add('login', () => {
    cy.session('login', () => {
        cy.visit('/')
        cy.get('input#1-email').type(Cypress.config('hygraphUser'))
        cy.get('input[type=password]').type(Cypress.config('hygraphPassword'))
        cy.get('.auth0-label-submit').click()
        cy.wait(5000)
    })

    var projectId = Cypress.config('hygraphProjectId')
    var projectName = Cypress.config('hygraphProjectName')

    // cy.visit(`/${projectId}/master`)
    // cy.get('h2[data-test=DashboardProjectName]').should('contain', projectName)

    // close the quickstart-checklist pop-up
    cy.visit('/')
    // cy.get('button[data-testid="close-quickstart-checklist"]').click();
})


//
// Create the project for the tests
// Delete and re-create if already exists
//
Cypress.Commands.add('createProject', () => {
    var projectName = Cypress.config('hygraphProjectName')
    var waitTime = 180000

    cy.visit('/').wait(5000)

    //check if project already exists
    //first check for zero projects
    cy.get('#root')
        .then(($root) => {
            if ($root.find('[data-test=ProjectCard]').length == 0) {
                cy.log('found zero projects')
            } else {
                cy.log('found at least one project')

                // at least one project, see if any are the test project
                cy.get('[data-test=ProjectCard]').each((el, index) => {
                    cy.wrap(el).invoke('attr', 'data-cy').then((projName) => {
                        if (projName == projectName) {

                            //delete project
                            cy.wrap(el).click();
                            cy.get('[data-testid="Project settings"]').click()
                            cy.get('[data-test=DeleteProjectDialogButton]').click()
                            cy.get('h4').contains('Delete project').should('be.visible')

                            // check for randomly appearing 'reason for deleting' dialog
                            cy.get('[role=dialog]').then(($dialog) => {
                                cy.log($dialog.text())
                                if ($dialog.text().includes('Reason for deleting')) {
                                    cy.get('span').contains('I want to start from scratch').click()
                                    cy.get('button[type=submit]').click()
                                }

                                cy.contains(`Please type ${projectName} to confirm`).should('be.visible')
                                cy.get('input[data-test=deleteProjectInput]').type(projectName).wait(500)
                                cy.get('button[data-test=ConfirmDeleteProject]').click()

                                // delete project can sometimes take a long time!
                                cy.get('[data-test=CreateTemplateCard]', { timeout: waitTime }).eq(0).should('be.visible')

                                cy.url().should('eq', Cypress.config().baseUrl)
                                return false
                            })

                        }



                    })
                })
            }


            cy.get('div[data-cy=fromScratch]').click();
            cy.get('input[data-test=createProjectName]').clear().type(projectName)
            cy.get('[role=dialog] [role=combobox]').click()
            cy.get('[data-cy="EU-WEST-2"]').click()
            cy.get('#CreateProjectRegion').invoke('val').should('eq', 'United Kingdom (London)')
            cy.get('[data-test=CreateProjectButton]').click()

            // create project can sometimes take a long time!
            cy.get('[data-test=DashboardProjectName]', { timeout: waitTime }).invoke('text').should('eq', projectName)

            // close the quickstart-checklist pop-up
            cy.get('button[data-testid="close-quickstart-checklist"]', { timeout: 10000 }).click();


            //get the api endpoint url
            cy.get('[data-testid="Project settings"]').click()
            cy.get('a').contains('Endpoints').click()
            cy.get('[data-test=ContentAPIEndpoint]').invoke('val').then(url => {
                cy.log('endpoint url:' + url)
                Cypress.config('hygraphContentApiEndpoint', url)
            })

            //set public api permissions
            cy.get('a').contains('Public Content API').click()
            cy.get('tr[data-test=ContentPermissionRow]').should('not.exist')
            cy.get('button[data-test=InitializeDefaultsButton]').click()
            cy.get('tr[data-test=ContentPermissionRow]', { timeout: 10000 }).should('be.visible')

            // add es local
            cy.get('a').contains('Locales').click()
            cy.get('h2').contains('Locales').parent().parent().parent().within(() => {
                //verify only one locale configured
                cy.get('#displayName').should('have.length', 1)
                cy.get('#displayName').invoke('val').should('eq', 'English')

                //add spanish
                cy.get('[role=combobox]').click().wait(500)
                cy.get('li[data-cy=Spanish]').scrollIntoView()
                cy.get('li[data-cy=Spanish]').click().wait(500)
                cy.get('input[name=apiId]').eq(0).invoke('val').should('eq', 'es')
                cy.get('button[type=submit]').eq(0).click().wait(2000)
                cy.get('#displayName[value=Spanish]', { timeout: 10000 })
            })
        })
})

//
// Create the model for the tests
// Delete and re-create if already exists
//
Cypress.Commands.add('createModel', () => {
    var modelName = Cypress.config('hygraphModelName')
    cy.get('div[data-testid="Schema"]').click();


    cy.get('div[data-testid="Schema"]').click();

    //check if model already exists
    //first check for zero models
    cy.get('[data-testid=schemaContextNav]')
        .then(($nav) => {
            if ($nav.find('[data-test=SidebarModelItem]').length) {

                // at least one model, see if any are the test model
                cy.get('a[data-test=SidebarModelItem').each((el, index) => {
                    cy.wrap(el).invoke('text').then(model => {
                        if (model == modelName) {
                            //delete the model
                            cy.wrap(el).click();
                            cy.get('button[data-test=ModelSettingsDropdown]').click()
                            cy.get('[role=menuitem][data-valuetext=Delete]').click()
                            cy.get('button[type=submit]').contains(`Delete ${modelName}`).click().wait(500)
                            cy.checkToast('Model deleted successfully')
                            cy.wait(10000) //best wait a bit before re-creating

                            //break loop
                            return false
                        }
                    })
                })
            }

            //create model - intercept to get the model id 
            cy.intercept('POST',
                'https://management.hygraph.com/graphql',
                (req) => {
                    if (req.body.hasOwnProperty('operationName') && req.body.operationName == 'createModelMutation') {
                        req.alias = 'createRq'
                    }
                })
            cy.get('button[data-test=AddModelButton]').click()
            cy.get('input[data-test=CreateModelName]').type(modelName)
            cy.get('button[data-test=CreateModelAction]').click()
            cy.wait('@createRq').then((rq) => {
                var rsBody = rq.response.body
                var modelId = rsBody.data.createModel.migration.id
                cy.log('>>>>>>>>>>>>>>>>createModel, Setting modelId: ' + modelId)
                Cypress.config('hygraphModelId', modelId)
            })
            cy.checkToast()

            cy.get('h3[data-test=SchemaModelName]', { timeout: 10000 }).invoke('text').should('equal', modelName)
        })
})

//
// Go to the test model
//
Cypress.Commands.add('goToModel', () => {
    cy.get('div[data-testid="Schema"]').click();
    cy.get('a[data-test=SidebarModelItem]').contains(Cypress.config('hygraphModelName')).click();
});

//
// Generic function to verify toast message and dismiss
//
Cypress.Commands.add('checkToast', (maybeMessage) => {

    var expectedMessage = 'Changes applied successfully' //default
    if (maybeMessage) expectedMessage = maybeMessage

    // flakey tests - get random test failures where invoked text is empty or cannot find button
    // remove for now
    // cy.get('.Toastify').invoke('text').should('contain', expectedMessage)
    // cy.get('.Toastify').find('button').click({ multiple: true })
})

//
// Verify test case object has the required fields
//
Cypress.Commands.add('checkTc', (tc) => {
    expect(tc).to.have.keys('tcTitle', 'fieldType', 'apiId', 'displayName', 'description', 'options')
    expect(tc.options).to.have.keys('useAsTitle', 'allowMultiple', 'localize', 'charLimit', 'required', 'setUnique',
        'matchPattern', 'restrictPattern', 'initialValue', 'visibility')
})

