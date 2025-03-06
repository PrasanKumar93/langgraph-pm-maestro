import type { OverallStateType } from "../state.js";

import { SystemMessage } from "@langchain/core/messages";

import { convertMarkdownToPdf } from "../../utils/misc.js";
import { STEP_EMOJIS } from "../../utils/constants.js";
import { checkErrorToStopWorkflow } from "../error.js";

const style = `
       @page {
          margin: 1cm;
        }
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          max-width: 900px;
          margin: 0;
          padding: 20px;
          color: #333;
          font-size: 12pt; 
        }
        h1, h2, h3 {
          color: #2c3e50;
          margin-top: 16px;
          margin-bottom: 8px;
        }
        h1 { font-size: 1.5em; border-bottom: 1px solid #eaecef;text-align: center; }
        h2 { font-size: 1.2em;}
        h1, h2 {
          page-break-before: auto; 
        }
        h3 { 
            font-size: 1.1em;
            page-break-after: avoid; 
          }
        h3 ~ * {
          page-break-inside: avoid; 
          break-inside: avoid; 
        }
        p { 
            margin-bottom: 16px; 
            font-size: 1em;
        }
        code {
          background-color: #f6f8fa;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
        }
        pre {
          background-color: #f6f8fa;
          padding: 16px;
          border-radius: 6px;
          overflow: auto;
        }
        blockquote {
          border-left: 4px solid #dfe2e5;
          color: #6a737d;
          margin: 0;
          padding-left: 20px;
        }
        ul, ol {
          padding-left: 20px;
          margin-bottom: 4px;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 16px;
        }
        th, td {
          border: 1px solid #dfe2e5;
          padding: 8px 12px;
        }
        th {
          background-color: #f6f8fa;
        }
      `;

const generatePdf = async (content: string) => {
  const dateTimeString = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `./prd-files/competitor-analysis-${dateTimeString}.pdf`;
  await convertMarkdownToPdf({
    content: content,
    destination: fileName,
    css: style,
  });
  return fileName;
};

const getMarkdownContent = (state: OverallStateType) => {
  let toc = "# Table of Contents \n";
  toc += state.competitorFeatureDetailsList
    .map(
      (item, index) =>
        `- [Competitor ${index + 1}: ${item.competitorName}](#competitor-${
          index + 1
        })`
    )
    .join("\n");

  toc += `
- [Table Matrix and offerings](#competitor-table-matrix)`;

  let markdownContent = state.competitorFeatureDetailsList
    .map((item, index) => {
      return `
******************************************* 
# Competitor ${index + 1}
******************************************* 
       
      ${item.featureDetails}

      `;
    })
    .join("\n");

  markdownContent += `
  <><><><><><><><><><><><><><><><><><><><><>
  # Competitor Table Matrix
  <><><><><><><><><><><><><><><><><><><><><>
  ${state.competitorTableMatrix}
  `;

  markdownContent = toc + "\n\n" + markdownContent;
  return markdownContent;
};

const nodeCompetitorAnalysisPdf = async (state: OverallStateType) => {
  try {
    const markdownContent = getMarkdownContent(state);

    if (markdownContent) {
      const filePath = await generatePdf(markdownContent);
      const detail = STEP_EMOJIS.pdf + `Competitor Analysis PDF created`;
      state.messages.push(new SystemMessage(detail + " : " + filePath));
      if (state.onNotifyProgress) {
        await state.onNotifyProgress(detail);
      }
      state.competitorAnalysisPdfFilePath = filePath;
    }
  } catch (err) {
    state.error = err;
  }

  checkErrorToStopWorkflow(state);

  return state;
};

export { nodeCompetitorAnalysisPdf };
