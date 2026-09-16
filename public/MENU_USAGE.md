# Documentação de Menus - VidaSã

## Visão Geral

A rede social VidaSã utiliza uma arquitetura de **Single-Page Application (SPA)** com navegação por abas. O sistema apresenta quatro menus principais que permitem ao usuário navegar entre diferentes funcionalidades da plataforma.

---

## 1. Menu de Navegação Principal (Header)

### Localização
Cabeçalho superior da página, visível em todas as telas.

### Estrutura HTML
```html
<nav class="nav-pill" aria-label="Navegação principal">
  <a href="#" data-tab="feed">Feed</a>
  <a href="#" data-tab="mensagens">Msgs</a>
  <a href="#" data-tab="grupos">Grupos</a>
  <a href="#" data-tab="progresso">Progresso</a>
</nav>
```

### Propósito
Fornecer navegação rápida e intuitiva entre as funcionalidades principais da plataforma. Presente em todas as telas para consistência de experiência do usuário.

### Contexto de Utilização
- **Dispositivos Desktop**: Menu principal centralizado no cabeçalho
- **Responsividade**: Escondido em telas menores (mobile-first)
- **Acessibilidade**: Utiliza `aria-label` para descrição de navegação

### Ações Principais
1. Clicar em qualquer item do menu atualiza a aba visível
2. O item ativo recebe classe CSS `active`
3. Botão de alternância de tema (Ctrl+I) permanece no header

### Estado
- **Ativo**: Item selecionado possui classe `active` e é destacado visualmente
- **Badge**: Mostra nome da aba ativa (ex: "feed", "mensagens")

### Acessibilidade
- `aria-label` descreve a navegação principal
- `aria-current="page"` em desktop para itens ativos
- Foco visível para navegação por teclado

---

## 2. Menu Inferior (Bottom Navigation)

### Localização
Fixado na parte inferior da tela, visível especialmente em dispositivos móveis.

### Estrutura HTML
```html
<nav class="bottom-nav" aria-label="Navegação inferior — acesso rápido às funcionalidades" role="navigation">
  <div class="bottom-nav-inner">
    <a href="#" data-tab="feed">📋 Feed</a>
    <a href="#" data-tab="mensagens">💬 Mensagens</a>
    <a href="#" data-tab="grupos">👥 Grupos</a>
    <a href="#" data-tab="progresso">📊 Progresso</a>
  </div>
</nav>
```

### Propósito
Oferecer acesso rápido às funcionalidades principais em telas pequenas, mantendo os botões de navegação sempre visíveis através de `position: fixed`.

### Contexto de Utilização
- **Dispositivos Mobile**: Navegação principal de uso frequente
- **Desktop**: Opcional, mas visível para acesso rápido
- **Safe Area**: Respeita `env(safe-area-inset-bottom)` para dispositivos com entalhe

### Ações Principais
1. **Feed**: Visualizar postagens de rotinas saudáveis
2. **Mensagens**: Conversar com outros usuários (1:1)
3. **Grupos**: Participar de comunidades temáticas
4. **Progresso**: Acompanhar metas de exercícios e alimentação

### Estado
- **Posição Fixa**: `position: fixed` na parte inferior
- **Mask de Desfoque**: `backdrop-filter: blur(12px)` com opacidade
- **Classe Active**: Item selecionado destacado com fundo e cor diferenciados

### Acessibilidade
- `role="navigation"` para papel semântico
- `aria-label` descreve a função do menu
- `aria-hidden="true"` nos emojis para evitar leitura dupla

---

## 3. Abas de Conteúdo (Tab Content)

### Estrutura Geral
Cada aba é um `section` com `data-tab` correspondente ao menu:

```html
<section id="feed" class="tab-content" data-tab="feed">
  <!-- Conteúdo do Feed -->
</section>

<section id="mensagens" class="tab-content" data-tab="mensagens" style="display: none;">
  <!-- Conteúdo de Mensagens -->
</section>

<section id="grupos" class="tab-content" data-tab="grupos" style="display: none;">
  <!-- Conteúdo de Grupos -->
</section>

<section id="progresso" class="tab-content" data-tab="progresso" style="display: none;">
  <!-- Conteúdo de Progresso -->
</section>
```

### Estado Inicial
- Apenas a aba `#feed` é visível (`display: block`)
- Demais abas iniciam com `display: none`
- JavaScript controla a alternância via `switchTab()`

---

## 4. Funcionalidades por Aba

### 4.1 Feed de Rotinas (Feed)

#### Propósito
Exibir postagens da comunidade sobre rotinas saudáveis de exercícios e alimentação.

#### Componentes
- **Post Card**: Cada postagem individual
- **Imagem Post**: Visor de imagens com overlay de filtro
- **Botões de Ação**: Curtir, comentar, compartilhar

#### Interações
1. Rolagem vertical para carregar mais posts
2. Clique em "Ver mais" abre imagem em modal
3. Botões de like com contador

#### Dados Simulados
- Postagens de exercícios (agachamentos, corrida, musculação)
- Postagens de alimentação (receitas, lanches)
- Comentários pré-definidos para interação social

---

### 4.2 Mensagens (Chat)

#### Propósito
Permitir comunicação privada entre usuários da rede social.

#### Contexto de Utilização
1. Navegar até a aba "Mensagens"
2. Selecionar contato na lista de conversas
3. Digitar mensagem no campo inferior
4. Pressionar Enter ou clicar no botão enviar

#### Estrutura de Dados
```javascript
conversations: {
  [contatoId]: {
    contact: { name, avatar },
    messages: [{ author, text, time }]
  }
}
```

#### Funcionalidades
- **Conversas em memória**: Todas as mensagens são armazenadas no objeto `state.conversations`
- **Mensagens simuladas**: Respostas automáticas dos contatos
- **Histórico persistente**: Durante a sessão do navegador

