---
id: 004
date: 2026-08-26
topic: pokemon-go-reskin-motion
files_touched: script.js, index.html
decisions:
  - Simulate walking distance via phone accelerometer/devicemotion shake intensity instead of GPS, since GPS isn't available in sandbox
  - Include a manual 'simulate shake' button for desktop testing
  - Use a walking progress bar that spawns rarity-tiered critters, caught via chance-based catch button
  - Persist caught critters using Summit.save
open_questions:
  - none
---

Rebuilt the app from scratch as 'Roam Catchers', a Pokémon Go-style reskin where walking is tracked via the phone's motion sensor (devicemotion) rather than GPS, which isn't available in this sandbox. Shaking/movement fills a walking progress bar that spawns random critters with different rarities, which the player can attempt to catch with a chance-based catch button. Caught critters persist across reloads via Summit.save. A simulate-shake button was added so the game can be tested without a real phone.
