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
    , fromDate = core.getInput('fromdate')
    , toDate = core.getInput('todate')
    , runmethod = core.getInput('runmethod')
  ;


  if ( runmethod == "adhoc"){
    //******ADHOC METHOD */  

    await io.mkdirP(outputDir)

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
        const userActivity = await orgActivity.getUserActivity(org);
        const jsonresp = userActivity.map(activity => activity.jsonPayload);
        const jsonlist = jsonresp.filter(user => { return user.isActive === false });
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
    sd = new Date(fromDate).getTime(),
    console.log(ed)
    console.log(sd)
    filteredrepos = acrepolist.filter(d => {var time = new Date(d.created_date).getTime();
                             return (sd <= time && time <= ed);
                            });
    console.log(filteredrepos);
    // //*****workflowrun */
    ed = new Date(toDate).getTime(),
    sd = new Date(fromDate).getTime(),
    filteredwfruns = acworkflowrun.filter(d => {var time = new Date(d.created_date).getTime();
                             return (sd <= time && time <= ed);
                            });
    console.log(filteredwfruns);
    // //***********workflows */
    ed = new Date(toDate).getTime(),
    sd = new Date(fromDate).getTime(),
    filteredworkflows = acworkflow.filter(d => {var time = new Date(d.created_date).getTime();
                             return (sd <= time && time <= ed);
                            });
    console.log(filteredworkflows);

    console.log(filteredrepos,"filtered repos with date month and year")
    console.log(filteredwfruns,"filtered workflowruns with date month and year")
    console.log(filteredworkflows,"filtered workflows with date month and year")

    ///*******filter using dates */

    let activeuser = [];
    let uniqueUsers = [...new Set(userlist)];
    for(user of uniqueUsers){
        userevents = await orgActivity1.getUserEvents(user);
        console.log(userevents)
        if(userevents > 0){
            activeuser.push(user)
        }
    }
    let finaloutput = [];
    finaloutput.push({"total_orgs": orgs.length,"total_users":uniqueUsers.length,"active_users": activeuser.length,"total_repos":filteredrepos.length,"total_workflow_runs":filteredwfruns.length ,"total_workflows":filteredworkflows.length})
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
    
    
    for(org of orgs){
        let lRepoList = [];
        console.log(org)
        userlists = await orgActivity1.getOrgMembers(org); //user list
        console.log(userlists)
        userlists.map((  item) => {
            userlist.push(item.login)
        })
        
    
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
    let activeuser = [];
    let uniqueUsers = [...new Set(userlist)];
        for(user of uniqueUsers){
            userevents = await orgActivity1.getUserEvents(user);
            console.log(userevents)
            if(userevents > 0){
                activeuser.push(user)
            }
        }
    let finaloutput = [];
    finaloutput.push({"total_orgs": orgs.length,"total_users":uniqueUsers.length,"active_users": activeuser.length,"total_repos":repolist.length,"total_workflow_runs":totalworkflowrunscount ,"total_workflows":totalworkflowscount})
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