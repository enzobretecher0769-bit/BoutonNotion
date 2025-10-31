import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// ⚡️ Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ⚡️ Notion
const databaseId = process.env.NOTION_DATABASE_ID;
const notionToken = process.env.NOTION_TOKEN;

export default async function syncNotionToSupabase() {
  try {
    // 1️⃣ Récupérer toutes les pages de Notion
    const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${notionToken}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      }
    });
    const data = await res.json();

    // 2️⃣ Pour chaque page Notion
    for (let page of data.results) {
      const id_notion = page.id;
      const titre = page.properties?.Nom?.title[0]?.plain_text || "Sans titre";
      const url = page.url;
      const last_edited = new Date(page.last_edited_time).toISOString();

      // 3️⃣ Vérifier si la page existe déjà dans Supabase
      const { data: existing, error } = await supabase
        .from('pages_histoire')
        .select('id_notion')
        .eq('id_notion', id_notion)
        .single();

      if (existing) {
        // Update si existante
        await supabase
          .from('pages_histoire')
          .update({ titre, url, last_edited })
          .eq('id_notion', id_notion);
      } else {
        // Insert si nouvelle
        await supabase
          .from('pages_histoire')
          .insert([{ id_notion, titre, url, last_edited }]);
      }
    }

    console.log("✅ Synchronisation Notion → Supabase terminée !");
  } catch (err) {
    console.error("❌ Erreur syncNotionToSupabase :", err);
  }
}

// Pour test local, on peut exécuter directement le script
if (require.main === module) {
  syncNotionToSupabase();
}
