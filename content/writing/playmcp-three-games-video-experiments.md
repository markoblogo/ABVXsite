---
{
  "id": "playmcp-three-games-video-experiments",
  "slug": "playmcp-three-games-video-experiments",
  "title": "PlayMCP in Practice: Three Games, Real Costs, and a New Way to Make Video",
  "seoTitle": "PlayMCP Review: 3 Games, Recorded Costs, and Video Experiments",
  "seoDescription": "I tested PlayMCP by building three games with an AI agent. Here’s what worked, what the experiments cost, and how we reused game scenes in videos with Framewright.",
  "summary": "Three playable games, recorded platform-credit costs, and experiments turning interactive scenes into videos with PlayMCP, Codex and Framewright.",
  "primarySection": "writing",
  "appearsIn": [
    "writing"
  ],
  "type": "article",
  "visibility": "public",
  "status": "live",
  "language": "en",
  "publishedAt": "2026-10-21",
  "updatedAt": "2026-10-21",
  "tags": [
    "playmcp",
    "ai-game-development",
    "creative-tools",
    "framewright",
    "video-production",
    "music-games",
    "toki-pona"
  ],
  "links": [
    {
      "type": "site",
      "label": "Framewright on ABVX",
      "url": "https://abvx.xyz/work/framewright"
    },
    {
      "type": "github",
      "label": "Framewright on GitHub",
      "url": "https://github.com/markoblogo/framewright"
    }
  ],
  "featured": false,
  "sortRank": 500,
  "needsReview": false,
  "homepageEligible": true,
  "media": {
    "src": "/media/writing/playmcp-three-games-video-experiments/cover.webp",
    "width": 1920,
    "height": 1080,
    "alt": "PlayMCP review cover reading “3 AI Games. Real Costs.” alongside scenes from Disco Coffee Showdown, SIRTET and Jekyll or Hyde.",
    "role": "generic-thumbnail"
  }
}
---

A coffee fight, a game where you sabotage a computer, and a Victorian vocabulary duel: those were my first three experiments with PlayMCP.

I discovered the platform through Natalia, PlayMCP’s creative director. She contacted me, suggested I test the service, and provided 250,000 platform credits to experiment with. That invitation gave me room to build things, play them, find problems, and revise them. The usage figures below come from that testing balance.

I’ve now made three playable games and several videos around them. Along the way, PlayMCP also became part of my work on Framewright, an open-source toolkit for an agent-operated video studio.

