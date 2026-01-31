"use server";

import { Client } from "@langchain/langgraph-sdk";
import { supabase } from "@/lib/supabase";

const client = new Client({
    apiUrl: "https://prod-deepagents-agent-build-d4c1479ed8ce53fbb8c3eefc91f0aa7d.us.langgraph.app",
    apiKey: process.env.LANGSMITH_API_KEY,
    defaultHeaders: { "X-Auth-Scheme": "langsmith-api-key" },
});

const agentId = "8bed097c-fc62-4ebc-83ea-f49d592d9f03";

type RoastResult = {
    roast: string;
    verdict: string;
    score: number;
    analysis: string;
};

export async function analyze(formData: FormData) {
    const text = formData.get("text") as string;
    const nickname = formData.get("nickname") as string;
    const files = formData.getAll("files") as File[];

    if (!nickname) throw new Error("Nickname required");

    try {
        const thread = await client.threads.create();

        const content: any[] = [];
        if (text) content.push({ type: "text", text });

        // Convert files to base64
        for (const file of files) {
            const buffer = await file.arrayBuffer();
            const base64 = Buffer.from(buffer).toString("base64");
            const mimeType = file.type || "image/png";
            const dataUrl = `data:${mimeType};base64,${base64}`;
            content.push({ type: "image_url", image_url: { url: dataUrl } });
        }

        const run = await client.runs.wait(thread.thread_id, agentId, {
            input: { messages: [{ role: "user", content }] }
        });

        // Get the final state
        const state = await client.threads.getState(thread.thread_id);
        const values = state.values as any;
        const lastMessage = values.messages[values.messages.length - 1];

        // Attempt to parse JSON from the last message content
        let parsed: RoastResult;
        try {
            let contentString = "";
            if (Array.isArray(lastMessage.content)) {
                const textBlock = lastMessage.content.find((c: any) => c.type === 'text');
                if (textBlock) {
                    contentString = textBlock.text;
                }
            } else if (typeof lastMessage.content === 'string') {
                contentString = lastMessage.content;
            }

            // Handle markdown code blocks if present
            const codeBlockRegex = /```json\n([\s\S]*?)\n```|```\n([\s\S]*?)\n```/;
            const match = contentString.match(codeBlockRegex);

            if (match) {
                // Use the content inside the code block
                const jsonContent = match[1] || match[2];
                parsed = JSON.parse(jsonContent);
            } else {
                // Fallback: Try to find the first '{' and last '}'
                const firstBrace = contentString.indexOf('{');
                const lastBrace = contentString.lastIndexOf('}');

                if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                    const jsonCandidate = contentString.substring(firstBrace, lastBrace + 1);
                    parsed = JSON.parse(jsonCandidate);
                } else {
                    // Try parsing the whole string as a last resort
                    parsed = JSON.parse(contentString);
                }
            }
        } catch (e) {
            console.error("Failed to parse agent output", lastMessage.content);
            throw new Error("Agent failed to produce valid JSON");
        }

        // Save to Supabase (NOT saving input)
        const { error } = await supabase.from('roasts').insert({
            nickname,
            score: parsed.score,
            roast_text: parsed.roast,
            analysis: parsed.analysis,
            verdict: parsed.verdict
        });

        if (error) {
            console.error("Supabase Save Error", error);
        }

        return parsed;

    } catch (e) {
        console.error("Analysis failed", e);
        // Mock return for development if API fails
        return {
            roast: "You broke the API call with your incompetence.",
            verdict: "COOKED",
            score: 100,
            analysis: "failed to connect to brain."
        };
    }
}
