/* GERADO por scripts/marca/gerar.mjs a partir de identidade/marca.tokens.json: não edite
   O movimento da marca para o navegador (HyperFrames, página) e para o
   Remotion. Script comum, sem export: carregado por <script> ou importado,
   ele põe globalThis.MARCA_MOVIMENTO. Com o GSAP e o CustomEase na página,
   registra as curvas "marca", "marca-entrada" e "marca-saida". */
(function (raiz) {
  var M = {
    "configurada": false,
    "motivo": "a marca não está configurada: rode /marca"
  };
  M.exigeMarca = function () {
    if (!M.configurada) throw new Error("a marca não está configurada: rode /marca");
  };
  M.registrar = function (gsap, CustomEase) {
    M.exigeMarca();
    gsap.registerPlugin(CustomEase);
    CustomEase.create("marca", M.gsap.principal);
    CustomEase.create("marca-entrada", M.gsap.entrada);
    CustomEase.create("marca-saida", M.gsap.saida);
  };
  raiz.MARCA_MOVIMENTO = M;
  if (M.configurada && raiz.gsap && raiz.CustomEase) M.registrar(raiz.gsap, raiz.CustomEase);
})(typeof globalThis !== "undefined" ? globalThis : this);
