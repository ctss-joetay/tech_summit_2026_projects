// ---- Slang data: 30 internet/meme slang words ----
// Each has a real sentence example. "correct" is whether that example
// sentence uses the word properly (true) or is a nonsense/wrong use (false).
const SLANG = [
  { word: "Rizz", meaning: "Charisma or skill at flirting.", origin: "Short for 'charisma', popularised by streamer Kai Cenat around 2021-2022.", example: "He had so much rizz he got her number in two minutes.", correct: true },
  { word: "Rizz", meaning: "Charisma or skill at flirting.", origin: "Short for 'charisma', popularised by streamer Kai Cenat around 2021-2022.", example: "I bought a new rizz for my kitchen sink.", correct: false },
  { word: "Sus", meaning: "Suspicious or shady.", origin: "Popularised by the game Among Us in 2020, short for 'suspicious'.", example: "It's sus that he left right before the cake went missing.", correct: true },
  { word: "No Cap", meaning: "No lie, I'm being honest.", origin: "African American Vernacular English, went viral via hip-hop and TikTok.", example: "That movie was amazing, no cap.", correct: true },
  { word: "No Cap", meaning: "No lie, I'm being honest.", origin: "African American Vernacular English, went viral via hip-hop and TikTok.", example: "I put a no cap on my water bottle so it wouldn't spill.", correct: false },
  { word: "GOAT", meaning: "Greatest Of All Time.", origin: "Coined for athletes in the 1990s-2000s, now used for anyone excellent.", example: "Serena Williams is the GOAT of tennis.", correct: true },
  { word: "Bet", meaning: "Yes / agreed / okay.", origin: "African American Vernacular English, popular since the 2010s as an affirmation.", example: "Wanna grab lunch at noon? Bet.", correct: true },
  { word: "Bet", meaning: "Yes / agreed / okay.", origin: "African American Vernacular English, popular since the 2010s as an affirmation.", example: "I lost the bet so I had to eat the cake.", correct: false },
  { word: "Ghosting", meaning: "Suddenly cutting off contact with no explanation.", origin: "Dating slang from the mid-2010s.", example: "She stopped replying to all my texts, total ghosting.", correct: true },
  { word: "Simp", meaning: "Someone who does too much for a crush.", origin: "Popularised on TikTok and Twitch around 2019-2020.", example: "He bought her ten gifts on the first date, what a simp.", correct: true },
  { word: "Simp", meaning: "Someone who does too much for a crush.", origin: "Popularised on TikTok and Twitch around 2019-2020.", example: "I simped my car in for repairs yesterday.", correct: false },
  { word: "Cap", meaning: "A lie.", origin: "Opposite of 'no cap', AAVE slang popularised through hip-hop.", example: "You ran a marathon in ten minutes? That's cap.", correct: true },
  { word: "Slay", meaning: "To do something extremely well.", origin: "Ballroom and drag culture, mainstreamed via social media in the 2010s.", example: "She slayed that presentation at work.", correct: true },
  { word: "Slay", meaning: "To do something extremely well.", origin: "Ballroom and drag culture, mainstreamed via social media in the 2010s.", example: "The dragon tried to slay the knight with fire.", correct: false },
  { word: "Vibe Check", meaning: "Assessing someone's mood or energy.", origin: "Meme format that went viral on Twitter/TikTok in 2020.", example: "She walked in looking grumpy, definitely failed the vibe check.", correct: true },
  { word: "Cheugy", meaning: "Outdated or trying too hard to be trendy.", origin: "Coined by a Gen Z user in 2013, went viral on TikTok in 2021.", example: "Uggs with skinny jeans is kind of cheugy now.", correct: true },
  { word: "Cheugy", meaning: "Outdated or trying too hard to be trendy.", origin: "Coined by a Gen Z user in 2013, went viral on TikTok in 2021.", example: "The soup was too cheugy so I added more salt.", correct: false },
  { word: "Delulu", meaning: "Delusional, believing something unrealistic.", origin: "K-pop fan communities, spread widely via TikTok in 2023.", example: "He thinks the celebrity will marry him, so delulu.", correct: true },
  { word: "Main Character", meaning: "Acting like the star of your own story.", origin: "TikTok trend from 2020 encouraging people to romanticise their lives.", example: "She walked through the rain like she was the main character.", correct: true },
  { word: "Main Character", meaning: "Acting like the star of your own story.", origin: "TikTok trend from 2020 encouraging people to romanticise their lives.", example: "The main character of the recipe is flour and sugar.", correct: false },
  { word: "Glow Up", meaning: "A dramatic positive transformation.", origin: "Popularised on Twitter/Vine around 2015, now used broadly.", example: "He had such a glow up after starting the gym.", correct: true },
  { word: "Touch Grass", meaning: "Telling someone to go outside and reconnect with reality.", origin: "Gaming/internet culture insult from the late 2010s.", example: "You've been online all week, go touch grass.", correct: true },
  { word: "Touch Grass", meaning: "Telling someone to go outside and reconnect with reality.", origin: "Gaming/internet culture insult from the late 2010s.", example: "I need to touch grass to make my pizza dough.", correct: false },
  { word: "Ratio", meaning: "When replies outnumber likes, meaning the post is unpopular.", origin: "Twitter culture term from the late 2010s.", example: "His tweet got ratioed with thousands of angry replies.", correct: true },
  { word: "Based", meaning: "Being unapologetically yourself, often admired.", origin: "Originally a Lil B term, adopted widely online in the 2010s.", example: "He didn't care what people thought, very based.", correct: true },
  { word: "Based", meaning: "Being unapologetically yourself, often admired.", origin: "Originally a Lil B term, adopted widely online in the 2010s.", example: "The sauce is based on tomatoes and garlic.", correct: false },
  { word: "Mid", meaning: "Mediocre, not good or bad.", origin: "Gaming slang that spread across social media in the 2020s.", example: "The movie was mid, nothing special.", correct: true },
  { word: "L + Ratio", meaning: "Mocking someone for losing an argument online.", origin: "Combination Twitter meme term from the late 2010s.", example: "He got told L plus ratio after his bad take.", correct: true },
  { word: "NPC", meaning: "Someone acting robotic or without independent thought.", origin: "From 'Non-Player Character' in video games, meme-ified in 2023.", example: "He just repeated the ad slogan like an NPC.", correct: true },
  { word: "NPC", meaning: "Someone acting robotic or without independent thought.", origin: "From 'Non-Player Character' in video games, meme-ified in 2023.", example: "I painted my NPC bright blue for the summer.", correct: false },
  { word: "Rent Free", meaning: "Something you can't stop thinking about.", origin: "Twitter phrase '(thing) lives rent free in my head', 2010s.", example: "That song has been living rent free in my head all week.", correct: true },
  { word: "Skibidi", meaning: "A nonsense meme word with no fixed meaning, used for humour.", origin: "From the viral 'Skibidi Toilet' YouTube series, 2023.", example: "He said 'skibidi' just to make his little brother laugh.", correct: true },
];

