const API = '/api';

const assets = [
    { key: 'gold', label: 'Gold', color: '#2563eb' },
    { key: 'bitcoin', label: 'Bitcoin', color: '#ef4444' },
    { key: 'nvidia', label: 'NVIDIA', color: '#10b981' }
];

const views = {
    overview: ['◈', 'OVERVIEW', 'Market Overview', 'Monitor the latest available market prices, asset movements and relevant market context for the assets supported by QuantX.'],
    explorer: ['▣', 'ASSET EXPLORER', 'Technical Intelligence', 'Explore historical asset prices, returns, trends and quantitative indicators over the selected observation period.'],
    correlation: ['◫', 'CORRELATION LAB', 'Cross-Asset Dependency Map', 'Analyze how asset returns have moved in relation to one another over the selected historical window.', 'Cross asset dependency'],
    strategy: ['⚡', 'STRATEGY LAB', 'Backtest Execution & Hypothetical Stress Simulation', 'Configure algorithmic trading rules, evaluate historical backtest performance and experiment with hypothetical market stress scenarios.', 'Strategy Lab'],
    regimes: ['△', 'MARKET REGIMES', 'Macro Climate Decomposition', 'Examine how market conditions change over time and how the selected assets or strategies behave across identified regimes.', 'Climate decomposition'],
    adaptive: ['◎', 'ADAPTIVE LAB', 'Regime-Aware Allocation', 'Explore how strategy selection or allocation responds to changing market conditions, according to the platform\'s implemented methodology.'],
    stress: ['◇', 'STRESS LAB', 'Automated Market-Stress Intelligence', 'Evaluate portfolio or asset sensitivity to defined market shocks and examine the resulting risk implications.', 'Market Stress'],
    advanced: ['✦', 'ADVANCED LAB', 'Advanced Quantitative Analytics', 'Explore advanced quantitative analysis, risk measurements, simulations and optimization tools supported by QuantX.', 'Advanced Lab'],
    news: ['📰', 'FINANCIAL INTELLIGENCE', 'Market News & Global Macro Feed', 'Track real-time financial market news and contextual macroeconomic intelligence.', 'Global macro feed'],
    assessment: ['🎯', 'KNOWLEDGE ASSESSMENT', 'Financial Knowledge Self-Assessment', 'Evaluate your current knowledge of financial markets or quantitative finance and identify concepts that may benefit from further study.', 'Knowledge assessment'],
    summary: ['✧', 'RESEARCH SUMMARY', 'Automated Research Brief', 'Review a consolidated summary of available market statistics, strategy performance and risk analysis.', 'Research Summary']
};


const charts = {};
const $ = id => document.getElementById(id);
const plotTheme = { paper: '#263746', plot: '#263746', text: '#e8eef5', grid: 'rgba(210,226,240,.16)' };
let toggleNewsSidebar = null;

if (typeof Chart !== 'undefined') {
    Chart.defaults.color = '#d0dce7';
    Chart.defaults.font.family = 'IBM Plex Sans, Segoe UI, sans-serif';
}

function nav() {
    const html = Object.entries(views).map(([key, v]) => `<button class="nav-button" data-view-button="${key}"><b>${v[0]}</b><span>${v[4] || v[2]}</span></button>`).join('');
    $('desktopNav').innerHTML = html;
    $('mobileNav').innerHTML = html;
    document.querySelectorAll('[data-view-button]').forEach(button => button.addEventListener('click', () => {
        showView(button.dataset.viewButton);
    }));
}

const _preparedScreens = new Set(['overview']);

function showView(name) {
    prepareAdvanced();
    document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.dataset.view === name));
    document.querySelectorAll('[data-view-button]').forEach(button => button.classList.toggle('active', button.dataset.viewButton === name));
    if ($('sectionEyebrow')) $('sectionEyebrow').textContent = views[name][1];
    if ($('pageTitle')) $('pageTitle').textContent = views[name][2];
    if ($('pageSubtitle')) $('pageSubtitle').textContent = views[name][3] || '';

    // Scroll top smoothly on screen navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Priority user-interaction loading: if user navigates to an unprepared view, immediately trigger it
    if (!_preparedScreens.has(name)) {
        prioritizeScreen(name);
    }

    if (name === 'ml-regimes') {
        if ($('mlRegimeAsset')) {
            $('mlRegimeAsset').onchange = loadMLScatter;
        }
        loadMLScatter();
    }

    if (name === 'paper-trading') {
        if ($('paperOrder')) {
            $('paperOrder').onclick = () => placePaperOrder().catch(error => $('paperMessage').innerHTML = `<div class="finding">${error.message}</div>`);
        }
        if ($('paperRefresh')) {
            $('paperRefresh').onclick = () => loadPaperPortfolio();
        }
        loadPaperPortfolio();
    }

    if (name === 'news') {
        if (toggleNewsSidebar) toggleNewsSidebar(false);
        loadFullscreenNews();
    }
}


// --- Frontend Request Management: Deduplication & Cache ---
const _inFlightRequests = new Map();
const _responseCache = new Map();
const RESPONSE_CACHE_TTL = 180000; // 3 minutes client TTL

