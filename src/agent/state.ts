import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

const tavilySearchAnnotation = Annotation.Root({
  toolTavilySearchProcessed: Annotation<boolean>,
  toolTavilySearchData: Annotation<any>,
  allTavilySearchDataList: Annotation<any[]>,
});

interface ICompetitorFeatureDetails {
  competitorName: string;
  featureDetails: string;
}

const CompetitorMatrixAnnotation = Annotation.Root({
  competitorList: Annotation<string[]>,
  pendingProcessCompetitorList: Annotation<string[]>,
  competitorFeatureDetailsList: Annotation<ICompetitorFeatureDetails[]>,
  competitorTableMatrix: Annotation<string>,
  competitorAnalysisPdfFilePath: Annotation<string>,
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

const initializeState = (state: OverallStateType) => {
  state.productFeature = "";

  state.competitorList = [];
  state.pendingProcessCompetitorList = [];
  state.competitorFeatureDetailsList = [];
  state.competitorTableMatrix = "";
  state.competitorAnalysisPdfFilePath = "";

  state.systemSalesForceDataList = [];
  state.systemJiraDataList = [];
  state.toolSystemSalesForceProcessed = false;
  state.toolSystemJiraProcessed = false;

  state.effortEstimationData = {};

  state.outputProductPRD = "";
  state.outputPRDFilePath = "";
  state.error = "";

  state.toolTavilySearchProcessed = false;
  state.toolTavilySearchData = "";
  state.allTavilySearchDataList = [];
};

export { InputStateAnnotation, OverallStateAnnotation, initializeState };

type OverallStateType = typeof OverallStateAnnotation.State;
type InputStateType = typeof InputStateAnnotation.State;

export type { OverallStateType, InputStateType };
