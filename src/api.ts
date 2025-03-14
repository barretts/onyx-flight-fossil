// import { ConversationMessage } from "./types";

// const LM_API_URL = "http://127.0.0.1:1283/v1/chat/completions";

// export async function sendChatMessage(
//   conversation: ConversationMessage[],
//   API_KEY: string
// ): Promise<ReadableStreamDefaultReader<Uint8Array>> {
//   const payload = {
//     model: "gpt-3.5-turbo",
//     messages: conversation,
//     temperature: 0.7,
//     stream: true
//   };

//   const response = await fetch(LM_API_URL, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "Authorization": "Bearer " + API_KEY
//     },
//     body: JSON.stringify(payload)
//   });
//   if (!response.ok) {
//     throw new Error("Network response was not ok");
//   }
//   return response.body!.getReader();
// }
import { ConversationMessage } from "./types";

const LM_API_URL = "http://127.0.0.1:1283/v1/chat/completions";

export async function sendChatMessage(
  conversation: ConversationMessage[],
  API_KEY: string
): Promise<ReadableStreamDefaultReader<Uint8Array>> {
  const payload = {
    model: "gpt-3.5-turbo",
    messages: conversation,
    temperature: 0.7,
    stream: true
  };

  const response = await fetch(LM_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + API_KEY
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.body!.getReader();
}