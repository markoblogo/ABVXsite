---
{
  "id": "google-oo-harness-specialized-ai-agents",
  "slug": "google-oo-harness-specialized-ai-agents",
  "title": "Your AI Agent Got Smarter at One Task. Congratulations. It Just Broke Three Others.",
  "seoTitle": "Google OO-Harness: Why Specialised AI Agents Beat One Universal Harness",
  "summary": "Improving an AI agent for one task can make it worse at another. Google's OO-Harness uses object-oriented inheritance and selective routing to solve the problem, delivering a 77.41% partial-credit score versus 61.62% for the baseline on AutomationBench.",
  "seoDescription": "Google's OO-Harness research shows how specialised, inherited agent configurations outperform universal harness optimisation, without changing the AI model.",
  "primarySection": "writing",
  "appearsIn": [
    "writing"
  ],
  "type": "article",
  "visibility": "public",
  "status": "live",
  "language": "en",
  "publishedAt": "2026-10-25",
  "updatedAt": "2026-10-25",
  "tags": [
    "ai-agents",
    "agent-harness",
    "oo-harness",
    "google-research",
    "agentic-ai",
    "object-oriented-programming",
    "automation",
    "ai-engineering",
    "llm-orchestration",
    "software-architecture"
  ],
  "links": [],
  "featured": false,
  "sortRank": 500,
  "needsReview": false,
  "homepageEligible": true,
  "media": {
    "src": "/media/writing/google-oo-harness-specialized-ai-agents/cover.webp",
    "width": 1536,
    "height": 1024,
    "alt": "An overloaded robot tangled in tools and cables contrasts with an orchestrator directing specialised document, spreadsheet, development and automation agents.",
    "role": "generic-thumbnail"
  }
}
---

_Google's OO-Harness research suggests that the future of reliable AI agents might involve less universal optimisation and more of a software engineering idea we've had for decades: inheritance._

There's a wonderful tendency in software engineering to improve something until it stops working.

You discover a problem.

You fix it.

The fix works beautifully.

Then, three days later, someone from another department calls to explain that your magnificent improvement has turned their perfectly functional workflow into an industrial accident.

Welcome to AI agent engineering.

Only now the software is capable of producing its own industrial accidents, occasionally accompanied by a confident explanation of why everything is going splendidly.

A new paper from researchers affiliated with Google Cloud AI Research and the University of Illinois tackles exactly this problem.

It's called [Object-Oriented Harness: Evolving Agent Harnesses through Object-Oriented Design](https://arxiv.org/abs/2610.28380).

And its central idea is rather amusing.

After years of building increasingly sophisticated AI systems, someone has remembered inheritance.

Yes.

Classes.

Parent classes.

Child classes.

Method overrides.

The sort of thing software engineers were arguing about long before anybody thought it would be a good idea to let a language model operate a company's accounting system.

And apparently, it works rather well.

## The trouble with building one magnificent agent

Let's say you're building an AI agent for business operations.

It handles spreadsheets.

Processes documents.

Works with customer records.

Uses APIs.

Moves information between applications.

Occasionally attempts something resembling project management.

A perfectly ordinary list of responsibilities for a modern AI agent, which is expected to be an accountant, secretary, developer, analyst and personal assistant before lunch.

You begin with a base configuration.

Some system prompts.

A collection of tools.

Instructions about how to use them.

Execution logic.

Rules for managing context and deciding when work is finished.

This surrounding machinery is called the **agent harness**.

The model itself is only part of the system.

The harness determines how that model interacts with the world.

Now imagine the agent struggles with a particular spreadsheet task.

So you improve its harness.

You add special instructions.

Perhaps a validation step.

Perhaps a different way to handle data.

Perhaps more aggressive tool usage.

The spreadsheet results improve.

Wonderful.

Except now the same agent approaches a simple document-editing task with the procedural enthusiasm of a nuclear power plant inspector.

It takes twice as long.

Runs unnecessary checks.

Gets confused by instructions that were never intended for documents.

And occasionally fails a task that the original agent completed perfectly well.

You've optimised one workflow by introducing complications into every other workflow.

This is the fundamental problem with the universal harness.

