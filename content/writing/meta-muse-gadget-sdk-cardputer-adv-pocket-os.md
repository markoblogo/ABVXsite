---
{
  "id": "meta-muse-gadget-sdk-cardputer-adv-pocket-os",
  "slug": "meta-muse-gadget-sdk-cardputer-adv-pocket-os",
  "title": "Meta's Muse Gadget SDK Already Supports My Cardputer. Now Comes the Interesting Part.",
  "seoTitle": "Meta Muse Gadget SDK: M5Stack Cardputer ADV, ESP32 and Pocket OS",
  "seoDescription": "Meta's open-source Muse Gadget SDK supports ESP32 devices, including M5Stack Cardputer ADV. I'm exploring integration with my Pocket OS and Android TV.",
  "summary": "Meta released an open-source SDK connecting AI to inexpensive electronics. My Cardputer ADV is officially supported, so I've started investigating what it could add to Pocket OS.",
  "primarySection": "writing",
  "appearsIn": [
    "writing"
  ],
  "type": "article",
  "visibility": "public",
  "status": "live",
  "language": "en",
  "publishedAt": "2026-10-19",
  "updatedAt": "2026-10-19",
  "tags": [
    "meta-muse",
    "muse-gadgets",
    "esp32",
    "m5stack-cardputer",
    "pocket-os",
    "embedded-ai",
    "ai-agents",
    "iot",
    "open-source",
    "android-tv",
    "saved-find",
    "saved-find-status-exploring"
  ],
  "links": [
    {
      "type": "github",
      "label": "Saved Find — Meta Muse Gadget SDK (exploring)",
      "url": "https://github.com/facebookincubator/muse-gadget-sdk"
    },
    {
      "type": "site",
      "label": "Pocket OS for Cardputer on ABVX",
      "url": "https://abvx.xyz/work/pocket-os-cardputer"
    },
    {
      "type": "site",
      "label": "Related: Android TV Saved Find",
      "url": "https://abvx.xyz/writing/android-tv-debloat-codex-claude-code-adb"
    },
    {
      "type": "github",
      "label": "Official Cardputer ADV device documentation",
      "url": "https://github.com/facebookincubator/muse-gadget-sdk/blob/main/esp32/devices/README.md"
    },
    {
      "type": "github",
      "label": "Pocket OS / ABVx repository",
      "url": "https://github.com/markoblogo/Pocket-OS-Cardputer-ABV"
    }
  ],
  "featured": false,
  "sortRank": 500,
  "needsReview": false,
  "homepageEligible": true,
  "media": {
    "src": "/media/writing/meta-muse-gadget-sdk-cardputer-adv-pocket-os.jpeg",
    "width": 1280,
    "height": 983,
    "alt": "Screenshot of the Muse Gadgets website introducing its open-source device SDKs and example hardware.",
    "role": "generic-thumbnail"
  }
}
---

_Meta has released an open-source SDK that connects tiny devices to its Muse AI agent. My M5Stack Cardputer ADV is officially supported, and I've already started investigating what this could mean for my Pocket OS._

I have a weakness for small computers.

Not laptops.

Not smartphones.

I'm talking about those ridiculous little devices with tiny screens, miniature keyboards and processors that would probably have struggled to run a respectable desktop operating system twenty years ago.

I own an **M5Stack Cardputer ADV**.

It's a tiny ESP32-S3-powered computer with a keyboard, a screen, a microphone and various other useful components packed into something you can comfortably carry in your pocket.

And naturally, instead of simply enjoying the device, I decided to develop my own operating system for it.

Because apparently I don't have enough projects.

It's called **Pocket OS / ABVx**.

Then Meta released something interesting.

**Muse Gadget SDK.**

And, rather conveniently, my exact Cardputer model is already on the officially supported hardware list.

That seemed worth investigating.

## Meta wants Muse to interact with physical devices

