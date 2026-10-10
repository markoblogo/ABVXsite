---
{
  "id": "how-i-work-with-ai-agents-2026",
  "slug": "how-i-work-with-ai-agents-2026",
  "title": "How I Work With AI Agents in 2026",
  "seoTitle": "How I Work With AI Agents in 2026: Multi-Agent Orchestration and Automation",
  "type": "article",
  "primarySection": "writing",
  "appearsIn": [
    "writing"
  ],
  "status": "live",
  "visibility": "public",
  "publishedAt": "2026-10-10",
  "language": "en",
  "summary": "My practical AI agent workflow in 2026: orchestrator agents, 20–40 subagents, long-running sessions, taste gates, automation and why AI-native work keeps changing.",
  "tags": [
    "AI agents",
    "multi-agent orchestration",
    "agent workflows",
    "AI automation",
    "human review"
  ],
  "links": [],
  "media": {
    "src": "/media/writing/how-i-work-with-ai-agents-2026/cover.png",
    "alt": "Collage showing a person coordinating research, product, analysis and automation agents through an orchestrator.",
    "width": 1536,
    "height": 1024,
    "role": "generic-thumbnail"
  }
}
---

Every major model release changes what AI can do.

That is obvious.

The less obvious part is that it also changes **how work should be organised around AI**.

Astra and Claude Opus 5.5 are not simply better versions of the models I used a year ago. They change the practical unit of work.

A prompt becomes a session.

A session becomes a team.

A team becomes a hierarchy of agents that may work for hours or days without me reading most of what they produce internally.

This is why I think many discussions about "AI adoption" are already asking the wrong question.

The question is no longer:

**How do I add AI to my existing workflow?**

It is:

**What should the workflow look like now that this level of AI exists?**

Those are very different questions.

## Prompt engineering was a transitional profession

At the beginning of the generative AI boom, we invented an entire profession around writing prompts.

Prompt engineer.

People built libraries of elaborate instructions, magical phrases, carefully structured role definitions and increasingly baroque templates designed to convince a language model to behave.

That made sense for the models we had.

I am much less convinced it makes sense now.

Recent research on mathematical reasoning found a practical ceiling to what can be gained by continuously adding prompt complexity. In some configurations, especially on weaker models, larger rule systems actually degraded performance.

Another large experiment on AI data-science workflows found no reliable improvement from adding automatically generated reusable skill files over simply giving the model the task itself.

The lesson is not that instructions are useless.

Obviously they are not.

The lesson is that **more instruction is not automatically more intelligence**.

A huge prompt can become another source of cognitive load.

A skill can become context the model now has to interpret before doing the actual work.

And a carefully engineered framework can become a machine for preventing a sufficiently capable model from solving a problem in the simpler way it would have chosen itself.

I increasingly prefer to provide goals, constraints, relevant context and evaluation criteria, then let the model work.

## We did the same thing with the next generation of AI jobs

After prompt engineering came a collection of new specialisations.

Context engineering.

RAG architecture.

Workflow automation.

n8n ninjas.

Vector-database everything.

Again, these technologies are real and useful.

There are absolutely problems where retrieval architecture matters. There are processes where deterministic workflow automation is exactly what you want.

But I think we made the usual mistake of turning implementation techniques into universal philosophies.

For most of my own work, I now start with the opposite assumption:

**Do not build infrastructure until the model demonstrates that it needs infrastructure.**

Modern models are surprisingly good at retrieving context, navigating tools, writing temporary software, searching external systems and constructing their own intermediate workflows.

Quite often, the custom scaffolding that would have been essential two years ago is now just another thing that can break.

## My default unit of work is now a multi-agent system

Almost every substantial session I start today has roughly the same structure.

There is one agent I communicate with.

I think of it as the **orchestrator of orchestrators**.

That agent owns the project from my perspective.

Under it may be several specialised agents.

One may handle research.

Another may inspect a particular product component.

Another may analyse a set of deals.

Another may test an implementation.

Another may coordinate several agents of its own.

So the structure can look something like this:

```
Me
└── Orchestrator
    ├── Research orchestrator
    │   ├── Agent
    │   ├── Agent
    │   └── Agent
    │
    ├── Product orchestrator
    │   ├── Agent
    │   ├── Agent
    │   └── Agent
    │
    └── Analysis orchestrator
        ├── Agent
        ├── Agent
        └── Agent
```

And it can continue another level down if the work requires it.

I do not micromanage that hierarchy.

That is the point.

## I don't read agent chats

A typical substantial task may involve 20 to 40 subagents.

Some projects run for a couple of hours.

Others continue for 40 or 50 hours of aggregate agent work.

Trying to read all of those conversations would defeat the entire purpose of using agents.

So I don't.

I read the conversation with the orchestrator.

That is my interface.

I care about:

what was decided,

what was produced,

what failed,

what remains uncertain,

what requires my judgement,

and what happens next.

The internal agent conversations are implementation detail.

For me, reading all of them would be approximately as useful as reading every line of source code behind a finished application.

Possible?

Yes.

A good use of my time?

Usually not.

