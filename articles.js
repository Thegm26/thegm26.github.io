const articlesRoot = document.querySelector('#article-list');
const status = document.querySelector('#article-status');

const articleGroups = [
  {
    id: 'kubernetes',
    title: 'Kubernetes',
    description: 'Practical notes on workload placement, scheduling, availability, and cluster operations.',
    tags: ['kubernetes', 'k8s', 'devops', 'sre'],
  },
  {
    id: 'architecture',
    title: 'Architecture',
    description: 'Design decisions, technical trade-offs, and the documentation that keeps software understandable.',
    tags: ['architecture', 'adr', 'documentation', 'softwarearchitecture'],
  },
];

function formatDate(value) {
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

function articleCard(article) {
  const tags = (article.tag_list || []).map((tag) => `<span>#${tag}</span>`).join('');
  const image = article.cover_image ? `<img src="${article.cover_image}" alt="" loading="lazy">` : '<div class="article-image-placeholder" aria-hidden="true">DEV</div>';
  return `<article class="article-card"><a class="article-image" href="${article.url}" target="_blank" rel="noreferrer">${image}</a><div class="article-content"><p class="eyebrow">${formatDate(article.published_at || article.published_timestamp)} · ${article.reading_time_minutes || 1} min read</p><h2><a href="${article.url}" target="_blank" rel="noreferrer">${article.title}</a></h2><p>${article.description || ''}</p><div class="article-meta"><div class="article-tags">${tags}</div><a href="${article.url}" target="_blank" rel="noreferrer">Read on DEV <b>↗</b></a></div></div></article>`;
}

function matchesGroup(article, group) {
  const tags = (article.tag_list || []).map((tag) => tag.toLowerCase());
  const title = (article.title || '').toLowerCase();
  return group.tags.some((tag) => tags.includes(tag))
    || (group.id === 'kubernetes' && /\bk8s\b|kubernetes|drainlab/.test(title))
    || (group.id === 'architecture' && /\badr\b|architect/.test(title));
}

function articleGroup(group, articles, active) {
  const count = `${articles.length} article${articles.length === 1 ? '' : 's'}`;
  return `<section class="article-group" id="article-panel-${group.id}" role="tabpanel" aria-labelledby="article-tab-${group.id}"${active ? '' : ' hidden'}><div class="article-group-heading"><p class="eyebrow">${count}</p><h2>${group.title}</h2><p>${group.description}</p></div><div class="article-list">${articles.map(articleCard).join('')}</div></section>`;
}

function groupedArticles(articles) {
  const assigned = new Set();
  const groups = articleGroups.map((group) => {
    const matches = articles.filter((article) => {
      if (assigned.has(article.url) || !matchesGroup(article, group)) return false;
      assigned.add(article.url);
      return true;
    });
    return { ...group, articles: matches };
  });

  const other = articles.filter((article) => !assigned.has(article.url));
  if (other.length) {
    groups.push({
      id: 'field-notes',
      title: 'Other Field Notes',
      description: 'Experiments and practical lessons that sit outside the main series.',
      articles: other,
    });
  }

  return groups.filter((group) => group.articles.length);
}

function categoryTabs(groups, activeId) {
  const buttons = groups.map((group) => {
    const active = group.id === activeId;
    return `<button class="article-category-tab" id="article-tab-${group.id}" type="button" role="tab" aria-controls="article-panel-${group.id}" aria-selected="${active}" tabindex="${active ? '0' : '-1'}" data-article-group="${group.id}">${group.title}<span>${group.articles.length}</span></button>`;
  }).join('');
  return `<nav class="article-category-tabs" role="tablist" aria-label="Article categories">${buttons}</nav>`;
}

function activateGroup(groupId, updateHash = true) {
  const selected = articlesRoot.querySelector(`[data-article-group="${groupId}"]`);
  if (!selected) return;

  articlesRoot.querySelectorAll('[data-article-group]').forEach((button) => {
    const active = button === selected;
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });
  articlesRoot.querySelectorAll('.article-group').forEach((panel) => {
    panel.hidden = panel.id !== `article-panel-${groupId}`;
  });

  if (updateHash) history.replaceState(null, '', `#${groupId}`);
}

function renderGroupedArticles(articles) {
  const groups = groupedArticles(articles);
  const requested = window.location.hash.slice(1);
  const activeId = groups.some((group) => group.id === requested) ? requested : groups[0].id;

  articlesRoot.innerHTML = categoryTabs(groups, activeId)
    + groups.map((group) => articleGroup(group, group.articles, group.id === activeId)).join('');

  articlesRoot.querySelectorAll('[data-article-group]').forEach((button) => {
    button.addEventListener('click', () => activateGroup(button.dataset.articleGroup));
    button.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      const tabs = [...articlesRoot.querySelectorAll('[data-article-group]')];
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const next = tabs[(tabs.indexOf(button) + direction + tabs.length) % tabs.length];
      activateGroup(next.dataset.articleGroup);
      next.focus();
    });
  });
}

async function loadArticles() {
  try {
    const response = await fetch('articles.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Article feed unavailable');
    const articles = await response.json();
    if (!articles.length) throw new Error('No articles published yet');
    renderGroupedArticles(articles);
    status.textContent = `Synced daily from DEV · ${articles.length} published article${articles.length === 1 ? '' : 's'}`;
  } catch (error) {
    status.textContent = 'The article feed is temporarily unavailable. Visit DEV to read the latest posts.';
    status.classList.add('has-error');
  }
}

loadArticles();
