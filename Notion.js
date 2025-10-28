export default async function handler(req, res) {
  const databaseId = process.env.NOTION_DATABASE_ID;

  // 1️⃣ Récupérer toutes les pages de la base
  const response = await fetch(`https://api.notion.com/v1/databases/29acc698416580ffa5dff6de6855a522/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.NOTION_TOKEN}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28"
    }
  });

  const data = await response.json();

  // 2️⃣ Pour chaque page, récupérer le contenu complet
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

      // Extraire le texte brut de chaque bloc
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
}