async function get(path, options = {}) {
    const { bypassCache = false, timeout = 30000 } = options;
    const now = Date.now();

    if (!bypassCache && _responseCache.has(path)) {
        const cached = _responseCache.get(path);
        if (now - cached.time < RESPONSE_CACHE_TTL) {
            return JSON.parse(JSON.stringify(cached.data));
        }
    }

    if (_inFlightRequests.has(path)) {
        return _inFlightRequests.get(path);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const promise = (async () => {
        try {
            const response = await fetch(API + path, { signal: controller.signal });
            if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
            const data = await response.json();
            _responseCache.set(path, { data, time: Date.now() });
            return data;
        } finally {
            clearTimeout(timer);
            _inFlightRequests.delete(path);
        }
    })();

    _inFlightRequests.set(path, promise);
    return promise;
}


async function loadMLScatter() {
    const data = await get(`/advanced/ml-regimes?asset=${$('mlRegimeAsset').value}`);
    $('mlRegimeSource').textContent = data.source || ''; $('mlRegimeModel').textContent = data.model || '';
    const current = data.current || {};

    setMetrics('mlRegimeMetrics', [
        ['Current cluster', String(current.regime || 'Unknown'), `${data.label} · ${current.date || ''}`],
        ['Latest return', pct(current.return), '5-day rolling feature'],
        ['Volatility', pct(current.volatility), '21-day annualized feature']
    ]);

    $('mlRegimeTable').innerHTML = `<table class="trade-table"><thead><tr><th>Cluster</th><th>Days</th><th>Return</th><th>Volatility</th><th>Momentum</th></tr></thead><tbody>${(data.profiles || []).map(row => `<tr><td>${row.cluster} ·${row.regime}</td><td>${row.days}</td><td>${pct(row.return)}</td><td>${pct(row.volatility)}</td><td>${pct(row.momentum)}</td></tr>`).join('')}</tbody></table>`;

    if (typeof Plotly !== 'undefined') {
        const colors = ['#6671f2', '#ff5a3d', '#00c89b'];
        Plotly.newPlot('mlRegimeChart', [0, 1, 2].map(cluster => {
            const points = (data.observations || []).filter(row => row.cluster === cluster);
            return {
                x: points.map(row => row.return),
                y: points.map(row => row.volatility),
                customdata: points.map(row => row.date),
                mode: 'markers',
                type: 'scatter',
                name: String(cluster),
                marker: { color: colors[cluster], size: 6, opacity: .86 },
                hovertemplate: 'Date: %{customdata}<br>Return: %{x:.2%}<br>Volatility: %{y:.2f}<extra>Cluster ' + cluster + '</extra>'
            };
        }), {
            title: { text: `KMeans Market Regimes for ${data.label}`, font: { size: 14, color: plotTheme.text } },
            paper_bgcolor: plotTheme.paper,
            plot_bgcolor: plotTheme.plot,
            font: { color: plotTheme.text },
            margin: { l: 65, r: 20, t: 55, b: 55 },
            xaxis: { title: 'Return', tickformat: '.2%', gridcolor: 'rgba(148,163,184,.15)' },
            yaxis: { title: 'Volatility', tickformat: '.1f', gridcolor: 'rgba(148,163,184,.15)' },
            legend: { title: { text: 'Regime Cluster' } }
        }, { responsive: true, displaylogo: false });
    }
}

function metric(label, value, sub = '', metricKey = null) {
    const tooltipHtml = typeof renderMetricTooltip === 'function' ? renderMetricTooltip(metricKey || label, label) : '';
    return `
        <article class="metric-card">
            <div class="metric-card-header">
                <div class="metric-label">${label}</div>
                ${tooltipHtml}
            </div>
            <div class="metric-value">${value}</div>
            ${sub ? `<div class="metric-sub">${sub}</div>` : ''}
        </article>
    `;
}

function prepareAdvanced() {
    if (document.querySelector('[data-advanced-panel="ml-regimes"]')) return;
    const advanced = document.querySelector('[data-view="advanced"]');
    const tabs = advanced.querySelector('.advanced-tabs');

    [['ml-regimes', '◉ ML Market Regimes'], ['paper-trading', '▤ Paper Trading Simulator']].forEach(([name, label]) => {
        const button = document.createElement('button');
        button.className = 'advanced-tab';
        button.dataset.advancedView = name;
        button.textContent = label;
        button.addEventListener('click', () => {
            document.querySelectorAll('[data-advanced-view]').forEach(item => item.classList.toggle('active', item === button));
            document.querySelectorAll('[data-advanced-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.advancedPanel === name));
            if (name === 'ml-regimes') loadMLScatter();
            if (name === 'paper-trading') {
                bindPaperTradingControls();
                loadPaperPortfolio();
            }
        });
        tabs.append(button);
        const panel = document.querySelector(`[data-view="${name}"]`);
        panel.classList.remove('view');
        panel.classList.add('advanced-panel');
        panel.dataset.advancedPanel = name;
        advanced.append(panel);
        if (name === 'paper-trading') bindPaperTradingControls();
    });
}

function bindPaperTradingControls() {
    const orderButton = $('paperOrder');
    const refreshButton = $('paperRefresh');
    if (orderButton && !orderButton.dataset.bound) {
        orderButton.onclick = () => placePaperOrder().catch(error => $('paperMessage').innerHTML = `<div class="finding">${error.message}</div>`);
        orderButton.dataset.bound = 'true';
    }
    if (refreshButton && !refreshButton.dataset.bound) {
        refreshButton.onclick = () => loadPaperPortfolio();
        refreshButton.dataset.bound = 'true';
    }
}

function assistantReply(question) {
    const text = question.toLowerCase();
    if (text.includes('summar')) return 'The dashboard combines multi-asset performance, technical indicators, rolling correlations, regime analysis, and strategy backtests. Start with the Asset Explorer, then test the strategy under more than one period.';
    if (text.includes('risk') || text.includes('backtest')) return 'Backtests are historical simulations, not forecasts. Check drawdown, volatility, Sharpe ratio, transaction costs, position sizing, and benchmark performance before drawing a conclusion.';
    if (text.includes('next') || text.includes('investigat')) return 'A useful next step is to compare the same strategy across Bull, Bear, High Volatility, and Low Volatility regimes, then inspect whether the result survives different periods.';
    if (text.includes('correlation')) return 'Use the Correlation Lab to compare the static matrix with rolling relationships. A changing correlation can affect diversification and portfolio risk.';
    return 'I can help with asset behaviour, correlations, market regimes, backtest interpretation, and research workflow. Try one of the suggested prompts below.';
}

function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function renderAssistantMarkdown(markdown) {
    const escaped = escapeHtml(markdown).replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    const lines = escaped.split('\n');
    const output = [];
    let table = [];
    const flushTable = () => {
        if (!table.length) return;
        const rows = table.filter(row => !/^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(row));
        if (rows.length) {
            const cells = row => row.split('|').map(cell => cell.trim()).filter(Boolean);
            output.push(`<table class="assistant-markdown-table"><thead><tr>${cells(rows[0]).map(cell => `<th>${cell}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map(row => `<tr>${cells(row).map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
        }
        table = [];
    };
    lines.forEach(line => {
        if (line.includes('|') && line.trim().length > 1) { table.push(line); return; }
        flushTable();
        if (/^###\s+/.test(line)) output.push(`<h4>${line.replace(/^###\s+/, '')}</h4>`);
        else if (/^##\s+/.test(line)) output.push(`<h3>${line.replace(/^##\s+/, '')}</h3>`);
        else if (/^#\s+/.test(line)) output.push(`<h3>${line.replace(/^#\s+/, '')}</h3>`);
        else if (/^\s*[-*]\s+/.test(line)) output.push(`<div class="assistant-bullet">${line.replace(/^\s*[-*]\s+/, '')}</div>`);
        else if (/^\s*\d+\.\s+/.test(line)) output.push(`<div class="assistant-bullet">${line.replace(/^\s*\d+\.\s+/, '')}</div>`);
        else if (line.trim()) output.push(`<p>${line}</p>`);
    });
    flushTable();
    return output.join('').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>');
}

function addAssistantMessage(text, type) {
    const message = document.createElement('div');
    message.className = `assistant-message assistant-${type}`;
    if (type === 'bot') message.innerHTML = renderAssistantMarkdown(text);
    else message.textContent = text;
    $('assistantMessages').append(message);
    $('assistantMessages').scrollTop = $('assistantMessages').scrollHeight;
}

function setupAssistant() {
    const launcher = $('assistantLauncher');
    const panel = $('assistantPanel');
    const close = $('assistantClose');
    const form = $('assistantForm');
    const input = $('assistantInput');
    const history = [];
    const toggle = open => {
        panel.classList.toggle('open', open);
        panel.setAttribute('aria-hidden', String(!open));
        launcher.setAttribute('aria-expanded', String(open));
        if (open) input.focus();
    };
    launcher.addEventListener('click', () => toggle(!panel.classList.contains('open')));
    close.addEventListener('click', () => toggle(false));
    document.querySelectorAll('[data-assistant-prompt]').forEach(button => button.addEventListener('click', () => {
        const question = button.dataset.assistantPrompt;
        addAssistantMessage(question, 'user');
        askAssistant(question);
    }));
    form.addEventListener('submit', event => {
        event.preventDefault();
        const question = input.value.trim();
        if (!question) return;
        addAssistantMessage(question, 'user');
        input.value = '';
        askAssistant(question);
    });

    async function askAssistant(question) {
        let answer;
        try {
            const response = await fetch(`${API}/assistant`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: question, history }) });
            const data = await response.json();
            answer = response.ok ? data.answer : (data.detail || 'The assistant request was rejected.');
        } catch (error) {
            answer = 'The assistant service is unavailable. Check that the backend is running.';
        }
        history.push({ role: 'user', content: question }, { role: 'assistant', content: answer });
        addAssistantMessage(answer, 'bot');
    }
}

function setupNewsSidebar() {
    const sidebar = $('newsSidebar');
    const headerNewsBtn = $('headerNewsBtn');
    const closeBtn = $('newsCloseBtn');
    const refreshBtn = $('newsRefreshBtn');
    const overlay = $('newsOverlay');
    const newsList = $('newsList');
    const staleBanner = $('newsStaleBanner');
    const timeTag = $('newsLastUpdated');
    const filterPills = document.querySelectorAll('.news-pill');
    const shell = document.querySelector('.app-shell');

    if (!sidebar) return;

    let currentAsset = 'all';
    let isFetching = false;
    let autoRefreshTimer = null;
    let abortController = null;
    let cachedArticles = [];
    let hasLoadedOnce = false;

    function formatTime(isoString) {
        if (!isoString) return 'Just now';
        try {
            const date = new Date(isoString);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return 'Recently';
        }
    }

    function triggerLayoutReflow() {
        window.dispatchEvent(new Event('resize'));
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
            if (window.Plotly) {
                document.querySelectorAll('.plotly-chart').forEach(el => {
                    try { Plotly.Plots.resize(el); } catch (e) { }
                });
            }
        }, 60);
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 320);
    }

    function toggleSidebar(forceState) {
        const shouldOpen = forceState !== undefined ? forceState : !shell.classList.contains('news-open');
        shell.classList.toggle('news-open', shouldOpen);
        document.body.classList.toggle('news-open', shouldOpen);
        if (headerNewsBtn) {
            headerNewsBtn.classList.toggle('active', shouldOpen);
            headerNewsBtn.setAttribute('aria-expanded', String(shouldOpen));
        }

        triggerLayoutReflow();

        if (shouldOpen) {
            startAutoRefresh();
            if (!hasLoadedOnce) {
                fetchNews(currentAsset, false);
            }
        } else {
            stopAutoRefresh();
        }
    }

    toggleNewsSidebar = toggleSidebar;

    function startAutoRefresh() {
        stopAutoRefresh();
        autoRefreshTimer = setInterval(() => {
            if (shell.classList.contains('news-open') && !isFetching) {
                fetchNews(currentAsset, false);
            }
        }, 300000);
    }

    function stopAutoRefresh() {
        if (autoRefreshTimer) {
            clearInterval(autoRefreshTimer);
            autoRefreshTimer = null;
        }
    }

    function renderSkeletons() {
        newsList.innerHTML = Array(4).fill(0).map(() => `
            <div class="news-skeleton-card">
                <div class="news-skel-line news-skel-title-1"></div>
                <div class="news-skel-line news-skel-title-2"></div>
                <div class="news-skel-line news-skel-snippet"></div>
                <div class="news-skel-footer">
                    <div class="news-skel-line news-skel-badge"></div>
                    <div class="news-skel-line news-skel-source"></div>
                </div>
            </div>
        `).join('');
    }

    function escapeHtml(text) {
        if (!text) return '';
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }

    function renderArticles(articles) {
        if (!articles || articles.length === 0) {
            newsList.innerHTML = `
                <div class="news-empty-state">
                    <span class="news-empty-icon">📰</span>
                    <h3>No news articles found</h3>
                    <p>No recent articles found for this market filter. Try selecting All Markets or refresh.</p>
                    <button class="news-retry-btn" type="button" id="newsEmptyRetry">↻ Refresh Feed</button>
                </div>
            `;
            const emptyRetry = $('newsEmptyRetry');
            if (emptyRetry) emptyRetry.onclick = () => fetchNews(currentAsset, true);
            return;
        }

        newsList.innerHTML = articles.map(item => {
            const assetKey = (item.asset || 'all').toLowerCase();
            const tagClass = `tag-${assetKey}`;
            const assetName = assetKey === 'all' ? 'Market' : assetKey.charAt(0).toUpperCase() + assetKey.slice(1);
            const thumbHtml = item.thumbnail
                ? `<img class="news-card-thumb" src="${escapeHtml(item.thumbnail)}" alt="" loading="lazy" onerror="this.remove()" />`
                : '';

            return `
                <a class="news-card" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" title="Read: ${escapeHtml(item.title)}">
                    <div class="news-card-content">
                        <div class="news-card-body">
                            <h4 class="news-card-headline">${escapeHtml(item.title)}</h4>
                            ${item.snippet ? `<p class="news-card-snippet">${escapeHtml(item.snippet)}</p>` : ''}
                        </div>
                        ${thumbHtml}
                    </div>
                    <div class="news-card-footer">
                        <div class="news-card-meta">
                            <span class="news-tag ${tagClass}">${assetName}</span>
                            <span class="news-card-source">${escapeHtml(item.source)}</span>
                            <span>&bull;</span>
                            <span class="news-card-time">${escapeHtml(item.date)}</span>
                        </div>
                        <span class="news-card-link-icon" aria-hidden="true">↗</span>
                    </div>
                </a>
            `;
        }).join('');
    }

    async function fetchNews(asset, bypassCache = false) {
        if (isFetching && !bypassCache && asset === currentAsset) return;

        if (abortController) {
            abortController.abort();
        }
        abortController = new AbortController();

        isFetching = true;
        if (refreshBtn) {
            refreshBtn.classList.add('spinning');
            refreshBtn.setAttribute('disabled', 'disabled');
        }

        if (!cachedArticles || cachedArticles.length === 0) {
            renderSkeletons();
        }

        try {
            const response = await fetch(`${API}/news?asset=${asset}&limit=20${bypassCache ? '&refresh=true' : ''}`, {
                signal: abortController.signal
            });

            if (response.status === 503) {
                newsList.innerHTML = `
                    <div class="news-config-card">
                        <h3>⚠️ SerpApi Key Required</h3>
                        <p>Live market news powered by Google News requires a SerpApi key. Add the following to your backend <code>.env</code> file:</p>
                        <code>SERPAPI_API_KEY=your_serpapi_key_here</code>
                        <p>Once set, refresh the feed below to stream live market updates.</p>
                        <a href="https://serpapi.com/google-news-api" target="_blank" rel="noopener noreferrer">Get Free SerpApi Key ↗</a>
                        <br/>
                        <button class="news-retry-btn" type="button" id="newsConfigRetry">↻ Check Again</button>
                    </div>
                `;
                const configRetry = $('newsConfigRetry');
                if (configRetry) configRetry.onclick = () => fetchNews(currentAsset, true);
                if (staleBanner) staleBanner.style.display = 'none';
                if (timeTag) timeTag.textContent = 'Configuration needed';
                return;
            }

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                const errMsg = errData.detail || `Server returned ${response.status}`;
                throw new Error(errMsg);
            }

            const data = await response.json();
            hasLoadedOnce = true;
            const rawSidebar = data.articles || [];
            cachedArticles = rawSidebar.filter(item => {
                const u = String(item.url || '').toLowerCase();
                const t = String(item.title || '').toLowerCase();
                const s = String(item.source || '').toLowerCase();
                return !(u.includes('gold.org') || u.includes('goldhub') || u.includes('gold-market-commentary') ||
                    t.includes('gold-market-commentary') || s.includes('goldhub'));
            });

            if (data.stale && data.warning) {
                if (staleBanner) {
                    staleBanner.innerHTML = `<strong>Notice:</strong> ${escapeHtml(data.warning)}`;
                    staleBanner.style.display = 'block';
                }
            } else {
                if (staleBanner) staleBanner.style.display = 'none';
            }

            renderArticles(cachedArticles);

            if (timeTag) {
                const timeStr = formatTime(data.fetched_at);
                timeTag.textContent = data.cached ? `Cached ${timeStr}` : `Updated ${timeStr}`;
            }

        } catch (err) {
            if (err.name === 'AbortError') {
                return;
            }

            console.warn('[QuantX News] Fetch failed:', err.message);

            if (cachedArticles && cachedArticles.length > 0) {
                if (staleBanner) {
                    staleBanner.innerHTML = `<strong>Unable to refresh:</strong> Showing latest available results. (${escapeHtml(err.message)})`;
                    staleBanner.style.display = 'block';
                }
            } else {
                newsList.innerHTML = `
                    <div class="news-empty-state">
                        <span class="news-empty-icon">⚠️</span>
                        <h3>News Feed Temporarily Unavailable</h3>
                        <p>${escapeHtml(err.message)}</p>
                        <button class="news-retry-btn" type="button" id="newsErrorRetry">↻ Try Again</button>
                    </div>
                `;
                const errRetry = $('newsErrorRetry');
                if (errRetry) errRetry.onclick = () => fetchNews(currentAsset, true);
                if (staleBanner) staleBanner.style.display = 'none';
                if (timeTag) timeTag.textContent = 'Connection error';
            }
        } finally {
            isFetching = false;
            if (refreshBtn) {
                refreshBtn.classList.remove('spinning');
                refreshBtn.removeAttribute('disabled');
            }
        }
    }

    if (headerNewsBtn) headerNewsBtn.addEventListener('click', () => toggleSidebar());
    if (closeBtn) closeBtn.addEventListener('click', () => toggleSidebar(false));
    if (overlay) overlay.addEventListener('click', () => toggleSidebar(false));
    if (refreshBtn) refreshBtn.addEventListener('click', () => fetchNews(currentAsset, true));

    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            const asset = pill.dataset.newsAsset;
            if (asset === currentAsset) return;
            filterPills.forEach(p => p.classList.toggle('active', p === pill));
            currentAsset = asset;
            fetchNews(currentAsset, false);
        });
    });

    document.querySelectorAll('.news-fs-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const asset = pill.dataset.fsAsset;
            if (asset === currentFsAsset) return;
            document.querySelectorAll('.news-fs-pill').forEach(p => p.classList.toggle('active', p === pill));
            loadFullscreenNews(asset, false);
        });
    });

    if ($('newsFsRefreshBtn')) {
        $('newsFsRefreshBtn').addEventListener('click', () => loadFullscreenNews(currentFsAsset, true));
    }

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && shell.classList.contains('news-open')) {
            toggleSidebar(false);
        }
    });

    fetchNews('all', false);
}

