/* Brainy Blast maths question generators.
 *
 * Stages follow the UK school system:
 *   1 = Years 1–2 (KS1)   2 = Years 3–4 (Lower KS2)   3 = Years 5–6 (Upper KS2)
 *   4 = Years 7–9 (KS3)   5 = Years 10–11 (GCSE)
 *
 * Maths is generated fresh every round, so it never runs out.
 * English, Science, Tech Skills and General Knowledge questions live in
 * the CSV files in /questions — edit those to add more.
 */

/* ---------------- Maths (generated) ---------------- */
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const fmt = (n) => (n < 0 ? `−${-n}` : `${n}`);
const sgn = (n) => (n < 0 ? `− ${-n}` : `+ ${n}`);
const SUP = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
const sup = (n) => String(n).split("").map((d) => SUP[d]).join("");
const xTerm = (c) => (c === 1 ? "+ x" : c === -1 ? "− x" : c < 0 ? `− ${-c}x` : `+ ${c}x`);
const lin = (a, b) => `${a === 1 ? "" : a}n${b === 0 ? "" : " " + sgn(b)}`;
function three(ans, cands) {
  const out = [];
  for (const c of cands.map(String)) {
    if (c !== String(ans) && !out.includes(c)) out.push(c);
    if (out.length === 3) break;
  }
  return out;
}
function mix(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function roman(n) {
  const map = [[100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let s = "";
  for (const [v, r] of map) while (n >= v) { s += r; n -= v; }
  return s;
}

/* Each generator returns {q, a, w?, f, h}. With w it is multiple choice, without it the child types the answer. */
const MATHS = {
  1: [
    () => { const a = rnd(2, 12), b = rnd(1, 20 - a); return { q: `What is ${a} + ${b}?`, a: a + b, h: `Start at ${a} and count on ${b} more.`, f: `${a} + ${b} = ${a + b}` }; },
    () => { const a = rnd(6, 20), b = rnd(1, a - 1); return { q: `What is ${a} − ${b}?`, a: a - b, h: `Start at ${a} and count back ${b}.`, f: `${a} − ${b} = ${a - b}` }; },
    () => { const n = rnd(1, 9); return { q: `${n} + ? = 10`, a: 10 - n, h: `How many more from ${n} to get to 10? Use your fingers!`, f: `${n} and ${10 - n} are number bonds to 10.` }; },
    () => { const n = 10 * rnd(1, 9); return { q: `${n} + ? = 100`, a: 100 - n, h: `Use number bonds to 10: ${n / 10} + ${10 - n / 10} = 10.`, f: `${n} + ${100 - n} = 100` }; },
    () => { const t = pick([2, 5, 10]), n = rnd(1, 12); return { q: `What is ${n} × ${t}?`, a: n * t, h: `Count in ${t}s, ${n} times.`, f: `${n} × ${t} = ${n * t}` }; },
    () => { const n = 2 * rnd(1, 10); return { q: `What is half of ${n}?`, a: n / 2, h: `Share ${n} into 2 equal groups.`, f: `Half of ${n} is ${n / 2}, because ${n / 2} + ${n / 2} = ${n}.` }; },
    () => { const n = rnd(2, 15); return { q: `What is double ${n}?`, a: 2 * n, h: `Double means add it to itself: ${n} + ${n}.`, f: `Double ${n} is ${2 * n}.` }; },
    () => { const n = rnd(11, 99); return { q: `How many tens are in ${n}?`, a: Math.floor(n / 10), h: `Look at the first digit of ${n}.`, f: `${n} is ${Math.floor(n / 10)} tens and ${n % 10} ones.` }; },
    () => { const s = pick([2, 5, 10]), st = s * rnd(0, 5), seq = [st, st + s, st + 2 * s, st + 3 * s]; return { q: `What comes next? ${seq.join(", ")}, …`, a: st + 4 * s, h: `The numbers go up by ${s} each time.`, f: `Counting in ${s}s: ${seq.join(", ")}, ${st + 4 * s}.` }; },
    () => { const c = [1, 2, 5, 10, 20, 50], x = pick(c), y = pick(c); return { q: `You have a ${x}p coin and a ${y}p coin. How many pence is that altogether?`, a: x + y, h: `Add ${x} and ${y}.`, f: `${x}p + ${y}p = ${x + y}p` }; },
    () => { const ans = 2 * rnd(1, 25), w = new Set(); while (w.size < 3) w.add(2 * rnd(0, 24) + 1); return { q: "Which of these numbers is even?", a: ans, w: [...w], h: "Even numbers end in 0, 2, 4, 6 or 8.", f: `${ans} is even because it can be split into two equal groups.` }; },
    () => {
      const h = rnd(1, 11), k = pick([["o’clock", 0], ["half past", 30], ["quarter past", 15]]), mm = (m) => String(m).padStart(2, "0");
      const label = k[1] === 0 ? `${h} o’clock` : `${k[0]} ${h}`, ans = `${h}:${mm(k[1])}`;
      return { q: `What time is ${label}?`, a: ans, w: three(ans, [`${h}:${mm((k[1] + 15) % 60)}`, `${h + 1}:${mm(k[1])}`, `${h}:${mm(k[1] === 30 ? 45 : 30)}`, `${h === 1 ? 12 : h - 1}:${mm(k[1])}`]), h: "Half past means 30 minutes after. Quarter past means 15 minutes after.", f: `${label} is written as ${ans}.` };
    },
  ],
  2: [
    () => { const a = rnd(2, 12), b = rnd(2, 12); return { q: `What is ${a} × ${b}?`, a: a * b, h: `Do you know ${b} × ${a}? It’s the same answer!`, f: `${a} × ${b} = ${a * b}. Year 4s practise every times table up to 12 × 12.` }; },
    () => { const a = rnd(2, 12), b = rnd(2, 12); return { q: `What is ${a * b} ÷ ${a}?`, a: b, h: `Which number times ${a} makes ${a * b}?`, f: `${a * b} ÷ ${a} = ${b} because ${a} × ${b} = ${a * b}.` }; },
    () => { const a = rnd(120, 599), b = rnd(101, 399); return { q: `What is ${a} + ${b}?`, a: a + b, h: "Add the hundreds, then the tens, then the ones.", f: `${a} + ${b} = ${a + b}` }; },
    () => { const a = rnd(300, 999), b = rnd(101, a - 50); return { q: `What is ${a} − ${b}?`, a: a - b, h: "Try the column method. Exchange if you need to.", f: `${a} − ${b} = ${a - b}` }; },
    () => { const d = pick([2, 3, 4, 5, 10]), k = rnd(2, 12), n = d * k, u = d === 2 ? 1 : rnd(1, d - 1); return { q: `What is ${u}/${d} of ${n}?`, a: u * k, h: `First find 1/${d} of ${n} by dividing by ${d}.`, f: u === 1 ? `${n} ÷ ${d} = ${k}` : `1/${d} of ${n} is ${k}, so ${u}/${d} is ${u} × ${k} = ${u * k}.` }; },
    () => { const n = rnd(11, 999), r = Math.round(n / 10) * 10; return { q: `Round ${n} to the nearest 10.`, a: r, h: "Look at the ones digit. 5 or more rounds up.", f: `${n} rounded to the nearest 10 is ${r}.` }; },
    () => { const n = rnd(101, 999), r = Math.round(n / 100) * 100; return { q: `Round ${n} to the nearest 100.`, a: r, h: "Look at the tens digit. 5 or more rounds up.", f: `${n} rounded to the nearest 100 is ${r}.` }; },
    () => { const l = rnd(3, 12), w = rnd(2, l); return { q: `A rectangle is ${l} cm long and ${w} cm wide. What is its perimeter in cm?`, a: 2 * (l + w), h: `Add all four sides: ${l} + ${w} + ${l} + ${w}.`, f: `Perimeter = ${l} + ${w} + ${l} + ${w} = ${2 * (l + w)} cm` }; },
    () => { const n = rnd(2, 99), m = pick([10, 100]); return { q: `What is ${n} × ${m}?`, a: n * m, h: `Move each digit ${m === 10 ? "one place" : "two places"} to the left.`, f: `${n} × ${m} = ${n * m}` }; },
    () => { const n = rnd(1, 100); return { q: `What number is the Roman numeral ${roman(n)}?`, a: n, h: "I = 1, V = 5, X = 10, L = 50, C = 100. A smaller numeral before a bigger one means take away.", f: `${roman(n)} = ${n}` }; },
    () => { const a = rnd(2, 12), b = rnd(2, 12); return { q: `? × ${b} = ${a * b}`, a, h: `Count up in ${b}s until you reach ${a * b}.`, f: `${a} × ${b} = ${a * b}` }; },
  ],
  3: [
    () => { const a = rnd(12, 99), b = rnd(11, 35); return { q: `What is ${a} × ${b}?`, a: a * b, h: `Try ${a} × ${b - (b % 10)} and ${a} × ${b % 10}, then add them.`, f: `${a} × ${b} = ${a * b}` }; },
    () => { const p = pick([10, 20, 25, 50, 75]), base = 20 * rnd(1, 25); const hint = { 10: "Divide by 10.", 20: "Find 10%, then double it.", 25: "Halve it, then halve it again.", 50: "Halve it.", 75: "Find 25%, then multiply by 3." }[p]; return { q: `What is ${p}% of ${base}?`, a: (base * p) / 100, h: hint, f: `${p}% of ${base} = ${(base * p) / 100}` }; },
    () => { const a = rnd(2, 20), b = rnd(2, 9), c = rnd(2, 9); return { q: `What is ${a} + ${b} × ${c}?`, a: a + b * c, h: "Multiplication comes before addition (BODMAS)!", f: `${b} × ${c} = ${b * c}, then ${a} + ${b * c} = ${a + b * c}.` }; },
    () => { const n = rnd(2, 15); return { q: `What is ${n}²?`, a: n * n, h: `${n}² means ${n} × ${n}.`, f: `${n}² = ${n * n}. It is a square number.` }; },
    () => { const n = rnd(2, 5); return { q: `What is ${n}³?`, a: n ** 3, h: `${n} × ${n} × ${n}`, f: `${n}³ = ${n ** 3}. It is a cube number.` }; },
    () => { const ans = pick([7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]); return { q: "Which of these is a prime number?", a: ans, w: mix([9, 15, 21, 25, 27, 33, 35, 39, 45, 49, 51, 12, 18]).slice(0, 3), h: "A prime number has exactly two factors: 1 and itself.", f: `${ans} can only be divided exactly by 1 and ${ans}.` }; },
    () => { const b = 2 * rnd(2, 10), h = rnd(2, 12); return { q: `A triangle has a base of ${b} cm and a height of ${h} cm. What is its area in cm²?`, a: (b * h) / 2, h: "Area of a triangle = ½ × base × height.", f: `½ × ${b} × ${h} = ${(b * h) / 2} cm²` }; },
    () => { const t = rnd(-4, 6), d = rnd(3, 12); return { q: `The temperature is ${fmt(t)}°C. It falls by ${d} degrees. What is the temperature now in °C?`, a: t - d, h: `Count down ${d} on a number line from ${fmt(t)}. Answers below zero need a minus sign.`, f: `${fmt(t)} − ${d} = ${fmt(t - d)}°C` }; },
    () => { const n = rnd(2, 12), a = rnd(2, 9), b = rnd(1, 20); return { q: `${a}n + ${b} = ${a * n + b}. What is n?`, a: n, h: `Take away ${b} from both sides, then divide by ${a}.`, f: `${a}n = ${a * n}, so n = ${n}.` }; },
    () => { const pairs = [["1/2", "0.5"], ["1/4", "0.25"], ["3/4", "0.75"], ["1/5", "0.2"], ["2/5", "0.4"], ["1/10", "0.1"], ["3/10", "0.3"], ["1/8", "0.125"]]; const [fr, dec] = pick(pairs); return { q: `What is ${fr} as a decimal?`, a: dec, w: three(dec, mix(pairs.map((p) => p[1]))), h: "Divide the top number by the bottom number.", f: `${fr} = ${dec}` }; },
    () => { const k = rnd(2, 5), m = rnd(2, 15), N = (1 + k) * m; return { q: `Share £${N} in the ratio 1 : ${k}. How much is the smaller share, in £?`, a: m, h: `There are ${1 + k} parts altogether. Divide £${N} by ${1 + k}.`, f: `£${N} ÷ ${1 + k} = £${m} for one part.` }; },
    () => { const t = rnd(11, 99), m = pick([10, 100]); return { q: `What is ${(t / 10).toFixed(1)} × ${m}?`, a: m === 10 ? t : t * 10, h: `Move the digits ${m === 10 ? "one place" : "two places"} to the left.`, f: `${(t / 10).toFixed(1)} × ${m} = ${m === 10 ? t : t * 10}` }; },
  ],
  4: [
    () => { const x = pick([-3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]), a = rnd(2, 9), b = pick([-9, -7, -5, -3, 2, 4, 6, 8, 11, 13]), c = a * x + b; return { q: `Solve ${a}x ${sgn(b)} = ${fmt(c)}`, a: x, h: `${b < 0 ? "Add" : "Subtract"} ${Math.abs(b)} on both sides, then divide by ${a}.`, f: `${a}x = ${fmt(c - b)}, so x = ${fmt(x)}.` }; },
    () => { const a = rnd(2, 9), b = rnd(2, 9), p = rnd(2, 5), q = rnd(2, 5); return { q: `If a = ${a} and b = ${b}, what is ${p}a + ${q}b?`, a: p * a + q * b, h: `${p}a means ${p} × a.`, f: `${p} × ${a} + ${q} × ${b} = ${p * a} + ${q * b} = ${p * a + q * b}` }; },
    () => { const base = 20 * rnd(2, 15), p = pick([5, 10, 15, 20, 25, 30, 50]), inc = Math.random() < 0.5, ans = inc ? (base * (100 + p)) / 100 : (base * (100 - p)) / 100; return { q: `${inc ? "Increase" : "Decrease"} £${base} by ${p}%. What is the new amount, in £?`, a: ans, h: `Find ${p}% of £${base} first (£${(base * p) / 100}), then ${inc ? "add" : "subtract"} it.`, f: `£${base} ${inc ? "+" : "−"} £${(base * p) / 100} = £${ans}` }; },
    () => { const h = rnd(2, 12), [m, n] = pick([[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [5, 6], [3, 7], [2, 7]]); return { q: `What is the highest common factor (HCF) of ${h * m} and ${h * n}?`, a: h, h: "List the factors of each number and find the biggest one they share.", f: `${h * m} = ${h} × ${m} and ${h * n} = ${h} × ${n}, so the HCF is ${h}.` }; },
    () => { const [a, b] = pick([[4, 6], [6, 8], [3, 4], [4, 10], [6, 9], [5, 6], [8, 12], [6, 10], [9, 12], [4, 7]]); let l = Math.max(a, b); while (l % a || l % b) l++; return { q: `What is the lowest common multiple (LCM) of ${a} and ${b}?`, a: l, h: `List the multiples of ${a} and ${b} until you find one in both lists.`, f: `${l} is the smallest number in both the ${a} and ${b} times tables.` }; },
    () => { const [b, e] = pick([[2, rnd(3, 8)], [3, rnd(2, 4)], [5, rnd(2, 3)], [10, rnd(2, 5)]]); return { q: `What is ${b}${sup(e)}?`, a: b ** e, h: `Multiply ${b} by itself ${e} times.`, f: `${b}${sup(e)} = ${b ** e}` }; },
    () => { const a = rnd(30, 80), b = rnd(30, 80); return { q: `Two angles in a triangle are ${a}° and ${b}°. What is the third angle, in degrees?`, a: 180 - a - b, h: "Angles in a triangle add up to 180°.", f: `180 − ${a} − ${b} = ${180 - a - b}°` }; },
    () => { const names = { 4: "quadrilateral", 5: "pentagon", 6: "hexagon", 7: "heptagon", 8: "octagon", 9: "nonagon", 10: "decagon" }, n = rnd(4, 10); return { q: `What do the interior angles of a ${names[n]} add up to, in degrees?`, a: (n - 2) * 180, h: `Use (n − 2) × 180°. A ${names[n]} has ${n} sides.`, f: `(${n} − 2) × 180 = ${(n - 2) * 180}°` }; },
    () => { const xs = [rnd(2, 20), rnd(2, 20), rnd(2, 20), rnd(2, 20)]; const s = xs.reduce((p, c) => p + c, 0); let last = rnd(2, 20); while ((s + last) % 5) last++; xs.push(last); return { q: `What is the mean of ${xs.join(", ")}?`, a: (s + last) / 5, h: "Add them all up, then divide by how many numbers there are.", f: `Total = ${s + last}. ${s + last} ÷ 5 = ${(s + last) / 5}.` }; },
    () => { const r = rnd(1, 7), b = rnd(1, 7) + (Math.random() < 0.5 ? 0 : 1), t = r + b, ans = `${r}/${t}`; return { q: `A bag has ${r} red and ${b} blue counters. What is the probability of picking a red one?`, a: ans, w: three(ans, [`${b}/${t}`, `${r}/${b}`, `1/${t}`, `${t}/${r}`, `${r + 1}/${t}`]), h: "Probability = number of red ÷ total number of counters.", f: `There are ${t} counters and ${r} are red, so P(red) = ${r}/${t}.` }; },
    () => { const [p, q, h] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [6, 8, 10]]), k = rnd(1, 3); return { q: `A right-angled triangle has shorter sides of ${p * k} cm and ${q * k} cm. How long is the hypotenuse, in cm?`, a: h * k, h: "Pythagoras: a² + b² = c². Square, add, then square root.", f: `${(p * k) ** 2} + ${(q * k) ** 2} = ${(h * k) ** 2}, and √${(h * k) ** 2} = ${h * k}.` }; },
    () => { const d = rnd(1, 9) * 10 + rnd(1, 9), e = rnd(3, 6), value = d * 10 ** (e - 1), mant = `${Math.floor(d / 10)}.${d % 10}`, ans = `${mant} × 10${sup(e)}`; return { q: `Write ${value.toLocaleString("en-GB")} in standard form.`, a: ans, w: three(ans, [`${mant} × 10${sup(e - 1)}`, `${mant} × 10${sup(e + 1)}`, `${d} × 10${sup(e - 1)}`]), h: "Standard form is a number between 1 and 10 multiplied by a power of 10.", f: `${value.toLocaleString("en-GB")} = ${ans}` }; },
    () => { const a = rnd(2, 9), b = rnd(1, 9), ans = `${a}x + ${a * b}`; return { q: `Expand ${a}(x + ${b})`, a: ans, w: three(ans, [`${a}x + ${b}`, `x + ${a * b}`, `${a + b}x`, `${a}x + ${a + b}`]), h: `Multiply everything inside the bracket by ${a}.`, f: `${a} × x = ${a}x and ${a} × ${b} = ${a * b}.` }; },
  ],
  5: [
    () => { const x = rnd(1, 9), y = rnd(1, 9); return { q: `x + y = ${x + y} and x − y = ${fmt(x - y)}. What is x?`, a: x, h: "Add the two equations together to get rid of y.", f: `2x = ${2 * x}, so x = ${x} (and y = ${y}).` }; },
    () => { const x = rnd(1, 6), y = rnd(1, 6); return { q: `2x + y = ${2 * x + y} and x + y = ${x + y}. What is x?`, a: x, h: "Subtract the second equation from the first.", f: `(2x + y) − (x + y) = x, so x = ${2 * x + y - (x + y)}.` }; },
    () => {
      let p, q; do { p = pick([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]); q = pick([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]); } while (p === q || p === -q);
      const ans = `(x ${sgn(p)})(x ${sgn(q)})`;
      return { q: `Factorise x² ${xTerm(p + q)} ${sgn(p * q)}`, a: ans, w: three(ans, [`(x ${sgn(-p)})(x ${sgn(-q)})`, `(x ${sgn(p)})(x ${sgn(-q)})`, `(x ${sgn(-p)})(x ${sgn(q)})`, `(x ${sgn(p + q)})(x ${sgn(p * q)})`]), h: `Find two numbers that multiply to ${fmt(p * q)} and add to ${fmt(p + q)}.`, f: `${fmt(p)} × ${fmt(q)} = ${fmt(p * q)} and ${fmt(p)} + ${fmt(q)} = ${fmt(p + q)}.` };
    },
    () => { const r1 = rnd(1, 8), r2 = rnd(r1 + 1, 9), ans = `x = ${r1} or x = ${r2}`; return { q: `Solve x² ${xTerm(-(r1 + r2))} + ${r1 * r2} = 0`, a: ans, w: three(ans, [`x = −${r1} or x = −${r2}`, `x = ${r1} or x = −${r2}`, `x = −${r1} or x = ${r2}`, `x = ${r1 + r2} or x = ${r1 * r2}`]), h: "Factorise first, then set each bracket equal to zero.", f: `(x − ${r1})(x − ${r2}) = 0, so x = ${r1} or x = ${r2}.` }; },
    () => { const m = pick([-3, -2, -1, 1, 2, 3, 4]), x1 = rnd(-3, 3), dx = rnd(1, 4), y1 = rnd(-5, 5); return { q: `What is the gradient of the line through (${fmt(x1)}, ${fmt(y1)}) and (${fmt(x1 + dx)}, ${fmt(y1 + m * dx)})?`, a: m, h: "Gradient = change in y ÷ change in x.", f: `Change in y is ${fmt(m * dx)} and change in x is ${dx}, so the gradient is ${fmt(m)}.` }; },
    () => { const a = rnd(2, 7), b = pick([-3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8]), seq = [1, 2, 3, 4].map((n) => a * n + b), ans = lin(a, b); return { q: `What is the nth term of ${seq.join(", ")}, …?`, a: ans, w: three(ans, [lin(a, a + b), lin(1, a), lin(a + 1, b - 1), lin(a, b + 1)]), h: `The sequence goes up by ${a} each time, so it starts with ${a}n.`, f: `nth term = ${ans}. Check: when n = 1, ${a} ${sgn(b)} = ${seq[0]}.` }; },
    () => { const p = rnd(1, 7), q = rnd(1, 7), ans = `x² + ${p + q}x + ${p * q}`; return { q: `Expand (x + ${p})(x + ${q})`, a: ans, w: three(ans, [`x² + ${p * q}x + ${p + q}`, `x² + ${p + q}x + ${p + q}`, `x² + ${p * q}`, `2x + ${p + q}`, `x² + ${2 * (p + q)}x + ${p * q}`]), h: "Multiply each term in the first bracket by each term in the second (FOIL).", f: `x² + ${q}x + ${p}x + ${p * q} = ${ans}` }; },
    () => { const [e, v] = pick([["sin 30°", "0.5"], ["cos 60°", "0.5"], ["tan 45°", "1"], ["sin 90°", "1"], ["cos 0°", "1"], ["sin 0°", "0"], ["cos 90°", "0"], ["tan 0°", "0"]]); return { q: `What is ${e}?`, a: v, w: three(v, mix(["0", "0.5", "1", "√3/2", "√2/2"])), h: "These exact trig values are worth learning for the non-calculator paper.", f: `${e} = ${v}` }; },
    () => { const orig = 20 * rnd(1, 20), p = pick([10, 20, 25, 50]), y = (orig * (100 + p)) / 100; return { q: `After a ${p}% increase, a price is £${y}. What was the original price, in £?`, a: orig, h: `£${y} is ${100 + p}% of the original. Divide by ${(100 + p) / 100}.`, f: `£${y} ÷ ${(100 + p) / 100} = £${orig}` }; },
    () => { const k = rnd(2, 5), m = pick([2, 3, 5, 6, 7]), n = k * k * m, ans = `${k}√${m}`; return { q: `Simplify √${n}`, a: ans, w: three(ans, [`${m}√${k}`, `${k * k}√${m}`, `${k}√${m * k}`, `${k + 1}√${m}`]), h: `Look for a square number that divides ${n}.`, f: `√${n} = √${k * k} × √${m} = ${ans}` }; },
    () => { const a = rnd(2, 6), x = rnd(1, 8), b = rnd(1, 12), ans = `x > ${x}`; return { q: `Solve ${a}x + ${b} > ${a * x + b}`, a: ans, w: three(ans, [`x < ${x}`, `x > ${a * x}`, `x > ${x + b}`, `x ≥ ${x}`]), h: "Solve it like an equation, keeping the inequality sign.", f: `${a}x > ${a * x}, so x > ${x}.` }; },
    () => { const r = rnd(2, 10), ans = `${r * r}π`; return { q: `A circle has a radius of ${r} cm. What is its area in cm², in terms of π?`, a: ans, w: three(ans, [`${2 * r}π`, `${r}π`, `${2 * r * r}π`, `${r * r + r}π`]), h: "Area of a circle = πr².", f: `π × ${r}² = ${ans} cm²` }; },
    () => { const [q, a, w, f] = pick([
      ["A fair coin is flipped twice. What is the probability of getting two heads?", "1/4", ["1/2", "1/3", "3/4"], "½ × ½ = ¼"],
      ["A fair dice is rolled twice. What is the probability of getting two sixes?", "1/36", ["1/6", "2/6", "1/12"], "1/6 × 1/6 = 1/36"],
      ["What is the probability of NOT rolling a 6 on a fair dice?", "5/6", ["1/6", "6/5", "1/5"], "1 − 1/6 = 5/6"],
    ]); return { q, a, w, h: "For independent events, multiply the probabilities.", f }; },
  ],
};