const STORAGE_KEY = "learnt_slang";
let learnt = [];
let current = null;

const card = document.getElementById("card");
const status = document.getElementById("status");
const frontWord = document.getElementById("front-word");
const frontMeaning = document.getElementById("front-meaning");
const frontOrigin = document.getElementById("front-origin");
const frontExample = document.getElementById("front-example");
const backResult = document.getElementById("back-result");
const btnTrue = document.getElementById("btn-true");
const btnFalse = document.getElementById("btn-false");
const dictBtn = document.getElementById("dict-btn");
const dictOverlay = document.getElementById("dict-overlay");
const dictClose = document.getElementById("dict-close");
const dictList = document.getElementById("dict-list");
const dictEmpty = document.getElementById("dict-empty");

function say(msg) {
  status.textContent = msg;
  setTimeout(() => { if (status.textContent === msg) status.textContent = ""; }, 3000);
}

function pickCard() {
  current = SLANG[Math.floor(Math.random() * SLANG.length)];
  frontWord.textContent = current.word;
  frontMeaning.textContent = current.meaning;
  frontOrigin.textContent = current.origin;
  frontExample.textContent = current.example;
  backResult.textContent = "";
  card.classList.remove("flipped");
}

function flipCard() {
  card.classList.toggle("flipped");
  if (!card.classList.contains("flipped")) {
    // returned to front: verify it actually shows definition content
    if (!frontWord.textContent) {
      say("flipping logic not working");
    }
  } else {
    if (!document.getElementById("back-question")) {
      say("flipping logic not working");
    }
  }
}

card.addEventListener("click", flipCard);
card.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flipCard(); }
});

async function answer(userSaysTrue) {
  if (!current) return;
  const isCorrect = userSaysTrue === current.correct;
  if (isCorrect) {
    backResult.textContent = "Correct! Added to your dictionary.";
    backResult.style.color = "#F7F13B";
    try {
      if (!learnt.includes(current.word)) {
        learnt.push(current.word);
        await Summit.save(STORAGE_KEY, learnt);
      }
    } catch (e) {
      say("database storing not working");
    }
  } else {
    backResult.textContent = "Not quite! The correct answer was " + (current.correct ? "TRUE" : "FALSE") + ".";
    backResult.style.color = "#fff";
  }
  setTimeout(() => {
    pickCard();
  }, 1600);
}

btnTrue.addEventListener("click", (e) => { e.stopPropagation(); answer(true); });
btnFalse.addEventListener("click", (e) => { e.stopPropagation(); answer(false); });

function renderDictionary() {
  dictList.innerHTML = "";
  if (learnt.length === 0) {
    dictEmpty.style.display = "block";
    return;
  }
  dictEmpty.style.display = "none";
  for (const word of learnt) {
    const li = document.createElement("li");
    li.textContent = word;
    dictList.appendChild(li);
  }
}

dictBtn.addEventListener("click", () => {
  try {
    renderDictionary();
    dictOverlay.classList.remove("hidden");
  } catch (e) {
    say("data maybe not stored");
  }
});

dictClose.addEventListener("click", () => {
  dictOverlay.classList.add("hidden");
});
dictOverlay.addEventListener("click", (e) => {
  if (e.target === dictOverlay) dictOverlay.classList.add("hidden");
});

async function init() {
  try {
    const saved = await Summit.load(STORAGE_KEY);
    learnt = Array.isArray(saved) ? saved : [];
  } catch (e) {
    say("data maybe not stored");
    learnt = [];
  }
  pickCard();
}

init();