let currentFsAsset = 'all';

async function loadFullscreenNews(asset = currentFsAsset, bypassCache = false) {
    currentFsAsset = asset;
    const container = $('newsFsContainer');
    const statusTag = $('newsFsStatus');
    const staleBanner = $('newsFsStaleBanner');
    const refreshBtn = $('newsFsRefreshBtn');
    if (!container) return;

    if (refreshBtn) refreshBtn.textContent = '↻ Refreshing...';
    if (!container.children.length) {
        container.innerHTML = Array(6).fill(0).map(() => `
            <div class="news-skeleton-card">
                <div class="news-skel-line" style="height:120px;border-radius:6px;margin-bottom:8px"></div>
                <div class="news-skel-line news-skel-title-1"></div>
                <div class="news-skel-line news-skel-title-2"></div>
                <div class="news-skel-line news-skel-snippet"></div>
            </div>
        `).join('');
    }

    try {
        const response = await fetch(`${API}/news?asset=${asset}&limit=30${bypassCache ? '&refresh=true' : ''}`);
        if (response.status === 503) {
            container.innerHTML = `
                <div class="news-config-card" style="grid-column: 1/-1;">
                    <h3>⚠️ SerpApi Key Required</h3>
                    <p>Live Google News feed requires a free SerpApi key. Add the following to your backend <code>.env</code> file:</p>
                    <code>SERPAPI_API_KEY=your_key_here</code>
                    <p>After configuring, click Refresh to load live financial articles.</p>
                    <a href="https://serpapi.com/google-news-api" target="_blank" rel="noopener noreferrer">Get Free SerpApi Key ↗</a>
                </div>
            `;
            if (statusTag) statusTag.textContent = 'Configuration needed';
            return;
        }

        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }

        const data = await response.json();
        const rawArticles = data.articles || [];
        const isExcluded = (item) => {
            const u = String(item.url || '').toLowerCase();
            const t = String(item.title || '').toLowerCase();
            const s = String(item.source || '').toLowerCase();
            return u.includes('gold.org') || u.includes('goldhub') || u.includes('gold-market-commentary') ||
                t.includes('gold-market-commentary') || s.includes('goldhub');
        };
        const articles = rawArticles.filter(item => !isExcluded(item));

        if (statusTag) {
            const timeStr = new Date(data.fetched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            statusTag.textContent = data.cached ? `Cached ${timeStr}` : `Updated ${timeStr}`;
        }

        if (data.stale && data.warning) {
            if (staleBanner) {
                staleBanner.innerHTML = `<strong>Notice:</strong> ${data.warning}`;
                staleBanner.style.display = 'block';
            }
        } else {
            if (staleBanner) staleBanner.style.display = 'none';
        }

        if (!articles.length) {
            container.innerHTML = `
                <div class="news-empty-state" style="grid-column: 1/-1;">
                    <span class="news-empty-icon">📰</span>
                    <h3>No articles found</h3>
                    <p>No recent news found for this market category.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = articles.map(item => {
            const assetKey = (item.asset || 'all').toLowerCase();
            const tagClass = `tag-${assetKey}`;
            const assetName = assetKey === 'all' ? 'Market' : assetKey.charAt(0).toUpperCase() + assetKey.slice(1);
            const thumbHtml = item.thumbnail
                ? `<img class="news-fs-card-thumb" src="${item.thumbnail}" alt="" loading="lazy" onerror="this.remove()" />`
                : '';

            return `
                <a class="news-fs-card" href="${item.url}" target="_blank" rel="noopener noreferrer" title="Read: ${item.title}">
                    ${thumbHtml}
                    <h3 class="news-fs-card-headline">${item.title}</h3>
                    ${item.snippet ? `<p class="news-fs-card-snippet">${item.snippet}</p>` : ''}
                    <div class="news-fs-card-footer">
                        <div class="news-card-meta">
                            <span class="news-tag ${tagClass}">${assetName}</span>
                            <span class="news-card-source">${item.source}</span>
                            <span>&bull;</span>
                            <span class="news-card-time">${item.date}</span>
                        </div>
                        <span class="news-card-link-icon" aria-hidden="true">↗</span>
                    </div>
                </a>
            `;
        }).join('');

    } catch (err) {
        console.warn('[QuantX News FS] Error:', err.message);
        if (statusTag) statusTag.textContent = 'Error loading news';
        if (!container.children.length) {
            container.innerHTML = `
                <div class="news-empty-state" style="grid-column: 1/-1;">
                    <span class="news-empty-icon">⚠️</span>
                    <h3>News Feed Temporarily Unavailable</h3>
                    <p>${err.message}</p>
                </div>
            `;
        }
    } finally {
        if (refreshBtn) refreshBtn.textContent = '↻ Refresh';
    }
}

function pct(value, digits = 2) { return `${(Number(value || 0) * 100).toFixed(digits)}%`; }
function money(value) { return `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`; }
function normalize(series) {
    const first = Number(series[0]?.close) || 1;
    return series.map(row => Number(row.close) / first * 100);
}
function destroy(name) { if (charts[name]) charts[name].destroy(); }

function lineChart(name, id, labels, datasets, options = {}) {
    destroy(name);
    charts[name] = new Chart($(id), {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            animation: { duration: 350 },
            plugins: {
                legend: { labels: { color: '#dce6ef' } },
                tooltip: { backgroundColor: '#ffffff', borderColor: '#cbd8e7', borderWidth: 1, titleColor: '#17324f', bodyColor: '#425a75' }
            },
            scales: {
                x: { grid: { color: 'rgba(210,226,240,.14)' }, ticks: { maxTicksLimit: 8, maxRotation: 0, color: '#c3d2df' } },
                y: { grid: { color: 'rgba(210,226,240,.16)' }, ticks: { color: '#c3d2df' } }
            },
            ...options
        }
    });
}

function prepareStrategyUI() {
    const controls = document.querySelector('.strategy-controls');
    if (!controls || $('strategyPeriod')) return;
    controls.querySelector('#strategyAsset').closest('label').insertAdjacentHTML('afterend', '<label>Backtest period<select id="strategyPeriod"><option value="1y">1 year</option><option value="2y" selected>2 years</option><option value="5y">5 years</option></select></label>');
    controls.querySelector('#cost').closest('label').insertAdjacentHTML('beforebegin', '<label>Position sizing<output id="positionOutput">100%</output><input id="position" type="range" min="10" max="100" step="5" value="100" /></label>');
    const results = document.querySelector('.strategy-results');
    const equityPanel = results?.querySelector('.chart-panel');
    if (equityPanel) {
        const profilePanel = document.createElement('div');
        profilePanel.className = 'panel chart-panel strategy-profile-panel';
        profilePanel.innerHTML = '<div class="panel-heading"><h2>Strategy Signal Quality</h2><span class="status">Live backtest profile</span></div><div class="chart-wrap strategy-profile-chart-wrap"><canvas id="strategyProfileChart"></canvas></div>';
        equityPanel.insertAdjacentElement('afterend', profilePanel);
        const riskPanel = document.createElement('div');
        riskPanel.className = 'panel chart-panel strategy-risk-panel';
        riskPanel.innerHTML = '<div class="panel-heading"><h2>Return and Risk Profile</h2><span class="status">Daily return / 21D volatility / drawdown</span></div><div class="chart-wrap strategy-risk-chart-wrap"><canvas id="strategyRiskChart"></canvas></div>';
        equityPanel.insertAdjacentElement('afterend', riskPanel);
    }
}

function radarScore(value, minimum = 0, maximum = 100) {
    return Math.max(minimum, Math.min(maximum, Number(value) || 0));
}

function updateStrategyProfile(strategy, metrics) {
    destroy('strategyProfile');
    const trendScore = strategy === 'ema' || strategy === 'sma' ? 78 : strategy === 'momentum' ? 68 : 48;
    const momentumScore = radarScore(50 + Number(metrics.total_return || 0) * 100);
    const riskScore = radarScore(100 - Math.abs(Number(metrics.max_drawdown || 0)) * 200);
    const consistencyScore = radarScore(Number(metrics.win_rate || 0) * 100);
    const benchmarkScore = radarScore(50 + (Number(metrics.total_return || 0) - Number(metrics.benchmark_return || 0)) * 200);
    const executionScore = radarScore(100 - Number(metrics.total_trades || 0) * 1.2);
    charts.strategyProfile = new Chart($('strategyProfileChart'), {
        type: 'radar',
        data: {
            labels: ['Trend', 'Momentum', 'Risk control', 'Consistency', 'Benchmark edge', 'Execution'],
            datasets: [{
                label: 'Strategy profile',
                data: [trendScore, momentumScore, riskScore, consistencyScore, benchmarkScore, executionScore],
                borderColor: '#4969b2',
                backgroundColor: 'rgba(73,105,178,.18)',
                pointBackgroundColor: '#0a66c2',
                pointBorderColor: '#ffffff',
                pointHoverBackgroundColor: '#ffffff',
                pointHoverBorderColor: '#0a66c2',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    min: 0,
                    max: 100,
                    ticks: { stepSize: 20, color: '#61748d', backdropColor: 'transparent' },
                    grid: { color: 'rgba(91,116,145,.18)' },
                    angleLines: { color: 'rgba(91,116,145,.22)' },
                    pointLabels: { color: '#40566f', font: { size: 11, weight: '600' } }
                }
            },
            plugins: { legend: { labels: { color: '#40566f' } } }
        }
    });
}

async function loadOverview() {
    const period = $('overviewPeriod') ? $('overviewPeriod').value : '2y';
    const data = await get(`/assets?period=${period}`);
    const cards = data.assets || [];
    if (cards.length) {
        $('overviewCards').innerHTML = cards.map(item => metric(item.label, money(item.summary.price), `Daily ${pct(item.summary.daily_change)} | Sharpe ${Number(item.summary.sharpe || 0).toFixed(2)}`)).join('');
    }
    if (cards.length > 0 && cards[0].series && cards[0].series.length > 0) {
        const labels = cards[0].series.map(row => row.date);
        const overviewAssetColors = {
            gold: '#2563eb',     // Blue
            bitcoin: '#ef4444',  // Red
            nvidia: '#10b981'    // Green
        };
        const datasets = cards.map((payload, i) => {
            const assetKey = (payload.asset || (assets[i] ? assets[i].key : '') || '').toLowerCase();
            const strokeColor = overviewAssetColors[assetKey] || payload.color || (assets[i] ? assets[i].color : '#2563eb');
            return {
                label: payload.label || (assets[i] ? assets[i].label : ''),
                data: normalize(payload.series),
                borderColor: strokeColor,
                pointRadius: 0,
                borderWidth: 2.2,
                tension: .12
            };
        });
        lineChart('performance', 'performanceChart', labels, datasets);
        if ($('performanceCaption') && typeof renderFigureCaption === 'function') {
            $('performanceCaption').innerHTML = renderFigureCaption('performance', { period: period === '1y' ? '1 year' : period === '2y' ? '2 years' : '5 years' });
        }
        $('sourceStatus').textContent = cards.every(p => p.live) ? 'Live sync online' : 'Fallback data online';
        $('lastUpdated').textContent = `Updated ${new Date().toLocaleTimeString()}`;
    }
}

async function loadExplorer() {
    const assetVal = $('assetSelect').value;
    const periodVal = $('assetPeriod').value;
    const data = await get(`/assets/${assetVal}?period=${periodVal}`);
    const s = data.series || [];
    const sum = data.summary || {};
    $('assetMetrics').innerHTML = [
        metric('Price', money(sum.price)),
        metric('Daily return', pct(sum.daily_change)),
        metric('Cumulative return', pct(sum.cumulative_return)),
        metric('21D rolling return', pct(sum.rolling_return_21d)),
        metric('Annualized volatility', pct(sum.annual_volatility)),
        metric('Sharpe / drawdown', `${Number(sum.sharpe || 0).toFixed(2)} / ${pct(sum.max_drawdown)}`)
    ].join('');
    const last = s[s.length - 1] || {};
    const signals = [
        ['50 EMA', last.close > last.ema50 ? 'Bullish' : 'Below average', last.close > last.ema50 ? 78 : 35],
        ['200 EMA', last.close > last.ema200 ? 'Trend support' : 'Trend risk', last.close > last.ema200 ? 72 : 30],
        ['Volatility', `${pct(last.volatility)} annualized`, Math.min(95, Number(last.volatility || 0) * 140)],
        ['Drawdown', pct(last.drawdown), Math.max(8, 100 + Number(last.drawdown || 0) * 180)]
    ];
    $('signals').innerHTML = signals.map(x => `<div class="signal"><div class="signal-top"><span>${x[0]}</span><span>${x[1]}</span></div><div class="signal-bar"><i style="width:${x[2]}%"></i></div></div>`).join('');
    lineChart('asset', 'assetChart', s.map(x => x.date), [['Close', 'close', '#65b7ff'], ['SMA50', 'sma50', '#d68b2a'], ['EMA50', 'ema50', '#7898ff'], ['EMA200', 'ema200', '#20b8b0']].map(x => ({ label: x[0], data: s.map(row => row[x[1]]), borderColor: x[2], pointRadius: 0, borderWidth: x[0] === 'Close' ? 2.4 : 1.5, tension: .18 })));
    if ($('assetCaption') && typeof renderFigureCaption === 'function') {
        const assetName = $('assetSelect').selectedOptions[0]?.textContent || assetVal;
        $('assetCaption').innerHTML = renderFigureCaption('asset', { asset: assetName, period: periodVal === '1y' ? '1 year' : periodVal === '2y' ? '2 years' : '5 years' });
    }
}

async function loadCorrelation() {
    const data = await get('/correlation');
    $('correlationSource').textContent = data.source || '';
    const labels = data.labels || [];
    const matrix = data.matrix || [];
    Plotly.newPlot('correlationMatrix', [{
        z: matrix, x: labels, y: labels, type: 'heatmap',
        zmin: -1, zmax: 1,
        colorscale: [[0, '#063b73'], [.25, '#5ba5d8'], [.5, '#fff0e8'], [.75, '#f58f68'], [1, '#790021']],
        hovertemplate: 'Ticker: %{y}<br>Ticker: %{x}<br>Correlation: %{z:.6f}<extra></extra>',
        text: matrix.map(row => row.map(value => Number(value).toFixed(6))),
        texttemplate: '%{text}',
        textfont: { color: '#142033', size: 11 },
        showscale: true,
        colorbar: { title: 'Correlation', tickvals: [-1, -.5, 0, .5, 1], ticktext: ['-1', '-0.5', '0', '0.5', '1'], titlefont: { color: plotTheme.text }, tickfont: { color: plotTheme.text } }
    }], {
        paper_bgcolor: '#f3f5f7', plot_bgcolor: '#f3f5f7', font: { color: '#29415e' },
        margin: { l: 100, r: 80, t: 20, b: 85 },
        xaxis: { title: 'Ticker', gridcolor: '#252b36' },
        yaxis: { title: 'Ticker', autorange: 'reversed', gridcolor: '#252b36' },
        hovermode: 'closest'
    }, { responsive: true, displaylogo: false, modeBarButtonsToRemove: ['lasso2d', 'select2d'] });
    const rollingSeries = Object.entries(data.rolling_series || {}).map(([name, values], index) => ({
        x: data.rolling_labels || [], y: values, type: 'scatter', mode: 'lines', name,
        line: { color: ['#7f8cff', '#ff5a3d', '#00d5a0'][index], width: 2 },
        hovertemplate: `${name}<br>%{x}<br>Correlation: %{y:.3f}<extra></extra>`
    }));
    Plotly.newPlot('rollingCorrelationChart', rollingSeries, {
        paper_bgcolor: '#f3f5f7', plot_bgcolor: '#f3f5f7', font: { color: '#29415e' },
        margin: { l: 50, r: 20, t: 20, b: 55 }, hovermode: 'x unified',
        xaxis: { gridcolor: '#252b36', nticks: 7 },
        yaxis: { title: 'Correlation', range: [-1, 1], gridcolor: '#252b36', zerolinecolor: '#566174' },
        legend: { orientation: 'h', y: 1.08 }
    }, { responsive: true, displaylogo: false, modeBarButtonsToRemove: ['lasso2d', 'select2d'] });
    if ($('correlationMatrixCaption') && typeof renderFigureCaption === 'function') {
        $('correlationMatrixCaption').innerHTML = renderFigureCaption('correlationMatrix');
    }
    if ($('rollingCorrelationCaption') && typeof renderFigureCaption === 'function') {
        $('rollingCorrelationCaption').innerHTML = renderFigureCaption('rollingCorrelation');
    }
}

function setMetrics(id, items) {
    const container = $(id);
    if (!container) return;
    container.innerHTML = items.map(x => metric(x[0], x[1], x[2] || '', x[3] || null)).join('');
}

async function runBacktest(asset = $('backtestAsset').value) {
    const body = { asset, initial_capital: Number($('capital').value) || 10000, position_size: Number($('position').value) || 1, transaction_cost: Number($('cost').value) || 0 };
    const response = await fetch(API + '/backtest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await response.json();
    const m = data.metrics || {};
    setMetrics('backtestMetrics', [['Total return', pct(m.total_return)], ['Sharpe', Number(m.sharpe || 0).toFixed(2)], ['Max drawdown', pct(m.max_drawdown)], ['Final value', money(m.final_value)]]);
    lineChart('backtest', 'backtestChart', (data.curve || []).map(x => x.date), [{ label: 'Strategy', data: (data.curve || []).map(x => x.strategy), borderColor: '#00d5a0', pointRadius: 0, borderWidth: 2, tension: .2 }, { label: 'Buy & Hold', data: (data.curve || []).map(x => x.benchmark), borderColor: '#f5c451', pointRadius: 0, borderWidth: 1.5, tension: .2 }]);
    return m;
}

async function loadStrategy() {
    const assetVal = $('strategyAsset').value;
    const periodVal = $('strategyPeriod').value;
    const stratVal = $('strategySelect').value;
    const fastVal = Number($('fastWindow').value);
    const slowVal = Number($('slowWindow').value);
    const capitalVal = Number($('capital').value) || 140000;
    const costVal = (Number($('cost').value) || 0) / 100;
    const body = { asset: assetVal, period: periodVal, initial_capital: capitalVal, position_size: (Number($('position').value) || 100) / 100, transaction_cost: costVal, strategy: stratVal, fast_window: fastVal, slow_window: slowVal };
    const response = await fetch(API + '/backtest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await response.json();
    const m = data.metrics || {};
    $('strategySource').textContent = data.source || '';
    const strategyName = $('strategySelect').selectedOptions[0].textContent;
    updateStrategyProfile(stratVal, m);
    setMetrics('strategyMetrics', [
        ['Strategy Return', pct(m.total_return), '', 'strategy_return'],
        ['Benchmark Return', pct(m.benchmark_return), '', 'benchmark_return'],
        ['Strategy Sharpe', Number(m.sharpe || 0).toFixed(2), '', 'strategy_sharpe'],
        ['Benchmark Sharpe', Number(m.benchmark_sharpe || 0).toFixed(2), '', 'benchmark_sharpe'],
        ['Strategy Volatility', pct(m.annualized_volatility), '', 'strategy_volatility'],
        ['Benchmark Volatility', pct(m.benchmark_annualized_volatility), '', 'benchmark_volatility'],
        ['Strategy Drawdown', pct(m.max_drawdown), '', 'strategy_drawdown'],
        ['Benchmark Drawdown', pct(m.benchmark_max_drawdown), '', 'benchmark_drawdown'],
        ['Win Rate', pct(m.win_rate), '', 'win_rate']
    ]);
    const curve = data.curve || [];
    lineChart('strategy', 'strategyChart', curve.map(x => x.date), [{ label: strategyName, data: curve.map(x => x.strategy), borderColor: '#7f8cff', pointRadius: 0, borderWidth: 1.5, tension: .15 }, { label: 'Buy & Hold Benchmark', data: curve.map(x => x.benchmark), borderColor: '#ff5a3d', pointRadius: 0, borderWidth: 1.5, tension: .15 }, { label: 'Buy signal', data: curve.map(x => x.buy ? x.strategy : null), borderColor: '#00d5a0', backgroundColor: '#00d5a0', pointRadius: 5, pointHoverRadius: 6, showLine: false }, { label: 'Sell signal', data: curve.map(x => x.sell ? x.strategy : null), borderColor: '#ff5a3d', backgroundColor: '#ff5a3d', pointRadius: 5, pointHoverRadius: 6, showLine: false }]);
    lineChart('strategyRisk', 'strategyRiskChart', curve.map(x => x.date), [{ label: 'Daily return', data: curve.map(x => Number(x.return || 0) * 100), borderColor: '#00d5a0', pointRadius: 0, borderWidth: 1.2 }, { label: '21D volatility', data: curve.map(x => Number(x.volatility || 0) * 100), borderColor: '#f5c451', pointRadius: 0, borderWidth: 1.2 }, { label: 'Drawdown', data: curve.map(x => Number(x.drawdown || 0) * 100), borderColor: '#ff5a3d', pointRadius: 0, borderWidth: 1.2 }], { scales: { y: { ticks: { callback: value => `${value}%` } } } });
    $('tradeLog').innerHTML = `<table class="trade-table strategy-trade-table"><thead><tr><th>Date</th><th>Action</th><th>Execution Price (₹)</th><th>Portfolio Valuation (₹)</th></tr></thead><tbody>${(data.trades || []).slice(-20).reverse().map(row => { const buy = row.action.startsWith('BUY'); return `<tr class="${buy ? 'buy-row' : 'sell-row'}"><td>${row.date}</td><td><span class="trade-badge ${buy ? 'buy-badge' : 'sell-badge'}"><span class="trade-badge-dot"></span>${row.action}</span></td><td>${Number(row.execution_price).toLocaleString()}</td><td>${Number(row.portfolio_value).toLocaleString()}</td></tr>`; }).join('')}</tbody></table>`;
    if ($('strategyCaption') && typeof renderFigureCaption === 'function') {
        const assetName = $('strategyAsset').selectedOptions[0]?.textContent || assetVal;
        $('strategyCaption').innerHTML = renderFigureCaption('strategy', { strategy: strategyName, asset: assetName, fast: fastVal, slow: slowVal, capital: capitalVal.toLocaleString(), cost: `${(costVal * 100).toFixed(2)}%` });
    }
}

async function loadRegimes() {
    const asset = $('regimeAsset')?.value || $('assetSelect').value;
    const data = await get(`/regimes/${asset}`);
    const rows = data.regimes || [];
    const current = data.current || {};
    $('regimeSource').textContent = data.source || '';
    $('currentRegime').textContent = current.regime || 'Unknown'; $('currentRegimeMeta').textContent = `${current.trend || 'Unknown'} trend · ${current.volatility_state || 'Unknown'} · ${current.date || ''}`;
    $('currentRegimeDot').style.background = current.color || '#93a4bc';
    $('regimeCards').innerHTML = rows.map(x => metric(x.regime, `${x.days} days`, `${pct(x.return)} return | ${pct(x.volatility)} vol`)).join('');
    $('regimeTable').innerHTML = `<table class="trade-table regime-table"><thead><tr><th>Regime</th><th>Days</th><th>Return</th><th>Volatility</th></tr></thead><tbody>${rows.map(x => `<tr><td><span class="regime-swatch" style="background:${x.color}"></span>${x.regime}</td><td>${x.days}</td><td>${pct(x.return)}</td><td>${pct(x.volatility)}</td></tr>`).join('')}</tbody></table>`;
    const timeline = data.timeline || [];
    if (typeof Plotly !== 'undefined') {
        Plotly.newPlot('regimeTimeline', [{
            x: timeline.map(x => x.date), y: timeline.map(x => 1), mode: 'markers', type: 'scatter',
            marker: { size: 10, color: timeline.map(x => x.color), symbol: 'square' },
            customdata: timeline.map(x => [x.regime, x.trend, x.volatility_state]),
            hovertemplate: 'Date: %{x}<br>Regime: %{customdata[0]}<br>Trend: %{customdata[1]}<br>Volatility: %{customdata[2]}<extra></extra>',
            showlegend: false
        }], {
            paper_bgcolor: plotTheme.paper, plot_bgcolor: plotTheme.plot, font: { color: plotTheme.text }, margin: { l: 25, r: 20, t: 20, b: 45 },
            xaxis: { gridcolor: 'rgba(148,163,184,.15)', tickfont: { color: '#a8b0bf' }, nticks: 8 },
            yaxis: { visible: false, fixedrange: true }, hovermode: 'closest'
        }, { responsive: true, displaylogo: false, modeBarButtonsToRemove: ['lasso2d', 'select2d'] });
    }
    destroy('regime');
    charts.regime = new Chart($('regimeChart'), {
        type: 'bar',
        data: { labels: rows.map(x => x.regime), datasets: [{ label: 'Regime return', data: rows.map(x => Number(x.return) * 100), backgroundColor: rows.map(x => x.color), borderRadius: 3 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#29415e' } }, y: { suggestedMin: 0, grid: { color: 'rgba(91,116,145,.14)' }, ticks: { color: '#61748d', callback: v => `${v}%` } } } }
    });
    if ($('regimeTimelineCaption') && typeof renderFigureCaption === 'function') {
        const assetName = $('regimeAsset')?.selectedOptions[0]?.textContent || asset;
        $('regimeTimelineCaption').innerHTML = renderFigureCaption('regimeTimeline', { asset: assetName });
    }
    if ($('regimeChartCaption') && typeof renderFigureCaption === 'function') {
        const assetName = $('regimeAsset')?.selectedOptions[0]?.textContent || asset;
        $('regimeChartCaption').innerHTML = renderFigureCaption('regimeChart', { asset: assetName });
    }
}

async function loadRegimePerformance() {
    const asset = $('regimeAsset').value;
    const regime = $('regimeScenario').value;
    const data = await get(`/regime-performance/${asset}?regime=${regime}`);
    $('regimeStrategyTable').innerHTML = `<div class="panel-heading"><div><span class="eyebrow">Selected macro regime</span><h2>${data.regime_label}</h2></div><span class="status">${data.source}</span></div><table class="trade-table regime-comparison-table"><thead><tr><th>Quantitative Strategy</th><th>Period Return (%)</th><th>Sharpe Ratio</th><th>Max Drawdown (%)</th><th>Trades</th></tr></thead><tbody>${(data.strategies || []).map(row => { const returnUp = Number(row.period_return) >= 0; const sharpeUp = Number(row.sharpe) >= 1; const drawdownRisk = Number(row.max_drawdown) < -0.2; return `<tr class="${returnUp ? 'regime-positive-row' : 'regime-negative-row'}"><td class="regime-strategy-name">${row.strategy}</td><td><span class="regime-value ${returnUp ? 'value-positive' : 'value-negative'}">${pct(row.period_return)}</span></td><td><span class="regime-value ${sharpeUp ? 'value-positive' : 'value-neutral'}">${Number(row.sharpe || 0).toFixed(2)}</span></td><td><span class="regime-value ${drawdownRisk ? 'value-negative' : 'value-neutral'}">${pct(row.max_drawdown)}</span></td><td>${row.trades}</td></tr>`; }).join('')}</tbody></table>`;
}

async function loadStress() {
    const asset = $('stressAsset')?.value || 'bitcoin';
    if ($('stressDetectedScenario')) $('stressDetectedScenario').innerHTML = '<span class="status-analyzing">⚡ Analyzing live market data...</span>';
    if ($('stressRecommendedShock')) $('stressRecommendedShock').textContent = '...';
    try {
        const data = await get(`/stress/automated/${asset}`);
        if ($('stressSource')) $('stressSource').textContent = data.source || '';
        if ($('stressDetectedScenario')) {
            $('stressDetectedScenario').textContent = `⚡ ${data.scenario_label || 'Detected Stress Regime'}`;
        }
        if ($('stressRecommendedShock')) {
            $('stressRecommendedShock').textContent = `${data.recommended_shock_percent}%`;
        }
        if ($('stressFreshnessTag')) {
            $('stressFreshnessTag').textContent = `Analyzed: ${data.data_freshness}`;
        }
        if ($('stressReasoningText')) {
            $('stressReasoningText').textContent = data.classification_reasoning;
        }
        if ($('stressSimulationMeta')) {
            $('stressSimulationMeta').textContent = `Simulated under ${data.scenario_label} (${data.recommended_shock_percent}% shock magnitude)`;
        }

        const mObs = data.metrics_observed || {};
        if ($('stressObservedMetrics')) {
            $('stressObservedMetrics').innerHTML = [
                ['Current Drawdown', pct(mObs.current_drawdown), 'From peak close'],
                ['21D Volatility', pct(mObs.annualized_volatility), `Dispersion (Z=${mObs.volatility_zscore}σ)`],
                ['21D Momentum', pct(mObs.momentum_21d), 'Multi-week velocity'],
                ['99% Tail VaR (1D)', pct(mObs.var_99), 'Extreme historical tail']
            ].map(x => metric(x[0], x[1], x[2])).join('');
        }

        if ($('stressNewsEvidence')) {
            const newsItems = data.news_evidence || [];
            if (newsItems.length > 0) {
                $('stressNewsEvidence').innerHTML = newsItems.map(item => `
                    <a class="stress-news-item" href="${item.url}" target="_blank" rel="noopener noreferrer" title="${item.title}">
                        <div>
                            <h4 class="stress-news-item-title">${item.title}</h4>
                            <div class="stress-news-item-meta">
                                <span>${item.source}</span>
                                <span>&bull;</span>
                                <span>${item.date}</span>
                            </div>
                        </div>
                        <span class="stress-news-item-icon">↗</span>
                    </a>
                `).join('');
            } else {
                $('stressNewsEvidence').innerHTML = '<div class="finding" style="margin:0;padding:6px 0;">No active macro news evidence returned for this asset. Configure SerpApi key in .env for live news feed.</div>';
            }
        }

        const sim = data.simulation || {};
        const m = sim.metrics || {};
        if ($('stressMetrics')) {
            setMetrics('stressMetrics', [
                ['Baseline return', pct(m.baseline_return)],
                ['Stressed return', pct(m.stressed_return)],
                ['Stress loss', pct(m.stress_loss)],
                ['Stressed max drawdown', pct(m.stressed_drawdown)]
            ]);
        }

        lineChart('stress', 'stressChart', (sim.curve || []).map(x => x.date), [
            { label: 'Baseline', data: (sim.curve || []).map(x => x.baseline), borderColor: '#00d5a0', pointRadius: 0, borderWidth: 2, tension: .15 },
            { label: `Stressed Path (${data.recommended_shock_percent}%)`, data: (sim.curve || []).map(x => x.stressed), borderColor: '#ff5a3d', pointRadius: 0, borderWidth: 2, tension: .15 }
        ]);
        if ($('stressChartCaption') && typeof renderFigureCaption === 'function') {
            const assetName = $('stressAsset')?.selectedOptions[0]?.textContent || asset;
            $('stressChartCaption').innerHTML = renderFigureCaption('stress', { asset: assetName, scenario: data.scenario_label || 'Detected Stress Regime', shock: `${data.recommended_shock_percent}%` });
        }
    } catch (err) {
        console.error('[Stress Lab Auto] Error:', err);
        if ($('stressDetectedScenario')) $('stressDetectedScenario').textContent = 'Detection error';
        if ($('stressReasoningText')) $('stressReasoningText').textContent = `Unable to complete automated stress detection: ${err.message}`;
    }
}

async function loadStrategyManualStress() {
    const asset = $('strategyStressAsset')?.value || 'bitcoin';
    const scenario = $('strategyStressScenario')?.value || 'market_crash';
    const shock = Number($('strategyStressShock')?.value || 20) / 100;
    try {
        const data = await get(`/stress/${asset}?scenario=${scenario}&shock=${shock}`);
        const m = data.metrics || {};
        if ($('strategyStressSource')) $('strategyStressSource').textContent = data.source || '';
        if ($('strategyStressMetrics')) {
            setMetrics('strategyStressMetrics', [
                ['Baseline return', pct(m.baseline_return)],
                ['Stressed return', pct(m.stressed_return)],
                ['Stress loss', pct(m.stress_loss)],
                ['Stressed max drawdown', pct(m.stressed_drawdown)]
            ]);
        }
        lineChart('strategyStress', 'strategyStressChart', (data.curve || []).map(x => x.date), [
            { label: 'Baseline', data: (data.curve || []).map(x => x.baseline), borderColor: '#00d5a0', pointRadius: 0, borderWidth: 2, tension: .15 },
            { label: `Stressed (${$('strategyStressShock')?.value || 20}%)`, data: (data.curve || []).map(x => x.stressed), borderColor: '#ff5a3d', pointRadius: 0, borderWidth: 2, tension: .15 }
        ]);
        const descriptions = {
            market_crash: 'Hypothetical sudden downward repricing testing immediate capital drawdown capacity.',
            volatility_spike: 'Daily returns amplified to model turbulent swing expansions under high volatility.',
            liquidity_shock: 'Simulates gap-down execution dislocation and sharp liquidity withdrawal.',
            recovery: 'A sharp shock followed by a measured mean-reverting recovery trajectory.'
        };
        if ($('strategyStressSummary')) {
            $('strategyStressSummary').innerHTML = `
                <div class="finding">${descriptions[scenario] || 'Custom stress simulation.'}</div>
                <div class="finding">The simulated path ends ${pct(Math.abs(m.stress_loss))} below the baseline path for ${asset.toUpperCase()}.</div>
            `;
            if ($('strategyStressCaption') && typeof renderFigureCaption === 'function') {
                const assetName = $('strategyStressAsset')?.selectedOptions[0]?.textContent || asset;
                const scenarioName = $('strategyStressScenario')?.selectedOptions[0]?.textContent || scenario;
                $('strategyStressCaption').innerHTML = renderFigureCaption('strategyStress', { scenario: scenarioName, shock: `${$('strategyStressShock')?.value || 20}%`, asset: assetName });
            }
        }
    } catch (err) {
        console.error('[Strategy Stress Manual] Error:', err);
    }
    }

async function loadStrategyCombined() {
        const runBtn = $('strategyRunCombined');
        if (runBtn) runBtn.textContent = '⚡ Running Combined...';
        try {
            await Promise.all([loadStrategy(), loadStrategyManualStress()]);
        } finally {
            if (runBtn) runBtn.textContent = '⚡ Run Combined Backtest & Stress';
        }
    }

    function setupStrategySubtabs() {
        const subtabs = document.querySelectorAll('.strategy-subtab');
        subtabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.strategyTab;
                subtabs.forEach(t => t.classList.toggle('active', t === tab));
                const backtestPanel = $('strategyBacktestPanel');
                const stressPanel = $('strategyStressPanel');
                if (backtestPanel) backtestPanel.style.display = target === 'backtest' ? 'block' : 'none';
                if (stressPanel) {
                    stressPanel.style.display = target === 'stress' ? 'block' : 'none';
                    if (target === 'stress') {
                        loadStrategyManualStress();
                    }
                }
            });
        });

        if ($('strategyStressRun')) $('strategyStressRun').addEventListener('click', loadStrategyManualStress);
        if ($('strategyRunCombined')) $('strategyRunCombined').addEventListener('click', loadStrategyCombined);
        if ($('strategyStressAsset')) $('strategyStressAsset').addEventListener('change', loadStrategyManualStress);
        if ($('strategyStressScenario')) $('strategyStressScenario').addEventListener('change', loadStrategyManualStress);
        if ($('strategyStressShock')) {
            $('strategyStressShock').addEventListener('input', e => {
                if ($('strategyStressShockOutput')) $('strategyStressShockOutput').value = `${e.target.value}%`;
            });
            $('strategyStressShock').addEventListener('change', loadStrategyManualStress);
        }
    }

    async function loadAdvanced() {
        const asset = $('advancedAsset').value;
        const horizon = Number($('horizonSize').value);
        const paths = Number($('pathsSize').value);
        const data = await get(`/advanced/forecast/${asset}?horizon=${horizon}&paths=${paths}`);
        $('advancedSource').textContent = data.source || ''; $('advancedChartTitle').textContent = `Monte Carlo Forecast for ${data.label} (${data.horizon} Trading Days)`;
        setMetrics('advancedMetrics', [['Current price', money(data.starting_price)], ['Expected final price', money(data.expected_final_price)], ['10th–90th range', `${money(data.lower_final_price)} – ${money(data.upper_final_price)}`]]);
        $('advancedSummary').innerHTML = `<div class="finding">${data.paths} simulated paths using real historical return behavior.</div><div class="finding">Annualized historical volatility: ${(Number(data.annualized_volatility || 0) * 100).toFixed(2)}%.</div>`;
        if (typeof Plotly !== 'undefined') {
            const traces = (data.simulations || []).map(path => ({ x: data.labels, y: path, type: 'scatter', mode: 'lines', line: { color: 'rgba(10,102,194,.24)', width: 1 }, hoverinfo: 'skip', showlegend: false }));
            traces.push({ x: data.labels, y: data.lower_band, type: 'scatter', mode: 'lines', line: { color: 'rgba(35,92,156,0)', width: 0 }, hoverinfo: 'skip', showlegend: false });
            traces.push({ x: data.labels, y: data.upper_band, type: 'scatter', mode: 'lines', fill: 'tonexty', fillcolor: 'rgba(10,102,194,.12)', line: { color: 'rgba(10,102,194,0)', width: 0 }, name: '10–90% range', hovertemplate: 'Day %{x}<br>Range: $%{y:,.0f}<extra></extra>' });
            traces.push({ x: data.labels, y: data.expected_path, type: 'scatter', mode: 'lines', line: { color: '#ffad16', width: 3 }, name: 'Expected Path (Mean)', hovertemplate: 'Day %{x}<br>Expected: ₹%{y:,.0f}<extra></extra>' });
            Plotly.newPlot('advancedChart', traces, { paper_bgcolor: '#edf4fa', plot_bgcolor: '#edf4fa', font: { color: '#29415e' }, margin: { l: 70, r: 20, t: 10, b: 55 }, xaxis: { title: 'Future Trading Days', gridcolor: 'rgba(91,116,145,.18)', zeroline: false }, yaxis: { title: 'Simulated Price', gridcolor: 'rgba(91,116,145,.18)', tickformat: ',.0f' }, hovermode: 'x unified', legend: { orientation: 'h', x: .72, y: 1.08, font: { size: 11, color: '#29415e' } } }, { responsive: true, displaylogo: false, modeBarButtonsToRemove: ['lasso2d', 'select2d'] });
        }
        if ($('advancedChartCaption') && typeof renderFigureCaption === 'function') {
            $('advancedChartCaption').innerHTML = renderFigureCaption('advanced', { asset: data.label, horizon, paths });
        }
    }

    async function loadOptimizer() {
        const rfVal = Number($('riskFreeSize').value);
        const iterVal = Number($('optimizerIterations').value);
        const data = await get(`/advanced/optimizer?risk_free_rate=${rfVal / 100}&iterations=${iterVal}`);
        $('advancedSource').textContent = data.source || ''; $('optimizerTable').innerHTML = `<table class="trade-table optimizer-table"><thead><tr><th>Asset</th><th>Optimal Weight (%)</th></tr></thead><tbody>${data.assets.map((asset, i) => `<tr><td>${asset}</td><td>${Number(data.weights[i]).toFixed(2)}%</td></tr>`).join('')}</tbody></table>`;
        if (typeof Plotly !== 'undefined') {
            Plotly.newPlot('optimizerChart', [{ labels: data.assets, values: data.weights, type: 'pie', textinfo: 'label+percent', marker: { colors: ['#4969b2', '#e06b4f', '#168b8a'] }, hole: .02, hovertemplate: '%{label}: %{value:.2f}%<extra></extra>' }], { paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: { color: '#29415e' }, margin: { l: 20, r: 20, t: 20, b: 20 }, showlegend: true, legend: { font: { color: '#29415e' } } }, { responsive: true, displaylogo: false });
        }
        if ($('optimizerChartCaption') && typeof renderFigureCaption === 'function') {
            $('optimizerChartCaption').innerHTML = renderFigureCaption('optimizer', { riskFree: `${rfVal.toFixed(2)}%`, iterations: iterVal });
        }
    }

    async function loadRisk() {
        const data = await get(`/advanced/risk?confidence=0.95&days=1`);
        $('riskSource').textContent = data.source || ''; $('riskMetrics').innerHTML = [['1-Day VaR (95% Confidence)', pct(data.var_95)], ['1-Day VaR (99% Confidence)', pct(data.var_99)], ['Expected Shortfall / CVaR (95%)', pct(data.cvar)]].map(x => metric(x[0], x[1])).join('');
        if (typeof Plotly !== 'undefined') {
            Plotly.newPlot('riskChart', [{ x: data.distribution, type: 'histogram', nbinsx: 45, marker: { color: '#4969b2' }, name: 'Daily returns', hovertemplate: 'Return: %{x:.2%}<br>Count: %{y}<extra></extra>' }, { x: [data.var_95, data.var_95], y: [0, 1], type: 'scatter', mode: 'lines', line: { color: '#d68b2a', dash: 'dash', width: 2 }, name: '95% VaR Cutoff' }, { x: [data.var_99, data.var_99], y: [0, 1], type: 'scatter', mode: 'lines', line: { color: '#d34d55', dash: 'dash', width: 2 }, name: '99% VaR Cutoff' }], { paper_bgcolor: plotTheme.paper, plot_bgcolor: plotTheme.plot, font: { color: plotTheme.text }, margin: { l: 55, r: 20, t: 20, b: 50 }, bargap: .02, xaxis: { title: 'Daily return', tickformat: '.0%', gridcolor: plotTheme.grid }, yaxis: { title: 'Count', gridcolor: plotTheme.grid }, legend: { orientation: 'h', x: .6, y: 1.1 } }, { responsive: true, displaylogo: false });
        }
        if ($('riskChartCaption') && typeof renderFigureCaption === 'function') {
            $('riskChartCaption').innerHTML = renderFigureCaption('risk');
        }
    }

    async function loadMLRegimes() {
        const assetVal = $('mlRegimeAsset').value;
        const data = await get(`/advanced/ml-regimes?asset=${assetVal}`);
        $('mlRegimeSource').textContent = data.source || ''; $('mlRegimeModel').textContent = data.model || '';
        const current = data.current || {};
        setMetrics('mlRegimeMetrics', [['Current state', current.regime || 'Unknown', `${data.label} · ${current.date || ''}`], ['5-day return', pct(current.return), 'Rolling feature average'], ['Annualized volatility', pct(current.volatility), '21-day feature average']]);
        $('mlRegimeTable').innerHTML = `<table class="trade-table"><thead><tr><th>State</th><th>Days</th><th>Return</th><th>Volatility</th><th>Momentum</th></tr></thead><tbody>${(data.profiles || []).map(row => `<tr><td>${row.regime}</td><td>${row.days}</td><td>${pct(row.return)}</td><td>${pct(row.volatility)}</td><td>${pct(row.momentum)}</td></tr>`).join('')}</tbody></table>`;
        if (typeof Plotly !== 'undefined') {
            const colors = { Defensive: '#7a8da6', Balanced: '#f5c451', 'Risk-on': '#42d392' };
            Plotly.newPlot('mlRegimeChart', [{ x: (data.timeline || []).map(row => row.date), y: (data.timeline || []).map(row => row.regime), mode: 'markers', type: 'scatter', marker: { size: 8, color: (data.timeline || []).map(row => colors[row.regime] || '#93a4bc') }, text: (data.timeline || []).map(row => row.regime), hovertemplate: 'Date: %{x}<br>State: %{text}<extra></extra>', showlegend: false }], { paper_bgcolor: plotTheme.paper, plot_bgcolor: plotTheme.plot, font: { color: plotTheme.text }, margin: { l: 90, r: 20, t: 20, b: 45 }, xaxis: { gridcolor: plotTheme.grid, nticks: 8 }, yaxis: { gridcolor: plotTheme.grid }, hovermode: 'closest' }, { responsive: true, displaylogo: false });
        }
        if ($('mlRegimeChartCaption') && typeof renderFigureCaption === 'function') {
            $('mlRegimeChartCaption').innerHTML = renderFigureCaption('mlRegimes', { asset: data.label });
        }
    }

    async function loadPaperPortfolio() {
        const data = await get('/advanced/paper');
        $('paperSource').textContent = data.source || '';
        setMetrics('paperMetrics', [['Account equity', money(data.equity)], ['Available cash', money(data.cash)], ['Total return', pct(data.return)]]);
        $('paperPositions').innerHTML = `<table class="trade-table"><thead><tr><th>Asset</th><th>Quantity</th><th>Last price</th><th>Value</th><th>Daily</th></tr></thead><tbody>${(data.positions || []).map(row => `<tr><td>${row.label}</td><td>${Number(row.quantity).toFixed(4)}</td><td>${money(row.price)}</td><td>${money(row.value)}</td><td>${pct(row.change)}</td></tr>`).join('')}</tbody></table>`;
        $('paperTrades').innerHTML = `<table class="trade-table"><thead><tr><th>Time</th><th>Asset</th><th>Side</th><th>Quantity</th><th>Price</th></tr></thead><tbody>${(data.trades || []).slice().reverse().map(row => `<tr><td>${row.time}</td><td>${row.asset}</td><td>${row.side.toUpperCase()}</td><td>${Number(row.quantity).toFixed(4)}</td><td>${money(row.price)}</td></tr>`).join('')}</tbody></table>`;
    }

    async function placePaperOrder() {
        const asset = $('paperAsset').value;
        const side = $('paperSide').value;
        const quantity = Number($('paperQuantity').value);
        const portfolio = await get('/advanced/paper');
        const position = (portfolio.positions || []).find(row => row.asset === asset);
        const price = Number(position?.price || 0);
        const held = Number(position?.quantity || 0);
        if (!Number.isFinite(quantity) || quantity <= 0) { $('paperMessage').innerHTML = '<div class="finding">Enter a quantity greater than zero.</div>'; return; }
        if (side === 'buy' && quantity * price > Number(portfolio.cash || 0)) { $('paperMessage').innerHTML = `<div class="finding">Insufficient cash. Maximum buy quantity for ${position?.label || asset}: ${(Number(portfolio.cash || 0) / price).toFixed(6)}.</div>`; return; }
        if (side === 'sell' && quantity > held) { $('paperMessage').innerHTML = `<div class="finding">Insufficient ${position?.label || asset} position. Available quantity: ${held.toFixed(6)}.</div>`; return; }
        const response = await fetch(`${API}/advanced/paper/order?asset=${asset}&side=${side}&quantity=${quantity}`, { method: 'POST' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Order rejected');
        $('paperMessage').innerHTML = `<div class="finding">Executed ${side} ${quantity} ${data.executed.asset} at ${money(data.executed.price)}.</div>`;
        await loadPaperPortfolio();
    }

    function loadStatic() {
        setMetrics('adaptiveCards', [['Adaptive score', '81.4', 'Risk-adjusted allocation score'], ['Suggested allocation', '42 / 33 / 25', 'BTC / Gold / NVIDIA'], ['Regime adjustment', 'Bullish tilt', 'Trend exposure maintained']]);
        destroy('adaptive');
        charts.adaptive = new Chart($('adaptiveChart'), { type: 'bar', data: { labels: ['Gold', 'Bitcoin', 'NVIDIA'], datasets: [{ label: 'Suggested weight', data: [33, 42, 25], backgroundColor: ['#f5c451', '#ef4444', '#10b981'] }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#29415e' } }, y: { grid: { color: 'rgba(91,116,145,.14)' }, ticks: { color: '#61748d' } } } } });
        if ($('adaptiveChartCaption') && typeof renderFigureCaption === 'function') {
            $('adaptiveChartCaption').innerHTML = renderFigureCaption('adaptive');
        }
        $('findings').innerHTML = ['Gold remains a defensive anchor while Bitcoin captures the strongest upside participation.', 'NVIDIA offers growth exposure with materially higher volatility.', 'Return correlations remain moderate, supporting diversification.', 'The trend strategy is strongest when directional persistence is high.'].map(x => `<div class="finding">${x}</div>`).join('');
        $('riskView').innerHTML = [['Risk budget', 'Moderate risk / high conviction'], ['Macro regime', 'Bullish risk-on with controlled volatility'], ['Action', 'Maintain trend exposure and rebalance on volatility expansion']].map(x => `<div class="risk-item"><strong>${x[0]}</strong>${x[1]}</div>`).join('');
    }

    async function downloadResearchReport() {
        const btn = $('downloadReportBtn');
        const btnText = $('downloadReportText');
        const errBanner = $('reportErrorBanner');
        if (!btn || btn.disabled) return;

        if (errBanner) {
            errBanner.style.display = 'none';
            errBanner.textContent = '';
        }

        const originalText = btnText ? btnText.textContent : 'Download Report';
        btn.disabled = true;
        if (btnText) btnText.textContent = 'Generating 2-Page PDF...';

        try {
            const response = await fetch(`${API}/reports/research-summary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    preferred_asset: 'bitcoin',
                    preferred_strategy: 'ema',
                    lookback_period: '2y'
                })
            });

            if (!response.ok) {
                let errorMsg = `Server error (${response.status})`;
                try {
                    const errData = await response.json();
                    if (errData && errData.detail) errorMsg = errData.detail;
                } catch (_) { }
                throw new Error(errorMsg);
            }

            const blob = await response.blob();
            if (blob.size === 0) {
                throw new Error('Server returned empty PDF document');
            }

            let filename = `QuantX_Research_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
            const disp = response.headers.get('Content-Disposition');
            if (disp && disp.includes('filename=')) {
                const match = disp.match(/filename=["']?([^"';]+)["']?/);
                if (match && match[1]) filename = match[1];
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 200);

            if (btnText) btnText.textContent = '✓ Downloaded!';
            setTimeout(() => {
                if (btnText) btnText.textContent = originalText;
                btn.disabled = false;
            }, 1800);
        } catch (err) {
            console.error('[QuantX Research Report] Download failed:', err);
            if (errBanner) {
                errBanner.textContent = `Report generation failed: ${err.message}. Please try again.`;
                errBanner.style.display = 'block';
            }
            if (btnText) btnText.textContent = '⚠️ Generation Failed';
            setTimeout(() => {
                if (btnText) btnText.textContent = originalText;
                btn.disabled = false;
            }, 2500);
        }
    }

    // --- Stage 3: Controlled Sequential Background Preloading Engine ---
    const _preloadQueue = [
        { name: 'explorer', label: 'Asset Explorer', task: () => loadExplorer() },
        { name: 'correlation', label: 'Correlation Lab', task: () => loadCorrelation() },
        { name: 'strategy', label: 'Strategy Lab', task: async () => { await loadStrategy(); loadStrategyManualStress(); } },
        { name: 'regimes', label: 'Market Regimes', task: async () => { await loadRegimes(); await loadRegimePerformance(); } },
        { name: 'stress', label: 'Stress Lab', task: () => loadStress() },
        { name: 'advanced', label: 'Advanced Analytics', task: () => loadAdvanced() },
        { name: 'summary', label: 'Research Summary', task: () => loadStatic() }
    ];

    let _isPreloading = false;
    let _currentPreloadIndex = 0;

    function updatePreloadBadge(text, isDone = false) {
        const badge = $('preloadStatusBadge');
        if (badge) badge.style.display = 'none'; // Silenced: keep background preloader running silently without visible text
        if (text) console.log(`[QuantX Background Analytics] ${text}`);
    }

    async function runBackgroundPreloading() {
        if (_isPreloading) return;
        _isPreloading = true;

        try {
            while (_currentPreloadIndex < _preloadQueue.length) {
                const item = _preloadQueue[_currentPreloadIndex];
                _currentPreloadIndex++;

                if (!_preparedScreens.has(item.name)) {
                    updatePreloadBadge(`Preloading ${item.label}...`);
                    try {
                        await item.task();
                        _preparedScreens.add(item.name);
                    } catch (taskErr) {
                        console.warn(`[QuantX Preloader] Note: ${item.label} deferring:`, taskErr.message);
                    }
                    // Yield to main UI thread so user interactions are silky smooth
                    await new Promise(resolve => setTimeout(resolve, 80));
                }
            }
        } finally {
            _isPreloading = false;
            updatePreloadBadge('', true);
            console.log('[QuantX Preloader] All background analytics prepared.');
        }
    }

    async function prioritizeScreen(name) {
        const item = _preloadQueue.find(q => q.name === name);
        if (!item || _preparedScreens.has(name)) return;

        updatePreloadBadge(`Loading ${item.label}...`);
        try {
            await item.task();
            _preparedScreens.add(name);
        } catch (err) {
            console.warn(`[QuantX Priority Load] Failed to prepare ${name}:`, err.message);
        } finally {
            if (_currentPreloadIndex >= _preloadQueue.length) {
                updatePreloadBadge('', true);
            }
        }
    }

    function updateSplashText(msg) {
        const el = $('splashStatusText');
        if (el) el.textContent = msg;
    }

    function dismissSplashScreen() {
        const splash = $('quantxSplashScreen');
        if (splash && !splash.classList.contains('fade-out')) {
            splash.classList.add('fade-out');
            setTimeout(() => splash.remove(), 500);
        }
    }

    async function init() {
        const startupStart = performance.now();
        document.body.classList.add('research-light-theme');
        setupAssistant();
        setupNewsSidebar();
        nav();
        showView('overview');
        if ($('downloadReportBtn')) {
            $('downloadReportBtn').addEventListener('click', downloadResearchReport);
        }
        document.querySelectorAll('[data-advanced-view]').forEach(button => button.addEventListener('click', () => {
            document.querySelectorAll('[data-advanced-view]').forEach(item => item.classList.toggle('active', item === button));
            document.querySelectorAll('[data-advanced-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.advancedPanel === button.dataset.advancedView));
            if (button.dataset.advancedView === 'optimizer') loadOptimizer();
            if (button.dataset.advancedView === 'risk') loadRisk();
        }));
        $('overviewPeriod').addEventListener('change', loadOverview);
        $('assetSelect').addEventListener('change', () => { loadExplorer(); });
        $('assetPeriod').addEventListener('change', loadExplorer);
        $('regimeAsset').addEventListener('change', () => { loadRegimes(); loadRegimePerformance(); });
        $('regimeScenario').addEventListener('change', loadRegimePerformance);
        $('strategyRun').addEventListener('click', loadStrategy);
        if ($('stressAutoRefresh')) $('stressAutoRefresh').addEventListener('click', loadStress);
        if ($('stressAsset')) $('stressAsset').addEventListener('change', loadStress);
        setupStrategySubtabs();
        $('advancedRun').addEventListener('click', loadAdvanced);
        $('advancedAsset').addEventListener('change', loadAdvanced);
        $('optimizerRun').addEventListener('click', loadOptimizer);
        $('riskFreeSize').addEventListener('input', event => $('riskFreeOutput').value = `${Number(event.target.value).toFixed(2)}%`);
        $('riskFreeSize').addEventListener('change', loadOptimizer);
        $('optimizerIterations').addEventListener('change', loadOptimizer);
        $('fastWindow').addEventListener('input', event => $('fastOutput').value = event.target.value);
        $('slowWindow').addEventListener('input', event => $('slowOutput').value = event.target.value);
        prepareStrategyUI();
        $('position').addEventListener('input', event => $('positionOutput').value = `${event.target.value}%`);
        $('strategyPeriod').addEventListener('change', loadStrategy);
        $('cost').addEventListener('input', event => $('costOutput').value = `${Number(event.target.value).toFixed(2)}%`);
        $('horizonSize').addEventListener('input', event => $('horizonOutput').value = `${event.target.value} trading days`);
        $('pathsSize').addEventListener('input', event => $('pathsOutput').value = `${event.target.value} paths`);

        // Update splash text as data loading begins
        if ($('splashStatusText')) $('splashStatusText').textContent = 'Connecting to live market feeds...';

        // Timer to cycle status message smoothly during background fetch
        const splashStatusTimer = setTimeout(() => {
            if ($('splashStatusText')) $('splashStatusText').textContent = 'Synchronizing real-time asset prices...';
        }, 750);

        // Minimum 1.5s branded splash display so logo is appreciated smoothly without flashing
        const minSplashPromise = new Promise(resolve => setTimeout(resolve, 1500));

        // Load overview data (fetches live market prices and renders overviewCards & chart)
        const overviewPromise = loadOverview().catch(overviewErr => {
            console.warn('[Fin4X Startup] Overview load error:', overviewErr.message);
        });

        // 3.5s maximum safety timeout so splash never hangs indefinitely even on slow/offline networks
        const safetyTimeoutPromise = new Promise(resolve => setTimeout(resolve, 3500));

        // Wait for both live Overview data AND minimum 1.5s splash display (or max 3.5s safety timeout)
        await Promise.race([
            Promise.all([overviewPromise, minSplashPromise]),
            safetyTimeoutPromise
        ]);

        clearTimeout(splashStatusTimer);
        if ($('splashStatusText')) $('splashStatusText').textContent = 'Market data ready';

        // Smoothly dismiss splash screen now that Overview cards and charts are 100% ready
        dismissSplashScreen();

        const startupDuration = (performance.now() - startupStart).toFixed(0);
        console.log(`[Fin4X Startup] Essential dashboard loaded with live data in ${startupDuration}ms`);

        // Kick off background preloading sequentially for the remaining views
        runBackgroundPreloading();
    }

    function start() {
        init().catch(error => {
            dismissSplashScreen();
            $('sourceStatus').textContent = 'Connection error';
            $('lastUpdated').textContent = `Error: ${error.message}`;
            console.error(error);
        });
    }

    if (typeof Chart === 'undefined') {
        const chartScript = document.createElement('script');
        chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        chartScript.onload = start;
        chartScript.onerror = () => {
            dismissSplashScreen();
            $('lastUpdated').textContent = 'Chart library unavailable';
        };
        document.head.appendChild(chartScript);
    } else {
        start();
    }

    // ==============================================================
    // QuantX Knowledge Self-Assessment UI & Session Controller
    // ==============================================================
    let _activeAssessment = null;

    function startAssessment(pathKey) {
        if (typeof AdaptiveAssessmentSession === 'undefined' || typeof ASSESSMENT_QUESTIONS === 'undefined') {
            console.error('[QuantX Assessment] Engine or Questions not loaded');
            return;
        }

        _activeAssessment = new AdaptiveAssessmentSession(pathKey, ASSESSMENT_QUESTIONS, ASSESSMENT_RESOURCES);

        $('assessmentIntroState').style.display = 'none';
        $('assessmentResultState').style.display = 'none';
        $('assessmentActiveState').style.display = 'block';

        const badges = $('assessmentHeaderBadges');
        if (badges) {
            badges.style.display = 'inline-flex';
            $('assessmentPathBadge').textContent = _activeAssessment.config.name;
        }

        renderCurrentQuestion();
    }

    function renderCurrentQuestion() {
        if (!_activeAssessment || !_activeAssessment.currentQuestion) return;

        const q = _activeAssessment.currentQuestion;
        const totalAnswered = _activeAssessment.answeredQuestions.length;
        const targetMax = _activeAssessment.config.maxQuestions;

        // Progress bar
        const progressPct = Math.min(100, Math.round(((totalAnswered + 1) / targetMax) * 100));
        $('assessmentProgressFill').style.width = `${progressPct}%`;

        // Metadata
        $('questionTopicTag').textContent = q.topic;
        $('questionCounter').textContent = `Question ${totalAnswered + 1} of ~${_activeAssessment.config.minQuestions}–${targetMax}`;
        if ($('assessmentDifficultyBadge')) {
            $('assessmentDifficultyBadge').textContent = q.difficulty.toUpperCase();
            $('assessmentDifficultyBadge').className = `assessment-badge-diff diff-${q.difficulty}`;
        }

        // Question Text
        $('questionText').textContent = q.text;

        // Options List
        const form = $('assessmentOptionsForm');
        form.innerHTML = q.options.map((optText, idx) => `
        <label class="assessment-option-label" data-idx="${idx}">
            <input type="radio" name="assessmentOpt" value="${idx}" onchange="onAssessmentOptionSelected(${idx})" />
            <span class="assessment-option-text">${optText}</span>
        </label>
    `).join('');

        const submitBtn = $('assessmentSubmitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = (totalAnswered + 1 >= _activeAssessment.config.minQuestions) ? 'Submit Answer & Check Progress ↗' : 'Next Question ↗';
    }

    function onAssessmentOptionSelected(idx) {
        document.querySelectorAll('.assessment-option-label').forEach(label => {
            const isSelected = label.dataset.idx === String(idx);
            label.classList.toggle('selected', isSelected);
        });
        $('assessmentSubmitBtn').disabled = false;
    }

    function submitCurrentAnswer() {
        if (!_activeAssessment) return;

        const checked = document.querySelector('input[name="assessmentOpt"]:checked');
        if (!checked) return;

        const chosenIndex = parseInt(checked.value, 10);
        const result = _activeAssessment.recordAnswer(chosenIndex);

        if (result.isCompleted) {
            displayAssessmentResults();
        } else {
            renderCurrentQuestion();
        }
    }

    function displayAssessmentResults() {
        if (!_activeAssessment) return;

        const profile = _activeAssessment.calculateProfile();
        if (!profile) return;

        $('assessmentActiveState').style.display = 'none';
        $('assessmentResultState').style.display = 'block';

        // Hero stats
        $('resultPathName').textContent = `${profile.pathName} Diagnostic`;
        $('resultOverallTitle').textContent = `Overall Assessment Score: ${profile.overallPercentage}%`;
        $('resultOverallPercentage').textContent = `${profile.overallPercentage}%`;
        $('resultScoreSub').textContent = `${profile.totalCorrect} / ${profile.totalAnswered} Correct`;

        // Educational interpretation
        let interp = `Your score reflects performance across ${profile.totalAnswered} dynamically selected conceptual and analytical questions in ${profile.pathName}. `;
        if (profile.overallPercentage >= 80) {
            interp += 'You demonstrated strong conceptual command across the evaluated topic areas.';
        } else if (profile.overallPercentage >= 60) {
            interp += 'You possess competent familiarity with core market mechanics, with specific areas available for deeper study.';
        } else if (profile.overallPercentage >= 40) {
            interp += 'You have a developing baseline of market concepts. Reviewing the targeted resources below will help reinforce foundational risk and analytical principles.';
        } else {
            interp += 'Your results highlight foundational concepts that would benefit from focused study prior to exploring advanced strategies.';
        }
        interp += ' Note: This diagnostic is an educational guide and does not evaluate live trading readiness.';
        $('resultInterpretationText').textContent = interp;

        // Strengths
        const strengthsEl = $('resultStrengthsList');
        if (profile.strengths.length > 0) {
            strengthsEl.innerHTML = profile.strengths.map(s => `
            <div class="result-diagnostic-item strength">
                <span>✓ ${s.topic}</span>
                <span class="result-diagnostic-score">${s.score}%</span>
            </div>
        `).join('');
        } else {
            strengthsEl.innerHTML = '<div class="finding">No topics reached the 80%+ strong threshold on this assessment.</div>';
        }

        // Knowledge Gaps
        const gapsEl = $('resultGapsList');
        if (profile.gaps.length > 0) {
            gapsEl.innerHTML = profile.gaps.map(g => `
            <div class="result-diagnostic-item gap">
                <span>⚠ ${g.topic}</span>
                <span class="result-diagnostic-score">${g.score}%</span>
            </div>
        `).join('');
        } else {
            gapsEl.innerHTML = '<div class="finding" style="color:#16734d;">No significant knowledge gaps identified on the assessed topics!</div>';
        }

        // Topic Bars
        $('resultTopicBars').innerHTML = profile.topicResults.map(tr => `
        <div class="topic-bar-row">
            <div class="topic-bar-header">
                <span class="topic-bar-name">${tr.topic}</span>
                <span class="topic-bar-band ${tr.bandClass}">${tr.percentage !== null ? `${tr.percentage}% · ` : ''}${tr.band}</span>
            </div>
            <div class="topic-track">
                <div class="topic-fill ${tr.bandClass}" style="width: ${tr.percentage !== null ? tr.percentage : 0}%;"></div>
            </div>
        </div>
    `).join('');

        // Verified External Resources
        $('resultRecommendationsList').innerHTML = profile.recommendations.map(r => `
        <a class="resource-card" href="${r.url}" target="_blank" rel="noopener noreferrer">
            <span class="resource-org">${r.organization} &bull; ${r.type}</span>
            <h4 class="resource-title">${r.title}</h4>
            <p class="resource-desc">${r.description}</p>
            <div class="resource-reason">${r.reason}</div>
            <div class="resource-footer-row">
                <span>Level: ${r.level}</span>
                <span>Open Verified Guide ↗</span>
            </div>
        </a>
    `).join('');

        // Detailed Question Review
        $('resultAnswerReviewList').innerHTML = profile.review.map(item => `
        <div class="review-item ${item.isCorrect ? 'correct' : 'incorrect'}">
            <div class="review-meta-row">
                <span><strong>#${item.index}</strong> &bull; ${item.topic} (${item.difficulty})</span>
                <span style="font-weight:700;color:${item.isCorrect ? '#16734d' : '#b44837'};">
                    ${item.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </span>
            </div>
            <div class="review-question-text">${item.text}</div>
            <div class="review-answers-box">
                <div class="review-ans-user"><strong>Your Answer:</strong> ${item.options[item.selectedOption] || 'None'}</div>
                ${!item.isCorrect ? `<div class="review-ans-correct"><strong>Correct Answer:</strong> ${item.options[item.correctAnswer]}</div>` : ''}
            </div>
            <p class="review-explanation"><strong>Explanation:</strong> ${item.explanation}</p>
        </div>
    `).join('');
    }

    function resetAssessment() {
        _activeAssessment = null;
        $('assessmentResultState').style.display = 'none';
        $('assessmentActiveState').style.display = 'none';
        $('assessmentIntroState').style.display = 'block';
        if ($('assessmentHeaderBadges')) $('assessmentHeaderBadges').style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }


