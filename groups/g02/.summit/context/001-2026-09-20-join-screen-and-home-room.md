---
id: 001
date: 2026-09-20
topic: join-screen-and-home-room
files_touched: script.js, index.html
decisions:
  - Nothing persists between sessions per brief — users must re-enter name each visit
  - Used a shared database table for avatars, polled every 2 seconds, so multiple visitors see each other in the home room
  - Built join screen + home room first as the single working piece; status-setting and voice call deferred to later turns
open_questions:
  - none
---

Built the first working version of a cosy isometric-style family home app for elderly users to feel connected to family. Implemented a join screen requiring a name (empty name is refused with an error) and a shared home room where each joined user appears as a bobbing pastel rounded-cuboid avatar with their name tag, using a database table polled every 2 seconds so multiple visitors see each other live. Visual style follows the brief: teal accent colour, pastel palette, rounded corners, cosy wood-and-cream aesthetic. Avatar status-setting (idle animations) and the voice chat room are not yet built and are planned for future turns.
