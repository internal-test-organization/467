const Organization = require('./githublib/Organization')
  , RepositoryActivity = require('./githublib/RepositoryActivity')
  , UserActivity = require('./UserActivity')
;


module.exports = class OrganizationUserActivity {

  constructor(octokit) {
    this._organization = new Organization(octokit);
    this._repositoryActivity = new RepositoryActivity(octokit);
    
  }

  get organizationClient() {
    return this._organization;
  }

  get repositoryClient() {
    return this._repositoryActivity;
  }

  

  async getUserActivity(org) {
    const self = this;

    const repositories = await self.organizationClient.getRepositories(org)
      , orgUsers = await self.organizationClient.findUsers(org)
    ;

    const activityResults = {};
    for(let idx = 0; idx< repositories.length; idx++) {
      const repoActivity = await self.repositoryClient.getActivity(repositories[idx]);
      Object.assign(activityResults, repoActivity);
    }

    const userActivity = generateUserActivityData(activityResults);

    orgUsers.forEach(user => {
      if (userActivity[user.login]) {
        if (user.email && user.email.length > 0) {
          userActivity[user.login] = user.email;
        }
      } else {
        const userData = new UserActivity(user.login, user.orgs);
        userData.email = user.email;

        userActivity[user.login] = userData
      }
    });
    

    // An array of user activity objects
    return Object.values(userActivity);
  }

  async getOrgsValid (org) {
    const self = this;
    const orgsValid = await self.organizationClient.getOrgs(org);

    return orgsValid;
    
  }
  
  async getTeamActivity (organization, teamsname, jsonlist) {
    const self = this;
    let teamlist = teamsname.split(',');
    let TeamLists = [];
    for(const teamname of teamlist){
      const Teamvalid = await self.getTeamconversion(teamname);
      const TeamList = await self.organizationClient.findTeam(organization, Teamvalid);
      TeamLists = [...TeamLists, ...TeamList];
    }
    console.log(TeamLists)
    let resulttes = [];
    if(TeamLists.length > 0){
       resulttes = jsonlist.filter((res1) => {
        return TeamLists.some((res2)=>{
          // console.log(res2)
          
          if(res1.login === res2.login && res1.orgs === res2.orgs){
            console.log(`${res1.login} === ${res2.login} && ${res1.orgs} === ${res2.orgs}`)
            Object.assign(res1, {teamStatus:1});
          }
        })
      })
    }
    console.log(jsonlist)
    console.log("****************json***")
    

    return jsonlist;
    
  }

  async getTeamconversion(team){
    const slug2 = team
                    .replace(/[^a-z0-9]+/gi, '-')
                    .replace(/^-+/, '')
                    .replace(/^-+$/, '');
    const finslugid = slug2.toLowerCase();
    return finslugid;
  }

}

function generateUserActivityData(data) {
  if (!data) {
    return null
  }

  // Use an object to ensure unique user to activity based on user key
  const results = {};

  function process(repo, values, activityType) {
    if (values) {
      Object.keys(values).forEach(login => {
        if (!results[login]) {
          results[login] = new UserActivity(login);
        }

        results[login].increment(activityType, repo, values[login]);
      })
    }
  }

  Object.keys(data).forEach(repo => {
    const activity = data[repo];
    Object.keys(activity).forEach(activityType => {
      process(repo, activity[activityType], activityType)
    });
  });

  return results;
}