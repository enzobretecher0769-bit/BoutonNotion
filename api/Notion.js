export default async function handler(req, res) {
  const databaseId = process.env.NOTION_DATABASE_ID;

  // Récupérer toutes les pages de la base
  const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.NOTION_TOKEN}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28"
    }
  });

  const data = await response.json();

  // Pour chaque page, récupérer le contenu complet
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

      // Extraire le texte ou un placeholder pour chaque type de bloc
      const contenu = dataBlocks.results.map(block => {
        switch(block.type) {
          case "paragraph":
            return block.paragraph?.text?.map(t => t.plain_text).join('') || '';
          case "heading_1":
          case "heading_2":
          case "heading_3":
            return block[block.type]?.text?.map(t => t.plain_text).join('') || '';
          case "bulleted_list_item":
          case "numbered_list_item":
            return "• " + (block[block.type]?.text?.map(t => t.plain_text).join('') || '');
          case "image":
            return "[Image]"; // ou block.image.file.url pour URL directe
          case "quote":
            return `"${block.quote?.text?.map(t => t.plain_text).join('') || ''}"`;
          case "code":
            return "`" + (block.code?.text?.map(t => t.plain_text).join('') || '') + "`";
          default:
            return ""; // Ignorer les autres types pour l’instant
        }
      }).join('\n');

      // Récupérer le titre de la page
      const titre = page.properties?.Nom?.title[0]?.plain_text || "Sans titre";

      return {
        pageId,
        titre,
        contenu,
        date: new Date(page.last_edited_time).toLocaleString("fr-FR"),
        url: page.url
      };
    })
  );

  res.status(200).json(items);
}
