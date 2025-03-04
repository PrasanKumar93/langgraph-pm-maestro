import { searchJira } from "../agent/tool-system-jira.js";

const testSearchJira = async (params: any) => {
  if (!(params && Object.keys(params).length > 0)) {
    params = null;
  }

  /*
  .env variable

  JIRA_JQL_QUERY="project = 'CPG' AND textfields ~ 'SEARCH_FIELD' ORDER BY created DESC"
  */

  const productFeature = params?.SEARCH_FIELD || "beagle"; //"grafana", "gears", "beagle";

  const records = await searchJira(productFeature);

  return records;
};

export { testSearchJira };
