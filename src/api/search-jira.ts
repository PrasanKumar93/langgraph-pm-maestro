import { searchJira } from "../agent/tool-system-jira.js";

const testSearchJira = async (params: any) => {
  if (!(params && Object.keys(params).length > 0)) {
    params = null;
  }

  const sampleQuery =
    "project = 'RED' AND type = Initiative AND textfields ~ 'SEARCH_FIELD' ORDER BY created DESC";

  const productFeature = params?.SEARCH_FIELD || "beagle"; //"grafana", "gears", "beagle";

  const records = await searchJira(productFeature, sampleQuery);

  return records;
};

export { testSearchJira };
