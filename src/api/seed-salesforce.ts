import { SalesforceST } from "../utils/salesforce.js";
import { SALESFORCE_OBJECTS } from "../utils/constants.js";
import salesforceData from "../data/salesforce-data.js";
import { LoggerCls } from "../utils/logger.js";

const cleanupExistingRecords = async () => {
  try {
    const salesforceST = SalesforceST.getInstance();

    const records = await salesforceST.getAllRecords(
      SALESFORCE_OBJECTS.TechnicalRequest
    );

    if (records.length > 0) {
      for (const record of records) {
        await salesforceST.deleteRecord(
          SALESFORCE_OBJECTS.TechnicalRequest,
          record.Id
        );
      }
    }
  } catch (err) {
    LoggerCls.error("Error cleaning up existing records", err);
  }
};

const seedSalesforce = async () => {
  await cleanupExistingRecords();

  const salesforceST = SalesforceST.getInstance();
  try {
    await salesforceST.login();
    for (const data of salesforceData) {
      let record = {
        Name: "Request from " + data.customer__c,
        ...data,
      };
      await salesforceST.insertRecord(
        SALESFORCE_OBJECTS.TechnicalRequest,
        record
      );
    }
    return `Inserted ${salesforceData.length} records into Salesforce`;
  } catch (err) {
    throw err;
  }
};

export { seedSalesforce };
