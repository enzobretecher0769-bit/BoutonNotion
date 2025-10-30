export default async function handler(req, res) {
  const databaseId = "29bcc69841658056875ed508e02036ad"; // ✅ ID base Notion
  const notionToken = process.env.NOTION_TOKEN;

  try {
    // 1️⃣ Récupérer les pages
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

    // 2️⃣ Transformer et trier les pages
    let pages = data.results.map((page) => ({
      id: page.id,
      titre: page.properties?.Nom?.title?.[0]?.plain_text || "Sans titre",
      date: new Date(page.last_edited_time),
      url: page.url,
    }));

    // 3️⃣ Trier du plus récent au plus ancien
    pages.sort((a, b) => b.date - a.date);

    // 4️⃣ Garder seulement les 5 plus récents
    pages = pages.slice(0, 5);

    // 5️⃣ Reformater la date
    pages = pages.map((p) => ({
      ...p,
      date: p.date.toLocaleString("fr-FR"),
    }));

    res.status(200).json(pages);
  } catch (error) {
    console.error("Erreur API:", error);
    res.status(500).json({ error: error.message });
  }
}
