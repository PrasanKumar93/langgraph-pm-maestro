// Demo for Redis-backed checkpointing with LangGraph
// Usage:
//   npm run checkpointer-demo
//   (comment runDemo() and uncomment runDemo2() to test state loading)

import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import type { RunnableConfig } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";

import { RedisCheckpointSaver } from "../redis-checkpoint.js";

// --- State Schema ---
const ConversationStateAnnotation = Annotation.Root({
  messages: Annotation<string[]>(),
});
type ConversationState = typeof ConversationStateAnnotation.State;

// --- LLM Node ---
const llmNode = async (state: ConversationState) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable not set.");
  }
  const messages = state.messages ?? [];
  // Prepare OpenAI chat format
  const chatHistory = messages.map((msg) => {
    if (msg.startsWith("User:")) {
      return { role: "user", content: msg.replace(/^User:\s*/, "") };
    } else if (msg.startsWith("Bot:")) {
      return { role: "assistant", content: msg.replace(/^Bot:\s*/, "") };
    } else {
      return { role: "user", content: msg };
    }
  });
  const model = new ChatOpenAI({
    openAIApiKey: apiKey,
    modelName: "gpt-3.5-turbo",
    temperature: 0.7,
  });
  const response = await model.invoke(chatHistory);
  const botReply = `Bot: ${response.content}`;
  return {
    ...state,
    messages: [...messages, botReply],
  };
};

// --- Redis Checkpointer Setup ---
const checkpointer = new RedisCheckpointSaver({
  connectionString: process.env.REDIS_URL || "redis://localhost:6379",
  // insertRawJson: true, // Uncomment for easier debugging
  commonPrefix: "demo:",
  ttl: 600,
});
const thread_id = "demo-convo-thread-1";

// --- Build the Graph ---
const graph = new StateGraph({
  stateSchema: ConversationStateAnnotation,
});
graph.addNode("llm", llmNode).addEdge(START, "llm").addEdge("llm", END);

const compiledGraph = graph.compile({ checkpointer });

// --- Demo Runner: Multi-turn Conversation ---
async function runDemo() {
  let state: ConversationState = { messages: [] };
  let config: RunnableConfig = {
    configurable: { thread_id },
  };

  // Turn 1: user says hello
  state.messages.push("User: Hello I'm Prasan!");
  state = await compiledGraph.invoke(state, config);
  console.log(state.messages[state.messages.length - 1]);

  // Turn 2: user asks a question
  state.messages.push("User: What's the capital city of India?");
  state = await compiledGraph.invoke(state, config);
  console.log(state.messages[state.messages.length - 1]);

  // Turn 3: user says thanks
  state.messages.push("User: Thanks");
  state = await compiledGraph.invoke(state, config);
  console.log(state.messages[state.messages.length - 1]);

  // Show full conversation history
  console.log("\nFull conversation:");
  for (const msg of state.messages) {
    console.log(msg);
  }
}

// --- Load State from Redis ---
async function loadState(thread_id: string): Promise<ConversationState> {
  const tuple = await checkpointer.getTuple({
    configurable: { thread_id, checkpoint_ns: "" },
  });
  if (tuple && tuple.checkpoint) {
    const checkpoint = tuple.checkpoint as any;
    if (checkpoint.channel_values && checkpoint.channel_values.messages) {
      return { messages: checkpoint.channel_values.messages };
    }
  }
  return { messages: [] };
}

// --- Demo Runner: Resume from Redis State ---
async function runDemo2() {
  let state: ConversationState = await loadState(thread_id);
  let config: RunnableConfig = {
    configurable: { thread_id }, // same thread
  };

  // Next user turn
  state.messages.push("User: What is my name?");
  state = await compiledGraph.invoke(state, config);
  console.log(state.messages[state.messages.length - 1]);
}

// --- Entry Point ---
runDemo();
// To test state loading, comment runDemo() and uncomment below:
// runDemo2();

/**
 * OUTPUT:
 * -------
 * (first time runDemo())
User: Hello I'm Prasan!
Bot: Hello Prasan! How can I assist you today?
User: What's the capital city of India?
Bot: The capital city of India is New Delhi.
User: Thanks
Bot: You're welcome! If you have any more questions, feel free to ask.

(second time runDemo2)
User: What is my name?
Bot: Your name is Prasan.
 */