**Every improvement becomes everybody's problem.**

## One size fits absolutely nobody

The usual approach to agent optimisation is to keep improving a single configuration.

One harness.

One set of rules.

One increasingly elaborate collection of instructions designed to handle every possible task.

It's the software equivalent of creating the world's finest Swiss Army knife.

Except each time you add another tool, the screwdriver becomes slightly worse at being a screwdriver.

Eventually you've built a device capable of opening wine, cutting wire, measuring atmospheric pressure and submitting your tax return.

Unfortunately, it can no longer open a bottle.

Google's researchers propose a different approach.

Instead of optimising one universal harness, build a **family of specialised harnesses**.

Each specialises in a particular type of execution problem.

And rather than copying everything from scratch, use object-oriented inheritance.

A specialised harness inherits the behaviour of its parent.

Then overrides or extends only the parts that need to change.

The base remains available.

Other specialised versions remain unaffected.

A correction designed for one family of tasks doesn't automatically contaminate everything else.

It's hardly a revolutionary concept in software architecture.

But applying it systematically to evolving AI-agent harnesses is a genuinely interesting idea.

## The model stays exactly the same

This is an important distinction.

OO-Harness is not another technique for making a foundation model more intelligent.

The researchers didn't need to train a new language model for each category of business task.

The executor model remains fixed during evaluation.

What changes is the code around it.

The prompts.

The tools.

The control flow.

The way it handles particular situations.

During development, an evolution agent examines execution records, identifies groups of tasks with similar needs, and proposes specialised harness classes.

These candidates are evaluated against the relevant groups of tasks.

Successful changes can become part of the growing hierarchy.

And because subclasses can inherit from previously developed classes, useful improvements can be reused without rewriting the entire system.

Think of it as building a family of mechanics.

One specialises in engines.

Another in brakes.

Another in transmissions.

They all understand the basics of repairing cars.

But you don't insist that the brake specialist apply his favourite brake-repair procedure to your gearbox.

A remarkably sensible arrangement.

Which raises the obvious question.

How does the system decide which specialist to use?

## First, let the ordinary agent have a go

This is perhaps my favourite part of the architecture.

When a new task arrives, OO-Harness doesn't immediately assign it to a specialised agent based on a few keywords.

The base agent runs first.

The system observes what happened.

Then a router examines the task and the execution trace, using previously learned routing information.

It makes a decision.

If the base execution looks appropriate, keep its result.

If the task appears to belong to a category where a specialised harness would help, run that specialist instead.

In other words, the base agent doesn't disappear.

It remains the default option.

And specialisation is applied selectively.

This also means routing isn't free: when the system chooses a specialist, the task has already been attempted once by the base agent. That creates additional execution and routing costs.

But the principle is powerful.

**Don't replace something that's working simply because you've invented something more complicated.**

An idea so obvious that it's remarkable how often software development manages to ignore it.

## The numbers are rather interesting

The researchers evaluated the approach on several benchmarks involving business workflows, workspace tasks and tool use.

On AutomationBench, which tests business-process automation, the results were:

|Harness|Average partial-credit score|
|---|---|
|Base harness|61.62%|
|Meta-Harness, one globally optimised configuration|63.92%|
|OO-Harness, specialised inherited configurations|**77.41%**|

That's an improvement of 15.79 percentage points over the base configuration.

Not bad for a technique whose underlying architectural principle has been around for decades.

One important detail: these scores measure average partial credit for task execution, not the percentage of tasks completed perfectly.

On AutomationBench's stricter full-success metric, OO-Harness achieved 37.22%, compared with 25.44% for the base.

Still a meaningful improvement.

But a reminder that AI-agent benchmarks need to be read rather than merely admired.

The study also included a strong competing approach that already used specialised harnesses, Adaptive Auto-Harness, which scored 75.40% on AutomationBench.

So the result isn't that OO-Harness has single-handedly invented specialisation.

Its contribution is a particular way to organise, evolve and select specialisations through an inheritance hierarchy.

And the experimental results suggest that arrangement has advantages.

## The most important result might be what happened on unfamiliar tasks

Now we get to the part I find especially relevant to real-world automation.

