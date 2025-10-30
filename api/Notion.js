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
            return block.image?.type === "external" 
              ? `[Image](${block.image.external.url})`
              : block.image?.file?.url ? `[Image](${block.image.file.url})` : "[Image]";
          case "quote":
            return `"${block.quote?.text?.map(t => t.plain_text).join('') || ''}"`;
          case "code":
            return "`" + (block.code?.text?.map(t => t.plain_text).join('') || '') + "`";
          default:
            return "";
        }
      }).join('\n');

      const titre = page.properties?.Nom?.title[0]?.plain_text || "Sans titre";

      return {
        pageId,
        titre,
        contenu,
        last_edited_raw: page.last_edited_time, // pour tri correct
        date: new Date(page.last_edited_time).toLocaleString("fr-FR", { timeZone: "Europe/Paris" }),
        url: page.url
      };
    })
  );

  // Trier sur la date brute
  items.sort((a, b) => new Date(b.last_edited_raw) - new Date(a.last_edited_raw));

  // Garde les 5 derniers
  const recent = items.slice(0, 5);

  res.status(200).json(recent);
}
