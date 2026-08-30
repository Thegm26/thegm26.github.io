const articlesRoot = document.querySelector('#article-list');
const status = document.querySelector('#article-status');
const categoryId = document.body.dataset.articleCategory;

const categories = {
  kubernetes: {
    title: 'Kubernetes',
    tags: ['kubernetes', 'k8s', 'devops', 'sre'],
    titlePattern: /\bk8s\b|kubernetes/i,
  },
  architecture: {
    title: 'Architecture',
    tags: ['architecture', 'adr', 'documentation', 'softwarearchitecture'],
    titlePattern: /\badr\b|architect/i,
  },
};

function formatDate(value) {
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

function articleCard(article) {
  const tags = (article.tag_list || []).map((tag) => `<span>#${tag}</span>`).join('');
  const image = article.cover_image ? `<img src="${article.cover_image}" alt="" loading="lazy">` : '<div class="article-image-placeholder" aria-hidden="true">DEV</div>';
  return `<article class="article-card"><a class="article-image" href="${article.url}" target="_blank" rel="noreferrer">${image}</a><div class="article-content"><p class="eyebrow">${formatDate(article.published_at || article.published_timestamp)} · ${article.reading_time_minutes || 1} min read</p><h2><a href="${article.url}" target="_blank" rel="noreferrer">${article.title}</a></h2><p>${article.description || ''}</p><div class="article-meta"><div class="article-tags">${tags}</div><a href="${article.url}" target="_blank" rel="noreferrer">Read on DEV <b>↗</b></a></div></div></article>`;
}

function belongsToCategory(article, category) {
  const tags = (article.tag_list || []).map((tag) => tag.toLowerCase());
  return category.tags.some((tag) => tags.includes(tag)) || category.titlePattern.test(article.title || '');
}

async function loadArticles() {
  const category = categories[categoryId];
  if (!category) return;

  try {
    const response = await fetch('articles.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Article feed unavailable');
    const articles = (await response.json()).filter((article) => belongsToCategory(article, category));
    if (!articles.length) throw new Error(`No ${category.title} articles published yet`);
    articlesRoot.innerHTML = articles.map(articleCard).join('');
    status.textContent = `${articles.length} published ${category.title} article${articles.length === 1 ? '' : 's'} · Synced daily from DEV`;
  } catch (error) {
    status.textContent = error.message;
    status.classList.add('has-error');
  }
}

loadArticles();
