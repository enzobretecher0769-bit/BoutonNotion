export default async function handler(req, res) {
  const databaseId = "29acc698416580ffa5dff6de6855a522"; // ton ID de base Notion
  const notionToken = process.env.NOTION_TOKEN;

  try {
    // 1️⃣ Récupérer les pages de la base
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${notionToken}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
    });

    const data = await response.json();
    console.log("Réponse Notion:", data);

    if (!data.results) {
      throw new Error("Aucun résultat renvoyé par Notion.");
    }

    // 2️⃣ Pour chaque page, récupérer les blocs enfants
    const items = await Promise.all(
      data.results.map(async (page) => {
        const pageId = page.id;

        const resBlocks = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${notionToken}`,
            "Notion-Version": "2022-06-28",
          },
        });

        const dataBlocks = await resBlocks.json();

        // Sécurisation complète du contenu
        const contenu = (dataBlocks.results || [])
          .map(block => {
            try {
              const type = block.type;
              const blockData = block[type];
              if (!blockData) return "";

              const textArray = blockData.rich_text || blockData.text;
              if (!textArray || !Array.isArray(textArray)) return "";

              return textArray.map(t => t.plain_text).join("");
            } catch (err) {
              return ""; // si un bloc est incomplet ou vide
            }
          })
          .filter(Boolean)
          .join("\n");

        return {
          pageId,
          titre: page.properties?.Nom?.title?.[0]?.plain_text || "Sans titre",
          contenu: contenu || "(Aucun texte trouvé)",
          date: new Date(page.last_edited_time).toLocaleString("fr-FR"),
          url: page.url,
        };
      })
    );

    res.status(200).json(items);
  } catch (error) {
    console.error("Erreur API:", error);
    res.status(500).json({ error: error.message });
  }
}
