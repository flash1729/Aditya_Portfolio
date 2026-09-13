---
title: "turning on a warning for everyone"
date: 2026-09-13
description: "one commented-out line in Clang, 35+ patches to get there, a merge, two reverts, and what it taught me about why LLVM reviews the way it does."
tags: ["clang", "llvm", "diagnostics", "open source"]
---

The change that started all of this is one line. In `DiagnosticGroups.td`, inside the group that defines `-Wall`, `UnusedTemplate` sat there commented out. Someone wrote the warning back in 2017, and for nine years it stayed switched off. My job was to uncomment it.

That's it. That's the whole patch, if you only look at the diff that flips the switch. But getting to the point where that line could land took a month of cleanup, 35+ patches, and a genuinely humbling crash course in what it means to change a tool this many people depend on.

## what the warning does

`-Wunused-template` flags function and variable templates that have internal linkage and never get used. On paper that's housekeeping. Here's why it matters more than it sounds.

Think about this: you write a function template in a header and mark it `static`. Every `.cpp` file that includes that header now gets its own private copy. Fine, until another inline function in that same header calls it. Now different translation units are referring to different entities under the same name. That's a One Definition Rule violation, and the standard files it under "ill-formed, no diagnostic required." The compiler is allowed to say nothing while your program does something subtly wrong.

An unused internal-linkage template in a header is exactly the shape of code that turns into that bug. So the warning catches the smell before it becomes the disease.

## why you can't just flip it

Before you turn a warning on for everyone, your own house has to be clean. LLVM builds itself with `-Werror` on a lot of bots. If I'd enabled the warning with 652 of them still in the tree, every one of those bots would've gone red in the same hour.

So the order of work was fixed for me. Build the whole tree with the flag on, collect every warning, fix them all, and only then touch the line. 652 raw warnings, 46 unique sites, about 24 files. They fell into three kinds:

1. A `static` or anonymous-namespace template in a header. Drop the internal linkage. Templates are already implicitly inline, so this costs nothing and fixes the real ODR problem.
2. A template in a `.cpp` file that nothing ever instantiates. Dead code. Delete it.
3. A template only used inside `assert()` or `LLVM_DEBUG()`, which vanish in release builds. Mark it `[[maybe_unused]]` and move on.

I split the fixes by area so each one could be reviewed by someone who actually owns that code. One patch for Mips, one for VPlan, one for the IR verifier, one for JITLink, a couple for Clang itself. Every single one tagged NFC. Small, boring, and easy to say yes to.

## the part where review earns its keep

Here's the thing I didn't fully appreciate going in. Clang is the compiler behind Chrome, every iPhone app, Android, PlayStation, and a large share of Google's C++. When `-Wall` changes, it changes for all of them at once. A default flipped in Clang is a default flipped in a very large fraction of the software that exists.

That's why LLVM reviews the way it does, and it's why I stopped seeing it as friction somewhere around the third patch. Every change went to the people who maintain that corner of the tree. Some sat for a week. On a couple I was asked to wait for the original author of the code to weigh in before anything moved. On the frontend patch I had to argue for keeping two helpers that nothing currently instantiates, because deleting them would've quietly broken any future option that needed them.

That's the process doing its job. It's the only real defense between a one-line change and a lot of broken builds nobody asked for. The more I dig into how LLVM works, the more I think the review culture is the actual product. The compiler is what falls out of it.

## how it actually landed

The flip went in on July 6. It got reverted the same day. Something tripped once it met the full set of bots, I sorted it out, and relanded it the next day. That's normal here, and honestly it felt reassuring. The system caught something before it reached anyone downstream.

Then it sat on `main` for about seven weeks. During that time LLVM 23 branched, so the release branch inherited the warning switched on.

## and then the false positives came in

Once a warning is on for everyone, everyone's code starts talking back to you.

The first report was a false positive involving a `requires` clause. Code that was clearly in use, flagged as unused. Then a bigger one: many false positives in GPU code, in exactly the kind of codebase where people build with `-Werror` and can't just ignore it.

So on August 25 the change was reverted on `main`, and the revert was backported to the release branch the same day. It missed the 23.1.0 tag by a few hours. Which means Clang 23.1.0 shipped with `-Wunused-template` in `-Wall`, and 23.1.1 has it off again. I had to laugh when I saw the dates line up. You can do everything by the book and still ship by accident.

## where it stands

Right now the warning is back to opt-in on `main`. The tree is still clean, and other people have kept fixing new instances as they show up in MLIR, LLDB, BOLT, and a couple of other places, which genuinely made me happy. The cleanup outlived the flip.

The plan is to fix the false positives one at a time, the `requires` clause case first, then the GPU one, and try the flip again once the diagnostic stops shouting at correct code. Iteratively, with the same reviews, for the same reason. If you're going to change something that ends up in this many places, slow is the only honest speed.
