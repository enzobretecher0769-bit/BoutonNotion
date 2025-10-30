export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { name, emoji } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Le nom de la page est requis" });
  }

  const databaseId = "29bcc69841658056875ed508e02036ad";

  try {
    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.NOTION_TOKEN}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        icon: { emoji: emoji || "📄" },
        properties: {
          Nom: {
            title: [
              {
                text: { content: name }
              }
            ]
          }
        }
      })
    });

    const data = await response.json();

    if (response.ok) {
      res.status(200).json({ message: "Page créée avec succès", data });
    } else {
      res.status(400).json({ error: data });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur : " + err.message });
  }
}
