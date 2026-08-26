let rawSetlists = [];
let aggregatedSongList = [];
let currentSortMode = 'count';

// 문자열 정규화 (비교용)
function normalizeTitle(title) {
  return title
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/[\->\_]/g, '')
    .replace(/[a-ga-g#b]/gi, '')
    .replace(/\s+/g, '')
    .toLowerCase()
    .trim();
}

// 편집 거리 알고리즘 (오타 감지)
function getEditDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

async function loadData() {
  try {
    const response = await fetch('/api/setlists');
    
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `서버 응답 에러 (${response.status})`);
    }

    rawSetlists = await response.json();

    if (!Array.isArray(rawSetlists) || rawSetlists.length === 0) {
      console.warn('불러온 노션 데이터가 비어있습니다.');
    }

    const songMap = new Map();

    rawSetlists.forEach(item => {
      if (!item.songs) return;
      item.songs.forEach(songName => {
        const trimmedSong = songName.trim();
        if (!trimmedSong) return;

        if (!songMap.has(trimmedSong)) {
          songMap.set(trimmedSong, {
            song: trimmedSong,
            latestDate: item.date,
            count: 1
          });
        } else {
          const existing = songMap.get(trimmedSong);
          existing.count += 1;
          if (item.date > existing.latestDate) {
            existing.latestDate = item.date;
          }
        }
      });
    });

    aggregatedSongList = Array.from(songMap.values());

    applySortAndRender();
    detectDuplicatesAndTypos(aggregatedSongList);

  } catch (error) {
    console.error('데이터 로딩 오류:', error);
    const tbody = document.getElementById('aggregated-list');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red;">데이터 로딩 실패: ${error.message}</td></tr>`;
    }
  }
}

function setSortMode(mode) {
  currentSortMode = mode;
  
  document.getElementById('btn-sort-count').classList.toggle('active', mode === 'count');
  document.getElementById('btn-sort-date').classList.toggle('active', mode === 'date');

  applySortAndRender();
}

function applySortAndRender() {
  if (currentSortMode === 'count') {
    aggregatedSongList.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.latestDate.localeCompare(b.latestDate);
    });
  } else {
    aggregatedSongList.sort((a, b) => {
      if (a.latestDate !== b.latestDate) return a.latestDate.localeCompare(b.latestDate);
      return b.count - a.count;
    });
  }

  renderMainList(aggregatedSongList);
}

function detectDuplicatesAndTypos(list) {
  const normalizedGroup = new Map();

  list.forEach(item => {
    const normKey = normalizeTitle(item.song);
    if (!normKey) return;

    if (!normalizedGroup.has(normKey)) {
      normalizedGroup.set(normKey, []);
    }
    normalizedGroup.get(normKey).push(item);
  });

  const suspiciousGroups = [];

  normalizedGroup.forEach((items, normKey) => {
    if (items.length > 1) {
      suspiciousGroups.push({
        type: '중복',
        label: normKey,
        variants: items.map(i => `${i.song} (${i.count}회)`),
        totalCount: items.reduce((sum, i) => sum + i.count, 0)
      });
    }
  });

  const uniqueNormKeys = Array.from(normalizedGroup.keys());
  for (let i = 0; i < uniqueNormKeys.length; i++) {
    for (let j = i + 1; j < uniqueNormKeys.length; j++) {
      const keyA = uniqueNormKeys[i];
      const keyB = uniqueNormKeys[j];

      if (keyA === keyB) continue;

      const dist = getEditDistance(keyA, keyB);
      const maxLen = Math.max(keyA.length, keyB.length);

      if ((dist <= 2 && maxLen >= 3) || (dist / maxLen <= 0.25)) {
        const itemsA = normalizedGroup.get(keyA);
        const itemsB = normalizedGroup.get(keyB);
        const combinedItems = [...itemsA, ...itemsB];

        suspiciousGroups.push({
          type: '오타의심',
          label: `${keyA} ↔ ${keyB}`,
          variants: combinedItems.map(i => `${i.song} (${i.count}회)`),
          totalCount: combinedItems.reduce((sum, i) => sum + i.count, 0)
        });
      }
    }
  }

  renderDuplicateList(suspiciousGroups);
}

function renderDuplicateList(groups) {
  const tbody = document.getElementById('duplicate-list');
  document.getElementById('duplicate-group-count').textContent = groups.length;
  tbody.innerHTML = '';

  if (groups.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#8c8c8c;">감지된 중복 및 오타 의심 곡이 없습니다. 데이터가 깔끔합니다!</td></tr>`;
    return;
  }

  groups.forEach(g => {
    const tr = document.createElement('tr');
    const tagClass = g.type === '중복' ? 'tag-dup' : 'tag-typo';
    tr.innerHTML = `
      <td><span class="type-tag ${tagClass}">${g.type}</span></td>
      <td><strong>${g.label}</strong></td>
      <td>${g.variants.map(v => `<span class="badge">${v}</span>`).join(' ')}</td>
      <td>${g.totalCount}회</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderMainList(list) {
  const tbody = document.getElementById('aggregated-list');
  document.getElementById('unique-count').textContent = list.length;
  tbody.innerHTML = '';

  list.forEach(entry => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${entry.song}</td>
      <td>${entry.count}회</td>
      <td>${entry.latestDate}</td>
    `;
    tbody.appendChild(tr);
  });
}

// 초기 로딩
loadData();