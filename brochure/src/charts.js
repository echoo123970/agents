/* ============================================================
   COLOUR CHARTS — marble and glass
   Edit the arrays below to change, reorder or extend the charts.
   `css` is the swatch fill: replace any entry with
   `url(images/swatch-name.jpg)` once photographed samples exist.
   ============================================================ */

const MARBLE = [
  ["Bianco Carrara", "Italy · honed",      "linear-gradient(118deg,#F4F2EE 0%,#E9E7E2 46%,#F6F5F2 100%)"],
  ["Statuario",      "Italy · polished",   "linear-gradient(112deg,#FAF9F6 0%,#EFEEEA 52%,#F7F6F3 100%)"],
  ["Calacatta Oro",  "Italy · polished",   "linear-gradient(120deg,#F7F3E9 0%,#EFE6D2 40%,#D8C49A 62%,#F5F1E6 100%)"],
  ["Thassos White",  "Greece · honed",     "linear-gradient(110deg,#FCFCFA 0%,#F4F4F1 60%,#FAFAF8 100%)"],
  ["Crema Marfil",   "Spain · polished",   "linear-gradient(116deg,#F0E4CE 0%,#E5D5B8 54%,#EFE3CC 100%)"],
  ["Bianco Perlino", "Italy · brushed",    "linear-gradient(114deg,#EFE9DE 0%,#E0D7C7 55%,#EDE7DB 100%)"],
  ["Travertino Navona","Italy · filled",   "linear-gradient(118deg,#EBDCC4 0%,#DCC7A6 50%,#E7D6BC 100%)"],
  ["Botticino",      "Italy · polished",   "linear-gradient(112deg,#EDE1CB 0%,#DCCBAD 58%,#E8DCC4 100%)"],
  ["Giallo Siena",   "Italy · polished",   "linear-gradient(120deg,#E3C177 0%,#C99E4C 48%,#DCB868 100%)"],
  ["Onice Miele",    "Iran · polished",    "linear-gradient(122deg,#E8C98F 0%,#D4A85F 38%,#F0DCB4 74%,#DCB878 100%)"],
  ["Rosa Portogallo","Portugal · polished","linear-gradient(116deg,#E8CFC8 0%,#D3ADA4 52%,#E4C8C0 100%)"],
  ["Rosso Verona",   "Italy · honed",      "linear-gradient(118deg,#B06A58 0%,#8E4A3C 50%,#A66052 100%)"],
  ["Marrone Imperiale","Italy · polished", "linear-gradient(114deg,#7C5744 0%,#573828 52%,#6E4B39 100%)"],
  ["Emperador Dark", "Spain · polished",   "linear-gradient(120deg,#5A3E2E 0%,#3C2618 48%,#523726 100%)"],
  ["Noce Travertine","Turkey · honed",     "linear-gradient(112deg,#9D7A59 0%,#7C5B3E 54%,#95724F 100%)"],
  ["Pietra Grey",    "Iran · honed",       "linear-gradient(118deg,#4A4A4C 0%,#2E2E30 52%,#434345 100%)"],
  ["Bardiglio",      "Italy · honed",      "linear-gradient(116deg,#8D9092 0%,#6E7275 54%,#85898C 100%)"],
  ["Grigio Carnico", "Italy · polished",   "linear-gradient(120deg,#5E6164 0%,#3D4043 50%,#565A5D 100%)"],
  ["Nero Marquina",  "Spain · polished",   "linear-gradient(118deg,#1E1E20 0%,#0E0E10 52%,#1A1A1C 100%)"],
  ["Verde Alpi",     "Italy · polished",   "linear-gradient(116deg,#2C5147 0%,#17342C 50%,#27483F 100%)"],
  ["Verde Guatemala","India · polished",   "linear-gradient(120deg,#25463A 0%,#122A21 48%,#1F3C31 100%)"],
  ["Breccia Oniciata","Italy · polished",  "linear-gradient(118deg,#E0C4B0 0%,#C39C82 46%,#EBD6C6 100%)"],
  ["Azul Macaubas",  "Brazil · polished",  "linear-gradient(116deg,#4C6C86 0%,#2E4D68 52%,#42627C 100%)"],
  ["Sodalite Blue",  "Bolivia · polished", "linear-gradient(120deg,#2A3F63 0%,#172946 50%,#243858 100%)"],
  ["Quartz Bianco",  "quartz · polished",  "linear-gradient(118deg,#FAFAF8 0%,#F0F0EC 54%,#F7F7F4 100%)"],
  ["Quartz Calacatta","quartz · polished",  "linear-gradient(120deg,#F8F5EE 0%,#EDE7D9 42%,#D9C9A6 64%,#F6F3EC 100%)"],
  ["Quartz Grigio",  "quartz · honed",     "linear-gradient(118deg,#C9C7C2 0%,#AEACA6 54%,#C0BEB8 100%)"],
  ["Quartz Sabbia",  "quartz · polished",  "linear-gradient(118deg,#E9DFCC 0%,#D6C8AC 54%,#E3D8C3 100%)"],
  ["Quartz Antracite","quartz · honed",    "linear-gradient(118deg,#46464A 0%,#2C2C30 54%,#3E3E42 100%)"],
  ["Quartz Nero",    "quartz · polished",  "linear-gradient(118deg,#1C1C1E 0%,#0C0C0E 54%,#18181A 100%)"]
];

