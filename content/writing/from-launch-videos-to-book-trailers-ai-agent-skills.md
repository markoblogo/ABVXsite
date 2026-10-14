---
{
  "id": "from-launch-videos-to-book-trailers-ai-agent-skills",
  "slug": "from-launch-videos-to-book-trailers-ai-agent-skills",
  "title": "From Launch Videos to Book Trailers: Another Experiment With AI Agent Skills",
  "type": "article",
  "primarySection": "writing",
  "appearsIn": [
    "writing"
  ],
  "status": "live",
  "visibility": "public",
  "summary": "After testing /brag on software projects, I used Codex, local Kokoro narration and sound design to create French and English book trailers.",
  "seoTitle": "AI Book Trailers With Codex, Kokoro and Agent Skills",
  "seoDescription": "Two real book trailers, in French and English: testing Codex, local Kokoro narration and a modular AI workflow for video, timing and sound.",
  "language": "en",
  "publishedAt": "2026-10-14",
  "tags": [
    "ai-agents",
    "agent-skills",
    "codex",
    "ai-video",
    "book-trailers",
    "kokoro",
    "hyperframes",
    "publishing",
    "sound-design"
  ],
  "links": [],
  "media": {
    "src": "/media/writing/from-launch-videos-to-book-trailers-ai-agent-skills.png",
    "width": 1672,
    "height": 941,
    "alt": "From Books to Trailers: an AI video experiment with Jeanne la bataillonneuse and the three Good Dogs of the Apocalypse books.",
    "role": "generic-thumbnail"
  }
}
---

*After testing /brag on two software projects, I tried a more modular workflow with Codex, local narration and sound design. The results were two book trailers—and a useful reminder that more technical complexity doesn't always produce a better video.*