[Muse Gadgets](https://github.com/facebookincubator/muse-gadget-sdk) is a new open-source project from Meta.

The idea is fairly straightforward.

Instead of restricting an AI assistant to a smartphone or computer, developers can connect it to inexpensive physical electronics.

Displays.

Buttons.

Microphones.

Speakers.

Sensors.

Various other components.

Meta has released two SDKs under the Apache 2.0 licence.

One targets ESP32 microcontrollers.

The other targets Raspberry Pi and other Linux computers.

The ESP32 version allows compatible devices to communicate with Muse, Meta's personal AI agent. The Linux version can expose commands, files and system information to the agent.

Essentially, the physical device becomes another interface or endpoint for AI.

And this is where things get interesting.

You don't necessarily need a powerful computer to give a small device access to a sophisticated AI system.

**The intelligence doesn't have to run on the device itself.**

The device can handle interaction, input, output and specific hardware functions while the actual AI processing happens elsewhere.

This isn't a new concept, obviously.

But having an open-source SDK designed specifically for this kind of integration makes experimentation much more accessible.

## My Cardputer is already supported

I initially assumed I'd have to investigate whether the SDK could be adapted to my hardware.

Then I opened the [official ESP32 device documentation](https://github.com/facebookincubator/muse-gadget-sdk/blob/main/esp32/devices/README.md).

And there it was.

**M5Stack Cardputer ADV.**

Not merely another ESP32 board with vaguely similar specifications.

The actual device.

Meta's SDK includes an experimental Cardputer ADV target with a user interface, push-to-talk input and text responses.

The implementation uses the device's keyboard controls, including GO/Space for voice interaction.

There are limitations.

The Cardputer ADV has no PSRAM, so the current Muse implementation doesn't support the home-network tunnel available on some more capable boards. It also doesn't support displaying images received from Muse, and its replies are text-based.

But that doesn't particularly bother me.

It's a tiny computer.

I don't expect it to become a workstation.

What interests me is how much useful interaction can fit into such a small device.

The official support also gives me something particularly valuable: an existing implementation to study rather than having to design the entire integration from scratch. [GitHub](https://github.com/facebookincubator/muse-gadget-sdk/blob/main/esp32/devices/README.md)

## I already have my own operating system for it

My project is called [Pocket OS / ABVx](/work/pocket-os-cardputer).

It's an offline-first personal operating system built around simple everyday activities.

Listening to music.

Reading books.

Recording short voice notes.

Keeping notes and an inbox.

Tracking journeys.

Managing small personal routines.

There's also a Mac companion application for preparing content and handling some device operations.

The idea is not to create another miniature smartphone.

Quite the opposite.

I want a small device that does a few useful things without constantly demanding attention, an internet connection or another subscription.

That's why the offline-first principle matters to me.

But I've also been interested in adding optional AI capabilities.

And Muse Gadget SDK provides another possible direction to explore.

Not necessarily by replacing Pocket OS with Meta's firmware.

That would rather defeat the purpose of developing my own operating system.

The more interesting question is whether some of the Muse integration concepts, communication mechanisms and supported functionality could coexist with my current architecture.

There are technical complications, including different ESP-IDF versions, memory limitations and the existing firmware's responsibilities.

So this is not something I intend to solve by blindly flashing another image onto the device.

I've already sent the SDK to Codex to investigate alongside the Pocket OS project.

**The investigation has started. The conclusions haven't arrived yet.**

Which is precisely why I'm saving this discovery here.

## And then there's my Android TV

This also connects to another project I've been considering.

I recently discovered an interesting approach to [optimising Android TV using coding agents and ADB](/writing/android-tv-debloat-codex-claude-code-adb).

The idea is to have Codex or Claude Code inspect installed packages, identify potentially unnecessary services and help simplify the television's operating environment.

I haven't tested that workflow on my own TV yet.

But now I'm wondering whether Muse could eventually become another part of the experiment.

Not necessarily running directly on Android TV.

The released SDKs target ESP32 and Linux, not Android TV as a supported platform.

A Raspberry Pi or another Linux device could potentially serve as a bridge, with appropriate software exposing carefully controlled TV functions.

Or perhaps a more suitable integration approach will emerge.

I don't know yet.

And I don't particularly want to invent an elaborate architecture before examining the available tools.

But the possibility is interesting.

Imagine controlling selected television functions through an AI interface, without depending entirely on the manufacturer's built-in assistant.

Or creating a small hardware controller that communicates with an AI agent and interacts with other devices in your home.

There are plenty of possibilities worth investigating.

Whether any of them are practical is another question.

## I like where this is heading

What interests me most about Muse Gadgets isn't one particular board or feature.

It's the gradual separation of intelligence from the physical device.

For decades, more capable software generally required more capable hardware.

Bigger processors.

More RAM.

More storage.

More power.

But when the intelligence can operate remotely, a small computer can become useful in ways that aren't directly proportional to its local computing resources.

The device still has to handle communications, interface responsiveness, hardware controls and reliability.

Network connectivity becomes another dependency.

And, of course, privacy and access permissions need attention.

But the possibilities are different.

A tiny device doesn't need to become powerful enough to run everything itself.

It needs to become good at interacting with a larger system.

And that fits rather nicely with what I've been building in Pocket OS.

## One more thing for my growing list of experiments

So, for now, this is a Saved Find.

Not a completed integration.

Not a benchmark.

Not a review claiming that I've successfully turned my Cardputer into an AI assistant.

Just an interesting technology, official hardware support for a device I already own, and an investigation that has started.

I'll return to the subject once Codex has established what can realistically be reused and what would require changing the existing firmware.

I'm also keeping the Android TV possibility in mind.

And perhaps I'll eventually find a useful way to connect several of these devices.

Or discover that the entire idea is unnecessarily complicated.

Both are perfectly acceptable outcomes.

After all, experimentation is supposed to answer questions.

Not merely confirm that every idea was brilliant.

For now, the important links are:

**[Meta Muse Gadget SDK on GitHub](https://github.com/facebookincubator/muse-gadget-sdk)**

**[Official ESP32 documentation, including Cardputer ADV](https://github.com/facebookincubator/muse-gadget-sdk/blob/main/esp32/README.md)**

**[Pocket OS / ABVx for M5Stack Cardputer ADV](https://github.com/markoblogo/Pocket-OS-Cardputer-ABV)**

A new SDK.

A tiny computer.

An existing operating system.

And another perfectly reasonable excuse to spend several evenings experimenting.
