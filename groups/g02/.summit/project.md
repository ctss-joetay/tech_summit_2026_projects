
# Project Brief: Grandkid House (for g02)

WHO: elderly (65+) users, comfortable with phones but not complex apps. They miss family, esp. overseas grandkids, and want a simple way to feel connected/see each other.

WHAT WE'RE BUILDING: A cosy shared "home" webpage. Everyone who joins appears as a cute rounded cuboid avatar (Stardew-Junimo-like) in an isometric pastel living room. No login/accounts — just type a name and join. Nothing is remembered between visits — must type name again each time.

KEY FEATURES (build order):
1. Name + Join screen (refuse empty name, show a clear message)
2. Isometric-styled home room showing every joined avatar (real shared presence via Summit.db table, polled)
3. Click own avatar → choose status: working, sleeping, chores, playing games, relaxing, exercising, free to chat — shown as icon/label on the sprite, persists until changed
4. Voice chat: when 2+ avatars are "free to chat", they can start/join a group call; a dedicated call screen shows avatars around a round table with animated voice-reactive shapes; Leave/End Call returns to home room. Must support people joining/leaving while 2+ remain.

VISUAL RULES: main colour #2DD4BF, pastel palette, isometric cute pixel-art feel, wood/cosy living-room vibe, rounded shapes only. NEVER minimal black-and-white or sharp corners.

CHECKS TO KEEP WORKING:
- Join/end-call buttons must visibly change the screen, or show a clear error
- Clicking status changes the avatar's animation/label until next change, or shows a clear error
- Empty name is refused with a message asking for a name
- A call with 2+ people stays alive when someone joins/leaves

DATA: Shared avatar presence lives in a Summit.db table (`avatars`: name, color, status) — this is the group's live "who's home" list, polled by all visitors. Nothing else is saved (no login persistence, per brief).
