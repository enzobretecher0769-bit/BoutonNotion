export default async function handler(req, res) {
  try {
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
    console.log("Réponse Notion:", data); // 👈 Ajout pour déboguer

    const items = await Promise.all(
      data.results.map(async (page) => {
        const pageId = page.id;

        const resBlocks = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${process.env.NOTION_TOKEN}`,
            "Notion-Version": "2022-06-28"
          }
        });

        const dataBlocks = await resBlocks.json();

        const contenu = dataBlocks.results.map(block => {
          if (block.type === "paragraph") {
            return block.paragraph.text.map(t => t.plain_text).join('');
          }
          return '';
        }).join('\n');

        return {
          pageId,
          contenu,
          date: new Date(page.last_edited_time).toLocaleString("fr-FR")
        };
      })
    );

    res.status(200).json(items);

  } catch (err) {
    console.error("Erreur API:", err);
    res.status(500).json({ error: err.message });
  }
}
