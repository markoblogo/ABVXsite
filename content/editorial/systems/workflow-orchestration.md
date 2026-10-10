# AI Workflow & Orchestration for Reviewable Development

An AI-assisted coding workflow has to do more than produce a patch. It needs to gather relevant repository context, choose an appropriate task method, respect project boundaries, run checks and return evidence that a reviewer can inspect. Orchestration organizes those steps; reusable instructions and skills help keep them consistent across tasks.

The ABVX projects in this group include [SET](/work/set), an orchestration layer for operational tools and structured development systems; the [AGENTS.md Generator](/work/agents-md-generator), which helps create and verify lean repository context; and [ABVX Agent Skills](/work/abvx-agent-skills), a portable execution layer of small, reviewable, validation-gated skillpacks.

## Context before action

Repositories differ in their architecture, commands, risk boundaries and contribution practices. A useful instruction layer helps an agent find those facts before changing code. A reusable skill can then provide a method for a particular kind of work, such as investigating a bug, updating content or checking a deployment.

This separation keeps general project rules distinct from task-specific procedures. It also makes context easier to review: instructions can state what the agent should inspect, what actions are in scope and what evidence is required before reporting success.

## Orchestration with checkpoints

Structured workflows define stages such as intake, inspection, implementation, verification and handoff. Checkpoints let a person review consequential decisions and prevent a tool from treating an attempted action as a completed result. The purpose is dependable execution, not maximum autonomy.

These projects explore practical ways to organize AI coding work so it is easier to understand, test and continue. Visit the linked project pages for each system's specific scope and implementation.

## Examples from practice

[How I Work With AI Agents in 2026](/writing/how-i-work-with-ai-agents-2026) describes my orchestrator workflow, parallel tasks, review gates and the parts I choose to automate. For a concrete build to inspect, [the SKYFLY video and technical notes](/writing/40-ai-agents-superman-flight-simulator) separate the reported agent and token counts from questions about architecture, repeatability and product quality.
