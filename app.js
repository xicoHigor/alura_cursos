(() => {
  const courses = Array.isArray(window.ALURA_COURSES) ? window.ALURA_COURSES : [];
  const trails = Array.isArray(window.ALURA_TRAILS) ? window.ALURA_TRAILS : [];
  const byId = (id) => document.getElementById(id);
  const searchInput = byId('search-input');
  const categoryFilter = byId('category-filter');
  const topicFilter = byId('topic-filter');
  const levelFilter = byId('level-filter');
  const durationFilter = byId('duration-filter');
  const sortFilter = byId('sort-filter');
  const favoritesToggle = byId('favorites-toggle');
  const favoritesIcon = favoritesToggle.querySelector('span');
  const favoritesBadge = byId('favorite-count');
  const grid = byId('course-grid');
  const summary = byId('results-summary');
  const emptyState = byId('empty-state');
  const loadMore = byId('load-more');
  const pageSize = 36;
  const trailProgressKey = 'x-analises-alura-trail-progress';
  let visibleLimit = pageSize;
  let favoritesOnly = false;
  let trailProgress = readTrailProgress();

  const accentByArea = {
    'Programação': '#34edf3',
    'Front-end': '#f715ab',
    'Data Science': '#c465ef',
    'DevOps': '#8fa2ff',
    'Design & UX': '#34edf3',
    'Marketing Digital': '#f715ab',
    'Mobile': '#d38aff',
    'Inovação & Gestão': '#34edf3',
    'Thinking with CEOs': '#f715ab',
    'Sem categoria': '#9da9d1',
  };
  const iconByArea = {
    'Programação': '<path d="m8 8-4 4 4 4m8-8 4 4-4 4m-3-10-2 12"/>',
    'Front-end': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01"/>',
    'Data Science': '<path d="M4 20h16M7 16v-4m5 4V7m5 9V4"/><path d="m5 10 6-5 5 3 4-5"/>',
    'DevOps': '<path d="M7.5 18.5H17a4 4 0 0 0 .5-8 6 6 0 0 0-11.3-1.2A4.6 4.6 0 0 0 7.5 18.5Z"/><path d="m9 14 3-3 3 3m-3-3v7"/>',
    'Design & UX': '<path d="m4 16 9.8-9.8a2.1 2.1 0 0 1 3 3L7 19H4v-3Z"/><path d="m14 6 4 4M4 21h16"/>',
    'Marketing Digital': '<path d="m3 11 17-6v14L3 13v-2Z"/><path d="m7 14 2 6h4l-2-5m9-6 2-2m-2 8 2 2"/>',
    'Mobile': '<rect x="6" y="2.5" width="12" height="19" rx="2.2"/><path d="M10 5h4m-3 13.5h2"/>',
    'Inovação & Gestão': '<path d="M9 18h6m-5 3h4m-5-6.2a6 6 0 1 1 6 0c-.8.6-1 1.1-1 2.2h-4c0-1.1-.2-1.6-1-2.2Z"/><path d="M12 2v1m8 7h1M3 10h1m2.3-5.7.7.7m10 0-.7.7"/>',
    'Thinking with CEOs': '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-5 4v-4.6a2.5 2.5 0 0 1-1-1.9v-8Z"/><path d="M8 8h8m-8 4h5"/>',
    'Sem categoria': '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v17H6.5A2.5 2.5 0 0 0 4 22V5.5Zm16 0A2.5 2.5 0 0 0 17.5 3H12v17h5.5A2.5 2.5 0 0 1 20 22V5.5Z"/>',
  };

  function makeAreaIcon(area, className) {
    const icon = document.createElement('span');
    icon.className = className;
    icon.setAttribute('aria-hidden', 'true');
    icon.style.setProperty('--area-accent', accentByArea[area] || '#34edf3');
    const path = iconByArea[area] || iconByArea['Sem categoria'];
    icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
    return icon;
  }

  function readFavorites() {
    try {
      const stored = JSON.parse(localStorage.getItem('x-analises-alura-favorites') || '[]');
      return new Set(Array.isArray(stored) ? stored : []);
    } catch {
      return new Set();
    }
  }

  function readTrailProgress() {
    try {
      const stored = JSON.parse(localStorage.getItem(trailProgressKey) || '{}');
      return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
    } catch {
      return {};
    }
  }

  let favorites = readFavorites();
  const saveFavorites = () => {
    try { localStorage.setItem('x-analises-alura-favorites', JSON.stringify([...favorites])); } catch { /* Favoritos continuam disponíveis nesta sessão. */ }
  };

  function normalized(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
  }

  function sorted(values) {
    return [...new Set(values)].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
  }

  function addOptions(select, values, firstLabel, selected = '') {
    select.replaceChildren();
    const first = document.createElement('option');
    first.value = '';
    first.textContent = firstLabel;
    select.append(first);
    for (const value of values) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.append(option);
    }
    if (values.includes(selected)) select.value = selected;
  }

  const allCategories = sorted(courses.flatMap((course) => course.categories || []));
  addOptions(categoryFilter, allCategories, 'Todas as áreas');
  addOptions(levelFilter, sorted(courses.map((course) => course.levelSuggestion).filter(Boolean)), 'Todos os níveis');
  const durationOptions = [
    ['0-5', 'Até 5 h'],
    ['5-10', 'Mais de 5 até 10 h'],
    ['10-20', 'Mais de 10 até 20 h'],
    ['20+', 'Mais de 20 h'],
    ['unknown', 'Sem duração informada'],
  ];
  for (const [value, label] of durationOptions) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    durationFilter.append(option);
  }

  function courseMatchesDuration(course, filter) {
    const hours = Number(course.durationHours);
    if (filter === 'unknown') return !Number.isFinite(hours) || hours <= 0;
    if (!Number.isFinite(hours) || hours <= 0) return false;
    if (filter === '0-5') return hours <= 5;
    if (filter === '5-10') return hours > 5 && hours <= 10;
    if (filter === '10-20') return hours > 10 && hours <= 20;
    if (filter === '20+') return hours > 20;
    return true;
  }

  function matchingCourses() {
    const query = normalized(searchInput.value.trim());
    const area = categoryFilter.value;
    const topic = topicFilter.value;
    const level = levelFilter.value;
    const duration = durationFilter.value;
    let matches = courses.filter((course) => {
      const categories = course.categories || [];
      const topics = course.topics || [];
      if (area && !categories.includes(area)) return false;
      if (topic && !topics.includes(topic)) return false;
      if (level && course.levelSuggestion !== level) return false;
      if (duration && !courseMatchesDuration(course, duration)) return false;
      if (favoritesOnly && !favorites.has(course.id)) return false;
      if (!query) return true;
      const haystack = normalized([course.title, ...categories, ...topics].join(' '));
      return haystack.includes(query);
    });
    const direction = sortFilter.value === 'za' ? -1 : 1;
    matches.sort((a, b) => direction * a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' }));
    return matches;
  }

  function makeTrailCard(trail, trailIndex) {
    const card = document.createElement('article');
    card.className = `trail-card${trail.id === 'analise-de-dados' ? ' is-featured' : ''}`;
    card.id = `trail-${trail.id}`;
    card.style.setProperty('--area-accent', accentByArea[trail.area] || '#34edf3');

    const top = document.createElement('div');
    top.className = 'trail-card-top';
    const areaGroup = document.createElement('div');
    areaGroup.className = 'card-area-group';
    areaGroup.append(makeAreaIcon(trail.area, 'trail-icon'));
    const area = document.createElement('span');
    area.className = 'area-chip';
    area.textContent = trail.area;
    areaGroup.append(area);
    const stepCount = document.createElement('span');
    stepCount.className = 'trail-step-count';
    stepCount.textContent = `${trail.steps.length} etapas`;
    top.append(areaGroup, stepCount);

    const heading = document.createElement('h3');
    heading.textContent = trail.title;
    const description = document.createElement('p');
    description.className = 'trail-description';
    description.textContent = trail.description;

    let note = null;
    if (trail.note) {
      note = document.createElement('p');
      note.className = 'trail-note';
      note.textContent = trail.note;
    }

    const source = document.createElement('p');
    source.className = 'trail-source';
    source.textContent = trail.source || 'Trilha sugerida';

    const progress = document.createElement('div');
    progress.className = 'trail-card-progress';
    const progressText = document.createElement('span');
    progressText.className = 'trail-card-progress-text';
    const progressTrack = document.createElement('div');
    progressTrack.className = 'trail-progress-track';
    progressTrack.setAttribute('role', 'progressbar');
    progressTrack.setAttribute('aria-label', `Progresso da trilha ${trail.title}`);
    progressTrack.setAttribute('aria-valuemin', '0');
    progressTrack.setAttribute('aria-valuemax', String(trail.steps.length));
    const progressFill = document.createElement('span');
    progressTrack.append(progressFill);
    progress.append(progressText, progressTrack);

    const details = document.createElement('details');
    details.className = 'trail-details';
    const summary = document.createElement('summary');
    summary.innerHTML = `Ver sequência <span aria-hidden="true">⌄</span>`;
    const list = document.createElement('ol');
    list.className = 'trail-steps';
    const useSourceRationales = trail.source === 'Recomendação da planilha';

    for (const [index, step] of trail.steps.entries()) {
      const item = document.createElement('li');
      const number = document.createElement('span');
      number.className = 'trail-step-number';
      number.textContent = String(index + 1).padStart(2, '0');
      const content = document.createElement('div');
      content.className = 'trail-step-content';
      const stage = document.createElement('span');
      stage.className = 'trail-step-stage';
      stage.textContent = step.stage || `Etapa ${index + 1}`;
      const link = document.createElement('a');
      link.className = 'trail-course-link';
      link.href = step.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = step.title;
      content.append(stage, link);
      if (useSourceRationales && step.description) {
        const reason = document.createElement('p');
        reason.className = 'trail-step-description';
        reason.textContent = step.description;
        content.append(reason);
      }
      const complete = document.createElement('button');
      complete.className = 'step-complete';
      complete.type = 'button';
      const isComplete = (trailProgress[trail.id] || []).includes(step.courseId);
      complete.setAttribute('aria-pressed', String(isComplete));
      complete.setAttribute('aria-label', `${isComplete ? 'Desmarcar' : 'Marcar como concluída'}: ${step.title}`);
      complete.textContent = isComplete ? '✓' : '○';
      complete.addEventListener('click', () => toggleStep(trail.id, step.courseId, complete, card, trail));
      item.append(number, content, complete);
      list.append(item);
    }

    details.append(summary, list);
    card.append(top, heading, description, progress);
    if (note) card.append(note);
    card.append(source, details);
    card.style.setProperty('--trail-order', trailIndex);
    return card;
  }

  function renderTrails() {
    const trailGrid = byId('trail-grid');
    trailGrid.replaceChildren(...trails.map(makeTrailCard));
    byId('trail-count').textContent = String(trails.length);
    renderStartHere();
    updateTrailProgressOverview();
  }

  function renderStartHere() {
    const recommendations = [
      { id: 'programacao-fundamentos', title: 'Quero começar a programar', description: 'Construa uma base de lógica e dê os primeiros passos com JavaScript.', area: 'Programação', label: 'LÓGICA E CÓDIGO' },
      { id: 'analise-de-dados', title: 'Quero explorar dados', description: 'Siga da organização de planilhas até consultas, análise e visualização.', area: 'Data Science', label: 'DADOS E ANÁLISE' },
      { id: 'ux-design', title: 'Quero criar produtos digitais', description: 'Explore experiência do usuário, interfaces e prototipação.', area: 'Design & UX', label: 'DESIGN E UX' },
    ];
    const startGrid = byId('start-grid');
    const cards = recommendations.map((recommendation) => {
      const trail = trails.find((item) => item.id === recommendation.id);
      if (!trail) return null;
      const card = document.createElement('article');
      card.className = 'start-card';
      card.style.setProperty('--area-accent', accentByArea[recommendation.area] || '#34edf3');
      const top = document.createElement('div');
      top.className = 'start-card-top';
      top.append(makeAreaIcon(recommendation.area, 'start-icon'));
      const label = document.createElement('span');
      label.className = 'start-label';
      label.textContent = recommendation.label;
      top.append(label);
      const heading = document.createElement('h3');
      heading.textContent = recommendation.title;
      const description = document.createElement('p');
      description.textContent = recommendation.description;
      const action = document.createElement('button');
      action.className = 'start-action';
      action.type = 'button';
      action.innerHTML = `Ver trilha <span aria-hidden="true">↗</span>`;
      action.addEventListener('click', () => {
        const trailCard = byId(`trail-${trail.id}`);
        const details = trailCard?.querySelector('details');
        if (details) details.open = true;
        trailCard?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      card.append(top, heading, description, action);
      return card;
    }).filter(Boolean);
    startGrid.replaceChildren(...cards);
  }

  function persistTrailProgress() {
    try { localStorage.setItem(trailProgressKey, JSON.stringify(trailProgress)); } catch { /* O progresso continua disponível nesta sessão. */ }
  }

  function updateTrailCardProgress(card, trail) {
    const done = new Set(trailProgress[trail.id] || []);
    const count = trail.steps.filter((step) => done.has(step.courseId)).length;
    const track = card.querySelector('.trail-progress-track');
    const text = card.querySelector('.trail-card-progress-text');
    const fill = track.querySelector('span');
    text.textContent = `${count} de ${trail.steps.length} etapas concluídas`;
    track.setAttribute('aria-valuenow', String(count));
    fill.style.width = `${trail.steps.length ? (count / trail.steps.length) * 100 : 0}%`;
  }

  function updateTrailProgressOverview() {
    const total = trails.reduce((sum, trail) => sum + trail.steps.length, 0);
    const completed = trails.reduce((sum, trail) => {
      const done = new Set(trailProgress[trail.id] || []);
      return sum + trail.steps.filter((step) => done.has(step.courseId)).length;
    }, 0);
    const percentage = total ? Math.round(completed / total * 100) : 0;
    byId('trail-progress-summary').textContent = `${completed} de ${total} etapas concluídas`;
    byId('overall-trail-progress').setAttribute('aria-valuenow', String(percentage));
    byId('overall-trail-progress-fill').style.width = `${percentage}%`;
    for (const trail of trails) {
      const card = byId(`trail-${trail.id}`);
      if (card) updateTrailCardProgress(card, trail);
    }
  }

  function toggleStep(trailId, courseId, button, card, trail) {
    const done = new Set(trailProgress[trailId] || []);
    if (done.has(courseId)) done.delete(courseId);
    else done.add(courseId);
    trailProgress[trailId] = [...done];
    persistTrailProgress();
    const isComplete = done.has(courseId);
    button.setAttribute('aria-pressed', String(isComplete));
    button.setAttribute('aria-label', `${isComplete ? 'Desmarcar' : 'Marcar como concluída'}: ${button.parentElement.querySelector('.trail-course-link').textContent}`);
    button.textContent = isComplete ? '✓' : '○';
    updateTrailCardProgress(card, trail);
    updateTrailProgressOverview();
  }

  function updateTopics() {
    const selectedArea = categoryFilter.value;
    const available = courses
      .filter((course) => !selectedArea || (course.categories || []).includes(selectedArea))
      .flatMap((course) => course.topics || []);
    const currentTopic = topicFilter.value;
    addOptions(topicFilter, sorted(available), 'Todos os temas', currentTopic);
  }

  function makeCard(course) {
    const category = (course.categories || ['Sem categoria'])[0];
    const topics = course.topics || [];
    const card = document.createElement('article');
    card.className = 'course-card';
    card.style.setProperty('--area-accent', accentByArea[category] || '#34edf3');

    const meta = document.createElement('div');
    meta.className = 'card-meta';
    const areaGroup = document.createElement('div');
    areaGroup.className = 'card-area-group';
    areaGroup.append(makeAreaIcon(category, 'course-icon'));
    const area = document.createElement('span');
    area.className = 'area-chip';
    area.textContent = category;
    areaGroup.append(area);
    meta.append(areaGroup);
    if (topics.length) {
      const topic = document.createElement('span');
      topic.className = 'topic-chip';
      topic.textContent = topics[0];
      topic.title = topics.join(', ');
      meta.append(topic);
    }

    const title = document.createElement('h3');
    title.textContent = course.title;

    const description = document.createElement('p');
    description.className = 'course-description';
    description.textContent = course.description || '';

    const facts = document.createElement('div');
    facts.className = 'course-facts';
    if (course.levelSuggestion) {
      const level = document.createElement('span');
      level.className = 'course-fact';
      level.textContent = `Nível sugerido · ${course.levelSuggestion}`;
      facts.append(level);
    }
    if (course.durationHours) {
      const duration = document.createElement('span');
      duration.className = 'course-fact course-fact-duration';
      duration.textContent = `⏱ ${course.durationHours} h estimadas`;
      duration.title = 'Carga horária estimada informada na API pública da Alura';
      facts.append(duration);
    }

    const actions = document.createElement('div');
    actions.className = 'card-actions';
    const link = document.createElement('a');
    link.className = 'drive-link';
    link.href = course.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', `Abrir ${course.title} no Google Drive`);
    link.innerHTML = 'Abrir no Google Drive <span aria-hidden="true">↗</span>';

    const favorite = document.createElement('button');
    favorite.className = `favorite-button${favorites.has(course.id) ? ' is-favorite' : ''}`;
    favorite.type = 'button';
    favorite.setAttribute('aria-label', favorites.has(course.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
    favorite.setAttribute('aria-pressed', String(favorites.has(course.id)));
    favorite.textContent = favorites.has(course.id) ? '★' : '☆';
    favorite.addEventListener('click', () => {
      if (favorites.has(course.id)) favorites.delete(course.id);
      else favorites.add(course.id);
      saveFavorites();
      render();
    });

    actions.append(link, favorite);
    card.append(meta, title, description);
    if (facts.childElementCount) card.append(facts);
    card.append(actions);
    return card;
  }

  function updateFavoriteCount() {
    const validIds = new Set(courses.map((course) => course.id));
    const count = [...favorites].filter((id) => validIds.has(id)).length;
    favoritesBadge.textContent = String(count);
    favoritesIcon.textContent = favoritesOnly ? '★' : '♡';
    favoritesToggle.setAttribute('aria-pressed', String(favoritesOnly));
  }

  function render() {
    const matches = matchingCourses();
    const visible = matches.slice(0, visibleLimit);
    grid.replaceChildren(...visible.map(makeCard));
    const total = matches.length;
    const showing = visible.length;
    summary.innerHTML = `<strong>${showing.toLocaleString('pt-BR')}</strong> de <strong>${total.toLocaleString('pt-BR')}</strong> cursos`;
    emptyState.hidden = total !== 0;
    grid.hidden = total === 0;
    loadMore.hidden = showing >= total;
    updateFavoriteCount();
  }

  function resetFilters() {
    searchInput.value = '';
    categoryFilter.value = '';
    updateTopics();
    topicFilter.value = '';
    sortFilter.value = 'az';
    levelFilter.value = '';
    durationFilter.value = '';
    favoritesOnly = false;
    visibleLimit = pageSize;
    render();
    searchInput.focus();
  }

  function refresh() {
    visibleLimit = pageSize;
    render();
  }

  categoryFilter.addEventListener('change', () => { updateTopics(); refresh(); });
  topicFilter.addEventListener('change', refresh);
  levelFilter.addEventListener('change', refresh);
  durationFilter.addEventListener('change', refresh);
  sortFilter.addEventListener('change', refresh);
  searchInput.addEventListener('input', refresh);
  favoritesToggle.addEventListener('click', () => { favoritesOnly = !favoritesOnly; refresh(); });
  loadMore.addEventListener('click', () => { visibleLimit += pageSize; render(); });
  byId('reset-filters').addEventListener('click', resetFilters);
  byId('empty-reset').addEventListener('click', resetFilters);

  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      searchInput.focus();
    }
  });

  const uniqueAreas = allCategories.filter((category) => category !== 'Sem categoria');
  byId('total-count').textContent = courses.length.toLocaleString('pt-BR');
  byId('hero-course-count').textContent = courses.length.toLocaleString('pt-BR');
  byId('hero-area-count').textContent = uniqueAreas.length.toLocaleString('pt-BR');
  renderTrails();
  updateTopics();
  render();
})();
