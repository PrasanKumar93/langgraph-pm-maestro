import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

const tavilySearchAnnotation = Annotation.Root({
  toolTavilySearchProcessed: Annotation<boolean>,
  toolTavilySearchData: Annotation<any>,
  allTavilySearchDataList: Annotation<any[]>,
});

const CompetitorMatrixAnnotation = Annotation.Root({
  competitorList: Annotation<string[]>,
});

const SlackBotAnnotation = Annotation.Root({
  onNotifyProgress: Annotation<(detail: string) => Promise<void>>,
});

const InputStateAnnotation = Annotation.Root({
  inputText: Annotation<string>,
  ...SlackBotAnnotation.spec,
});

//#region OverallStateAnnotation

const OverallStateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  ...InputStateAnnotation.spec,
  ...CompetitorMatrixAnnotation.spec,
  ...tavilySearchAnnotation.spec,
  productFeature: Annotation<string>,
  productName: Annotation<string>,
  systemSalesForceDataList: Annotation<any[]>,
  systemJiraDataList: Annotation<any[]>,
  toolSystemSalesForceProcessed: Annotation<boolean>,
  toolSystemJiraProcessed: Annotation<boolean>,
  effortEstimationData: Annotation<any>,
  outputProductPRD: Annotation<string>,
  outputPRDFilePath: Annotation<string>,
  error: Annotation<any>,
});
//#endregion

export { InputStateAnnotation, OverallStateAnnotation };

type OverallStateType = typeof OverallStateAnnotation.State;
type InputStateType = typeof InputStateAnnotation.State;

export type { OverallStateType, InputStateType };
