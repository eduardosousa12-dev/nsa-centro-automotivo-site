# NSA Centro Automotivo — site

Landing page da **Troca de Óleo Nossa Senhora Aparecida / NSA Centro Automotivo** (Uberlândia – MG).

- HTML + CSS + JS puros, sem build e sem dependências (só Google Fonts).
- `index.html` · `css/style.css` · `js/main.js`
- Imagens e vídeos em `assets/`.

## Rodar local
Abra `index.html` no navegador ou rode `python3 -m http.server` na pasta.

## Publicar
Netlify (deploy automático a cada push na branch `main`).

## Onde editar
- WhatsApp: constante `WA_NUMBER` em `js/main.js` (e os links `wa.me` no HTML).
- Horário: objeto `schedule` em `js/main.js` + rodapé e JSON-LD no `index.html`.
- Preços dos pneus: seção `#pneus`, FAQ e JSON-LD no `index.html`.
- Domínio: troque `nsacentroautomotivo.netlify.app` em `index.html`, `robots.txt` e `sitemap.xml`.
