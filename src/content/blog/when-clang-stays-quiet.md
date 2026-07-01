---
title: "when clang stays quiet"
date: 2026-06-22
description: "a small Sema fix that teaches Clang to warn on a function reference compared to null, and why these silent spots are the best place to start."
tags: ["clang", "sema", "diagnostics"]
---

Compilers communicate with us. When something goes wrong, they tell us what happened and where, through errors, warnings, and notes. That conversation is most of what makes a compiler pleasant to use.

But every so often the compiler goes quiet when it shouldn't. The code is suspicious, the kind of thing you almost certainly didn't mean, and the compiler waves it through anyway. Those silent spots are the ones I find most interesting. A warning that should exist and doesn't is a small gap you can actually close.

I found one of those last month, and fixing it was my favorite patch so far.

## the setup

Clang already warns when you compare something to null that can never be null. Take this:

```cpp
int i = 42;
&i != nullptr;   // clang warns: this is always true
```

The address of a local variable is never null, so the comparison is pointless. Clang says so. Good.

It does the same for a plain function name:

```cpp
void foo();
foo != nullptr;  // clang warns here too
```

A function's address is never null either, so again, always true. Clang catches it.

## the gap

Now watch what happens with a reference to a function:

```cpp
void foo() {}

int main() {
    void (&f)() = foo;
    return f != nullptr;   // silence
}
```

`f` is a reference bound to a function. It can't be null. So `f != nullptr` is always true, exactly like the cases above. But Clang said nothing.

That bothered me. The three cases are the same idea wearing slightly different clothes. A pointer to something that can't be null, a function name, a reference to a function. Two of them got a warning and the third slipped through. There was no good reason for the third to be special.

## the fix

The logic lives in a Sema function called `DiagnoseAlwaysNonNullPointer`. Sema is the part of Clang that does semantic analysis, the stage that works out what your code actually means after it's been parsed.

The function already knew how to handle a bare function name. It just didn't look through a reference to reach the function underneath. So the fix was to teach it to see through the reference. Once it could, the existing checks did the rest. Both `-Wtautological-pointer-compare` and `-Wpointer-bool-conversion` started firing for the reference case, the same way they already did for the others.

The whole change was small. A few dozen lines, most of them tests. That's normal for this kind of work, and I've grown to like it. A tiny, focused patch that makes the compiler a little more consistent is a satisfying thing to ship.

## why i like these

There's a particular joy in closing a gap like this. Nothing dramatic happens. No new feature, no big rewrite. The compiler just gets a little better at telling the truth about your code, in one more place where it used to shrug.

For a first-timer, these silent-spot bugs are a gift. They're small enough to actually finish, the surrounding code shows you the pattern to follow, and when you're done the compiler does something it couldn't do before. If you want to start contributing to Clang, go looking for the places where it stays quiet. There are more of them than you'd think.
