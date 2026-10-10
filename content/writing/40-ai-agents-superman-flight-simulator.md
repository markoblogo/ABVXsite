---
{
  "id": "40-ai-agents-superman-flight-simulator",
  "slug": "40-ai-agents-superman-flight-simulator",
  "title": "40 AI Agents Built a Superman Flight Simulator in 7 Hours (45M Tokens)",
  "seoTitle": "40 AI Agents Built SKYFLY: Superman Simulator, Workflow and Token Costs",
  "type": "article",
  "primarySection": "writing",
  "appearsIn": [
    "writing"
  ],
  "status": "live",
  "visibility": "public",
  "publishedAt": "2026-10-10",
  "language": "en",
  "summary": "Watch my SKYFLY video and read practical notes on the reported 40-agent workflow, 45 million tokens, browser architecture and checks that matter beyond a demo.",
  "tags": [
    "AI agents",
    "agentic coding",
    "multi-agent development",
    "SKYFLY",
    "Three.js",
    "token budgets"
  ],
  "links": [
    {
      "type": "youtube",
      "label": "Watch on YouTube",
      "url": "https://www.youtube.com/watch?v=6q2JG0gCyDg"
    },
    {
      "type": "github",
      "label": "SKYFLY source and licence",
      "url": "https://github.com/vakovalskii/skyfly"
    }
  ],
  "videoUrl": "https://www.youtube.com/watch?v=6q2JG0gCyDg",
  "videoUploadedAt": "2026-10-10T15:20:37+00:00",
  "media": {
    "src": "https://i.ytimg.com/vi/6q2JG0gCyDg/hqdefault.jpg",
    "alt": "Thumbnail for the SKYFLY Superman flight simulator video.",
    "width": 480,
    "height": 360,
    "role": "video-thumbnail"
  }
}
---

In this video I cover **SKYFLY**, a browser flight simulator built by developer **vakovalskii**. The interesting question is how to evaluate a development process that combines many coding agents, a large token budget and a short elapsed time—not simply whether the demo looks impressive.

## What the reported numbers tell us

The video description reports **up to 40 agents working simultaneously**, **45 million tokens**, and **around seven hours of development**. It also mentions three exhausted $100 subscription limits. These are reported development figures, not measurements independently reproduced for this page.

Each number answers a different question:

- **Agent count** describes concurrency. It does not establish how many agents contributed useful changes or how independently they worked.
- **Elapsed time** describes time to a reported result. It is different from total agent-hours and human review time.
- **Token count** describes aggregate model traffic. It does not establish a cash price without knowing the models, input/output split, cached tokens and subscription terms.
- **Exhausted subscription limits** describe capacity constraints. They should not be converted directly into an exact project cost.

Dividing 45 million tokens by seven elapsed hours gives roughly **6.4 million tokens per hour across the workflow**. That is a useful scale indicator, not a per-agent rate or evidence of efficiency.

## What is actually in the browser game

The [project README](https://github.com/vakovalskii/skyfly) describes a JavaScript client using **Three.js and Vite**, with a **Node.js and WebSocket server**. It combines geographic terrain, OpenStreetMap buildings and multiplayer interaction.

That matters because this is an integration problem as well as a code-generation problem. Rendering, geographic data, player state and networking have to work together. Producing separate pieces quickly is only one part of producing a usable system.

The repository makes its source available for inspection under a restricted noncommercial licence. Publicly visible source is not blanket permission to reuse, modify or deploy it; consult the repository licence before doing so.

## What I would check beyond the demo

For this kind of multi-agent build, I would review four things before treating fast delivery as a repeatable method:

1. **Integration:** did the agents have clear component boundaries, and who resolved conflicting changes?
2. **Verification:** do rendering, input, reconnects and shared player state work outside the original demo sequence?
3. **Browser constraints:** does the experience remain usable on slower hardware, mobile screens and variable networks?
4. **Budget:** how much useful progress remained after accounting for retries, repeated context and human review?

These are evaluation questions, not claims that SKYFLY passes or fails those checks. They explain why agent count and speed alone are incomplete measures of a development workflow.

## How this connects to my own workflow

In [How I Work With AI Agents in 2026](/writing/how-i-work-with-ai-agents-2026), I describe an orchestrator as my main interface and human taste gates as checkpoints for direction and evaluation. This case gives a concrete reason to keep those checkpoints: parallel execution increases the amount of work that can happen before an integration or product decision is reviewed.

For more on context and checkpoints, see [AI Workflow and Orchestration](/editorial/systems/workflow-orchestration).

## Watch, inspect and explore

- [Watch the original video on YouTube](https://www.youtube.com/watch?v=6q2JG0gCyDg).
- [Inspect the SKYFLY repository and its licence](https://github.com/vakovalskii/skyfly).
- [Open the public SKYFLY game](https://fly.neuraldeep.ru/).

Source note: the development figures come from my video description; the architecture and licensing information come from the project README. This page adds workflow analysis and evaluation questions rather than reproducing the description alone.
