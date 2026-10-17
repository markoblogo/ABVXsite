---
{
  "id": "how-to-be-more-ambitious-with-ai-agents",
  "slug": "how-to-be-more-ambitious-with-ai-agents",
  "title": "Your AI Isn't Underperforming. You're Just Asking It to Do Too Little.",
  "seoTitle": "How to Be More Ambitious With AI Agents: Altitude, Depth and Range",
  "summary": "We're using increasingly powerful AI models to complete surprisingly small tasks. Felix Rieseberg's framework shows how to ask for better outcomes, deeper analysis and genuinely useful agent workflows.",
  "seoDescription": "Anthropic's Felix Rieseberg explains how to use AI more ambitiously through altitude, depth and range. Practical examples, agent workflows and the be-ambitious skill.",
  "type": "article",
  "primarySection": "writing",
  "appearsIn": [
    "writing"
  ],
  "status": "live",
  "visibility": "public",
  "language": "en",
  "publishedAt": "2026-10-17",
  "updatedAt": "2026-10-17",
  "tags": [
    "ai-agents",
    "agentic-workflows",
    "prompt-engineering",
    "claude",
    "codex",
    "ai-productivity",
    "multi-agent-systems",
    "agent-skills",
    "ai-native-development"
  ],
  "links": [],
  "media": {
    "src": "/media/writing/how-to-be-more-ambitious-with-ai-agents.png",
    "width": 1536,
    "height": 1024,
    "alt": "Editorial collage about asking AI agents bigger questions, with Speed, Altitude, Depth and Range, professional methods, evidence and better outcomes.",
    "role": "generic-thumbnail"
  }
}
---

_An Anthropic engineer explains how to make AI agents genuinely more ambitious. The trick isn't a longer prompt. It's asking for a different level of work._

We have a rather strange relationship with artificial intelligence.

Every few months, a new model arrives.

It's smarter. Faster. Better at coding. Better at reasoning. Capable of using tools, running software, analysing complicated data and coordinating other agents.

We celebrate.

We watch demonstrations.

We announce that everything has changed.

Then we open a chat window and ask it to summarise a PDF.

Excellent.

Humanity has spent billions of dollars developing something approaching a universal intellectual assistant, and we've given it the professional responsibilities of a slightly overqualified office intern.

I think that's becoming a serious problem.

Not with AI.

With us.

## We're still thinking in tasks, not outcomes

