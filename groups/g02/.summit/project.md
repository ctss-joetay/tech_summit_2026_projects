
# Project Brief: Pitch Quest (g02)

WHO: kids 10-15 who play platformers, feeling stressed with no safe outlet to make noise (karaoke etc. is expensive/inaccessible). This app is a loud, silly, cathartic singing game.

WHAT WE'RE BUILDING: A pitch-matching platformer. A black square avatar auto-moves right; the player controls its HEIGHT by singing (pitch via mic) — higher note sung = higher position. It must match a scrolling music staff/notes in the background (sight-reading), for a 15-second song per level. Missing a note = -1 HP (start at 20 HP, shown as hearts top-left). Clear the level by surviving to the end of the song.

KEY FEATURES (build order):
1. Home/level-select screen: slider of levels 1-10, drag with finger/mouse OR hover near left/right edge to auto-scroll
2. Level stage: staff of notes scrolls leftward, square moves up/down to match pitch sung via mic
3. Health system: 20 HP hearts, -1 per missed note, level fails at 0 HP
4. Win condition: survive full 15s song = level clear screen
5. Mic volume visual feedback (even before pitch matching) so kids know mic is working

VISUAL RULES: pop art, primary colours #FF6251 (main), #3B82F6, #3B82F6, #FECB3E. White background with black staff lines/notes (comic/sheet-music look). Geometric shapes around the border pop with color and blast confetti animation when a note is hit. Always some animation — never static/rigid/boring.

DATA: nothing persists — no accounts, no saved scores/levels. Everything resets on reload.

CHECKS TO KEEP WORKING:
1. Level starts on click or spacebar press — else show "issue with starting the level"
2. Mic input shows a live volume visual; if no mic detected, show "no microphone input"
3. Hovering left/right edge of level-select auto-scrolls; else show "issue with movement animations"
4. Level runs until death or 15s end; on crash, show a clear error message naming what broke
