// ---- Slang data: 30 internet/meme slang words ----
// "example" is always a CORRECT usage, shown on the front of the card.
// "quizExample" is the sentence used in the True/False quiz on the back —
// it may or may not be a correct usage. "quizCorrect" says which.
const SLANG = [
  { word: "Rizz", meaning: "Charisma or skill at flirting.", origin: "Short for 'charisma', popularised by streamer Kai Cenat around 2021-2022.", example: "He had so much rizz he got her number in two minutes.", quizExample: "I bought a new rizz for my kitchen sink.", quizCorrect: false },
  { word: "Sus", meaning: "Suspicious or shady.", origin: "Popularised by the game Among Us in 2020, short for 'suspicious'.", example: "It's sus that he left right before the cake went missing.", quizExample: "It's sus that he left right before the cake went missing.", quizCorrect: true },
  { word: "No Cap", meaning: "No lie, I'm being honest.", origin: "African American Vernacular English, went viral via hip-hop and TikTok.", example: "That movie was amazing, no cap.", quizExample: "I put a no cap on my water bottle so it wouldn't spill.", quizCorrect: false },
  { word: "GOAT", meaning: "Greatest Of All Time.", origin: "Coined for athletes in the 1990s-2000s, now used for anyone excellent.", example: "Serena Williams is the GOAT of tennis.", quizExample: "Serena Williams is the GOAT of tennis.", quizCorrect: true },
  { word: "Bet", meaning: "Yes / agreed / okay.", origin: "African American Vernacular English, popular since the 2010s as an affirmation.", example: "Wanna grab lunch at noon? Bet.", quizExample: "I lost the bet so I had to eat the cake.", quizCorrect: false },
  { word: "Ghosting", meaning: "Suddenly cutting off contact with no explanation.", origin: "Dating slang from the mid-2010s.", example: "She stopped replying to all my texts, total ghosting.", quizExample: "She stopped replying to all my texts, total ghosting.", quizCorrect: true },
  { word: "Simp", meaning: "Someone who does too much for a crush.", origin: "Popularised on TikTok and Twitch around 2019-2020.", example: "He bought her ten gifts on the first date, what a simp.", quizExample: "I simped my car in for repairs yesterday.", quizCorrect: false },
  { word: "Cap", meaning: "A lie.", origin: "Opposite of 'no cap', AAVE slang popularised through hip-hop.", example: "You ran a marathon in ten minutes? That's cap.", quizExample: "You ran a marathon in ten minutes? That's cap.", quizCorrect: true },
  { word: "Slay", meaning: "To do something extremely well.", origin: "Ballroom and drag culture, mainstreamed via social media in the 2010s.", example: "She slayed that presentation at work.", quizExample: "The dragon tried to slay the knight with fire.", quizCorrect: false },
  { word: "Vibe Check", meaning: "Assessing someone's mood or energy.", origin: "Meme format that went viral on Twitter/TikTok in 2020.", example: "She walked in looking grumpy, definitely failed the vibe check.", quizExample: "She walked in looking grumpy, definitely failed the vibe check.", quizCorrect: true },
  { word: "Cheugy", meaning: "Outdated or trying too hard to be trendy.", origin: "Coined by a Gen Z user in 2013, went viral on TikTok in 2021.", example: "Uggs with skinny jeans is kind of cheugy now.", quizExample: "The soup was too cheugy so I added more salt.", quizCorrect: false },
  { word: "Delulu", meaning: "Delusional, believing something unrealistic.", origin: "K-pop fan communities, spread widely via TikTok in 2023.", example: "He thinks the celebrity will marry him, so delulu.", quizExample: "He thinks the celebrity will marry him, so delulu.", quizCorrect: true },
  { word: "Main Character", meaning: "Acting like the star of your own story.", origin: "TikTok trend from 2020 encouraging people to romanticise their lives.", example: "She walked through the rain like she was the main character.", quizExample: "The main character of the recipe is flour and sugar.", quizCorrect: false },
  { word: "Glow Up", meaning: "A dramatic positive transformation.", origin: "Popularised on Twitter/Vine around 2015, now used broadly.", example: "He had such a glow up after starting the gym.", quizExample: "He had such a glow up after starting the gym.", quizCorrect: true },
  { word: "Touch Grass", meaning: "Telling someone to go outside and reconnect with reality.", origin: "Gaming/internet culture insult from the late 2010s.", example: "You've been online all week, go touch grass.", quizExample: "I need to touch grass to make my pizza dough.", quizCorrect: false },
  { word: "Ratio", meaning: "When replies outnumber likes, meaning the post is unpopular.", origin: "Twitter culture term from the late 2010s.", example: "His tweet got ratioed with thousands of angry replies.", quizExample: "His tweet got ratioed with thousands of angry replies.", quizCorrect: true },
  { word: "Based", meaning: "Being unapologetically yourself, often admired.", origin: "Originally a Lil B term, adopted widely online in the 2010s.", example: "He didn't care what people thought, very based.", quizExample: "The sauce is based on tomatoes and garlic.", quizCorrect: false },
  { word: "Mid", meaning: "Mediocre, not good or bad.", origin: "Gaming slang that spread across social media in the 2020s.", example: "The movie was mid, nothing special.", quizExample: "The movie was mid, nothing special.", quizCorrect: true },
  { word: "L + Ratio", meaning: "Mocking someone for losing an argument online.", origin: "Combination Twitter meme term from the late 2010s.", example: "He got told L plus ratio after his bad take.", quizExample: "He got told L plus ratio after his bad take.", quizCorrect: true },
  { word: "NPC", meaning: "Someone acting robotic or without independent thought.", origin: "From 'Non-Player Character' in video games, meme-ified in 2023.", example: "He just repeated the ad slogan like an NPC.", quizExample: "I painted my NPC bright blue for the summer.", quizCorrect: false },
  { word: "Rent Free", meaning: "Something you can't stop thinking about.", origin: "Twitter phrase '(thing) lives rent free in my head', 2010s.", example: "That song has been living rent free in my head all week.", quizExample: "That song has been living rent free in my head all week.", quizCorrect: true },
  { word: "Skibidi", meaning: "A nonsense meme word with no fixed meaning, used for humour.", origin: "From the viral 'Skibidi Toilet' YouTube series, 2023.", example: "He said 'skibidi' just to make his little brother laugh.", quizExample: "He said 'skibidi' just to make his little brother laugh.", quizCorrect: true },
  { word: "Yeet", meaning: "To throw something with force, or an exclamation of excitement.", origin: "Went viral from a 2014 Vine, still used in gaming and casual speech.", example: "He yeeted the ball straight into the goal.", quizExample: "I yeeted my homework in on time and calmly.", quizCorrect: false },
  { word: "Flex", meaning: "To show off something, often wealth or achievement.", origin: "Hip-hop slang from the 1990s, still common online today.", example: "He posted a photo of his new car just to flex.", quizExample: "He posted a photo of his new car just to flex.", quizCorrect: true },
  { word: "Lowkey", meaning: "Somewhat, or secretly.", origin: "AAVE term that spread widely through social media in the 2010s.", example: "I'm lowkey nervous about the exam tomorrow.", quizExample: "I built a lowkey house with three floors.", quizCorrect: false },
  { word: "Highkey", meaning: "Very much, openly and obviously.", origin: "Opposite of 'lowkey', spread the same way through social media.", example: "I'm highkey obsessed with this new song.", quizExample: "I'm highkey obsessed with this new song.", quizCorrect: true },
  { word: "Bussin", meaning: "Really good, usually describing food.", origin: "African American Vernacular English, spread widely via TikTok food videos.", example: "This pizza is bussin, you have to try it.", quizExample: "My car engine is bussin so I need a mechanic.", quizCorrect: false },
  { word: "Salty", meaning: "Bitter or annoyed about something small.", origin: "Slang since the early 2000s, now common in gaming and online chat.", example: "He got salty after losing the game.", quizExample: "He got salty after losing the game.", quizCorrect: true },
  { word: "Extra", meaning: "Over the top or overly dramatic.", origin: "Slang popularised in the 2010s across social media.", example: "She wore a full ballgown to a picnic, so extra.", quizExample: "I bought one extra loaf of bread for the trip.", quizCorrect: false },
  { word: "Stan", meaning: "An extremely devoted fan of someone.", origin: "From the 2000 Eminem song 'Stan', later became a verb online.", example: "She's a huge stan of that boy band.", quizExample: "She's a huge stan of that boy band.", quizCorrect: true },
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
const backQuestionWord = document.getElementById("back-question-word");
const backExample = document.getElementById("back-example");
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
  if (backQuestionWord) backQuestionWord.textContent = current.word;
  if (backExample) backExample.textContent = "\u201c" + current.quizExample + "\u201d";
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
  const isCorrect = userSaysTrue === current.quizCorrect;
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
    backResult.textContent = "Not quite! The correct answer was " + (current.quizCorrect ? "TRUE" : "FALSE") + ".";
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