#### Contatos Disponíveis
1. **Ana Costa** - Nutricionista (discutir cardápios)
2. **Carlos Silva** - Personal trainer (planejar treinos)
3. **Maria Santos** - Viajante (rotinas on-the-go)

---

### 4.3 Grupos

#### Propósito
Conectar pessoas através de comunidades temáticas com interesses em comum.

#### Contexto de Utilização
1. Navegar até a aba "Grupos"
2. Procurar grupo por categoria ou nome
3. Clicar em "Participar" para entrar no grupo
4. Publicar mural dentro do grupo

#### Estrutura de Dados
```javascript
groups: [
  {
    id,
    name,
    description,
    category, // 'nutrição', 'viajante', etc.
    joined: boolean,
    posts: []
  }
]
```

#### Categorias de Grupos
- **Nutrição**: Compartilhar receitas e dicas alimentares
- **Viajante**: Manter rotinas fora de casa
- **Iniciantes**: Acompanhamento e estudos iniciais

#### Funcionalidades
- **Unir-se a grupos**: Toggle de `joined` com animação
- **Mural de posts**: Publicar textos simples com data/hora
- **Participantes**: Contador visual de membros

#### Botões de Ação por Grupo
- `Ver Mais` - Abre posts no modal
- `Participar` / `Sair` - Altera status de participação

---

### 4.4 Progresso

#### Propósito
Acompanhar e visualizar metas de exercícios e alimentação ao longo do tempo.

#### Contexto de Utilização
1. Navegar até a aba "Progresso"
2. Visualizar métricas atuais (peso, exercícios, calorias)
3. Ver metas definidas no início
4. Monitorar barra de progresso por objetivo

#### Métricas Monitoradas
- **Peso Corporal**: Valor atual versus meta
- **Exercícios Semanais**: Sessões completadas
- **Calorias Diárias**: Média de consumo

#### Estrutura Visual
```
[ Métrica 1 ]  [ Métrica 2 ]
[ Objetivo ]   [ Objetivo ]
[ Barra de Progresso ]
```

#### Meta
- `goal` com propriedade `current` e `target`
- Barra de progresso com classe `warn` quando em risco

---

## 5. Sistema de Tema

### Propósito
Permitir troca entre tema claro e escuro para conforto visual.

### Contexto de Utilização
- **Automático**: Detecta preferência do sistema via `prefers-color-scheme`
- **Manual**: Ctrl+I alterna entre temas
- **Armazenamento**: Atributo `data-theme` no elemento `<html>`

### Variáveis CSS
```css
:root {
  --bg: #F7F5F0;        /* Fundo claro */
  --surface: #FFFFFF;   /* Fundo de cards */
  --ink: #1E293B;       /* Texto principal */
  --accent: #E11D48;    /* Vermelho (alertas) */
  --accent-2: #0F766E;  /* Verde (sucessos) */
}
```

### Transição
- Transição suave de 0.3s para todas as mudanças de tema
- Sombras e cores ajustadas dinamicamente

---

## 6. Acessibilidade Geral

### Principais Recursos
1. **ARIA Labels**: Descrições completas de navegação
2. **Role Semantics**: `banner`, `navigation` definidos
3. **Foco Visível**: Transições claras para navegação por teclado
4. **Contraste**: Cores com contraste WCAG adequado
5. **Font Loading**: `font-display: swap` para fallback rápido

### Navegação por Teclado
- Tab: Navega entre links do menu
- Enter: Ativa aba selecionada
- Ctrl+I: Alterna tema
- Esc: Fecha modais (quando implementado)

---

## 7. Responsividade

### Breakpoints
```css
@media (max-width: 480px) {
  /* Ajustes mobile */
}

@media (prefers-color-scheme: dark) {
  /* Variações escuras */
}
```

### Elementos Mobile-First
- Menu inferior fixed-bottom
- Padding interno ajustado: `16px 14px 100px`
- Overlay text resizing para 18px

---

## 8. Estados do Aplicativo

### Estrutura de Estado (app.js)
```javascript
state: {
  activeTab: 'feed' | 'mensagens' | 'grupos' | 'progresso',
  activeChat: contatoId | null,
  activeGroup: groupId | null,
  theme: 'light' | 'dark'
}
```

### Controle de Abas
```javascript
// Método principal de troca
App.toggleTab(tabName) {
  // Remove active de todos
  // Adiciona active ao selecionado
  // Atualiza badge
  // Esconde/ mostra seções
}
```

---

## 9. Fluxos de Navegação

### Roteamento Simples
```
index.html → DOMContentLoaded → App.init()
→ App.render() → Renderiza feed inicial
→ Usuário clica no menu → App.toggleTab() → Alterna abas
```

### Sem Backend
- Todos os dados são estáticos em memória
- Não há persistência entre sessões
- Ideal para demonstração e protótipos

---

## 10. Considerações Técnicas

### Pontos Fortes
- Arquitetura modular (HTML/CSS/JS separados)
- Design system consistente com variáveis
- Acessibilidade implementada
- Mobile-first responsive

### Limitações Conhecidas
- Persistência implementada (mensagens e grupos via `localStorage`)
- Busca de grupos com modal animado
- Sem autenticação real
- Mensagens simuladas com respostas fixas

---

## Próximas Melhorias Sugeridas

1. ✅ **Persistência de Estado** — Implementado (`localStorage`)
2. ✅ **Busca em Grupos** — Implementado (filtro por nome/ID + modal animado)
3. **Alertas de Tema** — Notificação de alternância de tema
4. **Transições Animadas** — CSS transitions para troca de abas
5. **PWA** — Tornar acessível offline
