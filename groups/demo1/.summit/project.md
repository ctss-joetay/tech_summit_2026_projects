## Project Brief

**Who:** 50-60 year olds who want to understand modern internet slang/memes used by their grandchildren.

**What we're building:** A single-page "Slang of the Day" card app.
- Front page shows a Pokémon-card-style card: slang word, meaning, origin, and an example sentence that is **always a correct/appropriate usage**.
- Click/tap card → flips to a True/False quiz side showing a *different* example sentence for the same word — this one **may be a correct usage or an incorrect/nonsense usage**, randomly, and the visitor judges which.
- Correct answer → word gets added to visitor's personal "Dictionary" (learnt words).
- Wrong or tapping again → card flips back to definition side.
- Top-right dictionary icon opens a panel/modal listing all learnt words.
- Next to it, a **notepad icon** opens a "Practice a Sentence" panel: visitor picks a slang word from a dropdown, types their own sentence, clicks Check, and an AI call (`Summit.generate`, streamed) judges whether the word was used correctly and explains why in 1-2 sentences. **With the new notepad function**, visitors can now key in their own original sentence (not just pre-set examples) to test whether they're using a chosen slang word correctly in context, and get AI feedback on it.
- 30 slang/meme words total in the data set, each with its own correct front-example and a separate quiz-example + quizCorrect flag.

**Persistence:** one visitor's learnt word list, saved via Summit.save (key/value array of learnt words).

**Visual style:** pop art — thick black outlines, bright bursts of colour, colours #2B4DD4 (main), #F7573B (accent), #F7F13B (highlight). Cute, smooth animated transitions on every interaction. Text is bold/heavy-weight and generously sized throughout for readability by an older audience (uses clamp()-based responsive sizing so long words/sentences shrink to fit rather than overflow the card). Never cluttered, always readable. SVG icons only, no stock photos.

**Required checks (must show a spoken/visible message on failure):**
1. Tap card in quiz mode → flips back to definition. Fail message: "flipping logic not working"
2. Tap card in definition mode → flips to quiz. Fail message: "flipping logic not working"
3. Click dictionary icon → shows all correctly-answered words. Fail message: "data maybe not stored"
4. Correct T/F answer → saves word as learnt. Fail message: "database storing not working"
5. AI sentence-check: if AI call is blocked/unavailable, shows the platform's message verbatim in the practice panel.

**Status:** Core loop built and working (card + flip + quiz + dictionary + persistence). Font sizing increased and made responsive to avoid overflow. Added AI-powered "Practice a Sentence" feature via notepad icon, with the new notepad function letting visitors type their own sentences for AI-checked slang usage feedback.

**Open question:** Whether the AI call budget dashboard counter is just delayed/not refreshing versus an actual tracking bug (raised by group, not yet resolved — no code change needed unless it persists).
