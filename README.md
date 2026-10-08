# CH2C Arkaden — CTF Writeup

Security assessment / CTF solve for the CH2C Arkaden starting assignment at
**https://ch2cstartopgave.vercel.app/arcade?device=computer**

CH2C is a Danish scouting activity. The site presents three classic arcade games
(Tetris, Pac-Man, Snake) that each hide one Danish word. Together the three words
form a [what3words](https://what3words.com) address pointing to a physical location.

## Solution

```
///spil.spøgelse.oksesteg
```

**Location**: Skovlunde Station, Ballerup, Region Hovedstaden, Denmark
**Map**: https://what3words.com/spil.spøgelse.oksesteg

---

## How Each Game Hides Its Word

### 1. Tetris — `spil` (game/play)

The Tetris word is hidden behind two layers of encoding.

**Layer 1 — Morse code in the score panel**

The score panel (`morsePanel`) progressively reveals a Morse code string as you
clear lines. The full string is:

```
...././.-.-/.-//
```

One character is revealed per 3 lines cleared (`Math.floor(lines_cleared / 3)`).
Decoded with the Danish Morse alphabet:

| Morse | Letter |
|-------|--------|
| `....` | H |
| `.` | E |
| `.-.-` | Æ |
| `.-` | A |

This gives **HEÆA** — not a real word. That's the hint there's a second step.

**Layer 2 — Caesar cipher keyed by the pink letters**

In the TETRIS title on the arcade page, two letters are highlighted with
`class="pinkLetter"`: **T** and **I**. The remaining letters (ETRS) share the
same styling as the "What.3.Words" text, marking them as decoration rather than
clues.

The pink letters **T** and **I** provide the Caesar cipher shift key. Apply a
shift of **11** across the 29-letter Danish alphabet (A-Z + Æ Ø Å):

| Morse letter | +11 | Result |
|--------------|-----|--------|
| H (8) | → 19 | **S** |
| E (5) | → 16 | **P** |
| Æ (27) | → 9 | **I** |
| A (1) | → 12 | **L** |

**HEÆA → SPIL** ✓

### 2. Pac-Man — `spøgelse` (ghost)

The word is stored reversed in the game code:

```js
y = Array.from("spøgelse").reverse()
```

During gameplay, each time you eat a power pellet (special dot), one letter from
the reversed array flashes on screen via the `pacLetterFlash` component:

```js
{ letter: y[_.current % y.length], sequence: _.current }
```

The source word **spøgelse** means "ghost" — the iconic Pac-Man enemy.

### 3. Snake — `oksesteg` (roast beef)

The word is stored as a plain string constant:

```js
S = "oksesteg"
```

Every 10th food item the snake eats is "special". The special food's grid
position encodes a letter from the word:

```js
S[t % S.length].toUpperCase().charCodeAt(0) - 64
```

This value determines where the food appears (`x + y + 2 === letterValue`).
When eaten, the letter flashes on screen. The word **oksesteg** means "roast
beef" — thematically fitting for a game about eating.

---

## Technical Details

- **Stack**: Next.js App Router on Vercel with React Server Components
- **Games**: Entirely client-side, no backend API, no auth, no cookies
- **Audio**: Web Audio API oscillator synthesis (no audio files)
- **All three games** share a single JS chunk (~20KB)
- **Sound engine** is in a separate chunk (~8KB) with a 128-note MIDI melody

There are no network requests during gameplay — every secret is extractable
from the static JS bundles.

---

## Solver Script

The [`ctf-solver.js`](ctf-solver.js) script extracts all three words
automatically. Paste it into DevTools on the site:

1. Open https://ch2cstartopgave.vercel.app (any page)
2. Open DevTools → Console
3. Paste the entire contents of `ctf-solver.js`
4. Hit Enter

The script will:
- Discover the JS chunk filenames from the HTML
- Find the game-logic chunk by signature
- Extract the Morse string, pink letters, reversed word, and plain word
- Apply the Caesar cipher to decrypt the Tetris word
- Print the full what3words address

No gameplay required.

### Sample output

```
╔════════════════════════════════════════════════════════╗
║            CH2C ARKADEN — CTF SOLVE  v3               ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  🧩 TETRIS                                             ║
║     Morse (raw):         ...././.-.-/.-//              ║
║     Morse decoded:       HEÆA                          ║
║     Pink title letters:  T, I                          ║
║     Caesar shift:        11                            ║
║     Decrypted word:      SPIL                          ║
║                                                        ║
║  👻 PAC-MAN                                            ║
║     Stored (reversed):   spøgelse                      ║
║                                                        ║
║  🐍 SNAKE                                              ║
║     Word (plain):        oksesteg                      ║
║                                                        ║
╠════════════════════════════════════════════════════════╣
║  🗺️  WHAT3WORDS ADDRESS                                ║
║     ///spil.spøgelse.oksesteg                          ║
╚════════════════════════════════════════════════════════╝
```
