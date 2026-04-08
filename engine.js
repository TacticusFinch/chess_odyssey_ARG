const TYPE_SPEED = 40;
const DELAY_BETWEEN_LINES = 800;

// ═══════════════════════════════════════════
//  ШАХМАТНАЯ ДИАГРАММА
// ═══════════════════════════════════════════

const CHESS_PIECES = {
    K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
    k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟'
};

function createSquare(piece, row, col) {
    const sq = document.createElement('div');
    const isLight = (row + col) % 2 === 0;
    sq.className = `chess-square ${isLight ? 'square-light' : 'square-dark'}`;
    sq.textContent = piece;
    return sq;
}

function buildBoardElement(fen) {
    const wrapper = document.createElement('div');
    wrapper.className = 'chess-board-wrapper';

    const board = document.createElement('div');
    board.className = 'chess-board';

    fen.split(' ')[0].split('/').forEach((rank, row) => {
        let col = 0;
        for (const ch of rank) {
            if (ch >= '1' && ch <= '8') {
                for (let i = 0; i < +ch; i++) board.appendChild(createSquare('', row, col++));
            } else {
                board.appendChild(createSquare(CHESS_PIECES[ch] || '?', row, col++));
            }
        }
    });

    wrapper.appendChild(board);
    return wrapper;
}

// ═══════════════════════════════════════════
//  ИЗОБРАЖЕНИЕ
// ═══════════════════════════════════════════

function buildImageElement(src) {
    const wrapper = document.createElement('div');
    wrapper.className = 'terminal-image-wrapper';

    const img = document.createElement('img');
    img.src = src;
    img.className = 'terminal-image';
    img.alt = '';

    wrapper.appendChild(img);
    return wrapper;
}

// ═══════════════════════════════════════════
//  ТЕРМИНАЛ С ПОДДЕРЖКОЙ FEN И IMG
// ═══════════════════════════════════════════

function initTerminal(elementId, lines, callback) {
    const container = document.getElementById(elementId);
    container.innerHTML = '';

    let lineIdx = 0;
    let charIdx = 0;
    let timer = null;
    let skipped = false;
    let currentDiv = null;

    // ── Рендер всего массива мгновенно ──
    function renderAll() {
        container.innerHTML = '';
        lines.forEach(line => {
            if (line.startsWith('FEN:')) {
                container.appendChild(buildBoardElement(line.slice(4).trim()));
            } else if (line.startsWith('IMG:')) {
                container.appendChild(buildImageElement(line.slice(4).trim()));} else {
                const div = document.createElement('div');
                div.innerHTML = line;
                container.appendChild(div);
            }
        });
    }

    // ── Пропуск по клику ──
    function skip(e) {
        if (e?.target?.tagName === 'BUTTON' || skipped) return;
        skipped = true;
        clearTimeout(timer);
        renderAll();
        cleanup();
        if (callback) callback();
    }

    function cleanup() {
        document.removeEventListener('click', skip);
        document.removeEventListener('touchstart', skip);
    }

    document.addEventListener('click', skip);
    document.addEventListener('touchstart', skip);

    // ── Посимвольная печать ──
    function nextLine() {
        if (skipped || lineIdx >= lines.length) return;
        typeChar();
    }

    function advance() {
        lineIdx++;
        charIdx = 0;
        currentDiv = null;

        if (lineIdx < lines.length) {
            timer = setTimeout(nextLine, DELAY_BETWEEN_LINES);
        } else {
            cleanup();
            if (callback) callback();
        }
    }

    function typeChar() {
        if (skipped) return;

        const line = lines[lineIdx];

        // ── FEN-строка → рисуем доску целиком ──
        if (line.startsWith('FEN:')) {
            const board = buildBoardElement(line.slice(4).trim());
            board.style.opacity = '0';
            board.style.transition = 'opacity 0.6s ease-in';
            container.appendChild(board);
            requestAnimationFrame(() => { board.style.opacity = '1'; });
            advance();
            return;
        }

        // ── IMG-строка → вставляем картинку ──
        if (line.startsWith('IMG:')) {
            const imgEl = buildImageElement(line.slice(4).trim());
            imgEl.style.opacity = '0';
            imgEl.style.transition = 'opacity 0.6s ease-in';
            container.appendChild(imgEl);
            requestAnimationFrame(() => { imgEl.style.opacity = '1'; });
            advance();
            return;
        }

        // ── Обычная строка ──
        if (charIdx === 0) {
            currentDiv = document.createElement('div');
            container.appendChild(currentDiv);
        }

        if (charIdx >= line.length) {
            advance();
            return;
        }

        // Перескакиваем HTML-тег целиком
        if (line[charIdx] === '<') {
            const tagEnd = line.indexOf('>', charIdx);
            if (tagEnd !== -1) {
                currentDiv.innerHTML += line.slice(charIdx, tagEnd + 1);
                charIdx = tagEnd + 1;
            }
        } else {
            currentDiv.innerHTML += line[charIdx];
            charIdx++;
        }

        timer = setTimeout(typeChar, TYPE_SPEED);
    }

    nextLine();
}