require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Notion Database ID 자동 정제 함수 (32자리 순수 Hex ID만 추출)
function getCleanDatabaseId(rawInput) {
  if (!rawInput) return '';
  const cleaned = rawInput.replace(/['"\s]/g, '');
  const match = cleaned.replace(/-/g, '').match(/[a-f0-9]{32}/i);
  return match ? match[0] : cleaned;
}

// 2. Notion API Key 자동 정제 함수 (공백 및 따옴표 제거)
function getCleanApiKey(rawInput) {
  if (!rawInput) return '';
  return rawInput.replace(/['"\s]/g, '');
}

const API_KEY = getCleanApiKey(process.env.NOTION_API_KEY);
const DATABASE_ID = getCleanDatabaseId(process.env.NOTION_DATABASE_ID);

console.log("========================================");
console.log("API KEY 로드 확인:", API_KEY ? `${API_KEY.substring(0, 10)}...` : "실패 (undefined)");
console.log("정제된 DATABASE ID:", DATABASE_ID || "실패 (undefined)");
console.log("========================================");

app.get('/api/setlists', async (req, res) => {
  try {
    if (!API_KEY || !DATABASE_ID) {
      return res.status(400).json({ error: ".env 파일의 NOTION_API_KEY 또는 NOTION_DATABASE_ID를 확인해 주세요." });
    }

    // Node.js 내장 fetch로 Notion API 직접 호출
    const notionUrl = `https://api.notion.com/v1/databases/${DATABASE_ID}/query`;

    const response = await fetch(notionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sorts: [
          {
            property: '날짜',
            direction: 'descending'
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Notion API 응답 에러:", data);
      return res.status(response.status).json({
        error: data.message || "Notion API 호출 실패",
        detail: data
      });
    }

    // 데이터 파싱
    const setlists = data.results.map((page) => {
      const props = page.properties;

      const songs = [];
      Object.keys(props).forEach((key) => {
        if (key.startsWith('찬양')) {
          const textValue = props[key]?.rich_text?.[0]?.plain_text || props[key]?.title?.[0]?.plain_text;
          if (textValue) songs.push(textValue);
        }
      });

      return {
        id: page.id,
        title: props['예배명']?.title?.[0]?.plain_text || props['이름']?.title?.[0]?.plain_text || '주일 예배',
        date: props['날짜']?.date?.start || '날짜 미정',
        leader: props['인도자']?.select?.name || props['인도자']?.rich_text?.[0]?.plain_text || '',
        note: props['비고']?.select?.name || props['비고']?.rich_text?.[0]?.plain_text || '',
        songs: songs
      };
    });

    res.json(setlists);
  } catch (error) {
    console.error('Server Internal Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});