module.exports = class Organization {

    constructor(octokit) {
      if (!octokit) {
        throw new Error('An octokit client must be provided');
      }
      this._octokit = octokit;
    }
  
    getOrgRepositories(org) {
      return this.octokit.paginate("GET /orgs/:org/repos", {org: org, per_page: 100})
        .then(repos => {
          console.log(`Processing ${repos.length} orgrepositories`);
          return repos.map(repo => { return {
            name: repo.name,
          }});
        })
    }
    
    getUserOrgs() {
      return this.octokit.paginate("GET /user/orgs")
      .then(userorgs => {
        console.log(`Processing ${userorgs.length} orglists`);
        return userorgs.map(userorg => { return {
          name: userorg.login,
        }});
      })
    }
   
//******** Action secrets */
    getOverridenSecretsrepos(org,secret) {
      return this.octokit.paginate('GET /orgs/{org}/actions/secrets/{secret_name}/repositories', {org: org, secret_name: secret, per_page: 100})
      .then(repos => {
        console.log(`Processing ${repos.length} repos`);
        return repos.map(repo => { return {
          name: repo.name,
        }});
      })
    }
  
    getOrgMembers(org) {
      return this.octokit.paginate("GET /orgs/:org/members", {org: org, per_page: 100})
        .then(members => {
          console.log(`Processing ${members.length} members`);
          return members.map(member => {
            return {
              login: member.login,
            };
          });
        });
    }

    getOrgRepoSecret(org,orepo) {
      return this.octokit.paginate("GET /repos/{owner}/{repo}/actions/secrets", {owner: org ,repo: orepo ,per_page: 100 })
      .then(reposecrets => {
        console.log(`Processing ${reposecrets.length} repossecrets`);
        return reposecrets.map(reposecret => {
          return {
            name: reposecret.name,
          };
        });
      });
    }

    getRepoContributor(org,repo) {
      return this.octokit.paginate('GET /repos/{owner}/{repo}/contributors', { owner: org ,repo: repo ,per_page: 100})
      .then(repocontributors => {
        console.log(`Processing ${repocontributors.length} repos contributores`);
        return repocontributors.map(repocontributor => {
          return {
            name: repocontributor.login,
          };
        });
      });
    }

    getOrgRepo(org) {
      return this.octokit.paginate('GET /orgs/{org}/repos', {org: org, per_page: 100})
      .then(orgsecrepos => {
        console.log(`Processing ${orgsecrepos.length} repos contributores`);
        return orgsecrepos.map(orgsecrepo => {
          return {
            name: orgsecrepo.name,
            created_date : orgsecrepo.created_at
          };
        });
      });
    }
    getWorkflows(org,reponame){
      return this.octokit.paginate('GET /repos/{owner}/{repo}/actions/workflows', {owner: org,repo: reponame,per_page: 100})
      .then(workflows => {
        console.log(`Processing ${workflows.length} workflow runs`);
        //return workflows.length
        return workflows.map(workflow => {
          return {
            name: workflow.id,
            created_date : workflow.created_at
          };
        });
      });
    }
    getWorkFlowRuns(org, reponame) {
      return this.octokit.paginate('GET /repos/{owner}/{repo}/actions/runs', {owner: org,repo: reponame,per_page: 100})
      .then(workflowruns => {
        console.log(`Processing ${workflowruns.length} workflow runs`);
        //return workflowruns.length
        return workflowruns.map(workflowrun => {
          return {
            name: workflowrun.id,
            created_date : workflowrun.created_at
          };
        });
      });
    }
    getOrgs(org) {
      return this.octokit.paginate("GET /orgs/:org",
        {
          org: org
        }
      ).then(orgs => {
          console.log(`Searching ${org} organization`);
          const data =  {
            name: org,
            status: 'success'
          }
          return data;
        })
        .catch(err => {
          console.log(`Invalid name of Organization ===>> ${org} `)
          if (err.status === 404) {
              return {
                name: org,
                status: 'error'
              }
          } else {
            console.error(err)
            throw err;
          }
        })
    }
  
    findUsers(org) {
      return this.octokit.paginate("GET /orgs/:org/members", {org: org, per_page: 100})
        .then(members => {
          return members.map(member => {
            return {
              login: member.login,
              email: member.email || '',
              orgs: org
            };
          });
        });
    }
  
    get octokit() {
      return this._octokit;
    }
  }
