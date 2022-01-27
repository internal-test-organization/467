const fs = require('fs')
  , path = require('path')
  , core = require('@actions/core')
  , io = require('@actions/io')
  , json2csv = require('json2csv')
  , glob = require('@actions/io')
  , github = require('@actions/github')
  , dateUtil = require('./src/dateUtil')
  , githubClient = require('./src/githublib/githubClient')
  , OrganizationActivity = require('./src/OrgsUserActivity')
  , Organization = require('./src/githublib/Organization')
;

async function run() {
  const token = core.getInput('token')
    // , since = core.getInput('since')
    // , days = core.getInput('activity_days')
    , outputDir = core.getInput('outputDir')
    //, organizationinp = core.getInput('organization')
    , maxRetries = core.getInput('octokit_max_retries')
  ;
// console.log(organizationinp)
// let regex = /^[\w\.\_\-]+((,|-)[\w\.\_\-]+)*[\w\.\_\-]+$/g;
// let validate_org = regex.test(organizationinp);
// if((!validate_org)) {
//   throw new Error('Provide a valid organization - It accept only comma separated value');
// }

// let sinceregex = /^(20)\d\d-(0[1-9]|1[012])-([012]\d|3[01])T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/ 
// ;

await io.mkdirP(outputDir)

const octokit = githubClient.create(token, maxRetries)
  , orgActivity = new OrganizationActivity(octokit)
  , orgActivity1 = new Organization(octokit)
;

// if((!Number(days)) || (days < 0)) {
//     throw new Error('Provide a valid activity_days - It accept only Positive Number');
//   }

//***since and fromdate and todate */
// let fromDate;
//   if (since) {
//     let validate_since = sinceregex.test(since);
//     if((!validate_since)) {
//       throw new Error('Provide a valid since - It accept only following format - YYYY-MM-DDTHH:mm:ss');
//     }
//     console.log(`Since Date has been specified, using that instead of active_days`)
//     fromDate = dateUtil.getFromDate(since);
    
//   } else {
//     fromDate = dateUtil.convertDaysToDate(days);
    
//   }



////find the organization list


let orgs = [];
const orglists = await orgActivity1.getUserOrgs()
orglists.map((item) => {
    orgs.push(item.name)
    console.log(orgs,"list of organization")
})

let userlist = [];
let repolist = [];
let workflowrun  = [];
let totalworkflowscount = 0 ;
let totalworkflowrunscount = 0;
let activeuser = [];
for(org of orgs){
    let lRepoList = [];
    console.log(org)
    userlists = await orgActivity1.getOrgMembers(org); //user list
    console.log(userlists)
    userlists.map((  item) => {
        userlist.push(item.login)
    })
    
    for(user of userlist){
        userevents = await orgActivity1.getUserEvents(user);
        console.log(userevents)
        if(userevents > 0){
            activeuser.push(user)
        }
    }

    repolists = await orgActivity1.getOrgRepo(org); //repo list
    console.log(repolists)
     repolists.map((item) => {
         repolist.push(item.name)
         lRepoList.push(item.name)
     })
    // const userActivity = await orgActivity.getUserActivity(org, fromDate);
    // const jsonresp = userActivity.map(activity => activity.jsonPayload);
    // const jsonlist = jsonresp.filter(user => { return user.isActive === false });
    // console.log(jsonlist)

    for(repos of lRepoList ){
        console.log(repos)
        workflowruns = await orgActivity1.getWorkFlowRuns(org,repos);
        console.log(workflowruns,"workflow runs total count")
        totalworkflowrunscount += workflowruns;

        workflows = await orgActivity1.getWorkflows(org,repos);
        console.log(workflows,"workflow  total count")
        totalworkflowscount += workflows;

    
    }
    // console.log(totalworkflowscount)
}

// console.log(userlist,"final user list")
// console.log(repolist,"final repo list")
// console.log(totalworkflowscount,"final workflow count array")
let uniqueRepos = [...new Set(repolist)];
let uniqueUsers = [...new Set(userlist)];
console.log(uniqueUsers);
console.log(uniqueRepos);

let finaloutput = [];
// /////output//////
finaloutput.push({"total_orgs": orgs.length,"total_users":uniqueUsers.length,"active_users": active_user.length,"total_repos":repolists.length,"total_workflow_runs":totalworkflowscount ,"total_workflows":totalworkflowscount})
finaloutputresult = JSON.stringify(finaloutput)
console.log(orgs.length,"Organizations");
console.log(uniqueUsers.length,"user count");
console.log(uniqueRepos.length,"repo count");
console.log(totalworkflowrunscount,"count");
console.log(totalworkflowscount,"final workflow count array");

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



}

async function execute() {
    try {
      await run();
    } catch (err) {
      core.setFailed(err.message);
    }
  }
  execute();
