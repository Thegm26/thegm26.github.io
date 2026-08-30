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

function articleGroup(group, articles, index) {
  const count = `${articles.length} article${articles.length === 1 ? '' : 's'}`;
  return `<section class="article-group" aria-labelledby="article-group-${group.id}"><div class="article-group-heading"><p class="eyebrow">Series ${String(index + 1).padStart(2, '0')} · ${count}</p><h2 id="article-group-${group.id}">${group.title}</h2><p>${group.description}</p></div><div class="article-list">${articles.map(articleCard).join('')}</div></section>`;
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

async function loadArticles() {
  try {
    const response = await fetch('articles.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Article feed unavailable');
    const articles = await response.json();
    if (!articles.length) throw new Error('No articles published yet');
    articlesRoot.innerHTML = groupedArticles(articles)
      .map((group, index) => articleGroup(group, group.articles, index))
      .join('');
    status.textContent = `Synced daily from DEV · ${articles.length} published article${articles.length === 1 ? '' : 's'}`;
  } catch (error) {
    status.textContent = 'The article feed is temporarily unavailable. Visit DEV to read the latest posts.';
    status.classList.add('has-error');
  }
}

loadArticles();
