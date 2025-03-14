// export async function processStream(
//   reader: ReadableStreamDefaultReader<Uint8Array>,
//   onChunk: (delta: string) => void
// ): Promise<void> {
//   const decoder = new TextDecoder("utf-8");

//   async function readStream(): Promise<void> {
//     const { done, value } = await reader.read();
//     if (done) return;
//     const chunk = decoder.decode(value, { stream: true });
//     const lines = chunk.split("\n");
//     for (const line of lines) {
//       if (line.startsWith("data: ")) {
//         const jsonStr = line.slice(6).trim();
//         if (jsonStr === "[DONE]") continue;
//         try {
//           const dataObj = JSON.parse(jsonStr);
//           const delta = dataObj.choices[0].delta;
//           if (delta && delta.content) {
//             onChunk(delta.content);
//           }
//         } catch (e) {
//           console.error("JSON parse error:", e);
//         }
//       }
//     }
//     await readStream();
//   }
//   await readStream();
// }
export async function processStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk: (delta: string) => void,
  onComplete: () => void
): Promise<void> {
  const decoder = new TextDecoder("utf-8");

  async function readStream(): Promise<void> {
    const { done, value } = await reader.read();
    if (done) {
      onComplete();
      return;
    }
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const dataObj = JSON.parse(jsonStr);
          const delta = dataObj.choices[0].delta;
          if (delta && delta.content) {
            onChunk(delta.content);
          }
        } catch (e) {
          console.error("JSON parse error:", e);
        }
      }
    }
    await readStream();
  }
  await readStream();
}