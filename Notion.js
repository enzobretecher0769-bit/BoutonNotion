export default async function handler(req, res) {
  const databaseId = process.env.NOTION_DATABASE_ID;

  const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.NOTION_TOKEN}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28"
    }
  });

  const data = await response.json();

  const items = data.results.map(page => {
    return {
      nom: page.properties.Nom.title[0]?.plain_text || "Sans nom",
      date: new Date(page.last_edited_time).toLocaleString("fr-FR")
    };
  });

  res.status(200).json(items);
}
