export default async function handler(req, res) {
  const databaseId = process.env.NOTION_DATABASE_ID;

  try {
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

    // 2️⃣ Pour chaque page, récupérer tous les blocs enfants
    const items = await Promise.all(
      data.results.map(async (page) => {
        const pageId = page.id;

        const resBlocks = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${process.env.NOTION_TOKEN}`,
            "Notion-Version": "2022-06-28"
          }
        });

        const dataBlocks = await resBlocks.json();

        // 3️⃣ Extraire le contenu complet
        const contenu = dataBlocks.results.map(block => {
          switch (block.type) {
            case "paragraph":
              return block.paragraph?.text?.map(t => t.plain_text).join('') || '';
            case "heading_1":
            case "heading_2":
            case "heading_3":
              return block[block.type]?.text?.map(t => t.plain_text).join('') || '';
            case "bulleted_list_item":
            case "numbered_list_item":
              return (block[block.type]?.text?.map(t => t.plain_text).join('') || '');
            case "image":
              return block.image?.file?.url || block.image?.external?.url || '';
            case "quote":
              return `"${block.quote?.text?.map(t => t.plain_text).join('') || ''}"`;
            case "code":
              return "```" + (block.code?.text?.map(t => t.plain_text).join('') || '') + "```";
            case "callout":
              return block.callout?.text?.map(t => t.plain_text).join('') || '';
            case "divider":
              return "──────────────";
            default:
              return '';
          }
        }).filter(Boolean).join('\n'); // concat tout le contenu

        // 4️⃣ Récupérer le titre
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

    // 5️⃣ Trier par date de modification (plus récent en premier)
    items.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 6️⃣ Garder seulement les 5 derniers
    const recent = items.slice(0, 5);

    res.status(200).json(recent);

  } catch (err) {
    console.error("Erreur API:", err);
    res.status(500).json({ error: "Erreur lors de la récupération des pages" });
  }
}
