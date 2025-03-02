import { SalesforceST } from "../utils/salesforce.js";

const testSearchSalesforce = async (params: any) => {
  if (!(params && Object.keys(params).length > 0)) {
    params = null;
  }
  const salesforceST = SalesforceST.getInstance();

  const sampleQuery =
    "FIND {SEARCH_FIELD} IN ALL FIELDS RETURNING TechnicalRequest__c(Id, Name, painPoint__c, featureRequestDetails__c, potentialDealSize__c, industry__c, priority__c, currentWorkaround__c, businessImpact__c)";
  const sampleParams = {
    SEARCH_FIELD: "Real-time Analytics",
  };

  const query = process.env.SF_SEARCH_FEATURE_QUERY || sampleQuery;
  params = params || sampleParams;

  const records = await salesforceST.runSearchQuery(query, params);

  return records;
};

export { testSearchSalesforce };
