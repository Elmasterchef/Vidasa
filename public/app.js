"use strict";

/**
 * VidaSã App — App de rede social de vida saudável (single-page, em memória)
 * Contém:
 * - Lógica de navegação e alternância de abas (Feed, Mensagens, Grupos, Progresso)
 * - Lista de conversas e funcionamento do chat (entrada/saída + respostas simuladas)
 * - Lista de grupos, entrada de mural, botão de entrar/participar
 * - Trabalho simulado de progresso (métricas, metas, histórico)
 * - Gerenciamento de tema e hooks de acessibilidade
 */

const App = {
  // ---------- State ----------
  state: {
    activeTab: 'feed', // 'feed' | 'mensagens' | 'grupos' | 'progresso'
    activeChat: null, // id do contato atualmente aberto
    activeGroup: null, // id do grupo atualmente aberto
    theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  },

  // ---------- Persistência (localStorage) ----------
  _save(key, data) {
    try { localStorage.setItem(`vidasa_${key}`, JSON.stringify(data)); } catch(e) { /* storage full ou bloqueado */ }
  },
  _load(key, fallback) {
    try { const raw = localStorage.getItem(`vidasa_${key}`); return raw ? JSON.parse(raw) : fallback; } catch(e) { return fallback; }
  },

  // ---------- Inicializar ----------
  init() {
    this.cacheElements();
    this.render();
    this.attachEventListeners();
    this.observeTheme();
    console.log('App iniciado — tab ativa:', this.state.activeTab, 'tabs encontradas:', this.$.tabs.length);
  },

  // ---------- Utilitários DOM ----------
  cacheElements() {
    this.$ = {
      header: document.querySelector('.site-header'),
      navLinks: document.querySelectorAll('.nav-pill a, .bottom-nav-inner a'),
      tabs: document.querySelectorAll('.tab-content'),
      conversationsList: document.getElementById('conversations-list'),
      chatView: document.getElementById('chat-view'),
      chatMessages: document.getElementById('chat-messages'),
      chatInput: document.getElementById('chat-input'),
      msgInput: document.getElementById('chat-msg-input'),
      groupsContainer: document.getElementById('groups-container'),
      groupView: document.getElementById('group-view'),
      groupMural: document.getElementById('group-mural'),
      groupInput: document.getElementById('group-input'),
      groupMsgInput: document.getElementById('group-msg-input'),
      searchInput: document.getElementById('group-search'),
      groupSearchResults: document.getElementById('group-search-results'),
      badge: document.getElementById('badge'),
    };
  },

  // ---------- Rote renderização principal ----------
  render() {
    this.switchTab(this.state.activeTab);
    this.renderConversations();
    this.renderGroups();
    this.renderProgress();
  },

  // ---------- Navegação entre abas ----------
  switchTab(tab) {
    if (!['feed', 'mensagens', 'grupos', 'progresso'].includes(tab)) return;
    this.state.activeTab = tab;

    // Ocultar todas as abas, mostrar apenas a ativa
    this.$.tabs.forEach(t => t.classList.remove('active'));
    const target = document.getElementById('tab-' + tab);
    if (target) target.classList.add('active');

    // Atualizar links de navegação ativos
    this.$.navLinks.forEach(a => {
      const isActive = a.dataset.tab === tab;
      a.classList.toggle('active', isActive);
      if (isActive) {
        a.setAttribute('aria-current', 'page');
        a.setAttribute('aria-label', this.getTabLabel(tab));
      } else {
        a.removeAttribute('aria-current');
        a.removeAttribute('aria-label');
      }
    });

    // Título e badge do header
    if (this.$.badge) this.$.badge.textContent = tab === 'feed' ? 'feed' : tab;

    // Fechar qualquer chat aberto ao trocar de aba
    if (this.state.activeChat) {
      this.closeChat();
    }
    if (this.state.activeGroup) {
      this.closeGroup();
    }

    // Ajustar visibilidade da entrada de chat
    if (this.$.chatInput) this.$.chatInput.classList.remove('visible');
    if (this.$.groupInput) this.$.groupInput.classList.remove('visible');
  },

  // ---------- Rótulos para mudança de aba (contexto de utilização) ----------
  getTabLabel(tab) {
    const labels = {
      feed: 'Feed de rotinas saudáveis',
      mensagens: 'Ver e iniciar conversas com contatos',
      grupos: 'Explorar grupos de interesse e comunidades',
      progresso: 'Acompanhar seu progresso e metas de vida saudável',
    };
    return labels[tab] || '';
  },

  // ---------- Configurar listeners de eventos ----------
  attachEventListeners() {
    // Clique nos links de navegação
    this.$.navLinks.forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const tab = a.dataset.tab;
        if (tab) this.switchTab(tab);
      });
    });

    // Clique em conversas
    if (this.$.conversationsList) {
      this.$.conversationsList.addEventListener('click', e => {
        const target = e.target.closest('.conversation');
        if (target) {
          const userId = target.getAttribute('data-user');
          if (userId) this.openChat(userId);
        }
      });
    }

    // Clique em grupos
    if (this.$.groupsContainer) {
      this.$.groupsContainer.addEventListener('click', e => {
        const target = e.target.closest('.group-card');
        if (target) {
          const groupId = target.getAttribute('data-group');
          if (groupId) this.openGroup(groupId);
        }
      });
    }

    // Buscar grupos - modal de resultados
    if (this.$.searchInput) {
      this.$.searchInput.addEventListener('input', e => {
        const q = e.target.value.trim().toLowerCase();
        if (!q) {
          this.closeSearchOverlay();
          return;
        }
        const groups = [
          { id: 'corredores', name: 'Corredores VidaSã', icon: '🏃', bg: '#E8F0EF', members: 248, online: 12, joined: true },
          { id: 'yoga', name: 'Yoga & Bem-estar', icon: '🧘', bg: '#F3E8FF', members: 156, online: 8, joined: false },
          { id: 'nutricao', name: 'Nutrição Saudável', icon: '🥗', bg: '#FFF1F2', members: 312, online: 21, joined: false },
          { id: 'musculacao', name: 'Musculação Radical', icon: '🏋️', bg: '#FEF3C7', members: 489, online: 34, joined: false },
        ];
        const filtered = groups.filter(g => g.name.toLowerCase().includes(q) || g.id.includes(q));
        const overlay = document.getElementById('search-overlay');
        const results = document.getElementById('group-search-results');
        if (!overlay || !results) return;
        if (!filtered.length) {
          results.innerHTML = '<p style="padding:8px;color:var(--ink-muted);font-size:13px;">Nenhum grupo encontrado.</p>';
        } else {
          results.innerHTML = filtered.map(g => `
            <button class="search-item" onclick="App.openGroup('${g.id}'); App.closeSearchOverlay();" aria-label="Abrir ${g.name}">
              <div style="width:36px;height:36px;border-radius:10px;background:${g.bg};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">${g.icon}</div>
              <div style="min-width:0;"><h4 style="font-size:15px;font-weight:600;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${g.name}</h4><p style="font-size:12px;color:var(--ink-muted);margin:2px 0 0;">${g.members} membros · ${g.online} online</p></div>
            </button>
          `).join('');
        }
        overlay.style.display = 'flex';
        requestAnimationFrame(() => overlay.classList.add('active'));
        overlay.focus();
      });
    }

    // Clique no botão X no chat
    if (this.$.chatMessages) {
      this.$.chatMessages.addEventListener('click', e => {
        const btn = e.target.closest('button[aria-label*="Conversar"]');
        if (btn) {
          const userId = btn.getAttribute('data-user');
          if (userId) this.openChat(userId);
        }
      });
    }
  },

  // ---------- Mostrar/ocultar tema ----------
  observeTheme() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      this.state.theme = e.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', this.state.theme);
    });
  },

  // ---------- Renderizar lista de conversas ----------
  renderConversations() {
    if (!this.$.conversationsList) return;
    const conversations = [
      { id: 'marina', name: 'Marina Silva', last: 'Oi João, amanhã faço yoga às 7h', time: '09:42', unread: true, img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=face&q=80' },
      { id: 'ana', name: 'Ana Beatriz', last: 'Que tal trocarmos dicas de alimentação?', time: 'Ontem', unread: false, img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=160&h=160&fit=crop&crop=face&q=80' },
      { id: 'carlos', name: 'Carlos Mendes', last: 'Oi, vi sua postagem sobre quinoa', time: '12/09', unread: false, img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=face&q=80' },
      { id: 'lucas', name: 'Lucas Fernandes', last: 'Treinei hoje, como você?', time: '11/09', unread: false, img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&h=160&fit=crop&crop=face&q=80' },
    ];
    this.$.conversationsList.innerHTML = '';
    conversations.forEach(c => {
      const div = document.createElement('div');
      div.className = 'conversation';
      div.setAttribute('role', 'button');
      div.setAttribute('tabindex', '0');
      div.setAttribute('data-user', c.id);
      div.setAttribute('aria-label', `Conversar com ${c.name}`);
      div.innerHTML = `
        <img src="${c.img}" alt="${c.name}">
        <div class="info">
          <h4>${c.name}</h4>
          <p>${c.last}</p>
        </div>
        <div class="meta-chat">
          <span class="time">${c.time}</span>
          ${c.unread ? '<span class="unread" aria-label="mensagem não lida"></span>' : ''}
        </div>
      `;
      this.$.conversationsList.appendChild(div);
    });
  },

  // ---------- Abrir chat com contato ----------
  openChat(userId) {
    this.state.activeChat = userId;
    const conv = this.conversations[userId];
    if (!conv) return;

    // Ocultar lista de conversas
    if (this.$.conversationsList) this.$.conversationsList.style.display = 'none';
    // Mostrar chat view
    if (this.$.chatView) {
      this.$.chatView.style.display = 'block';
      if (this.$.chatMessages) this.$.chatMessages.innerHTML = '';
    }

    // Atualizar cabeçalho do chat
    if (this.$.chatAvatar) this.$.chatAvatar.src = conv.img;
    if (this.$.chatAvatar) this.$.chatAvatar.alt = conv.name;
    if (this.$.chatName) this.$.chatName.textContent = conv.name;

    // Exibir entrada de mensagem
    if (this.$.chatInput) {
      this.$.chatInput.classList.add('visible');
      if (this.$.msgInput) this.$.msgInput.focus();
    }

    // Renderizar mensagens
    this.renderMessages(conv);
  },

  // ---------- Fechar chat ----------
  closeChat() {
    this.state.activeChat = null;
    if (this.$.chatView) this.$.chatView.style.display = 'none';
    if (this.$.conversationsList) this.$.conversationsList.style.display = 'block';
    if (this.$.chatInput) this.$.chatInput.classList.remove('visible');
  },

  // ---------- Renderizar mensagens ----------
  renderMessages(conv) {
    if (!this.$.chatMessages) return;
    this.$.chatMessages.innerHTML = '';
    conv.messages.forEach(m => {
      const div = document.createElement('div');
      div.className = 'msg ' + (m.from === 'mine' ? 'outgoing' : 'incoming');
      div.style.cursor = 'pointer';
      div.setAttribute('aria-label', 'Mensagem: ' + m.text);
      div.setAttribute('tabindex', '0');
      div.addEventListener('click', () => this.openMsgPanel(conv.messages.indexOf(m)));
      div.innerHTML = m.text + '<div class="time">' + m.time + '</div>';
      this.$.chatMessages.appendChild(div);
    });
    this.scrollToBottom();
  },

  // ---------- Rolar até o final ----------
  scrollToBottom() {
    if (this.$.chatMessages) this.$.chatMessages.scrollTop = this.$.chatMessages.scrollHeight;
  },

  // ---------- Enviar mensagem ----------
  sendMsg() {
    const input = this.$.msgInput;
    const text = input.value.trim();
    if (!text || !this.state.activeChat) return;

    const conv = this.state.conversations[this.state.activeChat];
    conv.messages.push({ from: 'mine', text, time: 'agora' });
    this._save('conversations', this.state.conversations);
    input.value = '';
    this.renderMessages(conv);
    this.scrollToBottom();

    // Simular resposta após tempo aleatório
    const replies = ['Legal! 👍', 'Vou testar depois.', 'Interessante, obrigado!', 'Anotei 💪', 'Combinação perfeita!'];
    const reply = replies[Math.floor(Math.random() * replies.length)];
    setTimeout(() => {
      conv.messages.push({ from: 'theirs', text: reply, time: 'agora' });
      this._save('conversations', this.state.conversations);
      if (this.state.activeChat) {
        this.renderMessages(conv);
        this.scrollToBottom();
      }
    }, 800 + Math.random() * 600);
  },

  // ---------- Mensagens simuladas ----------
  conversations: {
    marina: {
      name: 'Marina Silva',
      img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=face&q=80',
      messages: [
        { from: 'theirs', text: 'Oi João, amanhã faço yoga às 7h', time: '09:42' },
        { from: 'mine', text: 'Seria ótimo! Já te aviso quando chegar.', time: '09:45' },
        { from: 'theirs', text: 'Perfeito, nos vemos lá ☀️', time: '09:46' },
      ],
    },
    ana: {
      name: 'Ana Beatriz',
      img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=160&h=160&fit=crop&crop=face&q=80',
      messages: [
        { from: 'theirs', text: 'Que tal trocarmos dicas de alimentação?', time: '18:30' },
        { from: 'mine', text: 'Claro! Adoraria trocar receitas saudáveis.', time: '18:32' },
        { from: 'theirs', text: 'Mando minha lista amanhã 🥗', time: '18:33' },
      ],
    },
    carlos: {
      name: 'Carlos Mendes',
      img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=face&q=80',
      messages: [
        { from: 'theirs', text: 'Oi, vi sua postagem sobre quinoa. Posso tirar dúvidas?', time: '10:15' },
        { from: 'mine', text: 'Claro, Carlos! Fico feliz em ajudar.', time: '10:20' },
      ],
    },
    lucas: {
      name: 'Lucas Fernandes',
      img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&h=160&fit=crop&crop=face&q=80',
      messages: [
        { from: 'theirs', text: 'Treinei hoje, como você?', time: '19:00' },
        { from: 'mine', text: 'Fui correr 5km à noite. Boas sensações!', time: '19:05' },
      ],
    },
  },

  // ---------- Renderizar lista de grupos ----------
  renderGroups() {
    if (!this.$.groupsContainer) return;
    const groups = [
      { id: 'corredores', name: 'Corredores VidaSã', icon: '🏃', bg: '#E8F0EF', members: 248, online: 12, joined: true, img1: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=face&q=80', img2: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&h=160&fit=crop&crop=face&q=80', img3: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=face&q=80' },
      { id: 'yoga', name: 'Yoga & Bem-estar', icon: '🧘', bg: '#F3E8FF', members: 156, online: 8, joined: false, img1: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=face&q=80', img2: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=160&h=160&fit=crop&crop=face&q=80' },
      { id: 'nutricao', name: 'Nutrição Saudável', icon: '🥗', bg: '#FFF1F2', members: 312, online: 21, joined: false, img1: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=160&h=160&fit=crop&crop=face&q=80', img2: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=face&q=80' },
      { id: 'musculacao', name: 'Musculação Radical', icon: '🏋️', bg: '#FEF3C7', members: 489, online: 34, joined: false, img1: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&h=160&fit=crop&crop=face&q=80', img2: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&h=160&fit=crop&crop=face&q=80' },
    ];
    this.$.groupsContainer.innerHTML = '';
    const query = this.$.searchInput ? this.$.searchInput.value.trim().toLowerCase() : '';
    const filtered = query ? groups.filter(g => g.name.toLowerCase().includes(query) || g.id.includes(query)) : groups;
    filtered.forEach(g => {
      const div = document.createElement('div');
      div.className = 'group-card';
      div.setAttribute('data-group', g.id);
      div.innerHTML = `
        <div class="group-head">
          <div class="group-icon" style="background:${g.bg};">${g.icon}</div>
          <div class="group-info">
            <h3>${g.name}</h3>
            <p>${g.members} membros · ${g.online} online</p>
          </div>
        </div>
        <div class="group-members">
          ${g.img1 ? `<img src="${g.img1}" alt="membro">` : ''}
          ${g.img2 ? `<img src="${g.img2}" alt="membro">` : ''}
          ${g.img3 ? `<img src="${g.img3}" alt="membro">` : ''}
        </div>
        <div class="join-btn${g.joined ? ' joined' : ''}" onclick="event.stopPropagation(); App.joinGroup(this)">${g.joined ? 'Participando' : 'Entrar'}</div>
      `;
      this.$.groupsContainer.appendChild(div);
    });
  },

  // ---------- Abrir visualização do grupo ----------
  openGroup(groupId) {
    this.state.activeGroup = groupId;
    const group = this.groups[groupId];
    if (!group) return;

    // Ocultar lista de grupos e barra de busca
    if (this.$.groupsContainer) this.$.groupsContainer.style.display = 'none';
    if (this.$.searchInput) this.$.searchInput.style.display = 'none';

    // Mostrar visualização do grupo
    if (this.$.groupView) {
      this.$.groupView.style.display = 'block';
      if (this.$.groupMural) this.$.groupMural.innerHTML = '';
    }

    // Atualizar cabeçalho do grupo
    if (this.$.groupViewIcon) {
      this.$.groupViewIcon.textContent = group.icon;
      this.$.groupViewIcon.style.background = group.bg;
    }
    if (this.$.groupViewName) this.$.groupViewName.textContent = group.name;

    // Renderizar mural do grupo
    this.renderGroupMural(group);

    // Exibir entrada de mensagem do grupo
    if (this.$.groupInput) {
      this.$.groupInput.classList.add('visible');
      if (this.$.groupMsgInput) this.$.groupMsgInput.focus();
    }

    // Ocultar entrada de chat individual
    if (this.$.chatInput) this.$.chatInput.classList.remove('visible');
  },

  // ---------- Fechar grupo ----------
  closeGroup() {
    this.state.activeGroup = null;
    if (this.$.groupView) this.$.groupView.style.display = 'none';
    if (this.$.groupsContainer) this.$.groupsContainer.style.display = 'block';
    if (this.$.searchInput) this.$.searchInput.style.display = 'block';
    if (this.$.groupInput) this.$.groupInput.classList.remove('visible');
  },

  // ---------- Renderizar mural do grupo ----------
  renderGroupMural(group) {
    if (!this.$.groupMural) return;
    this.$.groupMural.innerHTML = '';
    group.messages.forEach(m => {
      const div = document.createElement('div');
      div.className = 'm-post';
      div.innerHTML = `
        <span class="author">${m.author}</span>
        <span class="time">${m.time}</span>
        <p>${m.text}</p>
        <div class="actions">
          <button onclick="this.textContent=this.textContent.includes('❤️')?this.textContent.replace('❤️',''):this.textContent+=' ❤️';" aria-label="Curtir">❤️ 0</button>
          <button aria-label="Responder">💬 Responder</button>
        </div>
      `;
      this.$.groupMural.appendChild(div);
    });
    this.scrollToBottom();
  },

  // ---------- Enviar mensagem do grupo ----------
  sendGroupMsg() {
    const input = this.$.groupMsgInput;
    const text = input.value.trim();
    if (!text || !this.state.activeGroup) return;

    const group = this.groups[this.state.activeGroup];
    group.messages.push({ author: 'Eu', text, time: 'agora' });
    input.value = '';
    this.renderGroupMural(group);
    this.scrollToBottom();
  },

  // ---------- Entrar/sair de grupo ----------
  joinGroup(btn) {
    btn.textContent = 'Participando';
    btn.classList.add('joined');
  },

  // ---------- Fechar overlay de busca ----------
  closeSearchOverlay() {
    const overlay = document.getElementById('search-overlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    setTimeout(() => {
      if (!overlay.classList.contains('active')) overlay.style.display = 'none';
    }, 260);
    if (this.$.searchInput) this.$.searchInput.value = '';
  },

  // ---------- Modal de autenticação ----------
  openAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('active'));
  },
  closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => { if (!modal.classList.contains('active')) modal.style.display = 'none'; }, 260);
  },
  handleAuthSubmit(form) {
    const name = document.getElementById('auth-name')?.value.trim();
    const email = document.getElementById('auth-email')?.value.trim();
    const pw = document.getElementById('auth-password')?.value.trim();
    if (!name || !email || !pw) { alert('Preencha todos os campos.'); return; }
    // Salvar no localStorage como protótipo
    const user = { nome: name, email: email, senha_hash: btoa(pw), criado_em: new Date().toISOString() };
    const users = JSON.parse(localStorage.getItem('vidasa_users') || '[]');
    const exists = users.find(u => u.email === email);
    if (exists) { alert('E-mail já cadastrado. Entre com sua senha.'); this.closeAuthModal(); return; }
    users.push(user);
    localStorage.setItem('vidasa_users', JSON.stringify(users));
    localStorage.setItem('vidasa_current_user', JSON.stringify({ nome: name, email: email, logado: true }));
    alert(`Bem-vindo, ${name}! Cadastro salvo (localStorage).`);
    this.closeAuthModal();
    form.reset();
  },

  // ---------- Painel de mensagem (interação) ----------
  openMsgPanel(msgId) {
    console.log('openMsgPanel chamado com msgId:', msgId);
    const panel = document.getElementById('msg-panel');
    if (!panel) { console.error('msg-panel não encontrado'); return; }
    panel.style.display = 'block';
    panel.setAttribute('aria-label', `Painel da mensagem ${msgId}`);

    // Abrir campo de texto para enviar mensagem diretamente
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.classList.add('visible');
      chatInput.style.display = 'flex';
      console.log('chat-input ativado');
    }
    const msgInput = document.getElementById('chat-msg-input');
    if (msgInput) {
      msgInput.focus();
      console.log('foco no msg-input');
    }
  },
  closeMsgPanel() {
    const panel = document.getElementById('msg-panel');
    if (!panel) return;
    panel.style.display = 'none';
  },
  applyEmoji(btn, emoji) {
    btn.innerHTML = emoji + ' (reagido)';
    btn.setAttribute('aria-label', `Reação aplicada: ${emoji}`);
  },
  deleteSelectedMsg() {
    const chk = document.getElementById('msg-select');
    if (chk && chk.checked) {
      alert('Mensagem selecionada excluída (simulação).');
      chk.checked = false;
      this.closeMsgPanel();
    } else { alert('Marque a checkbox para excluir.'); }
  },
  moveSelectedMsg() {
    const chk = document.getElementById('msg-select');
    if (chk && chk.checked) {
      alert('Mensagem movida para arquivo (simulação).');
      chk.checked = false;
      this.closeMsgPanel();
    } else { alert('Marque a checkbox para mover.'); }
  },
  filterMessages() {
    const q = document.getElementById('msg-search')?.value.toLowerCase() || '';
    const list = this.$.conversationsList;
    if (!list) return;
    Array.from(list.querySelectorAll('.conversation')).forEach(conv => {
      const text = conv.textContent.toLowerCase();
      conv.style.display = text.includes(q) ? '' : 'none';
    });
  },

  // ---------- Gravação de áudio ----------
  startVoiceRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Gravação de áudio não suportada neste navegador.');
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const mediaRecorder = new MediaRecorder(stream);
        const chunks = [];
        mediaRecorder.ondataavailable = e => chunks.push(e.data);
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          alert('Mensagem de áudio gravada (simulação): ' + blob.size + ' bytes');
          stream.getTracks().forEach(t => t.stop());
        };
        mediaRecorder.start();
        alert('Gravando... fale agora. Clique novamente para parar.');
        setTimeout(() => { mediaRecorder.stop(); alert('Gravação finalizada.'); }, 3000);
      })
      .catch(err => alert('Erro ao acessar microfone: ' + err.message));
  },

  // ---------- Renderizar progresso ----------
  renderProgress() {
    // Dados estáticos para exemplo
    const metrics = [
      { label: 'Treinos', value: 47 },
      { label: 'Minutos', value: 1240 },
      { label: 'Refeições', value: 32 },
      { label: 'Sono médio', value: '8h 12m' },
    ];
    const goals = [
      { label: 'Corrida', current: 4, total: 5 },
      { label: 'Yoga', current: 3, total: 7 },
      { label: 'Musculação', current: 2, total: 3 },
      { label: 'Água (copos)', current: 6, total: 8 },
    ];

    // Métricas
    if (this.$.progressContainer) {
      this.$.progressContainer.innerHTML = '';
      metrics.forEach(m => {
        const col = document.createElement('div');
        col.className = 'metric';
        col.innerHTML = `<div class="value">${m.value}</div><div class="label">${m.label}</div>`;
        this.$.progressContainer.appendChild(col);
      });
    }

    // Metas
    if (this.$.goalsContainer) {
      this.$.goalsContainer.innerHTML = '';
      goals.forEach(g => {
        const percent = Math.round((g.current / g.total) * 100);
        const status = percent >= 100 ? '' : percent >= g.total * 0.66 ? 'warn' : '';
        const div = document.createElement('div');
        div.className = 'goal';
        div.innerHTML = `
          <div class="goal-head">
            <h4>${g.label}</h4>
            <span>${g.current} / ${g.total}</span>
          </div>
          <div class="goal-bar">
            <div class="fill ${status}" style="width:${percent}%"></div>
          </div>
        `;
        this.$.goalsContainer.appendChild(div);
      });
    }
  },

  // ---------- Utilitário para rolagem ----------
  scrollToBottom() {
    const containers = [this.$.chatMessages, this.$.groupMural];
    containers.forEach(c => {
      if (c) c.scrollTop = c.scrollHeight;
    });
  },

  // ---------- Grupos simulados ----------
  groups: {
    corredores: {
      name: 'Corredores VidaSã',
      icon: '🏃',
      bg: '#E8F0EF',
      messages: [
        { author: 'João Costa', text: 'Bom dia! Quanta km fizeram hoje?', time: '07:10' },
        { author: 'Lucas Fernandes', text: '10km tranquilo, ritmo 5:20/km', time: '07:15' },
        { author: 'Carlos Mendes', text: 'Fui de 5km, mas amanhã quero 8km', time: '07:20' },
      ],
    },
    yoga: {
      name: 'Yoga & Bem-estar',
      icon: '🧘',
      bg: '#F3E8FF',
      messages: [
        { author: 'Marina Silva', text: 'Hoje vamos focar em respiração 🧘‍♀️', time: '08:00' },
        { author: 'Ana Beatriz', text: 'Amo essa prática matinal!', time: '08:05' },
      ],
    },
    nutricao: {
      name: 'Nutrição Saudável',
      icon: '🥗',
      bg: '#FFF1F2',
      messages: [
        { author: 'Ana Beatriz', text: 'Alguém fez esse bowl de quinoa?', time: '12:30' },
        { author: 'Carlos Mendes', text: 'Sim! Adicionei abacate e grão-de-bico', time: '12:45' },
      ],
    },
    musculacao: {
      name: 'Musculação Radical',
      icon: '🏋️',
      bg: '#FEF3C7',
      messages: [
        { author: 'Pedro Lima', text: 'Semana 12 — agachamento 120kg! 💪', time: '18:00' },
        { author: 'Lucas Fernandes', text: 'Parabéns! Que força!', time: '18:05' },
      ],
    },
  },
};

// ---------- Inicializar app ----------
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

// ---------- Escutar mudança de tema via teclado (Ctrl+I para alternar) ----------
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key.toLowerCase() === 'i') {
    e.preventDefault();
    const root = document.documentElement;
    const current = root.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    console.log('Tema alterado para:', next);
  }
});