[Watch my short PlayMCP review](https://youtu.be/NVeMJLidncU)

## What PlayMCP does

[PlayMCP](https://playmcp.io/) lets you create and share games with an AI agent, with music central to its creative challenges. You sign in, [connect a compatible agent](https://playmcp.io/create), and develop your idea through conversation. I used Codex.

The agent writes the game code and works with the platform’s tools. In our experiments, that included analysing music, generating illustrations, animating characters, preparing assets, hosting builds, and running checks. I could then open the game, play it, and give feedback on what actually happened.

That last step mattered throughout the process. A build can run correctly while leaving the player unsure what to do. Characters can look good in a still image while feeling lifeless in motion. Working through those details was a substantial part of making the games.

PlayMCP also has community game pages and challenges. As of 21 October 2026, [First Music Game](https://playmcp.io/c/your-first-music-game/about) invites people to turn a track into a game, with free entry and a stated prize of 200,000 platform credits. I entered SIRTET. The contest has not produced a result yet; check its current brief if you want to participate.

## Three games, three different questions

### Disco Coffee Showdown: can a simple choice carry the joke?

The first experiment was a deliberately silly fan crossover: Jay and Silent Bob facing caffeine-fuelled alien worms in a coffee battle.

An early build mostly involved shooting incoming cups. It worked, but the interaction was too straightforward to carry the idea. We developed a second route: let Bob collect the coffee instead. Shooting and holding now lead the situation in different directions, with two exaggerated coffee-covered finales.

Making that choice understandable took several revisions. The cups had to belong visually to the characters. Jay’s weapon needed to point where he was firing. Reactions and endings needed to explain what the player had caused.

The useful lesson was how much small physical details contribute to understanding a game. A hand, a handle, or the direction of a prop can explain an action more effectively than another paragraph of instructions.

[Play Disco Coffee Showdown](https://playmcp.io/g/g_4FzN0mD8)

[Watch the game video](https://youtu.be/WLBxcM5JQ3U)

### SIRTET: the computer builds, you interfere

For the second game, I used my track **AI-logic** and reversed the familiar falling-block objective.

The computer tries to build tidy rows. You move and rotate the falling pieces to disrupt its work and fill the board. The name, SIRTET, reverses Tetris too. The opponent is a game-controlled builder; this is not a claim that a language model calculates every move live.

The first version made sabotage too easy. Strengthening the computer then made intervention frustrating: I could move a piece, only to see it immediately pulled back. We kept changing the struggle until interference felt consequential and the opponent could still recover.

The visual direction became industrial and unsettling: concrete-like blocks covering a vertical backdrop, degraded television typography, red light, and an animated mechanical face. Music and imagery gave the contest a mood beyond the board itself.

This experiment also produced an overview and a Short. The AI-win footage uses a disclosed seeded demonstration with the same rules, so it should not be read as a measured win rate for ordinary play.

[Play SIRTET](https://playmcp.io/g/g_hxx3yDS0)

[Watch the overview](https://youtu.be/wPIyeBYJZbQ)

[Watch the AI-win Short](https://youtube.com/shorts/Xeta6R8hvPg)

### Jekyll or Hyde: build the game as material for a book film

The third experiment started with a video-production goal. I wanted a promo for [The Strange Case of Dr. Jekyll and Mr. Hyde in Toki Pona](https://abvx.xyz/books/the-strange-case-of-dr-jekyll-and-mr-hyde-in-toki-pona), with a game providing the setting, actions, and character performances.

The mechanic is a short vocabulary duel. An English prompt appears with three Toki Pona choices. Correct answers help Jekyll; errors help Hyde. The first side to five wins. A rotating question pool gives repeat visits some variety, with meanings chosen in the context of the book.

We supplied the actual cover and an illustration as visual references. That helped bring the scenes closer to the book’s style. We also revised page perspective, removed accidental answer hints, strengthened character reactions, and fixed the automatic transitions and replay flow.

For the Toki Pona reading, I recorded my own voice. We selected a take, cleaned and edited it, and integrated it with the music. That recording also appears in the finished book promo.

The game became both a playable companion to the book and a source of material for the film. That is the use I want to explore further: interactive scenes with reusable characters, actions, and camera views for videos on other subjects.

[Play Jekyll or Hyde](https://playmcp.io/g/g_Zr0bwMnL)

[Watch the book promo](https://youtu.be/GPfkz36JWbI)

## What the experiments cost

These are recorded **PlayMCP credit usage figures**, including revisions and checks, through 19 October 2026:

- **Disco Coffee Showdown:** 21,294 credits
- **SIRTET:** At least 12,000 credits
- **Jekyll or Hyde:** 22,838 credits

The SIRTET figure is a confirmed subtotal from retained production stages. I do not have a complete itemised project total, so I am keeping it as a lower bound.

These credits came from the testing balance PlayMCP provided. They are not a cash bill or fixed prices for reproducing the games. AI-agent/model usage and the work of producing the accompanying videos are separate.

## Where Framewright fits

I used these experiments to develop [Framewright](https://github.com/markoblogo/framewright), my open-source toolkit for an agent-operated video studio.

Framewright helps an agent plan scenes, retain decisions and evidence, resume a production project, reuse materials, and prepare a local publication kit. The agent executes the chosen tools in its environment; the toolkit supplies methods, project structure, and checks.

Here, PlayMCP supplied the game-making environment and creative tools. Framewright helped carry the work into footage selection, narration, editing, covers, subtitles, and publication materials.

The three projects gave us different things to learn: readable comic interaction, a struggle balanced around music, and a book-specific virtual set. They also produced reusable workflows and records of what needed human judgment along the way.

I want to keep exploring that connection between interactive worlds and video production. A small game can be worth making for the experience of playing it, for the scenes it makes possible, or for both.

You can [try all three games on my PlayMCP profile](https://playmcp.io/u/markoblogo), [watch the service review](https://youtu.be/NVeMJLidncU), or explore [Framewright on GitHub](https://github.com/markoblogo/framewright).
