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
    , outputDir = core.getInput('outputDir')
    , maxRetries = core.getInput('octokit_max_retries')
    , fDate = core.getInput('fromdate')
    , toDate = core.getInput('todate')
    , runmethod = core.getInput('runmethod')
    , since = core.getInput('since')
    , days = core.getInput('activity_days')
  ;


  if ( runmethod == "adhoc"){
    //******ADHOC METHOD */  

    await io.mkdirP(outputDir)
    
      if((!Number(days)) || (days < 0)) {
        throw new Error('Provide a valid activity_days - It accept only Positive Number');
      }
    
      
      
    
      let sinceregex = /^(20)\d\d-(0[1-9]|1[012])-([012]\d|3[01])T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/ 
    ;
    
      let fromDate;
      if (since) {
        let validate_since = sinceregex.test(since);
        if((!validate_since)) {
          throw new Error('Provide a valid since - It accept only following format - YYYY-MM-DDTHH:mm:ss');
        }
        console.log(`Since Date has been specified, using that instead of active_days`)
        fromDate = dateUtil.getFromDate(since);
      } else {
        fromDate = dateUtil.convertDaysToDate(days);
      }

    const octokit = githubClient.create(token, maxRetries)
      , orgActivity = new OrganizationActivity(octokit)
      , orgActivity1 = new Organization(octokit)
    ;
    let orgs = [];
    const orglists = await orgActivity1.getUserOrgs()
    orglists.map((item) => {
        orgs.push(item.name)
        console.log(orgs,"list of organization")
    })
    let userlist = [];
    let acrepolist = [];
    let acworkflowrun = [];
    let acworkflow = [];
    let jsonfinallist = [];
    for(org of orgs){
        let aclRepoList = [];
        console.log(org)
        userlists = await orgActivity1.getOrgMembers(org); //user list
        console.log(userlists)
        userlists.map((  item) => {
            userlist.push(item.login)
        })
        const userActivity = await orgActivity.getUserActivity(org,fromDate);
        const jsonresp = userActivity.map(activity => activity.jsonPayload);
        const jsonlist = jsonresp.filter(user => { return user.isActive === true });
        jsonfinallist = [...jsonfinallist, ...jsonlist];
        console.log(jsonfinallist)
        acrepolists = await orgActivity1.getOrgRepo(org); //repo list
        console.log(acrepolists)
         acrepolists.map((item) => {
             acrepolist.push(item)
             aclRepoList.push(item.name)
         })
         for(repos of aclRepoList ){
            console.log(repos)
            acworkflowruns = await orgActivity1.getActionWorkFlowRuns(org,repos);
            console.log(acworkflowruns,"workflow runs total count")
            acworkflowruns.map((item) =>{
                acworkflowrun.push(item)
            })
    
            acworkflows = await orgActivity1.getActionWorkflows(org,repos);
            console.log(acworkflows,"workflow  total count")
            acworkflows.map((item) =>{
                acworkflow.push(item)
            })
            
            

        
        }
        
        
    } 
    console.log(acworkflowrun,"adhoc workflow runs")
    console.log(acworkflow,"adhoc workflows")
    console.log(acrepolist,"adhoc repolist")
    
     
    ///*******filter using dates */
    
    ///********acrepolist */
    ed = new Date(toDate).getTime(),
    sd = new Date(fDate).getTime(),
    console.log(ed)
    console.log(sd)
    filteredrepos = acrepolist.filter(d => {var time = new Date(d.created_date).getTime();
                             return (sd <= time && time <= ed);
                            });
    console.log(filteredrepos);
    // //*****workflowrun */
    ed = new Date(toDate).getTime(),
    sd = new Date(fDate).getTime(),
    filteredwfruns = acworkflowrun.filter(d => {var time = new Date(d.created_date).getTime();
                             return (sd <= time && time <= ed);
                            });
    console.log(filteredwfruns);
    // //***********workflows */
    ed = new Date(toDate).getTime(),
    sd = new Date(fDate).getTime(),
    filteredworkflows = acworkflow.filter(d => {var time = new Date(d.created_date).getTime();
                             return (sd <= time && time <= ed);
                            });
    console.log(filteredworkflows);

    console.log(filteredrepos,"filtered repos with date month and year")
    console.log(filteredwfruns,"filtered workflowruns with date month and year")
    console.log(filteredworkflows,"filtered workflows with date month and year")

    ///*******filter using dates */

    
    let uniqueUsers = [...new Set(userlist)];
    let uniqueactiveuserlist = [...new Set(jsonlist)]
    let finaloutput = [];
    finaloutput.push({"total_orgs": orgs.length,"total_users":uniqueUsers.length,"active_users": uniqueactiveuserlist.length,"total_repos":filteredrepos.length,"total_workflow_runs":filteredwfruns.length ,"total_workflows":filteredworkflows.length})
    finaloutputresult = JSON.stringify(finaloutput)
    console.log(finaloutput)
    
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
  }else{
      //*****SCHEDULER METHOD */
      await io.mkdirP(outputDir)
      console.log(days)
      if((!Number(days)) || (days < 0)) {
        throw new Error('Provide a valid activity_days - It accept only Positive Number');
      }
    
      
    
      let sinceregex = /^(20)\d\d-(0[1-9]|1[012])-([012]\d|3[01])T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/ 
    ;
    
      let fromDate;
      if (since) {
        let validate_since = sinceregex.test(since);
        if((!validate_since)) {
          throw new Error('Provide a valid since - It accept only following format - YYYY-MM-DDTHH:mm:ss');
        }
        console.log(`Since Date has been specified, using that instead of active_days`)
        fromDate = dateUtil.getFromDate(since);
      } else {
        fromDate = dateUtil.convertDaysToDate(days);
      }

    const octokit = githubClient.create(token, maxRetries)
      , orgActivity = new OrganizationActivity(octokit)
      , orgActivity1 = new Organization(octokit)
    ;
    let orgs = [];
    const orglists = await orgActivity1.getUserOrgs()
    orglists.map((item) => {
        orgs.push(item.name)
        console.log(orgs,"list of organization")
    
    
    })
    
    let userlist = [];
    let repolist = [];
    let totalworkflowscount = 0 ;
    let totalworkflowrunscount = 0;
    let jsonfinallist = [];
    
    for(org of orgs){
        let lRepoList = [];
        console.log(org)
        userlists = await orgActivity1.getOrgMembers(org); //user list
        console.log(userlists)
        userlists.map((  item) => {
            userlist.push(item.login)
        })
        const userActivity = await orgActivity.getUserActivity(org,fromDate);
        const jsonresp = userActivity.map(activity => activity.jsonPayload);
        const jsonlist = jsonresp.filter(user => { return user.isActive === true });
        jsonfinallist = [...jsonfinallist, ...jsonlist];
        console.log(jsonfinallist)
    
        repolists = await orgActivity1.getOrgRepo(org); //repo list
        console.log(repolists)
         repolists.map((item) => {
             repolist.push(item.name)
             lRepoList.push(item.name)
         })
        
    
        for(repos of lRepoList ){
            console.log(repos)
            workflowruns = await orgActivity1.getWorkFlowRuns(org,repos);
            console.log(workflowruns,"workflow runs total count")
            totalworkflowrunscount += workflowruns;
    
            workflows = await orgActivity1.getWorkflows(org,repos);
            console.log(workflows,"workflow  total count")
            totalworkflowscount += workflows;
    
        
        }
    }
    
    
    let uniqueUsers = [...new Set(userlist)];
    let uniqueactiveuserlist = [...new Set(jsonlist)]
    let finaloutput = [];
    finaloutput.push({"total_orgs": orgs.length,"total_users":uniqueUsers.length,"active_users": uniqueactiveuserlist.length,"total_repos":repolist.length,"total_workflow_runs":totalworkflowrunscount ,"total_workflows":totalworkflowscount})
    finaloutputresult = JSON.stringify(finaloutput)
    console.log(finaloutput)
    
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


}

async function execute() {
    try {
      await run();
    } catch (err) {
      core.setFailed(err.message);
    }
  }
  execute();