const lod = require('lodash')

describe('hygraph e2e tests', () => {

    before(() => {
        cy.login()
        cy.createProject()
    })

    beforeEach(() => {

        cy.login()
        // cy.visit(`/${Cypress.config('hygraphProjectId')}/master`)
        cy.visit('/')
        cy.get(`[data-cy="${Cypress.config('hygraphProjectName')}"]`).click()
        

        // close the quickstart-checklist pop-up
        cy.get('button[data-testid="close-quickstart-checklist"]', { timeout: 10000 }).click();
        cy.createModel()

        //cy.goToModel()
    })


    it('TC01', () => {

        const tc = {
            tcTitle: "TC01",
            fieldType: 'Single line text',
            apiId: 'tc01',
            displayName: 'TC01',
            description: 'TC01 description',
            options: {
                useAsTitle: false,
                allowMultiple: {
                    active: false
                },
                localize: false,
                charLimit: {
                    limitType: 'none'
                },
                required: true,
                setUnique: true,
                matchPattern: {
                    type: 'NONE'
                },
                restrictPattern: {
                    active: false
                },
                initialValue: {
                    initial: true,
                    value: "Some Initial Stuff"
                },
                visibility: 'Read / Write'
            }
        }

        cy.checkTc(tc)

        cy.beginAddField(tc)

        cy.setBasicFieldOptions(tc.options)

        cy.setFieldLimit(tc.options.charLimit, 'text')
        cy.setMatchPattern(tc.options.matchPattern)
        cy.setRestrictPattern(tc.options.restrictPattern)
        cy.setInitialValue(tc)
        cy.setVisibility(tc.options.visibility)
        cy.saveField()

        var content = 'Hello World'

        cy.beginAddContent(1)
        cy.verifyContentFieldBasics(0, tc)
        cy.verifyInitialValue(0, tc)
        cy.verifyRequired(0, tc)

        //set value and publish
        var name = lod.camelCase(tc.displayName)
        cy.get(`[name=${name}]`).clear().type(content).wait(500)
        cy.saveAndPublishContent()

        //verify unique restriction
        cy.beginAddContent(1)
        cy.get(`[name=${name}]`).clear().type(content).wait(500)

        //try saving
        cy.get('[data-testid=ContentFormHeaderSaveButton]').click().wait(500)
        cy.get('p').contains('Action failed').should('be.visible')
        cy.get('p').contains('Invalid query:').should('be.visible')
        cy.get('p').contains(`value is not unique for the field "${name}"`).should('be.visible')

        // verify api endpoint
        var modelName = Cypress.config('hygraphModelName')
        var fieldName = lod.camelCase(tc.displayName)
        var expectedRsBody =
            `{"data":{"${modelName}s":[{"${fieldName}":"${content}"}]}}`
        cy.verifyEndpoint(tc, expectedRsBody)
    })


    it('TC02', () => {

        const tc = {
            tcTitle: "Single Field [Markdown/Multiple/Limit Entries/Not Unique/Not Required]",
            fieldType: 'Markdown',
            apiId: 'tc02',
            displayName: 'TC02',
            description: 'Single Field [Markdown/Multiple/Limit Entries/Not Unique/Not Required]',
            options: {
                useAsTitle: false,
                allowMultiple: {
                    active: true,
                    limitType: "notMoreThan",
                    max: 2,
                    customMessage: "Enter at most 2 entries"
                },
                localize: false,
                charLimit: {
                    limitType: 'none'
                },
                required: false,
                setUnique: false,
                matchPattern: {
                    type: 'NONE'
                },
                restrictPattern: {
                    active: false
                },
                initialValue: {
                    initial: false,
                },
                visibility: 'Read / Write'
            }
        }
        const content = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'




        cy.checkTc(tc)

        cy.beginAddField(tc)

        cy.setBasicFieldOptions(tc.options)
        cy.setFieldLimit(tc.options.allowMultiple, 'entries')

        cy.setFieldLimit(tc.options.charLimit, 'text')
        cy.setMatchPattern(tc.options.matchPattern)
        cy.setRestrictPattern(tc.options.restrictPattern)
        cy.setInitialValue(tc)
        cy.setVisibility(tc.options.visibility)
        cy.saveField()

        cy.beginAddContent(1)
        cy.verifyContentFieldBasics(0, tc)
        cy.verifyInitialValue(0, tc)
        cy.verifyRequired(0, tc)

        //set value and publish
        var name = lod.camelCase(tc.displayName)
        cy.get('textarea').clear().type(content).wait(500)
        cy.get('button[data-testid=AddToListButton]').click().wait(500)
        //verify 1 item in list
        cy.get('[data-testid=ListItem]').should('have.length', 1)
        cy.get('[data-testid=mde-preview]').invoke('text').should('eq', content);

        cy.saveAndPublishContent()

        // verify no unique restriction - create duplicate entries
        cy.beginAddContent(1)
        cy.get('textarea').clear().type(content).wait(500)
        cy.get('button[data-testid=AddToListButton]').click().wait(500)
        cy.get('[data-testid=ListItem]').should('have.length', 1)
        cy.get('[data-testid=mde-preview]').invoke('text').should('eq', content);
        cy.saveAndPublishContent()

        //verify entry limit - max 2 in list
        const entryLimitErrorMsg = 'Some fields have invalid values, please correct them before saving.'

        cy.beginAddContent(1)
        cy.get('textarea').clear().type(content).wait(500)
        cy.get('button[data-testid=AddToListButton]').click().wait(500)
        cy.get('[data-testid=ListItem]').should('have.length', 1)


        cy.get('textarea').eq(0).clear().type(content).wait(500)
        cy.get('button[data-testid=AddToListButton]').click().wait(500)
        cy.get('[data-testid=ListItem]').should('have.length', 2)

        cy.get('textarea').eq(0).clear().type(content).wait(500)
        cy.get('button[data-testid=AddToListButton]').click().wait(500)
        cy.get('[data-testid=ListItem]').should('have.length', 3)

        //save content
        cy.get('[data-testid=ContentFormHeaderSaveButton]').click().wait(500)
        cy.contains(entryLimitErrorMsg).should('be.visible')

        var modelName = Cypress.config('hygraphModelName')
        var fieldName = lod.camelCase(tc.displayName)

        var expectedRsBody =
            `{"data":{"${modelName}s":[{"${fieldName}":["${content}"]},` +
            `{"${fieldName}":["${content}"]}]}}`

        // verify api endpoint
        cy.verifyEndpoint(tc, expectedRsBody)
    })

    it.only('TC03', () => {

        const tc = {
            tcTitle: "TC03",
            fieldType: 'Markdown',
            apiId: 'tc03',
            displayName: 'TC03',
            description: 'TC03 description',
            options: {
                useAsTitle: false,
                allowMultiple: {
                    active: false
                },
                localize: true,
                charLimit: {
                    limitType: "atLeast",
                    min: 3,
                    customMessage: "Oops! Something went wrong...."
                },
                required: true,
                setUnique: false,
                matchPattern: {
                    type: "Email",
                    caseInsensitive: false,
                    multiLine: false,
                    singleLine: true,
                    customMessage: "Please enter a valid Email"
                },
                restrictPattern: {
                    active: false
                },
                initialValue: {
                    initial: false,
                },
                visibility: 'Read / Write'
            }
        }
        const content = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'

        /// TODO

        // 1. verify locales
        // 2. verify multiple not allowed
        // 3. verify char limit
        // 4. verify required=T
        // 5. verify can duplicate
        // 6  verify match pattern
        // 7  verify no initial

        cy.checkTc(tc)

        cy.beginAddField(tc)

        cy.setBasicFieldOptions(tc.options)
        cy.setFieldLimit(tc.options.charLimit, 'text')
        cy.setMatchPattern(tc.options.matchPattern)
        cy.setRestrictPattern(tc.options.restrictPattern)
        cy.setInitialValue(tc)
        cy.setVisibility(tc.options.visibility)
        cy.saveField()

        cy.beginAddContent(1)









        cy.verifyContentFieldBasics(0, tc)
        cy.verifyInitialValue(0, tc)
        cy.verifyRequired(0, tc)

        //verify char limit
        cy.contains('Minimum 3 characters').should('be.visible')
        cy.get('.mde-tabs>button').contains('Write').click()
        cy.get('textarea').clear().type('AB').wait(500)
        cy.contains(tc.options.charLimit.customMessage).should('be.visible')
        cy.get('textarea').clear().type('ABC').wait(500)
        cy.contains(tc.options.charLimit.customMessage).should('not.exist')

        // verify match pattern
        var badEmail = 'thisIsNotAValidEmailAtsomewhere.com'
        var goodEmail = 'thisIsAValidEmail@somewhere.com'

        // verify cannot save bad email
        cy.get('.mde-tabs>button').contains('Write').click()
        cy.get('textarea').clear().type(badEmail).wait(500)

        // try to save
        cy.get('[data-testid=ContentFormHeaderSaveButton]').click().wait(500)
        cy.contains('Some fields have invalid values, please correct them before saving.').
            should('be.visible')

        //verify can save good email
        cy.get('.mde-tabs>button').contains('Write').click()
        cy.get('textarea').clear().type(goodEmail).wait(500)
        cy.saveAndPublishContent()
        cy.contains('Some fields have invalid values, please correct them before saving.').
            should('not.exist')

        // verify no unique restriction - create duplicate entries
        cy.beginAddContent(1)
        cy.get('.mde-tabs>button').contains('Write').click()
        cy.get('textarea').clear().type(goodEmail).wait(500)
        cy.saveAndPublishContent()

        // verify 2 entries
        cy.get(`a[data-test="Content ${Cypress.config('hygraphModelName')}"]`).click()

        cy.get('[data-test=ContentViewContainer]').within(() => {
            cy.get('span:contains(Published)').should('have.length', 2)
        })


        //verify localised - add another entry
        cy.beginAddContent(1)
        cy.get('[data-testid="AddLocale-es"]').click()
        //verify there are 2 fields available
        cy.get('[data-testid=text-area]').should('have.length', 2);
        cy.get('span').contains('en').should('be.visible')
        cy.get('span').contains('es').should('be.visible')

        // add english content
        var enEmail = 'somebody@myhome.ie'
        var esEmail = 'alguien@micasa.es'
        cy.get('textarea').eq(0).clear().type(enEmail)
        cy.get('textarea').eq(1).clear().type(esEmail)

        // save
        cy.saveAndPublishContent()        


        var modelName = Cypress.config('hygraphModelName')
        var fieldName = lod.camelCase(tc.displayName)

        // var expectedRsBody =
        //     `{"data":{"${modelName}s":[{"${fieldName}":["${content}"]},` +
        //     `{"${fieldName}":["${content}"]}]}}`

        var expectedRsBody =
            `{"data":{"${modelName}s":[{"${fieldName}":"${goodEmail}"},` +
            `{"${fieldName}":"${goodEmail}"},` +
            `{"${fieldName}":"${enEmail}"}]}}`
            
            // {"data":{"demos":[{"tc03":"thisIsAValidEmail@somewhere.com"}, +
            // {"tc03":"thisIsAValidEmail@somewhere.com"},{"tc03":"somebody@myhome.ie"}]}}

        // verify api endpoint
        cy.verifyEndpoint(tc, expectedRsBody)
    })
})
