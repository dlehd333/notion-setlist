export default async function handler(req, res) {
  // CORS 헤더 설정 (어디서든 접근 가능하도록 허용)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const NOTION_API_KEY = process.env.NOTION_API_KEY;
  const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

  if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
    return res.status(500).json({ error: '노션 API 키 또는 Database ID가 설정되지 않았습니다.' });
  }

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notion API 오류 (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    // 노션 데이터 파싱 로직
    const setlists = data.results.map(page => {
      const props = page.properties;
      const songs = [];
      
      Object.keys(props).forEach(key => {
        if (key.startsWith('곡')) {
          const val = props[key]?.rich_text?.[0]?.plain_text || props[key]?.title?.[0]?.plain_text;
          if (val) songs.push(val);
        }
      });

      return {
        date: props['날짜']?.date?.start || '날짜 미정',
        songs: songs
      };
    });

    res.status(200).json(setlists);

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}