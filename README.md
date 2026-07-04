# Meera

Meera is a private memory engine for noticing the patterns hiding in your own words.

Most people leave useful self-knowledge scattered across notes, chats, journals, voice memos, screenshots, planning docs, and half-written thoughts. The problem is not that the information is missing. The problem is that it is hard to see what keeps repeating, what remains unfinished, and what quietly deserves attention.

Meera turns that scattered memory into a living mirror. It helps a person look across what they have already written and ask: What keeps coming back? What did I say I would do? What am I avoiding? What should I finish next?

## The Idea

Meera is built around a simple belief: your past words already contain signals about your present decisions.

A normal notes app helps you store information. A chat app answers questions. Meera sits between those two ideas. It remembers the raw material and turns it into useful reflection.

The experience is designed to feel less like managing a database and more like opening a calm, intelligent companion that remembers what you keep losing track of.

## What Meera Does

Meera lets users save memories in plain language:

- journal entries
- pasted chats
- planning notes
- rough thoughts
- voice memo transcripts
- screenshots or image uploads
- project updates
- anything that captures what happened, what was felt, or what was intended

From those memories, Meera surfaces signals such as repeated patterns, open loops, avoided decisions, unfinished work, and practical next moves.

The goal is not to create another productivity dashboard. The goal is to help the user recognize themselves more clearly and act from that clarity.

## Core Experience

The central flow is:

1. Add a memory.
2. Meera finds possible signals.
3. The user sees insight cards.
4. The user clicks an insight.
5. Chat opens with that context.
6. Meera helps turn the insight into a next action.

That flow makes Meera feel like a memory engine, not just a chatbot with stored notes.

## Mirror

The Mirror is the main reflection space.

It is where the user asks questions like:

- What am I avoiding?
- What keeps repeating?
- What should I do next?
- What feels unfinished?
- What changed lately?

Meera answers by pointing back to saved memories. The answer is not floating advice. It is grounded in evidence from the user's own words.

The Mirror includes modes for different kinds of thinking:

- **Reflect**: find emotional, behavioral, or thinking patterns
- **Execute**: turn memories into next actions
- **Recall**: recover something the user mentioned and may have forgotten
- **Decide**: reason through a decision using past notes
- **Weekly**: summarize the week into signals and next steps

This gives the app intentionality. The user is not just chatting. They are choosing the kind of memory work they want Meera to do.

## Today's Read

Meera includes a daily-feeling summary called **Today's Read**.

It gives the user a quick sense of what the app currently sees:

- how many fresh memories are available
- how many open loops appear
- whether repeated patterns are showing up
- one suggested question to ask next

This section gives Meera a reason to be opened regularly. It creates a light ritual: open the app, see what Meera noticed, follow the next thread.

## Insight Cards

Meera turns memory signals into clear, productized cards.

Examples:

### Repeated Pattern

"You keep returning to the same AI project idea."

This card helps the user notice what their attention keeps circling.

### Open Loop

"You said you would message five users, but it never appears again."

This card captures unfinished intentions.

### Avoided Decision

"You keep switching projects when launch or distribution comes up."

This card names the point where momentum breaks.

### Next Move

"Ship a tiny public version by Sunday."

This card turns reflection into action.

Each insight is designed to be actionable. The user can ask about it, turn it into a plan, mark it as true or not true, mark it as surprising, or pin it for later.

## The Unfinished Shelf

One of Meera's strongest concepts is **The Unfinished Shelf**.

It lists things the user appears to have started but not completed.

Examples:

1. **AI study app**  
   Mentioned five times, no launch action found.

2. **Portfolio redesign**  
   Mentioned three times, paused after the design stage.

3. **Contacting potential users**  
   Mentioned twice, never completed.

This feature is emotionally useful because unfinished work often lives as background noise. Meera gives it a place, a name, and a next step.

## Weekly Mirror

The Weekly Mirror is the sticky feature.

Every week, Meera can summarize:

- what changed
- what repeated
- what the user avoided
- what got finished
- what deserves attention next

This makes Meera more than a one-time reflection tool. It becomes a recurring way to understand personal momentum.

## Memory Strength

Meera does not treat every insight as equally certain.

It shows memory strength:

- **Weak evidence** when the signal is early or thin
- **Medium evidence** when a pattern appears across multiple memories
- **Strong evidence** when several sources point to the same thing

This matters because reflection tools should be careful. Meera should not pretend to know more than the memories support.

## Evidence-First Reflection

Every meaningful answer should point back to the user's own words.

Meera highlights evidence snippets from memories so the user can see why an insight appeared. This keeps the experience grounded and trustworthy.

Instead of saying:

"You are procrastinating."

Meera should say:

"In your Monday planning note, you wrote that you spent the afternoon changing colors instead of sending the pitch. In your chat with Maya, you said the app needed one more polish pass before sharing."

That difference is the product.

## Powered by BTL Runtime

Meera uses BTL Runtime for the AI work behind memory reflection and extraction.

- **Provider**: BTL Runtime
- **Endpoint**: `/v1/chat/completions`
- **Model**: `btl-2` or the configured Runtime model from `BTL_MODEL`
- **Used for**: memory reflection, pattern extraction, image-to-memory parsing, and chat responses

The app calls BTL through a server-side client wrapper, keeps the Runtime configuration in environment variables, and routes user-facing reflection through saved memory evidence before generating a response.

## Why Meera Feels Different

Many AI note tools focus on search, summaries, or chat.

Meera focuses on personal continuity.

It is not only asking, "What did you save?" It is asking:

- What keeps repeating?
- What did you leave open?
- What changed?
- What did you avoid?
- What are you ready to finish?

The user should open Meera and feel:

"This app remembers what I keep losing track of."

## Design Direction

Meera should feel calm, premium, and useful.

The interface is intentionally quieter than a typical dashboard. It uses space, hierarchy, and restrained visual weight so that the user can think without feeling managed.

The product voice should be direct but gentle. Meera should not sound like a therapist, a productivity coach, or a generic assistant. It should sound like a clear mirror with a good memory.

## Privacy Posture

Meera is built around private memory.

The memories a user saves can be personal, rough, unfinished, or emotionally honest. The product should treat that material with care. The interface, copy, and behavior should reinforce that this is the user's private workspace.

## Product Promise

Meera helps people convert scattered self-knowledge into clear signals and next actions.

It is for anyone who writes things down but still loses the thread:

- founders carrying too many loose tasks
- builders switching between ideas
- students trying to understand their habits
- creators tracking unfinished work
- anyone who wants a clearer relationship with their own words

Meera is not just a place to store memories.

It is a place to notice what your memories have been trying to tell you.
