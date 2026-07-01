---
title: "my first month inside llvm"
date: 2026-06-28
description: "what it's actually like to make your first contributions to LLVM and Clang, starting from one small warning nobody had turned on."
tags: ["llvm", "clang", "compilers"]
---

Compilers have pulled at me for a long time. I kept reading about how they work, and at some point reading stopped being enough. I wanted to touch the real thing.

So last month I started contributing to LLVM. If you've written Swift, Rust, C, or C++, you've already run code that LLVM and Clang touched. It's one of those projects that quietly sits under everything.

I'll be honest about day one. The codebase is enormous. Cloning it takes a while. The first full build ran long enough that I made chai, came back, and it still wasn't done. I opened the source tree and had no clue where anything lived.

So I did the simple thing. I picked one small warning and followed it everywhere it went.

## the warning nobody had turned on

The warning was `-Wunused-template`. It already existed in Clang, written back in 2017. But it sat there switched off. It was marked `DefaultIgnore` and commented out of the `-Wall` group, so in practice nobody ever saw it.

The issue I picked up asked me to turn it on. Sounds like a one-line change. Uncomment it, done. It was not a one-line change.

## why an unused template is actually a bug

Here's the part that made me sit up.

Say you write a function template in a header and mark it `static`, or tuck it inside an anonymous namespace. That gives it internal linkage. Now every `.cpp` file that includes the header gets its own private copy of that template.

Most of the time that's just wasteful. But if another inline function or template in the same header calls it, the copies in different translation units now refer to different entities. That's a One Definition Rule violation. The standard calls it ill-formed, no diagnostic required, which is about the scariest phrase in C++. It means the compiler is allowed to stay silent while your program quietly does the wrong thing.

`-Wunused-template` catches the smell of this. An unused internal-linkage template in a header is exactly the shape of code that turns into this bug. So the warning earns its place. It closes a real hole and keeps the pattern from creeping back in.

## the grind

Once I built LLVM with the flag on, the tree lit up. 652 raw warnings. 46 unique spots. Around 24 files. Nothing would compile clean until every one was fixed.

I sorted them into three kinds:

1. A `static` or anonymous-namespace template in a header. Fix: drop the internal linkage. Templates are already implicitly inline, so removing `static` costs nothing and fixes the ODR problem.
2. A template in a `.cpp` that nothing ever instantiates. That's dead code. Delete it.
3. A template used only inside `assert()` or `LLVM_DEBUG()`, which both vanish in release builds. Mark it `[[maybe_unused]]` so it's honest about being conditional.

Then I split the work into small per-area patches. One for Mips, one for VPlan, one for the IR verifier, a couple for Clang's own frontend, and so on. Each one tagged NFC, which means no functional change. Reviewers like NFC patches because they're easy to reason about, and I learned to keep them tiny on purpose.

One of my favorites was a tiny Clang one. Two frontend templates were tripping the warning. The first, `moveOnNoError`, turned out to be a plain duplicate of a function that already lived in another file, so I deleted it. The other two were option-marshalling helpers that no current compiler option uses, but a future one might:

```cpp
// kept on purpose, even though nothing instantiates them yet
template <typename T>
[[maybe_unused]] static T mergeMaskValue(...);

template <typename T>
[[maybe_unused]] static T extractMaskValue(...);
```

Deleting them would've been a trap for whoever adds that option later. So I kept them and marked them `[[maybe_unused]]`. Knowing which to delete and which to keep took more thought than I expected.

## what the month taught me

The code was the smaller lesson. The bigger one was how a project this size actually moves.

Nothing lands fast. You open a patch, someone reviews it, you go back and forth, and only then does it merge. The final flip-the-switch patch can't even go in until every cleanup patch ahead of it has merged, or CI goes red. Watching that dependency chain made the whole thing click for me. A big change in LLVM isn't one heroic commit. It's a stack of small, careful, boring ones.

I came in wanting to understand compilers. I'm leaving the month understanding a little more about the discipline around them, and I didn't expect to enjoy that part as much as I do.

If you're sitting on the edge of contributing to something this big, here's what worked for me. Pick one small warning. Follow it all the way down. You'll learn more than any tutorial can teach you.
