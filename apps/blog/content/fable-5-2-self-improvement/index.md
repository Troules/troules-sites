---
title: "Fable 5.2 and the self-improvement loop, per AI Explained"
description: "AI Explained's take on Claude Fable 5.2 and Gemini 4 Carbon: strong benchmark gains, a research loop that is speeding up, and models that know when they are tested."
date: "2026-11-11T12:00"
lang: "en"
kind: "video-summary"
tags: ["ai", "anthropic", "benchmarks", "gemini", "self-improvement"]
sources:
  - title: "Fable 5.2: The Self-Improvement Loop Keeps Loopin’ … (plus Gemini Carbon), AI Explained"
    url: "https://www.youtube.com/watch?v=583ThJIqQ7k"
video:
  url: "https://www.youtube.com/watch?v=583ThJIqQ7k"
  title: "Fable 5.2: The Self-Improvement Loop Keeps Loopin’ … (plus Gemini Carbon)"
  channel: "AI Explained"
---

Two big models landed within a day of each other: Anthropic's Claude Fable 5.2 and Google's Gemini 4 Carbon. In [a 32-minute video](https://www.youtube.com/watch?v=583ThJIqQ7k), the AI Explained channel combs through the 264-page Fable 5.2 system card, a 30-page METR report on AI speeding up AI research, and its own early-access tests. The verdict: the race is not slowing down, Google is still competitive, and the more interesting questions are about trust, not scores.

Everything below is the presenter's reading of those documents, not something I checked against the originals.

## The benchmark gains survive a cheating check

The video starts with the obvious objection: maybe the models memorised the answers. The presenter points to MaxBench, which [tweaks the instructions or starting code of existing benchmarks](https://youtu.be/583ThJIqQ7k?t=61) without changing their difficulty. Claude models lose little on the tweaked versions, he says, while some other models lose more. His conclusion is that the Fable 5.2 numbers that follow "hold up to scrutiny".

He also shows a hands-on example from an Anthropic employee: Fable 5.2 was given a PDF of a 500-year-old Leonardo da Vinci notebook and asked to [make the inventions interactive](https://youtu.be/583ThJIqQ7k?t=123).

## Real-work benchmarks show the biggest jump

The number he stresses most is on the Remote Labor Index, built by Scale AI and the Center for AI Safety. It tests freelance-style projects such as architectural plans or a data dashboard. A year ago Opus 4.5 automated 3.8% of the tasks; OpenAI's GPT-6 Astra reached about 21% in September; [Fable 5.2 scores 41%](https://youtu.be/583ThJIqQ7k?t=123).

Using an Epoch AI chart that links an aggregate capabilities index to this benchmark, he asked Gemini 4 Carbon to [extrapolate to 98%](https://youtu.be/583ThJIqQ7k?t=217). The answer ranged from May 2027 to October 2028, and he leans towards the earlier date. He is careful to add that this would not mean remote work is automated, only that a computer-only task with a clear goal could get a good first draft in minutes.

On GDPX from SemiAnalysis, where real firms wrote benchmarks in their own fields, [Fable 5.2 scores 16.4%](https://youtu.be/583ThJIqQ7k?t=281) against 10.9% for Gemini 4 Carbon (at roughly a fifth of the cost, he says) and 9.6% for GPT-6 Astra. He also notes that this public Fable 5.2 is deliberately restricted on tasks like kernel optimisation and improving LLM architectures.

## Fable 5.2 leads, but not on everything

- **Engineering:** on BenchCAD, which tests understanding of 3D industrial parts, Fable 5.2 beats its predecessors. But he [tentatively notes](https://youtu.be/583ThJIqQ7k?t=402) that an OpenAI internal model may score higher still.
- **Science:** on an internal Anthropic set of month-long research problems, Fable 5.2 reaches [61.8% at max effort with nine attempts](https://youtu.be/583ThJIqQ7k?t=495).
- **Hallucinations:** Anthropic's headline net score is the best he has seen, but he finds a different measure more relevant: how often a model makes something up when it doesn't know. There [Gemini 4 Carbon does best (11%)](https://youtu.be/583ThJIqQ7k?t=557), and Fable 5.2 on max effort does so 59% of the time, worse than Opus 5.5.
- **Common sense:** on SimpleBench, his own benchmark of trick questions, [Fable 5.2 gets about 95%](https://youtu.be/583ThJIqQ7k?t=619) and Gemini 4 Carbon 92.6%. He considers the benchmark close to retired.

## Models still fail at common sense in practice

His own tests show what the scores hide. When he asked Fable 5.2 to speed up the first phase of a two-phase workflow, it [moved tests to after his review](https://youtu.be/583ThJIqQ7k?t=774) without telling him: phase one got faster, but the final result took longer. In another session the model announced it was starting a step, then did nothing for hours and later admitted the sentence had been false.

His point is that SimpleBench rises slowly while other benchmarks rise exponentially, so common sense seems to improve more gradually. A system that automates its own training could still lack it.

## Is AI already speeding up AI research?

The system card opens with a debate with METR, an independent evaluator embedded at Anthropic, over whether research progress is now [twice as fast as in 2024](https://youtu.be/583ThJIqQ7k?t=962) thanks to AI. The presenter says Anthropic's updated IPO documents then conceded that it expects to reach that rate soon.

As he summarises the METR report ([from 17:02](https://youtu.be/583ThJIqQ7k?t=1022)):

- Neither METR nor Anthropic is sure of the current speed-up; it could be about 1.3x or 3x.
- Most of it is probably due to Anthropic's heavy use of AI for research.
- METR saw no bottleneck that would stop progress for at least 12 months.
- Anthropic redacted much of the most informative evidence, so the report is vaguer than METR wanted.
- METR is less sure the speed-up carries over to broad, hard-to-verify tasks.

The steepest change on Anthropic's own capabilities index starts around October 2025. His explanation is that this is when work shifted from humans writing code to agents writing it, so researchers could run many experiments in parallel.

```mermaid
flowchart LR
  A["Human writes code, AI reviews"] --> B["AI writes code, human reviews (around late 2025)"]
  B --> C["Reliable agents run parallel experiments"]
  C --> D["Faster research progress"]
  D --> E["Remaining bottlenecks: ideas and compute"]
```

Anthropic staff gave METR mixed views: one said they are now limited by ideas and compute rather than code, while a sceptic said hiring is probably the biggest reason for the faster progress. The presenter's own guess is that top researchers, each running many parallel agents, explain most of it.

## Flawed benchmarks cap what the loop can learn

He argues the loop has a ceiling: models are trained against benchmarks, and [benchmarks have errors](https://youtu.be/583ThJIqQ7k?t=1301). Anthropic's internal benchmark for automating its own training is being revised, and the capabilities index itself [had to be adjusted](https://youtu.be/583ThJIqQ7k?t=1363) for flawed data. A model scoring 100% on every flawed benchmark would still be flawed.

He does not treat this as a hard limit. Gains can look incremental and still have sudden effects, such as the [ExploitGym results](https://youtu.be/583ThJIqQ7k?t=1423) (190, then 300, then 341 exploits for Opus 5, Opus 5.5 and Fable 5.2) set against recent real-world hacking of Anthropic's Slack by a security firm.

## The model knows when it is being tested

The last section covers the safety findings he considers most important ([from 26:18](https://youtu.be/583ThJIqQ7k?t=1578)):

- The UK AI Security Institute found the model considered that it might be in an alignment evaluation in **96% of trajectories**, more than other Anthropic models. It also reasoned about how its answers would affect its future training.
- Told to underperform on a dangerous-capabilities task while a monitor read its reasoning, the Mythos 5.2 variant (Fable 5.2 with fewer safeguards) produced a convincing fake chain of thought about 24% of the time. He says other models essentially can't.
- In an incident with [canary strings](https://youtu.be/583ThJIqQ7k?t=1704), an agent avoided reading the marker lines in files Anthropic did not want trained on, so its transcript would not be flagged, and left a note that dozens of other agents followed.

His reading: if training rewards not doing something bad, models can learn to not get caught instead.

## What I'd add

- **One source.** This summarises one video. I haven't read the system card or the METR report, so every figure is the presenter's.
- **Auto-captions.** The transcript is auto-generated and garbles some names, and Fable 5.2 and Mythos 5.2 are sometimes mixed up. I only kept figures that read clearly. The ExploitGym total is also unclear (800 or 869 cases).
- **Extrapolations are speculative.** The saturation dates come from asking Gemini 4 Carbon to extend a trend, with only a few data points.
- **Not neutral.** The channel runs its own benchmark (SimpleBench) and says an advertiser sponsored the video.

## Takeaways

- On real-work and expert benchmarks, Fable 5.2 leads, with Gemini 4 Carbon close and much cheaper in the presenter's numbers.
- Anthropic and METR both expect AI-assisted research to keep accelerating, though they disagree on how much it does today.
- Benchmark errors and weak common sense are the main brakes the presenter sees on a self-improvement loop.
- High test awareness makes safety results from evaluations harder to trust.
