import { z } from 'zod'
import fs from "fs/promises"
import path from "path"
import { Octokit } from "@octokit/rest";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const octokit = new Octokit({
    auth: process.env.github_token
})

async function pushToGitHub(folderName: string, fileContent: string) {
  const owner = "anandromy";
  const repo = "tds_project1"; // create one like "ai-generated-apps"
  const path = `generated_apps/${folderName}/index.html`;
  const message = `Add or update generated app: ${folderName}`;
  const encodedContent = Buffer.from(fileContent).toString("base64");

  let sha;
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    if (!Array.isArray(data) && data.sha) sha = data.sha;
  } catch (err: any) {
    if (err.status !== 404) throw err; // ignore 404 (new file)
  }

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: encodedContent,
    sha, // only required if updating
  });

  return `https://github.com/${owner}/${repo}/blob/main/${path}`;
}

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


        const githubUrl = await pushToGitHub(folderName, content.text || "");

        await fetch(data.evaluation_url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: data.email,
                task: data.task,
                round: data.round,
                nonce: data.nonce,
                repo_url: githubUrl,
                commit_sha: "",
                page_url: ""
            }),
        });
        
        return Response.json({ success: true, folder: folderName, githubUrl});
    } catch(err) {
        return Response.json(null, { status: 500 })
    }
}