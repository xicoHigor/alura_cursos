# Biblioteca de cursos — X-Análises

Catálogo estático de cursos com identidade visual baseada na paleta fornecida e logo X-Análises adaptada para o site.

## Como abrir

1. Extraia `alura-cursos.zip` mantendo a pasta `alura-cursos`.
2. Abra `alura-cursos/index.html` no navegador.
3. Mantenha `app.js`, `cursos.js`, `trilhas.js`, `styles.css` e a pasta `assets` junto do HTML.

## Recursos

- Busca por título, área e tema.
- Filtros por área, tema, nível sugerido e faixa de duração, além de ordenação alfabética e favoritos.
- Seção “Comece por aqui” com recomendações para programação, análise de dados e UX.
- Progresso das etapas das trilhas salvo localmente neste navegador.
- 1.432 cursos e 9 trilhas com 60 etapas.
- Links dos cursos e das etapas direcionam ao Google Drive.
- Layout responsivo para telas maiores e celulares.

## Dados

Os títulos, categorias e links do Google Drive vêm da planilha fornecida. As descrições aproveitam as recomendações registradas na planilha e, quando há correspondência exata, descrições ou ementas públicas da Alura. Cursos sem esses dados recebem um resumo baseado no título e na área.

A duração estimada é mostrada apenas quando foi encontrada correspondência exata na API pública da Alura. O nível é uma sugestão inferida a partir do título, não um nível oficial da Alura.

Favoritos e etapas concluídas ficam no armazenamento local do navegador usado para abrir o site. Eles não são sincronizados entre dispositivos.
