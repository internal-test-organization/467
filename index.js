const fs = require('fs')
  , path = require('path')
  , core = require('@actions/core')
  , io = require('@actions/io')
  , json2csv = require('json2csv')
  , glob = require('@actions/io')
  , github = require('@actions/github')
  , githubClient = require('./src/githublib/githubClient')
  , OrganizationActivity = require('./src/OrgsUserActivity')
  , Organization = require('./src/githublib/Organization')
;

async function run() {
  const token = core.getInput('token')
    , outputDir = core.getInput('outputDir')
    , organizationinp = core.getInput('organization')
    , maxRetries = core.getInput('octokit_max_retries')
  ;
console.log(organizationinp)
let regex = /^[\w\.\_\-]+((,|-)[\w\.\_\-]+)*[\w\.\_\-]+$/g;
let validate_org = regex.test(organizationinp);
if((!validate_org)) {
  throw new Error('Provide a valid organization - It accept only comma separated value');
}

let sinceregex = /^(20)\d\d-(0[1-9]|1[012])-([012]\d|3[01])T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/ 
;

await io.mkdirP(outputDir)

const octokit = githubClient.create(token, maxRetries)
  , orgActivity = new OrganizationActivity(octokit)
  , orgActivity1 = new Organization(octokit)
;



//***since and fromdate and todate */
let fromDate;
  if (since) {
    let validate_since = sinceregex.test(since);
    if((!validate_since)) {
      throw new Error('Provide a valid since - It accept only following format - YYYY-MM-DDTHH:mm:ss');
    }
    console.log(`Since Date has been specified, using that instead of active_days`)
    fromDate = dateUtil.getFromDate(since);
    todate = dateUtil.getFromDate(since)
  } else {
    fromDate = dateUtil.convertDaysToDate(days);
    todate = dateUtil.getFromDate(days)
  }



////find the organization list

let orgs = [];

const orglists = await orgActivity1.getUserOrgs()
orglists.map((item) => {
    orgs.push(item.name)
    console.log(orgs,"list of organization")
})

let userlist = [];
for (org of orgs){
    userlists = await orgActivity1.getOrgMembers(org);
    console.log(userlists)
    userlists.map((item) => {
        userlist.push(item.name)
        console.log(userlist,"user list")
    })
}


saveIntermediateData(outputDir, finaloutput);


function saveIntermediateData(directory, data) {
  try {
    const file = path.join(directory, 'org-overriden-secret.json');
    fs.writeFileSync(file, JSON.stringify(data));
    core.setOutput('report_json', file);
  } catch (err) {
    console.error(`Failed to save intermediate data: ${err}`);
  }
}

core.setOutput('repos',orgrepos);
core.setOutput('secret',secrets);
core.setOutput('report',finaloutput);
}

async function execute() {
    try {
      await run();
    } catch (err) {
      core.setFailed(err.message);
    }
  }
  execute();