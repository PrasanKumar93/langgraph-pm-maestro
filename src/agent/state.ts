import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

const InputStateAnnotation = Annotation.Root({
  inputProductFeature: Annotation<string>,
});

//#region OverallStateAnnotation

const executionStateAnnotation = Annotation.Root({
  toolSystemSalesForceProcessed: Annotation<boolean>,
  toolSystemJiraProcessed: Annotation<boolean>,
});

const CustomerDemandAnalysisAnnotation = Annotation.Root({
  systemSalesForceData: Annotation<any>,
  systemJiraData: Annotation<any>,
});

const OverallStateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  ...InputStateAnnotation.spec,
  ...CustomerDemandAnalysisAnnotation.spec,
  ...executionStateAnnotation.spec,
  outputProductPRD: Annotation<string>,
});
//#endregion
export { InputStateAnnotation, OverallStateAnnotation };

type OverallStateType = typeof OverallStateAnnotation.State;

export type { OverallStateType };