Earlier today, I wrote about [testing /brag on AsciiTheme and AMI](https://abvx.xyz/writing/brag-ai-agent-skill-launch-videos-review).

The appeal was practical: take a project I've already built and turn it into a short video without making video production another substantial project.

Both experiments produced something useful.

Then I came across a different approach.

Someone described a workflow combining Claude Code, an object-anatomy skill, a sound-layer toolkit and historical photographs. The idea was to reconstruct scenes, build objects and eventually make simulations match photographic evidence.

An ambitious proposition.

My immediate question was whether we could explore the same tools with Codex—and use my own projects as test material.

If an experiment works, I'd rather end up with something I can actually use.

We eventually produced two book trailers: one in French, another in English. Getting there involved an interesting detour.

## The idea was bigger than the first useful test

The starting points were [Anatomy](https://github.com/wheresryan22/anatomy) and [opus-sound-layer](https://github.com/Bodila51/opus-sound-layer).

Anatomy provides tools and instructions for building detailed visual representations of objects, including isometric SVG scenes, with additional rendering options.

Despite the Claude-focused post that introduced it to me, the repository already supports Codex.

The sound toolkit supplies a different part of the process: arranging recorded effects, mixing tracks and checking the resulting audio.

Its name mentions Opus, but the underlying scripts aren't tied to that model.

Together, these looked like useful components for an agent-directed production workflow. They didn't, however, amount to a verified historical reconstruction system.

That distinction matters. We didn't test whether a physical simulation could reproduce a historical photograph. We tested whether parts of this approach could help produce promotional videos.

## Our first attempt was technically interesting—and less convincing

We began with AsciiTheme again.

Using Anatomy's bundled desk-computer example as a starting point, we adapted a retro computer scene to display the project. The screen, keyboard and sound cues needed to follow the same timeline so that rendering a particular moment would always produce the same result.

That worked.

The visual export completed, and the focused checks passed. But the sound experiment still had unresolved audibility problems.

More importantly, I preferred the earlier AsciiTheme video made with Brag.

The additional machinery hadn't produced a stronger introduction to the product.

A detailed animated computer can be interesting to build. It doesn't automatically make the software inside it easier to understand or more appealing.

So we changed direction.

Instead of spending longer polishing the computer, I suggested using books already published on my website. We had existing covers, promotional images and clear product pages. A successful experiment would become usable publishing material.

## Test 1: A French trailer for Ukrainian modernism

The first finished result was a trailer for [*Jeanne la bataillonneuse, suivi de Miss Adrienne*](https://abvx.xyz/books/geo-chkouroupiy-jeanne-la-bataillonneuse), by Géo Chkouroupiy, in the *Modernisme ukrainien* collection.

[Watch the French trailer on YouTube →](https://youtu.be/PmhWa-V00zc)

This needed a different treatment from a software launch.

We used the existing book imagery, drawing the colours and typography from its visual identity. Gentle reframing and clean cuts gave the images movement while keeping the book recognisable.

The French narration introduced the settings and themes of the two works: war and revolution, the factory, unemployment and the promises of the industrial city.

For the voice, I chose local Kokoro rather than an account-based cloud service. The model and production files stayed on my external work drive.

One useful detail was how we handled timing.

We generated the narration in separate passages, measured their actual duration and built the sequence around the resulting speech. That gave us a more reliable rhythm than estimating how long a paragraph ought to take.

The finished trailer runs for approximately 28 seconds.

There were also ordinary editing decisions. Early crossfades produced distracting overlaps in the typography, so we replaced them with clean cuts. The restrained literary treatment didn't need additional sound effects.

The result was a French-language promotional asset built from material I already had.

## Test 2: Good Dogs of the Apocalypse

The second trailer was for [*Good Dogs of the Apocalypse*](https://abvx.xyz/good-dogs-of-the-apocalypse), a darkly comic System Apocalypse LitRPG series.

[Watch the English series trailer on YouTube →](https://youtu.be/89kTx1LhEP0)

Three books gave us a natural sequence:

- *Good Dog, Bad System*
- *Good Dog, Bad District*
- *Good Dog, Bad Authority*

The creative direction was darker and more direct. We used the existing promotional images, colours from the covers and an English voiceover generated locally with Kokoro.

The opening line was written for the trailer:

*The world changed. The dogs read the fine print.*

From there, the video moves through the books in reading order and introduces the series through survival, community and the freedom to choose.

The main version runs for approximately 34 seconds. We also made a separate six-second teaser to try a much more compressed approach.

These were production experiments, rather than an audience test. We haven't measured which version attracts more readers or produces more clicks.

## The sound needed more than “add a few effects”

This was where the second workflow became particularly useful.

We initially tried page-turn sounds at the book reveals. They matched the cuts, but the checks showed that the effects weren't sufficiently audible in the mix.

We then tried warmer book-placement recordings.

Two worked. The middle one still didn't.

The final version keeps two accents, bracketing the three-book sequence.

We removed the effect that wasn't helping, rather than changing the checks to make it pass.

The delivered French and English exports both passed the sound toolkit's final automated checks, including loudness, peak levels and the balance between narration and music. The music sat roughly 16–17 loudness units below the voice during speech.

Those checks provide useful technical evidence. They don't decide whether a voice is engaging, whether a name sounds natural or whether the trailer makes someone want to read the book. Listening and editorial judgement remain part of the process.

But they do catch problems that “the file rendered successfully” tells you nothing about.

## How this compares with Brag

The two experiments share some infrastructure, including Hyperframes for rendering. Their main difference was how the production work was organised.

- **Starting material.** **Brag:** Software projects and landing pages. **Modular workflow:** Existing book imagery and product pages.
- **Organisation.** **Brag:** A packaged launch-video workflow. **Modular workflow:** Separate visual, narration and sound steps.
- **Our outputs.** **Brag:** Short AsciiTheme and AMI introductions. **Modular workflow:** French and English book trailers.
- **Main benefit.** **Brag:** A quick route from project to presentation. **Modular workflow:** More deliberate control over speech, timing and audio.
- **Main cost.** **Brag:** Still requires factual and visual review. **Modular workflow:** More assembly, iteration and judgement.

Brag also supports narration; we simply didn't use it in our first two videos.

So this isn't a comparison between a silent tool and a speaking one. It's a comparison between a ready-made production workflow and a more deliberately assembled process.

For a short software announcement, I would still start with Brag.

For a book trailer where language, pacing and sound deserve closer attention, the modular approach gives us useful control.

## What we actually established

We started with a claim about historical photographs, object reconstruction and simulation.

We finished with two voiced book trailers.

We didn't validate historical reconstruction, a general-purpose physics workflow or a swarm of collaborating agents. Anatomy contributed an exploratory prototype; it wasn't the central visual tool in the final book videos.

What we did establish was a practical local workflow for combining existing product imagery, narration in two languages, motion, music and checked audio exports.

We also learned when to stop pursuing a technically interesting direction.

The computer scene was more elaborate than the first AsciiTheme promo. I still liked the simpler promo better.

The book trailers worked because their treatment suited the material: restrained and literary for the French edition, darker and more immediate for *Good Dogs*.

That seems a useful direction for further experiments.

Choose something real from the catalogue. Decide what it needs to communicate. Use the tools that help. Review the result.

If the experiment succeeds, there's a promotional asset ready to use—and a better understanding of which parts of the process are worth repeating.


**The two finished tests:**

- [Jeanne la bataillonneuse — French book trailer](https://youtu.be/PmhWa-V00zc)
- [Good Dogs of the Apocalypse — English series trailer](https://youtu.be/89kTx1LhEP0)

**Earlier experiment:** [I Tested /brag: An AI Agent Skill That Turns Projects into Launch Videos](https://abvx.xyz/writing/brag-ai-agent-skill-launch-videos-review)

**Tools explored:** [Anatomy](https://github.com/wheresryan22/anatomy), [opus-sound-layer](https://github.com/Bodila51/opus-sound-layer), [Kokoro ONNX](https://github.com/thewh1teagle/kokoro-onnx) and [Brag](https://github.com/latent-spaces/brag).
