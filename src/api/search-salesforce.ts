import { searchSalesforce } from "../agent/tool-system-sales-force.js";

const testSearchSalesforce = async (params: any) => {
  if (!(params && Object.keys(params).length > 0)) {
    params = null;
  }

  /*
  .env variable

  SF_SEARCH_FEATURE_QUERY="FIND {SEARCH_FIELD} IN ALL FIELDS RETURNING TechnicalRequest__c(Id, Name, painPoint__c, featureRequestDetails__c, potentialDealSize__c, industry__c, priority__c, currentWorkaround__c, businessImpact__c)"
  */

  const productFeature = params?.SEARCH_FIELD || "Real-time Analytics";

  const records = await searchSalesforce(productFeature);

  return records;
};

export { testSearchSalesforce };
