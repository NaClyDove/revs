/**
 * CH2C Arkaden CTF Solver (v3)
 *
 * Paste into DevTools console on https://ch2cstartopgave.vercel.app
 * Extracts every hidden clue from the client-side JS — no gameplay needed.
 *
 * Finds:
 *   • Tetris  — Morse code from score panel → Caesar cipher decrypt → word
 *   • Pac-Man — reversed word flashed when eating power pellets
 *   • Snake   — plain word encoded in special food placement
 *   • The full what3words address
 */
(async () => {
  const MORSE = {
    ".-":"A","-...":"B","-.-.":"C","-..":"D",".":"E",
    "..-.":"F","--.":"G","....":"H","..":"I",".---":"J",
    "-.-":"K",".-..":"L","--":"M","-.":"N","---":"O",
    ".--.":"P","--.-":"Q",".-.":"R","...":"S","-":"T",
    "..-":"U","...-":"V",".--":"W","-..-":"X","-.--":"Y",
    "--..":"Z",
    ".-.-":"Æ", "---.":"Ø", ".--.-":"Å"
  };

  const DANISH_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ";

  function caesarShift(text, shift) {
    return text.split("").map(ch => {
      const idx = DANISH_ALPHABET.indexOf(ch.toUpperCase());
      if (idx === -1) return ch;
      const shifted = DANISH_ALPHABET[(idx + shift) % DANISH_ALPHABET.length];
      return ch === ch.toLowerCase() ? shifted.toLowerCase() : shifted;
    }).join("");
  }

  console.log("%c[CTF] CH2C Arkaden solver starting…", "color:cyan;font-weight:bold");

  // ── Step 1: Discover JS chunk URLs from a game page ──
  const html = await (await fetch("/games/tetris?device=computer")).text();
  const chunkPaths = [...new Set(
    [...html.matchAll(/\/_next\/static\/chunks\/([\w~.\-]+\.js)/g)].map(m => m[1])
  )];

  // ── Step 2: Find the game-logic chunk ──
  let gameCode = null, gameChunk = null;
  for (const name of chunkPaths) {
    const js = await (await fetch("/_next/static/chunks/" + name)).text();
    if (js.includes("gameBoard") && js.includes("playArcadeSound")) {
      gameCode = js; gameChunk = name;
    }
  }
  if (!gameCode) { console.error("[CTF] Game chunk not found!"); return; }
  console.log(`%c[CTF] Game chunk: ${gameChunk}`, "color:green");

  // ── Step 3: Extract secrets ──

  // TETRIS — Morse code in score panel + Caesar cipher
  //   a) Morse string progressively revealed as lines are cleared
  const morseMatch = gameCode.match(/"([.\-\/]{6,})"\.slice\(0,Math\.floor/);
  const morseRaw = morseMatch ? morseMatch[1] : null;
  const morseLetters = morseRaw
    ? morseRaw.split("/").filter(Boolean).map(s => MORSE[s] || `[${s}]`)
    : [];
  const morseDecoded = morseLetters.join("");

  //   b) Pink-highlighted letters in the TETRIS title (class="pinkLetter")
  const pinkLetters = [...gameCode.matchAll(/className:"pinkLetter",children:"([^"]+)"/g)]
    .map(m => m[1]);

  //   c) Caesar cipher: shift = T(20) - I(9) = 11
  const caesarShiftValue = 11;
  const tetrisWord = caesarShift(morseDecoded, caesarShiftValue);

  // PAC-MAN — word stored reversed: Array.from("word").reverse()
  const pacMatch = gameCode.match(/Array\.from\("([^"]+)"\)\.reverse\(\)/);
  const pacmanWord = pacMatch ? pacMatch[1] : "NOT FOUND";

  // SNAKE — word stored plain before the 320-cell grid
  const snakeMatch = gameCode.match(/"([a-zæøå]{5,20})"\s*,\s*\w+=Array\.from\(\{length:320/);
  const snakeWord = snakeMatch ? snakeMatch[1] : "NOT FOUND";

  // ── Step 4: Build what3words address ──
  const w3wAddress = `${tetrisWord.toLowerCase()}.${pacmanWord}.${snakeWord}`;

  // ── Step 5: Output ──
  console.log("");
  console.log("%c╔════════════════════════════════════════════════════════╗", "color:#ffe052");
  console.log("%c║            CH2C ARKADEN — CTF SOLVE  v3               ║", "color:#ffe052;font-weight:bold");
  console.log("%c╠════════════════════════════════════════════════════════╣", "color:#ffe052");

  console.log("%c║                                                        ║", "color:#ffe052");
  console.log("%c║  🧩 TETRIS                                             ║", "color:#00ffff;font-weight:bold");
  console.log(`%c║     Morse (raw):         ${(morseRaw||"?").padEnd(28)} ║`, "color:#00ffff");
  console.log(`%c║     Morse decoded:       ${morseDecoded.padEnd(28)} ║`, "color:#00ffff");
  console.log(`%c║     Pink title letters:  ${(pinkLetters.join(", ")||"none").padEnd(28)} ║`, "color:#ff69b4");
  console.log(`%c║     Caesar shift:        ${String(caesarShiftValue).padEnd(28)} ║`, "color:#fff");
  console.log(`%c║     Decrypted word:      ${tetrisWord.padEnd(28)} ║`, "color:#00ff00;font-weight:bold");

  console.log("%c║                                                        ║", "color:#ffe052");
  console.log("%c║  👻 PAC-MAN                                            ║", "color:#ffff00;font-weight:bold");
  console.log(`%c║     Stored (reversed):   ${pacmanWord.padEnd(28)} ║`, "color:#ffff00");

  console.log("%c║                                                        ║", "color:#ffe052");
  console.log("%c║  🐍 SNAKE                                              ║", "color:#ff69b4;font-weight:bold");
  console.log(`%c║     Word (plain):        ${snakeWord.padEnd(28)} ║`, "color:#ff69b4");

  console.log("%c║                                                        ║", "color:#ffe052");
  console.log("%c╠════════════════════════════════════════════════════════╣", "color:#ffe052");
  console.log("%c║  🗺️  WHAT3WORDS ADDRESS                                ║", "color:#00ff00;font-weight:bold");
  console.log(`%c║     ///${w3wAddress.padEnd(44)} ║`, "color:#00ff00;font-weight:bold");
  console.log(`%c║     https://what3words.com/${w3wAddress.padEnd(24)} ║`, "color:#8888ff");
  console.log("%c╚════════════════════════════════════════════════════════╝", "color:#ffe052");

  // Morse breakdown
  if (morseRaw) {
    console.log("");
    console.log("%c  Tetris Morse → Caesar breakdown:", "color:gray");
    const groups = morseRaw.split("/").filter(Boolean);
    groups.forEach((s, i) => {
      const letter = MORSE[s] || "?";
      const shifted = caesarShift(letter, caesarShiftValue);
      console.log(`    ${s.padEnd(10)} → ${letter} → (+${caesarShiftValue}) → ${shifted}`);
    });
  }

  return { tetris: tetrisWord, pacman: pacmanWord, snake: snakeWord, w3w: w3wAddress };
})();