const GLASS = [
  ["Oro 24k",        "24k gold leaf",      "linear-gradient(118deg,#8A6A32 0%,#E6C98A 26%,#C9A458 50%,#F0DCAE 72%,#8F6F36 100%)"],
  ["Oro Bianco",     "white gold leaf",    "linear-gradient(118deg,#8E8C86 0%,#E4E2DA 28%,#BFBDB4 52%,#F0EFE9 74%,#918F88 100%)"],
  ["Rame",           "copper leaf",        "linear-gradient(118deg,#7A4326 0%,#C97B4A 30%,#A05C31 54%,#DA9464 76%,#7E4527 100%)"],
  ["Gold Fleck",     "fleck glass",        "linear-gradient(118deg,#6B4A1E 0%,#A97C36 48%,#7D5822 100%)"],
  ["Bianco Latte",   "opaque",             "linear-gradient(118deg,#FBFAF6 0%,#EFEDE6 54%,#F8F7F2 100%)"],
  ["Avorio",         "opaque",             "linear-gradient(118deg,#F3E9D6 0%,#E4D6BC 54%,#EFE4CE 100%)"],
  ["Sabbia",         "opaque",             "linear-gradient(118deg,#E0CFB2 0%,#CDB891 54%,#DAC8A8 100%)"],
  ["Miele",          "transparent",        "linear-gradient(118deg,#E4BD77 0%,#D19C42 54%,#E9C376 100%)"],
  ["Ambra",          "transparent",        "linear-gradient(118deg,#D89B3C 0%,#B4761F 54%,#D2963A 100%)"],
  ["Corallo",        "opaque",             "linear-gradient(118deg,#DE7E5E 0%,#C25C3C 54%,#D67457 100%)"],
  ["Rubino",         "transparent",        "linear-gradient(118deg,#A81F32 0%,#7C0D1D 54%,#9C1B2C 100%)"],
  ["Melograno",      "opaque",             "linear-gradient(118deg,#8E2036 0%,#611022 54%,#831D31 100%)"],
  ["Rosa Antico",    "opaque",             "linear-gradient(118deg,#E5BFB7 0%,#CE9B92 54%,#DEB4AB 100%)"],
  ["Lilla",          "opaque",             "linear-gradient(118deg,#C0AFC8 0%,#A48FAE 54%,#B7A5C0 100%)"],
  ["Violetto",       "transparent",        "linear-gradient(118deg,#5C3A73 0%,#3E2251 54%,#553469 100%)"],
  ["Turchese",       "opaque",             "linear-gradient(118deg,#63B7B5 0%,#3B9997 54%,#57AEAC 100%)"],
  ["Acquamarina",    "transparent",        "linear-gradient(118deg,#9FD0D6 0%,#76B5BE 54%,#93C8CF 100%)"],
  ["Blu Turchino",   "opaque",             "linear-gradient(118deg,#2E7C9B 0%,#1C5C77 54%,#28718E 100%)"],
  ["Blu Cobalto",    "transparent",        "linear-gradient(118deg,#1E4C96 0%,#12336C 54%,#1A4386 100%)"],
  ["Blu Notte",      "opaque",             "linear-gradient(118deg,#1B2A47 0%,#101B31 54%,#17243D 100%)"],
  ["Verde Salvia",   "opaque",             "linear-gradient(118deg,#93A88C 0%,#748A6D 54%,#879C80 100%)"],
  ["Verde Smeraldo", "transparent",        "linear-gradient(118deg,#1B6B52 0%,#0E4A37 54%,#175E49 100%)"],
  ["Grigio Perla",   "opaque",             "linear-gradient(118deg,#D6D3CC 0%,#BFBBB3 54%,#CFCCC5 100%)"],
  ["Antracite",      "opaque",             "linear-gradient(118deg,#3A3A3C 0%,#232325 54%,#323234 100%)"],
  ["Nero Specchio",  "mirror glass",       "linear-gradient(118deg,#26262A 0%,#4A4A50 24%,#141416 52%,#3C3C42 76%,#1C1C1F 100%)"],
  ["Iridescente",    "surface-fired",      "linear-gradient(118deg,#C7D8CF 0%,#D9C7D6 26%,#C9D2E2 50%,#E0D5C2 74%,#C6D7D0 100%)"],
  ["Terracotta",     "opaque",             "linear-gradient(118deg,#C4714C 0%,#A2512F 54%,#B96945 100%)"],
  ["Bronzo",         "metallic",           "linear-gradient(118deg,#6E5430 0%,#A98A56 30%,#7E6338 56%,#BFA173 78%,#6B5230 100%)"],
  ["Verde Menta",    "opaque",             "linear-gradient(118deg,#AFCDBB 0%,#8FB39D 54%,#A4C4B1 100%)"],
  ["Ghiaccio",       "transparent",        "linear-gradient(118deg,#DCE7EA 0%,#BFD2D8 54%,#D2E0E4 100%)"]
];

function paint(id, rows, kind) {
  const host = document.getElementById(id);
  if (!host) return;
  host.innerHTML = rows.map(([name, note, css], i) => `
    <div class="sw">
      <div class="chip ${kind}" style="background-image:${css};--va:${98 + ((i * 37) % 44)}deg;--vb:${
        18 + ((i * 23) % 58)}%"></div>
      <div class="nm">${name}</div>
      <div class="mt">${note}</div>
    </div>`).join("");
}

paint("marble-chart", MARBLE, "stone");
paint("glass-chart", GLASS, "glass");

/* ---- folio numbers ---------------------------------------------------
   Page numbers follow document order, so inserting or reordering a page
   never leaves a stale number behind.                                    */
document.querySelectorAll(".page").forEach((page, i) => {
  const folio = page.querySelector(".folio");
  if (folio) folio.lastElementChild.textContent = String(i + 1).padStart(2, "0");
});
