/* 博客双模式页面：列表视图 + 文章详情视图 */
(function () {
    'use strict';

    // DOM 元素
    var listView = document.getElementById('blog-list-view');
    var articleView = document.getElementById('blog-article-view');
    var list = document.getElementById('blog-list');
    var empty = document.getElementById('blog-empty');
    var count = document.getElementById('blog-count');
    var articleTitle = document.getElementById('article-title');
    var articleMeta = document.getElementById('article-meta');
    var articleCover = document.getElementById('article-cover');
    var articleCoverContainer = document.getElementById('article-cover-container');
    var articleBody = document.getElementById('article-body');
    var articleMissing = document.getElementById('article-missing');

    // 仅本地开发环境（localhost）可以预览草稿
    function isLocalPreview() {
                return location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    }

    // 从 URL 读取 ?post= 文章 ID
    function getPostId() {
                var params = new URLSearchParams(location.search);
                return (params.get('post') || '').trim();
    }

    // 切换视图：列表视图或文章详情视图
    function switchView(isArticle) {
                if (isArticle) {
                    listView.style.display = 'none';
                    articleView.style.display = 'block';
                    document.title = '文章详情 - My Blog';
                } else {
                    listView.style.display = 'block';
                    articleView.style.display = 'none';
                    document.title = 'Blog · My Blog';
                }
    }

    // 读取文章索引；普通访客看不到 draft 文章
    async function loadArticles() {
                var response = await fetch('data/articles.json');
                if (!response.ok) throw new Error('文章索引加载失败');
                var articles = await response.json();
                if (!Array.isArray(articles)) throw new Error('文章索引格式错误');
                return articles.filter(function (article) {
                    return article && article.id && (isLocalPreview() || !article.draft);
                });
    }

    // 按发布日期从新到旧排序（YYYY-MM-DD 字符串直接比较即可）
    function sortByDateDesc(articles) {
                return articles.slice().sort(function (a, b) {
                    return String(b.date || '').localeCompare(String(a.date || ''));
                });
    }

    // 无封面时以日期（MM.DD）作为封面块的降级内容
    function coverFallback(date) {
                var text = String(date || '');
                return text ? text.slice(5).replace('-', '.') : '—';
    }

    // 渲染单条文章条目（沿用现有 blog-entry 视觉结构）
    function render(article) {
                var item = document.createElement('article');
                item.className = 'blog-entry';

                if (article.cover) {
                    var media = document.createElement('div');
                    media.className = 'blog-entry-image';
                    var image = document.createElement('img');
                    image.src = article.cover;
                    image.alt = '';
                    image.loading = 'lazy';
                    media.appendChild(image);
                    item.appendChild(media);
                } else {
                    var number = document.createElement('div');
                    number.className = 'blog-entry-number blog-entry-number--date';
                    number.textContent = coverFallback(article.date);
                    item.appendChild(number);
                }

                var body = document.createElement('div');
                body.className = 'blog-entry-body';

                var meta = document.createElement('p');
                meta.className = 'blog-entry-meta';
                meta.textContent = [
                    article.draft ? '草稿' : '',
                    article.date,
                    (article.tags || []).join(' / ')
                ].filter(Boolean).join(' · ');

                var title = document.createElement('h3');
                title.textContent = article.title || '未命名文章';

                var summary = document.createElement('p');
                summary.textContent = article.description || '打开文章，阅读完整内容。';

                var link = document.createElement('a');
                link.className = 'blog-entry-link';
                link.href = 'blog.html?post=' + encodeURIComponent(article.id);
                link.textContent = '阅读全文 →';

                body.appendChild(meta);
                body.appendChild(title);
                body.appendChild(summary);
                body.appendChild(link);
                item.appendChild(body);
                list.appendChild(item);
    }

    // 解析单个标量：去引号、行内数组 [a, b]、布尔
    function parseScalar(raw) {
                var value = raw.trim();
                if (/^(['"]).*\1$/.test(value)) return value.slice(1, -1);
                if (/^\[.*\]$/.test(value)) {
                    return value.slice(1, -1).split(',').map(function (item) {
                        return item.trim().replace(/^['"]|['"]$/g, '');
                    }).filter(Boolean);
                }
                if (value === 'true') return true;
                if (value === 'false') return false;
                return value;
    }

    // 解析 YAML Front Matter（支持 title/date/description/cover/tags/draft 的常用写法）
    function parseFrontMatter(markdown) {
                var result = { meta: {}, body: markdown };
                var match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
                if (!match) return result;

                var meta = result.meta;
                var lines = match[1].split(/\r?\n/);
                for (var i = 0; i < lines.length; i += 1) {
                    var entry = lines[i].match(/^([A-Za-z_-]+):\s*(.*)$/);
                    if (!entry) continue;
                    var key = entry[1].toLowerCase();
                    var value = entry[2].trim();

                    if (value === '') {
                        // 块状列表：tags:\n  - A\n  - B
                        var items = [];
                        while (i + 1 < lines.length && /^\s*-\s+/.test(lines[i + 1])) {
                            i += 1;
                            items.push(lines[i].replace(/^\s*-\s+/, '').trim().replace(/^['"]|['"]$/g, ''));
                        }
                        meta[key] = items;
                    } else {
                        meta[key] = parseScalar(value);
                    }
                }

                result.body = markdown.slice(match[0].length).replace(/^\r?\n+/, '');
                return result;
    }

    // 相对路径补全为文章目录下的路径；绝对地址、锚点等保持原样
    function resolveRelative(value, base) {
                if (!value) return value;
                if (/^(https?:|mailto:|data:|#|\/)/i.test(value)) return value;
                return base + value.replace(/^\.\//, '');
    }

    // 页面头部已展示标题，跳过正文中重复的一级标题
    function removeDuplicateTitle() {
                var first = articleBody.firstElementChild;
                if (first && first.tagName === 'H1' &&
                    first.textContent.trim() === articleTitle.textContent.trim()) {
                    articleBody.removeChild(first);
                }
    }

    // 渲染正文：marked 解析 + DOMPurify 消毒（防 XSS），并修正相对图片/链接路径
    function renderBody(markdown, base) {
                DOMPurify.addHook('afterSanitizeAttributes', function (node) {
                    if (node.tagName === 'IMG') {
                        var src = node.getAttribute('src');
                        if (src) node.setAttribute('src', resolveRelative(src, base));
                    }
                    if (node.tagName === 'A') {
                        var href = node.getAttribute('href');
                        if (href) node.setAttribute('href', resolveRelative(href, base));
                    }
                });
                articleBody.innerHTML = DOMPurify.sanitize(marked.parse(markdown));
                removeDuplicateTitle();
    }

    // 将文章元数据填入页面
    function fillPage(id, meta, body) {
                articleTitle.textContent = meta.title;
                articleMeta.textContent = [meta.date, (meta.tags || []).join(' / ')].filter(Boolean).join(' · ');

                if (meta.cover) {
                    articleCover.src = resolveRelative(meta.cover, 'articles/' + id + '/');
                    articleCover.alt = meta.title;
                    articleCoverContainer.style.display = '';
                } else {
                    articleCoverContainer.style.display = 'none';
                }

                renderBody(body, 'articles/' + id + '/');
    }

    // 文章不存在 / 未发布 / 加载失败时的降级展示
    function showMissing() {
                articleBody.style.display = 'none';
                articleMissing.style.display = 'block';
    }

    // 初始化：根据 URL 参数决定显示列表还是文章
    async function init() {
                var postId = getPostId();
        
                if (postId) {
                    // 文章详情模式
                    switchView(true);
            
                    try {
                        var articles = await loadArticles();
                        var article = null;
                        for (var i = 0; i < articles.length; i += 1) {
                            if (articles[i] && articles[i].id === postId) { article = articles[i]; break; }
                        }
                        if (!article) {
                            showMissing();
                            return;
                        }

                        var markdown = await fetch('articles/' + encodeURIComponent(postId) + '/index.md').then(function (response) {
                            if (!response.ok) throw new Error('文章内容加载失败');
                            return response.text();
                        });
                        var parsed = parseFrontMatter(markdown);

                        // Front Matter 优先，索引字段作为兜底
                        var meta = {
                            title: parsed.meta.title || article.title || '未命名文章',
                            date: parsed.meta.date || article.date || '',
                            description: parsed.meta.description || article.description || '',
                            cover: parsed.meta.cover || article.cover || '',
                            tags: parsed.meta.tags || article.tags || [],
                            draft: parsed.meta.draft === true || article.draft === true
                        };
                        if (meta.draft && !isLocalPreview()) {
                            // 草稿对普通访客按"不存在"处理，仅本地可预览
                            showMissing();
                            return;
                        }

                        fillPage(postId, meta, parsed.body);
                    } catch (error) {
                        // 索引/正文加载失败、JSON 解析错误等统一降级
                        showMissing();
                    }
                } else {
                    // 列表模式
                    switchView(false);
            
                    try {
                        var articles = sortByDateDesc(await loadArticles());
                        count.textContent = articles.length + ' 篇文章';
                        if (!articles.length) {
                            empty.hidden = false;
                            return;
                        }
                        articles.forEach(render);
                    } catch (error) {
                        // 索引缺失、网络失败或 JSON 解析错误统一按空列表处理
                        count.textContent = '暂无文章';
                        empty.hidden = false;
                    }
                }
    }

    init();
}());
