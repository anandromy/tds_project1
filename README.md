# AI-Powered App Generator

A Next.js project that automatically generates minimal web applications using AI, pushes them to GitHub, and provides live URLs for evaluation. This tool leverages OpenRouter AI and GitHub Pages to streamline rapid prototyping and deployment of small web apps.

---

## Features

- **AI-Driven App Generation**  
  Generate HTML/CSS/JS code based on a textual brief using `aipipe.org` (OpenRouter GPT-4.1-nano model).

- **Automated GitHub Integration**  
  Each generated app is automatically pushed to a GitHub repository with a commit, preserving version history.

- **Live App Hosting**  
  GitHub Pages integration allows each generated app to be viewed live via a public URL.

- **Evaluation Integration**  
  After generation, the live GitHub URL can be sent via a POST request to an evaluation endpoint for further processing or grading.

- **Local Development Ready**  
  Generates and stores apps locally in `generated_apps/` for easy inspection and testing.

---

## Tech Stack

- **Frontend / Backend:** Next.js (App Router)  
- **AI Integration:** OpenRouter AI via `fetch`  
- **Version Control:** Git + Octokit (GitHub REST API)  
- **Hosting:** GitHub Pages for live app previews  
- **Language:** TypeScript, Node.js  

---

## Getting Started

### Prerequisites

- Node.js >= 18  
- npm or yarn  
- GitHub Personal Access Token (with `repo` permissions)  
- `.env.local` file with:

```env
AI_PIPE_TOKEN=<your-ai-pipe-token>
GITHUB_TOKEN=<your-github-token>
