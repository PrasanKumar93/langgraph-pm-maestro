import { Connection } from "jsforce";
import "dotenv/config";

import { LoggerCls } from "./logger.js";

class SalesforceST {
  private static instance: SalesforceST;
  private conn: Connection;

  private constructor() {
    this.conn = new Connection({
      loginUrl: process.env.SF_LOGIN_URL || "https://login.salesforce.com",
    });
  }

  public static getInstance(): SalesforceST {
    if (!SalesforceST.instance) {
      SalesforceST.instance = new SalesforceST();
    }
    return SalesforceST.instance;
  }

  public async login(): Promise<void> {
    try {
      const username = process.env.SF_USERNAME || "";
      const password = process.env.SF_PASSWORD || "";
      const securityToken = process.env.SF_SECURITY_TOKEN || "";

      await this.conn.login(username, password + securityToken);
      LoggerCls.log("Logged into Salesforce successfully.");
    } catch (error) {
      LoggerCls.error("Salesforce Login Error:", error);
      throw error;
    }
  }

  public async runSearchQuery(
    query: string,
    params?: Record<string, any>
  ): Promise<any[]> {
    let retRecords: any[] = [];
    try {
      if (params) {
        for (let [key, value] of Object.entries(params)) {
          value = value.toLowerCase();
          //replace special chars with space
          value = value.replace(/[^a-zA-Z0-9\s]/g, " ");

          const regex = new RegExp(`${key}`, "g");
          query = query.replace(regex, value);
        }
      }
      query = query.trim();

      LoggerCls.log(query);

      if (query.startsWith("FIND")) {
        const searchResult = await this.conn.search(query);
        retRecords = searchResult.searchRecords;
      } else {
        const queryResult = await this.conn.query(query);
        retRecords = queryResult.records;
      }

      LoggerCls.log(`Found ${retRecords.length} records in salesforce`);
    } catch (error) {
      LoggerCls.error("Salesforce Query Error:", error);
      throw error;
    }
    return retRecords;
  }

  public async insertRecord(objectName: string, data: any): Promise<any> {
    try {
      const result = await this.conn.sobject(objectName).create(data);
      LoggerCls.log(`Salesforce data inserted successfully:`, result);
      return result;
    } catch (error) {
      LoggerCls.error("Salesforce Insert Error:", error);
      throw error;
    }
  }

  public async deleteRecord(
    objectName: string,
    recordId: string
  ): Promise<any> {
    try {
      const result = await this.conn.sobject(objectName).destroy(recordId);
      LoggerCls.log(`Salesforce record deleted`, result);
      return result;
    } catch (error) {
      LoggerCls.error("Salesforce Delete Error:", error);
      throw error;
    }
  }

  public async getAllRecords(objectName: string): Promise<any[]> {
    try {
      const query = `SELECT Id, Name FROM ${objectName}`;
      const result = await this.conn.query(query);
      LoggerCls.log(
        `Retrieved ${result.records.length} records from ${objectName}`
      );
      return result.records;
    } catch (error) {
      LoggerCls.error(`Error retrieving records from ${objectName}:`, error);
      throw error;
    }
  }
}

export { SalesforceST };
