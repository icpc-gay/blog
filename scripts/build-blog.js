const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const articlesRoot = path.join(root, 'articles');
const outputFile = path.join(root, 'data', 'articles.json');

function parseScalar(value) {
    const text = value.trim();
    if (!text) return '';
    if ((text[0] === '"' && text[text.length - 1] === '"') ||
        (text[0] === "'" && text[text.length - 1] === "'")) {
        return text.slice(1, -1);
    }
    if (text === 'true') return true;
    if (text === 'false') return false;
    if (/^\[.*\]$/.test(text)) {
        return text.slice(1, -1).split(',').map(parseScalar).filter(Boolean);
    }
    return text;
}

function readFrontMatter(file) {
    const source = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
    const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (!match) throw new Error(`${file}: missing YAML front matter`);

    const metadata = {};
    const lines = match[1].split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
        const entry = lines[index].match(/^([A-Za-z][A-Za-z_-]*):\s*(.*)$/);
        if (!entry) continue;
        const key = entry[1].toLowerCase();
        if (entry[2].trim()) {
            metadata[key] = parseScalar(entry[2]);
            continue;
        }

        const items = [];
        while (index + 1 < lines.length && /^\s*-\s+/.test(lines[index + 1])) {
            index += 1;
            items.push(parseScalar(lines[index].replace(/^\s*-\s+/, '')));
        }
        metadata[key] = items;
    }
    return metadata;
}

function findMarkdownFiles(directory) {
    if (!fs.existsSync(directory)) return [];
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) return findMarkdownFiles(entryPath);
        return entry.isFile() && entry.name === 'index.md' ? [entryPath] : [];
    });
}

function buildArticle(file) {
    const relative = path.relative(articlesRoot, file);
    const id = path.dirname(relative).split(path.sep).join('/');
    if (!/^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
        throw new Error(`${file}: directory must use YYYY-MM-DD-slug format`);
    }

    const metadata = readFrontMatter(file);
    if (typeof metadata.title !== 'string' || !metadata.title.trim()) {
        throw new Error(`${file}: title is required`);
    }
    if (typeof metadata.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(metadata.date)) {
        throw new Error(`${file}: date must use YYYY-MM-DD format`);
    }
    if (metadata.description !== undefined && typeof metadata.description !== 'string') {
        throw new Error(`${file}: description must be a string`);
    }
    if (metadata.cover !== undefined && typeof metadata.cover !== 'string') {
        throw new Error(`${file}: cover must be a string`);
    }
    if (metadata.tags !== undefined && (!Array.isArray(metadata.tags) ||
        metadata.tags.some((tag) => typeof tag !== 'string'))) {
        throw new Error(`${file}: tags must be a list of strings`);
    }
    if (metadata.draft !== undefined && typeof metadata.draft !== 'boolean') {
        throw new Error(`${file}: draft must be true or false`);
    }

    const cover = (metadata.cover || '').trim();
    return {
        id,
        title: metadata.title.trim(),
        date: metadata.date,
        description: metadata.description || '',
        cover: cover ? `articles/${id}/${cover.replace(/^\.?\//, '')}` : '',
        tags: metadata.tags || [],
        draft: metadata.draft === true
    };
}

try {
    const articles = findMarkdownFiles(articlesRoot)
        .map(buildArticle)
        .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, `${JSON.stringify(articles, null, 2)}\n`, 'utf8');
    console.log(`Generated ${path.relative(root, outputFile)} with ${articles.length} article(s).`);
} catch (error) {
    console.error(`Blog build failed: ${error.message}`);
    process.exitCode = 1;
}
