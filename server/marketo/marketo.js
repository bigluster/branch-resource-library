const config = require('../../config')
const Marketo = require('node-marketo-rest')
const parse = require("parse-name").parse

module.exports = {
  syncUser: (user) => {
    return new Promise((resolve, reject) => {
      try {
        if(config.marketo == null) {
          resolve()
        } else {
          const marketo = new Marketo(config.marketo)
          let nameInfo = parse(user.fullname)
          const testLead = {
            firstName: nameInfo.first,
            lastName: nameInfo.last,
            company: user.company,
            email: user.email,
            country: user.country,
            leadSource: 'WEB - Web Activity',
            Lead_Source_Detail_Mirror__c: 'WEB - Branch',
            Web_Activity_Source__c: 'WA',
            Unsubscribed: user.unsubscribed
          }
          marketo.lead.createOrUpdate([testLead])
              .then(() => { resolve() })
              .catch((err) => {
                console.log("ISSUE WITH MARKETO", err)
                resolve()
              })
        }
      } catch(e) {
        console.log("ISSUE WITH MARKETO", e)
        resolve()
      }
    })
  },
  accessedSite: (user, incentive) => {
    return new Promise((resolve, reject) => {
      try {
        if(config.marketo == null) {
          reject()
        } else {
          const marketo = new Marketo(config.marketo)
          const testLead = {
            email: user.email,
            Incentive__c: incentive
          }
          marketo.lead.createOrUpdate([testLead])
              .then(() => { resolve() })
              .catch((err) => {
                console.log("ISSUE WITH MARKETO - ACCESSEDSITE", err)
                reject()
              })
        }
      } catch(e) {
        console.log("ISSUE WITH MARKETO - ACCESSEDSITE", e)
        reject()
      }
    })
  }
}