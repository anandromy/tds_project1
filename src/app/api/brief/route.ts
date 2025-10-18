import { z } from 'zod'
import fs from "fs/promises"
import path from "path"

const briefSchema = z.object({
  email: z.string().email(),
  secret: z.string(),
  task: z.string(),
  round: z.number(),
  nonce: z.string(),
  brief: z.string(),
  checks: z.array(z.string()),
  evaluation_url: z.string().url(),
  attachments: z.array(
    z.object({
      name: z.string(),
      url: z.string(),
    })
  ).optional(),
});


export async function POST(request:Request) {
    try {
        const request_json = await request.json()
        const { success, data, error } = briefSchema.safeParse(request_json)
        if(!success) {
            return Response.json("JSON object is not valid", { status: 400 })
        }

        if(data.secret !== process.env.secret) {
            return Response.json("Unauthorized: Invalid secret", { status: 401 })
        }     
        const prompt = `Generate a minimal app based on the following task: ${data.task}. Brief: ${data.brief}. Provide production-ready code`;
        const response = await fetch("https://aipipe.org/openrouter/v1/responses", {
            method: "POST",
            headers: { Authorization: `Bearer ${process.env.ai_pipe_token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ "model": "openai/gpt-4.1-nano", "input": `${prompt}`})
            })

        const openaires = await response.json()
        const content = openaires.output[0].content[0]


        const folderName = data.task.toLowerCase().replace(/[^a-z0-9_-]/g, "_").slice(0, 30);
        const dirPath = path.join(process.cwd(), "generated_apps", folderName);
        await fs.mkdir(dirPath, { recursive: true });
        await fs.writeFile(path.join(dirPath, "index.html"), content.text || "");

        return Response.json({ success: true, folder: folderName });
    } catch(err) {
        return Response.json(null, { status: 500 })
    }
}