// fundação: semente v1 · é seu
// A vitrine no navegador de verdade, nos dois tamanhos do playwright.config.
//
// 🚨 O esperado sai dos TOKENS DO PROJETO, lidos na página, nunca de número
// escrito aqui: com marca própria, o raio e a fonte são outros e o teste
// continua medindo a mesma regra.
// mutação: next.config.ts · "{ key: "X-Content-Type-Options", value: "nosniff" }," → "" · pega em 09/10/2026
// mutação: next.config.ts · "value: "max-age=31536000; includeSubDomains"," → "value: "max-age=0"," · pega em 09/10/2026
import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

const erros: string[] = []

test.beforeEach(async ({ page }) => {
  erros.length = 0
  page.on("console", (m) => {
    if (m.type() === "error") erros.push(m.text())
  })
  page.on("pageerror", (e) => erros.push(e.message))
  await page.goto("/vitrine")
  // Mede só com a página pintada: sem isto, a medida pode cair antes de o
  // conteúdo aparecer e dar caixa de tamanho zero.
  await expect(page.locator("h1")).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
})

/** O valor de um token do :root, em px. */
async function token(page: Page, nome: string) {
  return page.evaluate((n) => {
    const sonda = document.createElement("div")
    sonda.style.width = `var(${n})`
    document.body.append(sonda)
    const px = sonda.getBoundingClientRect().width
    sonda.remove()
    return px
  }, nome)
}

async function raio(page: Page, seletor: string) {
  return page
    .locator(seletor)
    .first()
    .evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius))
}

test("tem título de página", async ({ page }) => {
  await expect(page.locator("h1")).toBeVisible()
})

test("o conteúdo chega no HTML, visível sem esperar script", async ({
  request,
}) => {
  // Um `loading.tsx` na raiz manda o conteúdo num `<div hidden>` e o revela
  // por script: sem JavaScript, só o esqueleto.
  const html = await (await request.get("/vitrine")).text()
  expect(html).not.toMatch(/<div hidden id="S:\d+"/)
})

test("a resposta traz os cabeçalhos de segurança", async ({ request }) => {
  const cabecalhos = (await request.get("/vitrine")).headers()
  expect(cabecalhos["x-content-type-options"]).toBe("nosniff")
  expect(cabecalhos["x-frame-options"]).toBe("DENY")
  expect(cabecalhos["referrer-policy"]).toBe("strict-origin-when-cross-origin")
  expect(cabecalhos["permissions-policy"]).toContain("camera=()")
  // Em 127.0.0.1 o HSTS sai (ele só se cala em localhost), e se afirma aqui.
  expect(cabecalhos["strict-transport-security"]).toContain("max-age=31536000")
})

test("a fonte da marca carregou (não é a substituta nem a do sistema)", async ({
  page,
}) => {
  const resultado = await page.evaluate(() => {
    const pilha = getComputedStyle(document.body).fontFamily
    const primeira = pilha
      .split(",")[0]
      .trim()
      .replace(/^['"]|['"]$/g, "")
    const faces = [...document.fonts].filter(
      (f) => f.family.replace(/^['"]|['"]$/g, "") === primeira
    )
    return {
      primeira,
      declaradas: faces.length,
      carregadas: faces.filter((f) => f.status === "loaded").length,
    }
  })
  // A marca que usa a fonte do sistema não tem arquivo para carregar: é a
  // marca neutra, ou uma escolha da entrevista (gerar-marca.mjs).
  test.skip(
    resultado.primeira === "system-ui",
    "a marca usa a fonte do sistema: não há @font-face para medir"
  )
  expect(
    resultado.declaradas,
    `nenhum @font-face declara a ${resultado.primeira}`
  ).toBeGreaterThan(0)
  expect(
    resultado.carregadas,
    `a ${resultado.primeira} não carregou`
  ).toBeGreaterThan(0)
})

test("o botão tem o raio pequeno da marca, e o cartão o médio", async ({
  page,
}) => {
  expect(await raio(page, "main [data-slot=button]")).toBeCloseTo(
    await token(page, "--r-sm"),
    0
  )
  expect(await raio(page, "[data-peca=cartao]")).toBeCloseTo(
    await token(page, "--r-md"),
    0
  )
})

test("nada passa do raio grande da marca, e não existe pílula", async ({
  page,
}) => {
  const teto = await token(page, "--r-lg")
  const acima = await page.evaluate((limite) => {
    return [...document.querySelectorAll("body *")]
      .filter(
        (el) =>
          parseFloat(getComputedStyle(el).borderTopLeftRadius) > limite + 0.5
      )
      .map(
        (el) =>
          `${el.tagName.toLowerCase()}.${String(el.getAttribute("class") ?? "").slice(0, 60)}`
      )
  }, teto)
  expect(acima).toEqual([])
})

test("no celular, todo botão e todo campo têm alvo de toque de 44px", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "celular",
    "o alvo de toque é regra do ponteiro grosso"
  )
  // Todos os controles da página, e não só os marcados: o `Button` do
  // registry nasce com 32px.
  const pequenos = await page.evaluate(() =>
    [
      ...document.querySelectorAll(
        'main [data-slot="button"], main [data-slot="input"], main [data-slot="textarea"]'
      ),
    ]
      .map((el) => ({ el, caixa: el.getBoundingClientRect() }))
      .filter(
        ({ el, caixa }) =>
          caixa.height < 44 ||
          (el.getAttribute("data-slot") === "button" && caixa.width < 44)
      )
      .map(
        ({ el, caixa }) =>
          `${el.textContent?.trim() || el.id} (${Math.round(caixa.width)}×${Math.round(caixa.height)})`
      )
  )
  expect(pequenos).toEqual([])
  // E o piso não vira teto: o campo de várias linhas continua maior que uma
  // linha (a regra de 44px não pode encolher o Textarea).
  const alturas = await page.evaluate(() =>
    [...document.querySelectorAll('main [data-slot="textarea"]')].map(
      (el) => el.getBoundingClientRect().height
    )
  )
  for (const a of alturas) expect(a).toBeGreaterThanOrEqual(60)
})

test("campo de formulário nunca abaixo de 16px, em nenhuma largura", async ({
  page,
}) => {
  // Abaixo de 16px o iPhone dá zoom sozinho ao tocar no campo; o `md:text-sm`
  // do registry o leva a 14px a partir de 768px.
  for (const largura of [390, 768, 1280]) {
    await page.setViewportSize({ width: largura, height: 900 })
    const menores = await page.evaluate(() =>
      [...document.querySelectorAll("input, textarea, select")]
        .map((el) => parseFloat(getComputedStyle(el).fontSize))
        .filter((px) => px < 16)
    )
    expect(menores, `a ${largura}px`).toEqual([])
  }
})

test("o foco no botão tem contorno sólido de 2px", async ({ page }) => {
  await page.locator("main [data-slot=button]").first().focus()
  await page.keyboard.press("Shift+Tab")
  await page.keyboard.press("Tab")
  const foco = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement
    const s = getComputedStyle(el)
    return {
      slot: el.dataset.slot,
      largura: parseFloat(s.outlineWidth),
      estilo: s.outlineStyle,
    }
  })
  expect(foco.slot).toBe("button")
  expect(foco.largura).toBeGreaterThanOrEqual(2)
  expect(foco.estilo).toBe("solid")
})

