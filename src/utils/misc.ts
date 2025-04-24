import { dump as yamlDump } from "js-yaml";
import { mdToPdf } from "md-to-pdf";
import { LoggerCls } from "./logger.js";

interface IConvertMarkdownToPdfParams {
  content: string;
  destination: string;
  css?: string;
}

const getYamlFromJson = (data: any[]) => {
  let retValue = "";
  if (data?.length) {
    retValue = yamlDump(data, {
      indent: 2,
      quotingType: '"',
      forceQuotes: true,
    });
    retValue = retValue
      .split("\n")
      .map((line) => "    " + line) // Add 4 spaces to start of each line for nesting in prompt template
      .join("\n");

    //-------- Safe Yaml for prompt template
    // Replace backticks with Unicode escape sequences
    retValue = retValue.replace(/`/g, "\\u0060");

    // Replace curly braces with Unicode escape sequences
    retValue = retValue.replace(/{/g, "\\u007B").replace(/}/g, "\\u007D");

    // Replace colons with Unicode escape sequences
    retValue = retValue.replace(/:/g, "\\u003A");

    //-------
  }

  return retValue;
};

const convertMarkdownToPdf = async (params: IConvertMarkdownToPdfParams) => {
  try {
    const pdf = await mdToPdf(
      { content: params.content },
      {
        dest: params.destination,
        css: params.css,
        launch_options: {
          args: ["--no-sandbox", "--disable-setuid-sandbox"], // ubuntu server fix (EC2)
        },
      }
    );
    return pdf;
  } catch (err) {
    const pureError = LoggerCls.getPureError(err);
    LoggerCls.error("Error converting markdown to pdf", pureError);
    throw pureError;
  }
};

export { getYamlFromJson, convertMarkdownToPdf };
