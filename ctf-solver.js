/**
 * CH2C Arkaden CTF Solver
 *
 * Paste this into browser DevTools console while on
 * https://ch2cstartopgave.vercel.app (any page).
 *
 * It reads the public JS bundle and extracts the three
 * hidden words from Tetris, Pac-Man, and Snake.
 */
(async () => {
  const MORSE = {
    ".-":"A","-...":"B","-.-.":"C","-..":"D",".":"E",
    "..-.":"F","--.":"G","....":"H","..":"I",".---":"J",
    "-.-":"K",".-..":"L","--":"M","-.":"N","---":"O",
    ".--.":"P","--.-":"Q",".-.":"R","...":"S","-":"T",
    "..-":"U","...-":"V",".--":"W","-..-":"X","-.--":"Y",
    "--..":"Z",
    // Danish extensions
    ".-.-":"Æ", "---.":"Ø", ".--.-":"Å"
  };

  console.log("%c[CTF] Scanning JS bundles…", "color:cyan;font-weight:bold");

  // Step 1: Get the HTML of a game page to discover chunk URLs
  const html = await (await fetch("/games/tetris?device=computer")).text();
  const chunkPaths = [...new Set(
    [...html.matchAll(/\/_next\/static\/chunks\/([\w~.\-]+\.js)/g)].map(m => m[1])
  )];

  // Step 2: Find the chunk containing the game code
  let code = null;
  let chunkName = null;
  for (const name of chunkPaths) {
    const js = await (await fetch("/_next/static/chunks/" + name)).text();
    if (js.includes("gameBoard") && js.includes("playArcadeSound")) {
      code = js;
      chunkName = name;
      break;
    }
  }

  if (!code) {
    console.error("[CTF] Could not find game chunk. Bundle may have changed.");
    return;
  }

  console.log(`%c[CTF] Found game chunk: ${chunkName}`, "color:green");

  // Step 3: Extract secrets

  // Tetris — Morse code string revealed in the score panel
  const morseMatch = code.match(/"([.\-/]{6,})"\.slice\(0,Math\.floor/);
  const morseRaw = morseMatch ? morseMatch[1] : null;
  const tetrisWord = morseRaw
    ? morseRaw.split("/").filter(Boolean).map(s => MORSE[s] || "?").join("")
    : "NOT FOUND";

  // Pac-Man — word stored reversed via Array.from("...").reverse()
  const pacMatch = code.match(/Array\.from\("([^"]+)"\)\.reverse\(\)/);
  const pacmanWord = pacMatch ? pacMatch[1] : "NOT FOUND";

  // Snake — word stored as a plain string before the 320-cell grid
  const snakeMatch = code.match(/"([a-zæøå]{5,20})"\s*,\s*\w+=Array\.from\(\{length:320/);
  const snakeWord = snakeMatch ? snakeMatch[1] : "NOT FOUND";

  // Step 4: Output
  console.log("");
  console.log("%c╔══════════════════════════════════════╗", "color:#ffe052");
  console.log("%c║       CH2C ARKADEN — CTF SOLVE       ║", "color:#ffe052;font-weight:bold");
  console.log("%c╠══════════════════════════════════════╣", "color:#ffe052");
  console.log(`%c║  🧩 Tetris  (Morse):  ${tetrisWord.padEnd(14)}║`, "color:#00ffff");
  console.log(`%c║  👻 Pac-Man (reversed): ${pacmanWord.padEnd(13)}║`, "color:#ffff00");
  console.log(`%c║  🐍 Snake   (plain):  ${snakeWord.padEnd(14)}║`, "color:#ff69b4");
  console.log("%c╠══════════════════════════════════════╣", "color:#ffe052");
  console.log(`%c║  what.3.words: ${(tetrisWord+"."+pacmanWord+"."+snakeWord).padEnd(22)}║`, "color:#00ff00;font-weight:bold");
  console.log("%c╚══════════════════════════════════════╝", "color:#ffe052");

  if (morseRaw) {
    console.log("");
    console.log("%c  Morse breakdown:", "color:gray");
    morseRaw.split("/").filter(Boolean).forEach(s => {
      console.log(`    ${s.padEnd(8)} → ${MORSE[s] || "?"}`);
    });
  }

  return { tetris: tetrisWord, pacman: pacmanWord, snake: snakeWord };
})();