test("a página inteira usa a curva de movimento da marca", async ({ page }) => {
  const curva = await page.evaluate(() => {
    const sonda = document.createElement("div")
    sonda.style.transitionTimingFunction = "var(--ease-brand)"
    document.body.append(sonda)
    const esperada = getComputedStyle(sonda).transitionTimingFunction
    sonda.remove()
    const botao = document.querySelector(
      'main [data-slot="button"]'
    ) as HTMLElement
    return {
      esperada,
      doBotao: getComputedStyle(botao).transitionTimingFunction,
    }
  })
  expect(curva.doBotao).toBe(curva.esperada)
})

test("com menos movimento pedido, nada pulsa", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  const duracoes = await page.evaluate(() =>
    [...document.querySelectorAll('[data-slot="skeleton"]')].map((el) =>
      parseFloat(getComputedStyle(el).animationDuration)
    )
  )
  expect(duracoes.length).toBeGreaterThan(0)
  for (const d of duracoes) expect(d).toBeLessThan(0.01)
})

test("o último bloco que se revela aparece quando a página chega ao fim", async ({
  page,
}) => {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  // O atributo, e não a opacidade: a rede de segurança do CSS também põe
  // opacidade 1 depois de 4 s, e o teste mediria a rede em vez da revelação.
  // Só o observador marca data-revelado.
  await expect(page.locator("[data-revela]").last()).toHaveAttribute(
    "data-revelado",
    ""
  )
})

test("com o JavaScript funcionando, o bloco espera a pessoa chegar nele", async ({
  page,
}) => {
  // Sem rolar: o último bloco está longe, e não pode aparecer sozinho (nem
  // pela rede de 4 s do CSS).
  await page.waitForTimeout(4000)
  const ultimo = page.locator("[data-revela]").last()
  await expect(ultimo).not.toHaveAttribute("data-revelado", "")
  await expect(ultimo).toHaveCSS("opacity", "0")
})

test("com o JavaScript do Revela falhando, a página aparece inteira", async ({
  page,
}) => {
  // O vigia do layout tira a classe js em 3 s quando o código não chega.
  await page.route("**/_next/static/chunks/**", (rota) => rota.abort())
  await page.reload()
  await page.waitForTimeout(3500)
  await expect(page.locator("[data-revela]").last()).toHaveCSS("opacity", "1")
})

test("a cor com opacidade do Tailwind pinta (bg-primary/50)", async ({
  page,
}) => {
  const fundo = await page
    .locator("[data-peca=primaria]")
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(fundo).not.toBe("rgba(0, 0, 0, 0)")
  expect(fundo).not.toBe("transparent")
})

test("zero violação de acessibilidade e zero erro no console", async ({
  page,
}) => {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(800)
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  const resumo = violations.map(
    (v) =>
      `${v.id}: ${v.nodes
        .map((n) => n.target.join(" "))
        .slice(0, 3)
        .join(" | ")}`
  )
  expect(resumo).toEqual([])
  expect(erros).toEqual([])
})
