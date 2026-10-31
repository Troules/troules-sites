---
title: "Self-improving agent harnesses: three approaches in 2026"
description: "Exo, ModularRSI and agentskill take different routes to better agent harnesses. None I checked combines self-improvement with mining a repo's history."
date: "2026-10-31T23:55"
lang: "en"
kind: "research"
tags: ["agents", "agent-harness", "self-improvement", "llm"]
sources:
  - title: "exoharness/exo (GitHub README)"
    url: "https://github.com/exoharness/exo"
  - title: "ModularRSI: Modular and Generalizable Recursive Harness Self-Improvement (arXiv 2609.14857)"
    url: "https://arxiv.org/abs/2609.14857"
  - title: "airscripts/agentskill (GitHub README)"
    url: "https://github.com/airscripts/agentskill"
---

An agent harness is the layer that owns prompts, model calls, context and tools around an LLM. Some harnesses can now change themselves. This article compares three projects that approach harness quality from different angles, and what I could not find.

## Exo lets the agent edit its own harness

Exo is an MIT-licensed agent runtime. Its [README](https://github.com/exoharness/exo) describes a split between a harness's semantics (compaction, tool calling, planning) and the infrastructure around it, and it supports Codex, Claude Code and Pi out of the box. The repository describes Exo as able to "safely edit all aspects of itself at runtime to get better at your tasks".

Self-improvement is not the current core. The README points to an archive of earlier Exo versions, which included "a separate harness built on top of Exo as an experiment in self-evolution". The docs also say they are still being written and that some documented features are not implemented yet. So the claim is real at the design level, but I would treat it as early.

## ModularRSI evolves a harness from its own trajectories

ModularRSI ([arXiv 2609.14857](https://arxiv.org/abs/2609.14857), revised October 2026) is the most concrete research result of the three. It compares successful and failed trajectories for the same task, aggregates evidence across tasks, and evolves five modules: agent loop, tool use, observation management, context management and task completion detection.

Two design choices stand out. Each module evolves inside a restricted scope, which makes changes easier to attribute. The evolution tasks are also drawn from sources disjoint from the evaluation benchmarks, to avoid tuning to the test. The paper reports consistent gains on TB2.0 and SWE-Bench Verified, including on unseen tasks and across foundation models. The learning signal here is runs, not a codebase's history.

## agentskill reads a repo's conventions

[agentskill](https://github.com/airscripts/agentskill) turns a codebase into an `AGENTS.md` playbook. Its README calls it a forensic extraction tool: it walks a repository, measures source conventions, reads formatter and linter configuration, inspects Git history, and analyzes imports, symbols and tests, then emits structured evidence for an LLM. It does not change its own behaviour. Its job is to give a coding agent an accurate picture of an existing project before it starts working in it.

## What is missing

The three projects cover different parts of the problem. agentskill gathers evidence from a repository's history and conventions. ModularRSI improves a harness from the outcomes of its own runs. Exo provides a runtime where an agent can edit its harness. I did not find a project that does all three: mining a repository's history to build a harness, then improving that harness from results.

That combination is a plausible design, not a tested one. The obvious risks are that history reflects past mistakes as well as good practice, and that changes which pass tests may not be real improvements. ModularRSI's split between successful and failed runs is one way to guard against the second risk.

## Takeaways

- Exo makes self-editing a runtime property, but its self-evolution work was in an earlier, separate experiment.
- ModularRSI shows that contrasting successful and failed trajectories, and evolving modules separately, can transfer to unseen tasks and models.
- agentskill extracts conventions and history from a repo, but does not learn from outcomes.
- No project I checked combines repository-history analysis with outcome-driven self-improvement.
