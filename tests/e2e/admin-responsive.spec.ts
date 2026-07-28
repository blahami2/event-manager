import { expect, test } from "@playwright/test";

const fixture = `<!doctype html>
<html lang="cs"><head><meta charset="utf-8"><style>
*{box-sizing:border-box}body{margin:0;font:14px system-ui;background:#101114;color:#eee}
nav{padding:10px 16px;border-bottom:1px solid #333}.bar{display:flex;align-items:center;justify-content:space-between}
#menu{display:none}.menu-open #menu{display:grid;gap:8px;padding-top:12px}button,a{color:inherit;background:#202228;border:1px solid #444;border-radius:6px;padding:9px;text-decoration:none}
main{padding:16px;max-width:100%}header{display:flex;flex-direction:column;gap:12px}.actions{display:flex;flex-wrap:wrap;gap:8px}.actions>*{flex:1}
.stats{display:grid;grid-template-columns:1fr;gap:10px}.stat{min-width:0;padding:14px;border:1px solid #333;border-radius:8px}
.bulk{display:flex;flex-wrap:wrap;gap:8px;width:100%;padding:10px;border:1px solid #444;border-radius:12px}.bulk span{min-width:0;overflow:hidden;text-overflow:ellipsis}
@media(min-width:640px){header{flex-direction:row;justify-content:space-between}.actions>*{flex:none}.stats{grid-template-columns:repeat(3,1fr)}.bulk{flex-wrap:nowrap}}
</style></head><body>
<nav id="nav"><div class="bar"><strong>ADMINISTRACE</strong><button id="toggle" aria-expanded="false">Otevřít nabídku administrace</button></div>
<div id="menu"><a href="#">Registrace</a><a href="#">Nastavení</a><button>Odhlásit se</button></div></nav>
<main><header><div><small>SEZNAM HOSTŮ</small><h1>Registrace</h1></div><div class="actions"><a href="#">Stáhnout CSV</a><button>Přidat rezervaci</button></div></header>
<section class="stats"><div class="stat">Celkem registrací<br><b>12</b></div><div class="stat">Dospělí<br><b>20</b></div><div class="stat">Děti<br><b>7</b></div></section>
<section class="bulk" aria-label="Hromadné akce"><span>2 vybrané registrace</span><button>Znovu odeslat e-mail</button><a href="#">Exportovat</a><button>Vymazat výběr</button></section></main>
<script>toggle.onclick=()=>{const open=!nav.classList.toggle('menu-open');const expanded=nav.classList.contains('menu-open');toggle.setAttribute('aria-expanded',String(expanded));toggle.textContent=expanded?'Zavřít nabídku administrace':'Otevřít nabídku administrace'}</script>
</body></html>`;

for (const width of [320, 375]) {
  test(`Czech admin controls remain usable without overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.setContent(fixture);
    await page.getByRole("button", { name: "Otevřít nabídku administrace" }).click();

    await expect(page.getByRole("link", { name: "Registrace" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Přidat rezervaci" })).toBeVisible();
    await expect(page.getByText("Celkem registrací")).toBeVisible();
    await expect(page.getByRole("region", { name: "Hromadné akce" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
