// /api/refresh.js

let refreshRequested = false;

/**
 * Ce point d’entrée gère deux méthodes :
 * - POST : déclenche un signal de rafraîchissement
 * - GET : indique si un rafraîchissement a été demandé
 */
export default function handler(req, res) {
  // Autorise toutes les origines (utile pour les widgets Notion)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Gère les requêtes OPTIONS (prévol CORS)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "POST") {
    refreshRequested = true;
    return res.status(200).json({ message: "🔁 Signal de rafraîchissement envoyé" });
  }

  if (req.method === "GET") {
    const shouldRefresh = refreshRequested;
    refreshRequested = false; // Réinitialise après lecture
    return res.status(200).json({ refresh: shouldRefresh });
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}
