import axios, { AxiosInstance } from "axios";
import { LoggerCls } from "./logger.js";

class JiraST {
  private static instance: JiraST;
  private client: AxiosInstance;

  private constructor() {
    const baseUrl = process.env.JIRA_BASE_URL || "";
    const email = process.env.JIRA_EMAIL || "";
    const token = process.env.JIRA_API_TOKEN || "";

    if (baseUrl && email && token) {
      this.client = axios.create({
        baseURL: `${baseUrl}/rest/api/2`,
        auth: {
          username: email,
          password: token,
        },
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
    } else {
      throw new Error(
        "JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN must be set"
      );
    }
  }

  public static getInstance(): JiraST {
    if (!JiraST.instance) {
      JiraST.instance = new JiraST();
    }
    return JiraST.instance;
  }

  public async getAllFields(): Promise<any[]> {
    const response = await this.client.get("/field");
    return response.data;
  }

  public async searchIssues(
    jqlQuery: string,
    params?: Record<string, any>,
    returnFields?: string[]
  ): Promise<any[]> {
    let issues: any[] = [];
    try {
      let fieldsStr =
        returnFields && returnFields.length > 0
          ? returnFields.join(", ")
          : "*all";

      //   const fields = await this.getAllFields();
      //   console.log("fields length", fields.length);

      if (params) {
        for (let [key, value] of Object.entries(params)) {
          value = value.toLowerCase();
          //replace special chars with space
          value = value.replace(/[^a-zA-Z0-9\s]/g, " ");

          const regex = new RegExp(`${key}`, "g");
          jqlQuery = jqlQuery.replace(regex, value);
        }
      }
      jqlQuery = jqlQuery.trim();

      LoggerCls.log(jqlQuery);

      const response = await this.client.get("/search", {
        params: {
          jql: jqlQuery,
          maxResults: 10,
          fields: fieldsStr, //comma separated fields
        },
      });
      issues = response.data.issues || [];
      LoggerCls.log(`Found ${issues.length} records in JIRA`);
    } catch (error) {
      const err = LoggerCls.getPureError(error);
      LoggerCls.error("Error searching JIRA issues:", err);
      throw error;
    }

    return issues;
  }

  public async createIssue(issueData: any, projectKey?: string): Promise<any> {
    let retData: any = null;
    try {
      const entry = {
        fields: {
          project: {
            key: projectKey || process.env.JIRA_SEED_PROJECT_KEY,
          },
          issuetype: {
            name: "Task",
          },
          ...issueData,
        },
      };
      const response = await this.client.post("/issue", entry);
      retData = response.data;
    } catch (error) {
      const err = LoggerCls.getPureError(error);
      LoggerCls.error("Error creating JIRA issue:", err);
      throw error;
    }
    return retData;
  }
}

export { JiraST };