It's one thing to improve performance on the kinds of tasks you've been developing for.

It's another to avoid making a complete mess when the agent encounters something unfamiliar.

The researchers tested the system on tasks from application families outside those used to evolve the harnesses.

OO-Harness's router selected the base configuration for those unfamiliar tasks.

The result was a 59.18% strict success rate.

The globally optimised Meta-Harness achieved 44.90%.

That's a substantial difference.

And it illustrates why the fallback matters.

A universally modified harness may carry specialised assumptions into environments where those assumptions don't belong.

A family of harnesses can preserve a general-purpose baseline for situations where there is no compelling reason to specialise.

Of course, this particular experiment doesn't prove that the router will always make the right choice on unknown applications.

And falling back to base doesn't guarantee success.

But preserving known baseline behaviour is a valuable property when building systems intended to operate beyond carefully selected demonstrations.

## The obvious catch: complexity has a price

There's no free lunch here.

Except, apparently, in AI product announcements, where everything is simultaneously faster, cheaper, smarter and available next Tuesday.

A hierarchy of agent harnesses requires maintenance.

Specialised configurations need evaluation.

Routing decisions can be wrong.

The system needs execution traces and sufficiently useful observations to recognise recurring failure patterns.

And rerunning a task under a specialised harness consumes additional resources.

A successful benchmark improvement isn't automatically a production efficiency improvement.

You still need to measure latency, total inference cost, failure recovery and operational complexity.

The paper reports improvements across three evaluated benchmarks, but that doesn't establish that every business should immediately rebuild its agent architecture around object-oriented inheritance.

Still, the direction is compelling.

Especially when agents are expected to perform dozens of genuinely different kinds of work.

## The real problem isn't that the AI isn't clever enough

I've been working increasingly with AI agents as part of my own development and business workflows.

And one thing has become clear.

The quality of an agentic system isn't determined solely by which model you connect to it.

It's also determined by how work is organised around that model.

What context it receives.

Which tools it can access.

How tasks are divided.

When results are checked.

How failures are handled.

And whether a particular execution strategy is appropriate for the problem.

You can put an excellent model inside a terrible harness and get terrible results.

Or take the same model, improve the surrounding architecture, and obtain significantly better performance.

That's what makes this research interesting beyond the particular benchmark scores.

It suggests that improving an AI system doesn't necessarily mean making every component more complicated.

Sometimes it means **stopping one component's improvements from interfering with everything else**.

Which is a rather different engineering objective.

And, in many practical systems, probably a more useful one.

## Perhaps the future isn't one agent that does everything

For a while, the industry has been fascinated by the idea of the universal AI agent.

One assistant.

Every task.

Every application.

Every workflow.

One gigantic digital employee who never sleeps, never complains and occasionally deletes the wrong spreadsheet with extraordinary confidence.

But perhaps the more practical direction is an architecture where the underlying intelligence is shared and the execution machinery is specialised.

Not a hundred independently trained models.

Not a hundred enormous duplicated prompts.

One capable model.

A reusable base harness.

A family of specialised behaviours.

And a routing mechanism capable of choosing when each is appropriate.

The OO-Harness paper isn't the final answer to agent reliability.

It's a research result, not proof of universally reliable production automation.

But it illustrates something worth remembering.

We've spent an enormous amount of effort asking how to make AI models smarter.

Perhaps we should devote a little more attention to making sure the machinery surrounding them doesn't make them stupid.

Especially when we improve it.

**Because the best upgrade isn't always the one that makes an agent better at its favourite task.**

**Sometimes it's the one that stops that improvement from breaking everything else.**

And apparently, one way to achieve this involves a technology software engineers have known for a very long time.

Inheritance.

Who would have thought?

---

**Research reference:** [Object-Oriented Harness: Evolving Agent Harnesses through Object-Oriented Design](https://arxiv.org/abs/2610.28380), Gaotang Li and colleagues, October 2026.

**Related reading:** [How I Work With AI Agents in 2026](https://abvx.xyz/writing/how-i-work-with-ai-agents-2026) · [Before You Launch Your Product, Send Four AI Agents to Destroy It](https://abvx.substack.com/p/before-you-launch-your-product-send)
