const HTTP_STATUS_CODES = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  INTERNAL_SERVER_ERROR: 500,
};

const STEP_EMOJIS = {
  error: "❌ ",

  start: "🎬 ",
  analysis: "🔍 ",
  estimation: "🎯 ",
  docWriting: "✍️ ",
  pdf: "📄 ",
  complete: "✅ ",
  subGraph: "🧩 ",
  company: "🏢 ",
  subStep: "-----> ",
  competitorTable: "📊 ",
  tool: "🔧 ",
  allCompany: "🌐 ",

  review: "👀 ",
  launch: "🚀 ",
  star: "⭐️ ",
};

const SALESFORCE_OBJECTS = {
  TechnicalRequest: "TechnicalRequest__c", //used for local seeding
};

export { HTTP_STATUS_CODES, STEP_EMOJIS, SALESFORCE_OBJECTS };
