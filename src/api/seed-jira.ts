import { JiraST } from "../utils/jira.js";
import JIRA_DATA from "../data/jira-data.js";

const seedJira = async () => {
  const jiraST = JiraST.getInstance();
  try {
    for (const data of JIRA_DATA) {
      await jiraST.createIssue(data);
    }
    return `Inserted ${JIRA_DATA.length} records into Jira`;
  } catch (err) {
    throw err;
  }
};

export { seedJira };
