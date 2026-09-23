# Project Brief

**Who:** 50-60 year olds who want to understand modern internet slang/memes used by their grandchildren.

**What we're building:** A single-page "Slang of the Day" card app.
- Front page shows a Pokémon-card-style card: slang word, meaning, origin, example sentence.
- Click/tap card → flips to a True/False quiz: "was this used appropriately in a sentence?"
- Correct answer → word gets added to visitor's personal "Dictionary" (learnt words).
- Wrong or tapping again → card flips back to definition side.
- Top-right dictionary icon opens a panel/modal listing all learnt words.
- 30 slang/meme words total in the data set.

**Persistence:** one visitor's learnt word list, saved via Summit.save (key/value array of learnt words).

**Visual style:** pop art — thick black outlines, bright bursts of colour, colours #2B4DD4 (main), #F7573B (accent), #F7F13B (highlight). Cute, smooth animated transitions on every interaction. Never cluttered, always readable. SVG icons only, no stock photos.

**Required checks (must show a spoken/visible message on failure):**
1. Tap card in quiz mode → flips back to definition. Fail message: "flipping logic not working"
2. Tap card in definition mode → flips to quiz. Fail message: "flipping logic not working"
3. Click dictionary icon → shows all correctly-answered words. Fail message: "data maybe not stored"
4. Correct T/F answer → saves word as learnt. Fail message: "database storing not working"

**Status:** Building first version now (card + flip + quiz + dictionary + persistence).
