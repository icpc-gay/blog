(function () {
    var list = document.getElementById('blog-list');
    var empty = document.getElementById('blog-empty');
    var count = document.getElementById('blog-count');

    function textFrom(doc, selectors, fallback) {
        for (var i = 0; i < selectors.length; i += 1) {
            var element = doc.querySelector(selectors[i]);
            var value = element && (element.getAttribute('content') || element.textContent);
            if (value && value.trim()) return value.trim();
        }
        return fallback;
    }

    function readBlog(number) {
        var url = 'blogs/' + encodeURIComponent(number) + '/index.html';
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
                image: image && (image.getAttribute('content') || image.getAttribute('src'))
            };
        });
    }

    function safeUrl(value, base) {
        if (!value) return null;
        try {
            var url = new URL(value, base);
            return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
        } catch (error) {
            return null;
        }
    }

    function render(blog) {
        var item = document.createElement('article');
        item.className = 'blog-entry';
        if (blog.image) {
            var media = document.createElement('div');
            media.className = 'blog-entry-image';
            var image = document.createElement('img');
            image.src = blog.image;
            image.alt = '';
            image.loading = 'lazy';
            media.appendChild(image);
            item.appendChild(media);
        } else {
            var number = document.createElement('div');
            number.className = 'blog-entry-number';
            number.textContent = String(blog.number).padStart(2, '0');
            item.appendChild(number);
        }
        var body = document.createElement('div');
        body.className = 'blog-entry-body';
        var meta = document.createElement('p');
        meta.className = 'blog-entry-meta';
        meta.textContent = 'NO. ' + String(blog.number).padStart(2, '0');
        var title = document.createElement('h3');
        title.textContent = blog.title;
        var summary = document.createElement('p');
        summary.textContent = blog.summary;
        var link = document.createElement('a');
        link.className = 'blog-entry-link';
        link.href = blog.url;
        link.textContent = '阅读全文 →';
        body.appendChild(meta);
        body.appendChild(title);
        body.appendChild(summary);
        body.appendChild(link);
        item.appendChild(body);
        list.appendChild(item);
    }

    fetch('blogs/', { cache: 'no-store' }).then(function (response) {
        if (!response.ok) throw new Error('博客目录不可用');
        return response.text();
    }).then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var directories = Array.prototype.map.call(doc.querySelectorAll('a[href]'), function (link) {
            return link.getAttribute('href');
        }).map(function (href) {
            return href && href.replace(/\\/$/, '');
        }).filter(function (name) {
            return /^\\d+$/.test(name);
        }).map(function (name) {
            return Number(name);
        }).filter(function (number, index, values) {
            return number > 0 && number <= Number.MAX_SAFE_INTEGER && values.indexOf(number) === index;
        });
        return Promise.all(directories.map(function (number) { return readBlog(number).then(function (blog) {
            blog.image = safeUrl(blog.image, new URL(blog.url, location.href));
            return blog;
        }).catch(function () { return null; }); }));
    }).then(function (blogs) {
        var existing = blogs.filter(Boolean).sort(function (a, b) { return b.number - a.number; });
        count.textContent = existing.length + ' 篇文章';
        if (!existing.length) { empty.hidden = false; return; }
        existing.forEach(render);
    }).catch(function () {
        count.textContent = '暂无文章';
        empty.hidden = false;
    });
}());
