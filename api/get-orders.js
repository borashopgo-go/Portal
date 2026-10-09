const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

module.exports = async (req, res) => {
  const { cliente } = req.query;

  if (!cliente) {
    return res.status(400).json({ success: false, message: 'Nombre requerido' });
  }

  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: 'Nombre',
        title: {
          contains: cliente
        }
      }
    });

    if (response.results.length === 0) {
      return res.status(200).json({ success: true, debugKeys: [], orders: [] });
    }

    // Extraemos TODAS las llaves de propiedades exactas y sus tipos de datos
    const firstPageProps = response.results[0].properties;
    const debugInfo = {};

    Object.keys(firstPageProps).forEach(key => {
      debugInfo[key] = {
        type: firstPageProps[key].type,
        raw: firstPageProps[key]
      };
    });

    // Devolvemos la estructura completa en 'debugInfo'
    return res.status(200).json({ 
      success: true, 
      debugInfo,
      orders: [] 
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
