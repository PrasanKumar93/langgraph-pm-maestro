import { dump as yamlDump } from "js-yaml";
import { mdToPdf } from "md-to-pdf";

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
  const pdf = await mdToPdf(
    { content: params.content },
    {
      dest: params.destination,
      css: params.css,
    }
  );
  return pdf;
};

export { getYamlFromJson, convertMarkdownToPdf };
