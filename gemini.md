# Contexto do Projeto: Automação de Listas de Compras e Inventário Doméstico

## 🎯 Visão Geral
O projeto é um aplicativo mobile focado na gestão de inventário doméstico e automação de listas de compras. O objetivo é conectar dados de forma eficiente, garantindo uma interface de usuário otimizada, com fluxo de trabalho intuitivo e design responsivo.

## 🛠️ Tech Stack Principal
- **Front-end Mobile:** React Native (Expo) com TypeScript.
- **UI Framework:** React Native Paper (Material Design).
- **Back-end:** Node.js (Express) com TypeScript e Prisma/PostgreSQL.

## 🎨 Design System e UI/UX
A interface foca na componentização rigorosa para facilitar a navegação em um sistema complexo.
- **Paleta de Cores da Marca:**
  - Primária/Fundo Escuro: `#5D4D5D`
  - Secundária/Ações: `#b96565`
  - Neutra/Loading: `#887e88`
- **Tipografia:** - `Poppins` para textos gerais e botões (`PoppinsRegular`, `PoppinsBold`).
  - `Lobster` para títulos estilizados e de destaque.
- **Regras de Estilização (React Native Paper):**
  - Use as props nativas do Paper (como `buttonColor`, `textColor`, `mode="contained"`) em vez de forçar cores pelo `style`.
  - Ao criar componentes customizados baseados no Paper (ex: `Card`, `Button`), utilize o utilitário `Omit<ComponentProps, 'children'>` nas interfaces para evitar conflitos de herança.
  - Para inputs estilizados (modo outlined), utilize o `theme={{ colors: { ... } }}` internamente no componente para forçar as cores da marca.

## 🧱 Padrões de Código Front-end (React Native)
Sempre que gerar ou refatorar código, siga estritamente estas regras:

1. **Imutabilidade e Estados:**
   - NUNCA modifique arrays originais. Use `[...array]` ou métodos como `.map()` e `.filter()`.
   - Evite `array.reverse()`; prefira `[...array].reverse()`.

2. **Tipagem e Integração com Back-end:**
   - **Campos Decimal:** Valores de moeda ou quantidade vindos do Back-end chegam no JSON como **Strings**. A tipagem no Front-end DEVE ser `string` (ex: `estimated_price: string | null`). Use `parseFloat()` ou `Number()` apenas no momento do cálculo.
   - **Campos UUID:** IDs vindos do Back-end chegam como strings padrão.
   - Sempre defina interfaces TypeScript claras para as props dos componentes e para os mocks de dados.

3. **Animações (React Native Animated):**
   - Para transições de cor ou layout, utilize a API `Animated` do próprio React Native.
   - Sempre utilize `useRef(new Animated.Value(0)).current` e alterne entre `0` e `1` usando `interpolate` para transições de múltiplas cores.
   - Lembre-se de usar `useNativeDriver: false` ao animar cores de fundo (`backgroundColor`) ou bordas.

4. **Componentização (Princípio DRY):**
   - Mantenha os estilos unificados (`StyleSheet.create`).
   - Separe componentes lógicos (ex: lógica de filtragem) de componentes visuais (ex: botões e cards de exibição).
   - Use o operador spread (`{...rest}`) para repassar propriedades não mapeadas para os componentes base.

## 📅 Manipulação de Datas
- O Backend envia datas no formato ISO 8601 (ex: `"2026-11-01T10:30:00Z"`).
- O Front-end deve converter para objeto nativo usando `new Date(string)`.
- Use a API de Internacionalização (`Intl.ListFormat` e `.toLocaleString('pt-BR')`) para exibir dados legíveis para o usuário, evitando lógica manual complexa de tradução.

