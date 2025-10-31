export default async function handler(req, res) {
  const databaseId = process.env.NOTION_DATABASE_ID;

  // 1️⃣ Récupérer toutes les pages de la base
  const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.NOTION_TOKEN}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28"
    }
  });

  const data = await response.json();

  // 2️⃣ Pour chaque page, récupérer le titre et URL
  const items = data.results.map(page => {
    const titre = page.properties?.Nom?.title[0]?.plain_text || "Sans titre";
    return {
      pageId: page.id,
      titre,
      url: page.url
    };
  });

  // 3️⃣ Trier selon l’historique stocké dans localStorage (via frontend)
  //  Frontend utilisera la clé 'accesRapide' pour stocker un tableau d'IDs

  // 4️⃣ Ne garder que les 5 pages les plus récentes dans la liste finale
  const recent = items.slice(0, 5);

  res.status(200).json(recent);
}
