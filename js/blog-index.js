(function () {
    var list = document.getElementById('blog-list');
    var empty = document.getElementById('blog-empty');
    var count = document.getElementById('blog-count');
    var maxBlogs = 100;

    function textFrom(doc, selectors, fallback) {
        for (var i = 0; i < selectors.length; i += 1) {
            var element = doc.querySelector(selectors[i]);
            if (element && element.textContent.trim()) return element.textContent.trim();
        }
        return fallback;
    }

    function readBlog(number) {
        var url = 'blogs/' + number + '/index.html';
        return fetch(url, { cache: 'no-store' }).then(function (response) {
            if (!response.ok) throw new Error('文章不存在');
            return response.text();
        }).then(function (html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var image = doc.querySelector('meta[property="og:image"], article img, main img');
            return {
                number: number,
                url: url,
                title: textFrom(doc, ['h1', 'title'], '未命名文章'),
                summary: textFrom(doc, ['meta[name="description"]', 'article p', 'main p'], '打开文章，阅读完整内容。'),
                image: image && (image.content || image.getAttribute('src'))
            };
        });
    }

    function render(blog) {
        var item = document.createElement('article');
        item.className = 'blog-entry';
        var media = blog.image ? '<div class="blog-entry-image"><img src="' + new URL(blog.image, new URL(blog.url, location.href)).href + '" alt=""></div>' : '<div class="blog-entry-number">' + String(blog.number).padStart(2, '0') + '</div>';
        item.innerHTML = media + '<div class="blog-entry-body"><p class="blog-entry-meta">NO. ' + String(blog.number).padStart(2, '0') + '</p><h3>' + escapeHtml(blog.title) + '</h3><p>' + escapeHtml(blog.summary) + '</p><a class="blog-entry-link" href="' + blog.url + '">阅读全文 <span aria-hidden="true">→</span></a></div>';
        list.appendChild(item);
    }

    function escapeHtml(value) {
        var node = document.createElement('div');
        node.textContent = value;
        return node.innerHTML;
    }

    var requests = [];
    for (var number = 1; number <= maxBlogs; number += 1) requests.push(readBlog(number).catch(function () { return null; }));
    Promise.all(requests).then(function (blogs) {
        var existing = blogs.filter(Boolean).sort(function (a, b) { return b.number - a.number; });
        count.textContent = existing.length + ' 篇文章';
        if (!existing.length) { empty.hidden = false; return; }
        existing.forEach(render);
    });
}());