Felix Rieseberg, an engineering manager at Anthropic who has worked on Claude, recently published an interesting article called [How to Be More Ambitious: A Tutorial for Humans with Models](https://felixrieseberg.com/how-to-be-more-ambitious-a-tutorial-for-humans-with-models/).

His observation is simple.

Everybody in AI keeps telling us to be more ambitious.

Very inspiring.

Unfortunately, that advice is about as useful as telling somebody who wants to become wealthy to consider earning more money.

What does being more ambitious with AI actually mean?

Felix proposes four dimensions:

Speed, Altitude, Depth and Range.

Speed is obvious.

Doing the same thing faster.

Write code in twenty minutes instead of three hours.

Analyse documents in seconds.

Prepare a presentation before the coffee gets cold.

Wonderful.

But that's the least interesting part.

The other three dimensions are where things start getting considerably more useful.

And they correspond closely to how I've increasingly been organising my own work with AI agents.

## 1. Altitude: stop describing the task, describe the outcome

Imagine your application crashes.

You open your coding agent.

"Fix this crash."

It examines the error, modifies some code, runs a test and announces that everything is fine.

The following day, another crash.

You open the agent again.

"Fix this one."

And so on.

Congratulations. You've created a very fast software maintenance department.

But you still have the same maintenance process.

Felix describes moving from fixing individual crashes to giving Claude responsibility for keeping applications crash-free.

That's a fundamentally different assignment.

Instead of specifying the next action, you specify the condition you want to maintain.

Of course, the agent needs the right infrastructure.

Access to crash reports.

Information connecting application versions to source-code revisions.

Machines running Windows, macOS and Linux.

The ability to reproduce failures, implement fixes and test whether they actually work.

Without those things, telling Claude to keep an application crash-free is merely an ambitious way of producing another chat response.

But once the infrastructure exists, the workflow changes.

The human no longer needs to discover every problem and manually initiate every investigation.

The system can continuously identify issues, investigate them and prepare verified fixes within its authorised scope.

You're no longer asking AI to perform a task. You're assigning it responsibility for an outcome.

That distinction applies far beyond software.

Take a quarterly business report.

The traditional request is:

"Prepare a presentation with this quarter's numbers."

The slightly better request is:

"Explain what changed, why it changed and what management should do."

Better.

Now go another level higher.

"Identify the three most important decisions leadership needs to make, evaluate the available options and explain the consequences."

And then another.

"Can we create a system that detects these problems before the quarterly report is necessary?"

Now we're getting somewhere.

The quarterly presentation was never the real product.

The real product was better decisions.

We had simply become so accustomed to producing presentations that we forgot why we were making them.

AI gives us an opportunity to [reconsider that entire process](/writing/ai-native-business-models-redesign-industries).

## 2. Depth: ask for expert methods, not expert vocabulary

Here's another familiar AI phenomenon.

You ask a model to behave like a world-class financial analyst.

It immediately becomes very professional.

The vocabulary improves.

The sentences become longer.

There are references to strategic frameworks, macroeconomic conditions and perhaps a beautifully formatted SWOT analysis.

Everybody is impressed.

Unfortunately, the actual analysis may still consist of five paragraphs and a Markdown table.

Felix makes an important distinction.

Working like an expert isn't the same as sounding like one.

A genuinely strong analyst doesn't become an expert by using sophisticated terminology.

They use better data.

Better methods.

Better instruments.

And stronger ways of checking whether their conclusions are correct.

If the task requires a proper statistical analysis, why are we accepting a table assembled from a handful of numbers?

Give the agent access to the underlying data.

Let it use a database.

Let it write analysis code.

Let it build appropriate statistical models.

Let it test assumptions.

And, most importantly, require evidence that its conclusions survive independent verification.

I particularly like Felix's suggestion to set deliberately demanding goals.

If a website currently loads in ten seconds and the obvious target is five, why not investigate whether 200 milliseconds is achievable?

That doesn't mean pretending the laws of physics have been repealed.

Sometimes the target will be unrealistic.

But a sufficiently ambitious target forces the system to question architectural assumptions rather than merely optimise a few existing functions.

Perhaps the problem isn't an inefficient database query.

Perhaps the database query shouldn't be necessary.

Perhaps the entire page should be generated differently.

Perhaps we're optimising a process that should be eliminated.

This is where AI becomes interesting to me.

Not when it performs existing work faster.

When it starts questioning why the work exists in its current form.

## The most important part: don't let AI grade its own homework

There's one recommendation in Felix's article that I particularly agree with.

Use independent verification.

AI models are perfectly capable of confidently explaining why their own work is excellent.

They can produce a beautiful report describing how successfully they completed a task.

They can review their own code.

They can congratulate themselves on a well-designed solution.

And sometimes they're even right.

But none of that constitutes independent evidence.

If an agent optimises a website, measure the performance.

If it builds software, run the tests.

If it creates a statistical model, evaluate it against data that wasn't used to develop it.

If it analyses a business process, compare its conclusions with actual operational results.

If it claims to have improved something, establish what improved and by how much.

This is particularly important with long-running agentic workflows.

An agent that works for thirty hours in the wrong direction may produce something extraordinarily elaborate.

Possibly with excellent documentation.

That doesn't make it useful.

In my own work, I increasingly rely on what I call taste gates.

These are points where the agent must show me a meaningful result before continuing.

A proposed architecture.

A working prototype.

A visual direction.

An analytical conclusion.

Something I can evaluate against the actual purpose of the project.

But taste gates aren't a replacement for objective tests.

They complement them.

The human provides judgement where judgement is required.

The independent tests provide evidence where evidence is possible.

And the agent does the execution between those checkpoints.

## 3. Range: stop hiring imaginary experts and start using their methods

The third dimension is particularly interesting for multi-agent systems.

Traditionally, if you wanted to approach a problem from several professional disciplines, you needed several specialists.

A financial analyst.

A lawyer.

A designer.

A researcher.

An industry expert.

Perhaps someone whose entire job was to tell the others why their ideas were terrible.

That last person is usually called a consultant.

Or, occasionally, a spouse.

AI makes it much cheaper to bring different analytical disciplines into the same workflow.

But there's a trap.

Asking five agents to pretend to be five experts doesn't necessarily create a team of experts.

You may simply receive five variations of the same answer, written in slightly different professional dialects.

Felix's point is more useful.

Don't ask the AI to sound like a short seller.

Ask it to perform the research a short seller would conduct.

Don't ask it to act like a forensic accountant.

Ask it to examine the evidence using forensic accounting methods.

Don't ask it to pretend to be a journalist.

Ask it to investigate sources, verify claims and identify contradictions.

The distinction is between role-playing and methodology.

And that is a distinction worth remembering when building multi-agent systems.

A collection of agents with impressive job titles is not automatically an effective organisation.

They need different responsibilities, relevant tools, access to appropriate information and a way to test their work.

Otherwise, you've simply recreated corporate bureaucracy inside a language model.

Which seems like a particularly disappointing use of the technology.

## This is how I increasingly think about AI-native work

I've written before about [how I work with AI agents](/writing/how-i-work-with-ai-agents-2026).

My substantial working sessions increasingly involve orchestrators coordinating specialised agents, rather than one model responding to a sequence of individual instructions.

I don't need to read every conversation between those agents.

I need to understand what they are doing, what they have achieved, which decisions require my involvement and how the results are being verified.

But Felix's article highlights something even more fundamental.

The most important decision happens before the agents start working.

What are we actually asking them to accomplish?

Consider one of my current projects, [MN7R](/work/mn7r).

It's an operating environment for agricultural commodity brokerage teams.

And agricultural brokerage is a wonderful example of an industry where people spend enormous amounts of time coordinating information.

Offers.

Bids.

Counterparties.

Contracts.

Logistics.

Execution.

Documents.

Reports.

Now imagine asking an AI agent:

"Create a dashboard showing our brokerage transactions."

Fine.

The agent will probably build a dashboard.

It might even be beautiful.

But that's a relatively small task.

What if we ask something more ambitious?

"Help the brokerage team identify commercial opportunities earlier, reduce missed matches between buyers and sellers, and prevent avoidable execution problems."

Now the work changes.

The agent needs to understand brokerage processes.

It needs structured access to historical transactions, bids, offers and relevant operational records.

It may need to investigate why some deals failed.

It should identify patterns, test hypotheses and propose measurable improvements.

And any proposed automation needs appropriate controls before it affects real commercial commitments.

That's a much deeper assignment.

It requires different tools.

Different evaluation methods.

Different expertise.

And potentially a different software architecture.

These are examples of the direction we're exploring with MN7R and the broader [AMI infrastructure](/work/ami), not claims that every such capability is already deployed.

But the underlying idea is the same.

Don't ask AI to build the next screen in your existing workflow. Ask whether the workflow itself should exist in that form.

That's what I consider genuinely AI-native development.

## A useful prompt for getting out of the task trap

Felix also shared a practical prompt for pushing models toward deeper work.

I like it because it doesn't rely on some elaborate collection of instructions about being a genius, thinking like Einstein or imagining that your life depends on the quality of a spreadsheet.

The original is available in [his article](https://felixrieseberg.com/how-to-be-more-ambitious-a-tutorial-for-humans-with-models/).

Here's how I would adapt the idea for my own agent workflows:

```text
I want a more rigorous solution to this problem,
not simply a larger deliverable.

Before starting:

1. Identify what a leading practitioner in this field
   would investigate that my current request overlooks.

2. Determine which original data, documents, systems
   or observations are needed to understand the problem
   without relying on preprocessed summaries.

3. Identify the actual professional methods, software
   and analytical techniques required.

4. Define objective tests or external evidence that
   would demonstrate whether the result is correct.

5. Identify the decisions that require my judgement
   and establish checkpoints before proceeding.

Then propose a better version of the task,
including the necessary tools, data access,
verification methods and expected outcome.

Do not expand the scope merely to produce more work.
```

The fifth step is my addition, based on how I organise long-running agent sessions.

I don't want agents to interrupt me every three minutes.

But I also don't want them spending forty hours implementing an architectural decision I would have rejected in the first ten.

A few correctly placed checkpoints can save an extraordinary amount of wasted work.

## There's already a skill for this

Naturally, somebody has already turned Felix's prompt into an Agent Skill.

Because apparently every useful paragraph now needs its own repository.

It's called be-ambitious.

The implementation is available here:

[be-ambitious on GitHub](https://github.com/DannyMac180/skills/tree/main/be-ambitious)

You can install it in a compatible agent environment using:

```sh
npx skills add https://github.com/DannyMac180/skills --skill be-ambitious
```

As with any third-party agent skill, inspect its instructions before installing it.

The skill is essentially a reusable way to apply Felix's method to an existing task.

It doesn't magically provide missing data.

It doesn't replace access to tools.

It doesn't guarantee that the agent will suddenly become a world-class statistician.

But it can help reformulate a mediocre request into something more useful.

And that is already valuable.

## The real limitation may no longer be the model

I think we're entering an interesting period in AI development.

For a long time, the central question was whether models were capable of doing useful work.

Then it became whether they could perform that work reliably.

Those questions still matter.

But increasingly, another limitation is becoming visible.

Our imagination.

Or, more precisely, our tendency to design AI workflows around the limitations of the previous generation of technology.

A model becomes capable of handling a complicated project.

We continue asking it to complete individual tasks.

An agent can use databases, browsers, development tools and external services.

We continue pasting a few paragraphs into a chat window.

Multi-agent systems become practical.

We ask five agents to write five opinions about the same PDF.

It's a bit like buying a modern aircraft and using it as a particularly expensive taxi.

Yes, it can take you to the supermarket.

But you're missing several rather interesting possibilities.

Felix's article is useful because it gives us a practical way to escape that habit.

Move higher and ask for the outcome.

Move deeper and demand the methods and evidence that serious professionals would use.

Move wider and bring in techniques from disciplines you wouldn't normally consider.

And stop confusing a longer answer with a better result.

Because the most interesting thing about AI isn't that it can complete yesterday's work faster.

It's that we can finally start asking it to do work we previously wouldn't have considered attempting at all.

The models are becoming more ambitious.

Perhaps it's time we caught up.
