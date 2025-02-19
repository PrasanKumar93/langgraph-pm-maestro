import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

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

  productFeature: Annotation<any>,
  systemSalesForceData: Annotation<any>,
  systemJiraData: Annotation<any>,
  toolSystemSalesForceProcessed: Annotation<boolean>,
  toolSystemJiraProcessed: Annotation<boolean>,
  effortEstimationData: Annotation<any>,
  outputProductPRD: Annotation<any>,
  outputPRDFilePath: Annotation<string>,
  error: Annotation<any>,
});
//#endregion

export { InputStateAnnotation, OverallStateAnnotation };

type OverallStateType = typeof OverallStateAnnotation.State;
type InputStateType = typeof InputStateAnnotation.State;

export type { OverallStateType, InputStateType };
