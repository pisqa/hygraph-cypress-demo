//
// Content creation helper functions
//

const lod = require('lodash')
const dod = require('deep-object-diff')

//
// Start the Add Content workflow 
// Open the content editor and verify the number of fields
//
Cypress.Commands.add('beginAddContent', (fieldCount) => {
    cy.get('div[data-testid=Content]').click()
    cy.get(`a[data-test="Content ${Cypress.config('hygraphModelName')}"]`).click();

    //open editor
    cy.get('a[data-testid=ContentViewCreateItemButton]').click()

    //verify number of fields
    cy.get('button[data-testid=FieldToggleBtn]').should('have.length', fieldCount);

})


//
// Verify basic field data:
// Name, description, flags
// 
Cypress.Commands.add('verifyContentFieldBasics', (index, fieldData) => {

    cy.get('button[data-testid=FieldToggleBtn]').parent().parent().eq(index).within(() => {

        //verify displayName
        cy.get('label').contains(fieldData.displayName).should('be.visible')

        //verify description
        cy.get('p').contains(fieldData.description).should('be.visible')

        //verify flags
        //required
        if (fieldData.options.required) {
            cy.get('span').contains('Required').should('be.visible')
        } else {
            cy.get('span').contains('Required').should('not.exist');
        }

        //unique
        if (fieldData.options.setUnique) {
            cy.get('span').contains('Unique').should('be.visible')
        } else {
            cy.get('span').contains('Unique').should('not.exist');
        }

        //localised
        if (fieldData.options.localize) {
            cy.get('span').contains('Localized').should('be.visible')
        } else {
            cy.get('span').contains('Localized').should('not.exist');
        }

        //multiple
        if (fieldData.options.allowMultiple.active) {
            cy.get('button[data-testid=AddToListButton]').should('be.visible')
        } else {
            cy.get('button[data-testid=AddToListButton]').should('not.exist')
        }
    })
})

//
// Verify initial value:
// If no initial value in schema, verify no value
// 
Cypress.Commands.add('verifyInitialValue', (index, tc) => {

    var elType, invoker
    var initialValue = tc.options.initialValue

    if (tc.fieldType == 'Single line text') {
        elType = 'input'
        invoker = 'val'
    } else if (tc.fieldType == 'Multi line text' || tc.fieldType == 'Markdown') {
        elType = 'textarea'
        invoker = 'text'
    }

    cy.get('button[data-testid=FieldToggleBtn]').parent().parent().eq(index).within(() => {
        if (initialValue.initial) {
            cy.get(elType).invoke(invoker).should('eq', initialValue.value)
        } else {
            cy.get(elType).invoke(invoker).should('eq', '')
        }
    })
})

//
// Verify required restriction
// If field is required, verify cannot be saved empty
// If not required, verify can be saved empty
//
Cypress.Commands.add('verifyRequired', (index, tc) => {

    var elType, invoker

    if (tc.fieldType == 'Single line text') {
        elType = 'input'
    } else if (tc.fieldType == 'Multi line text' || tc.fieldType == 'Markdown') {
        elType = 'textarea'
    }

    // make sure field is empty
    cy.get('button[data-testid=FieldToggleBtn]').parent().parent().eq(index).within(() => {
        cy.get(elType).clear().wait(500)
    })

    //try saving
    cy.get('[data-testid=ContentFormHeaderSaveButton]').click().wait(500)
    if (tc.options.required) {
        cy.contains('Some fields have invalid values, please correct them before saving.').
            should('be.visible')
    } else {
        cy.contains('Some fields have invalid values, please correct them before saving.').
            should('not.exist')
        cy.checkToast('Entry created')
    }
})



//
// Save and publish content
// Verify STAGES displays published
//
Cypress.Commands.add('saveAndPublishContent', () => {
    cy.get('button[data-testid=ContentFormHeaderPublishButton]').click()
    cy.get('[data-testid=ContentPublishDialog] #publishDialogHeader').
        should('contain', `ublish this ${Cypress.config('hygraphModelName')}`)

    cy.get('[data-testid=ContentPublishDialog] button[data-testid=ContentPublishDialogButton]').click().wait(1000)

    //verify published
    cy.get('[data-stageid=PUBLISHED]').invoke('text').should('contain', 'Published')
    cy.wait(5000)

})

//
// Make a query to the content api endpoint
// and verify the response
//
Cypress.Commands.add('verifyEndpoint', (tc, expectedRs) => {

    var url = Cypress.config('hygraphContentApiEndpoint')
    var modelName = Cypress.config('hygraphModelName')
    var fieldName = lod.camelCase(tc.displayName)

    var queryStr = `
    {
        ${modelName}s {
            ${fieldName}
        }
    }`

    cy.request({
        method: 'POST',
        url: url,
        body: {
            query: queryStr
        }
    }).then(
        (response) => {
            var stat = response.status;
            expect(stat).to.eq(200)
            var rsBodyStr = JSON.stringify(response.body)

            cy.log('ACTUAL')
            cy.log(rsBodyStr)

            cy.log('EXP')
            cy.log(expectedRs)
            expect(rsBodyStr).to.eq(expectedRs)
        })
})