This distinction matters because a lot of current AI workflow advice still assumes that a human should supervise the model by watching everything it does.

That does not scale.

If I need to watch every agent, I do not have an agent organisation.

I have a very inefficient collection of interns.

## My real job is setting taste gates

The most important part of my work is not writing instructions.

It is setting what I call **taste gates**.

A taste gate is a point in the process where the system must stop and show me something before committing too much effort in one direction.

For example:

before choosing the final visual direction,

after completing the first working prototype,

before scaling an analysis across thousands of items,

after proposing the architecture but before implementing everything,

or when several reasonable strategic directions exist and the choice depends on judgement rather than objective correctness.

At those points, I give feedback.

Then the agents continue.

This is much more important than continuously supervising every step.

Because autonomous systems have a very simple failure mode:

they can work extremely efficiently in the wrong direction.

If the first strategic decision is wrong, a 60-hour agent session does not magically repair it.

It may simply produce 60 hours of increasingly polished wrongness.

That is why the human role increasingly moves from execution toward **direction and evaluation**.

You do not need to steer every metre.

You need to decide where the road should go.

## Taste is becoming operational infrastructure

I use the word "taste" deliberately.

People often imagine that AI supervision means checking factual correctness.

That is only part of it.

Many important decisions have no objectively correct answer.

Is this interface elegant enough?

Is this research question interesting?

Does this positioning sound generic?

Is this business opportunity actually worth pursuing?

Does this design feel finished?

Is this article saying something new or merely producing competent text?

These questions require judgement.

AI can help evaluate them.

But eventually someone has to define what "good" means for the project.

That definition becomes one of the most valuable human inputs into an agent system.

The better the models become, the less useful it is for me to describe every step.

The more useful it becomes for me to define the standard they need to reach.

## Half of my agent work happens without me starting it

There is another major shift.

Not all agents should begin with a conversation.

A significant part of my AI workflow now consists of automated tasks that run on schedules or triggers.

On a typical day, there may be more than a dozen of these.

They review new deals and inquiries.

Inspect incoming email and messages.

Analyse traffic and campaigns.

Prepare daily or weekly goals.

Track project status.

Read market news.

Review changes in important data.

Prepare summaries.

Surface things that require attention.

The important difference from old automation is that these are not necessarily rigid workflows.

Traditional automation is:

```
IF this happens
THEN do exactly these five steps
```

Agentic automation is closer to:

```
Here is the responsibility.
Here are the systems you can use.
Here is what matters.
Investigate and tell me if something requires attention.
```

That is a fundamentally different abstraction.

## The workflow now follows the model

I think this is where many companies misunderstand AI transformation.

They take an existing business process and attach an AI component to one step.

Add RAG to Slack.

Add a chatbot to customer support.

Add summarisation to meetings.

Add an AI button to the CRM.

Technically, the company now "uses AI".

Operationally, almost nothing has changed.

AI-native work starts from the other end.

You look at what current models can reliably do and then ask:

**If I were designing this process today, knowing these capabilities existed, would I design it the same way?**

Increasingly, the answer is no.

You might not need the same number of handoffs.

You might not need the same dashboards.

You might not need someone manually checking five systems.

You might not need the same reporting structure.

You may not even need the same software.

## And this architecture is temporary too

I do not think the current multi-agent architecture is the final form.

We still have major limitations.

Agents do not generally learn continuously by updating their model weights during ordinary work.

Long-term adaptation is still largely external: memory systems, files, context, tools and stored state rather than genuine continual learning inside the model.

Agents also communicate primarily through text, structured messages, files and tool outputs.

That is convenient for us because we can inspect it.

It is probably not the most efficient possible way for machine systems to communicate.

I expect both of these areas to change significantly.

Perhaps agents will eventually exchange richer latent representations rather than translating everything into human-readable language.

Perhaps continual adaptation will become much more practical.

Perhaps today's hierarchy of orchestrators will look as primitive in a few years as giant prompt templates already look to me today.

That is fine.

The workflow should change again when the models change again.

## AI-native means accepting that the process is temporary

This is probably my main point.

There is no permanent "best AI workflow".

There is only a workflow that makes sense for the current generation of models.

Prompt engineering made sense at one stage.

Complex RAG architectures made sense for many more tasks at another.

Today I spend much more of my time working with long-running multi-agent systems, orchestrators, scheduled agents and carefully placed taste gates.

Tomorrow that may change again.

That is what AI-native work means to me.

Not taking the business process you designed five years ago and attaching an LLM to it.

It means being willing to redesign the process every time the underlying intelligence changes enough to make the old process obsolete.

## Related work and examples

- [AI Workflow and Orchestration](/editorial/systems/workflow-orchestration): context, checkpoints and reviewable development.
- [ABVX Agent Skills](/work/abvx-agent-skills): reusable procedures for bounded work.
- [Where is AI startup funding going?](/writing/ai-startup-funding-trends-7740-companies): my research using Claude, MCP and Anysite.
- [40 AI agents and a browser flight simulator](/writing/40-ai-agents-superman-flight-simulator): a video and practical notes on parallel development, token budgets and verification.
