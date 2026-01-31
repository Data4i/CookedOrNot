"use server";
import { ChatGroq } from "@langchain/groq";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

const fallbackNicknames = [
    "Cooked-Intern-404",
    "Downbad-Developer-007",
    "Scrolling-Doom-999",
    "Touch-Grass-101",
    "Zero-Rizz-888"
];

export async function getNickname() {
    try {
        if (!process.env.GROQ_API_KEY) {
            throw new Error("Missing API Key");
        }

        const llm = new ChatGroq({
            apiKey: process.env.GROQ_API_KEY,
            model: "openai/gpt-oss-20b",
            temperature: 1.2,
        });

        const response = await llm.invoke([
            new SystemMessage("Generate a funny Gen Z nickname (Adjective-Noun-Number). Return ONLY JSON: {\"nickname\": \"...\"}"),
            new HumanMessage("Give me a nickname")
        ]);

        const content = response.content.toString();
        const jsonMatch = content.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const json = JSON.parse(jsonMatch[0]);
            if (json.nickname) return json.nickname;
        }

        throw new Error("Failed to parse");
    } catch (e) {
        console.error("Groq Error or Missing Key, using fallback", e);
        return fallbackNicknames[Math.floor(Math.random() * fallbackNicknames.length)];
    }
}
