export default async function handler(req, res) {
  // 👉 ID direct de ta base "Base histoire"
  const databaseId = "29bcc69841658056875ed508e02036ad";

  // 1️⃣ Récupération des pages de la base
  const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.NOTION_TOKEN}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28"
    }
  });

  const data = await response.json();

  // 2️⃣ Extraction du contenu des pages
  const items = await Promise.all(
    data.results.map(async (page) => {
      const pageId = page.id;

      // Récupération du contenu (blocs enfants)
      const resBlocks = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${process.env.NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28"
        }
      });

      const dataBlocks = await resBlocks.json();

      // Extraire le texte de chaque bloc
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
          default:
            return "";
        }
      }).join('\n');

      // Récupération du titre
      const titre = page.properties?.Nom?.title?.[0]?.plain_text || "Sans titre";

      // Conversion date fuseau horaire France
      const dateFR = new Date(page.last_edited_time)
        .toLocaleString("fr-FR", { timeZone: "Europe/Paris" });

      return {
        pageId,
        titre,
        contenu,
        date: dateFR,
        url: page.url
      };
    })
  );

  // 3️⃣ Tri du plus récent au plus ancien
  items.sort((a, b) => new Date(b.date) - new Date(a.date));

  // 4️⃣ Retourne toutes les pages (pas seulement 5)
  res.status(200).json(items);
}