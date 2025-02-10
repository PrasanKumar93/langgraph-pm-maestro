import { dump as yamlDump } from "js-yaml";

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
  }
  return retValue;
};

export { getYamlFromJson };
