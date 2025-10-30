let shouldRefresh = false;

export default async function handler(req, res) {
  // Quand on clique sur le bouton de rafraîchissement
  if (req.method === "POST") {
    shouldRefresh = true; // On active le signal
    return res.status(200).json({ message: "Rafraîchissement demandé" });
  }

  // Quand un widget (comme Historique) vérifie s’il doit se rafraîchir
  if (req.method === "GET") {
    if (shouldRefresh) {
      shouldRefresh = false; // ✅ On réinitialise pour ne rafraîchir qu'une fois
      return res.status(200).json({ refresh: true });
    } else {
      return res.status(200).json({ refresh: false });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}
