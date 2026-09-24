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
        // Filtra por la columna 'Nombre' de tu base de datos de Notion
        property: 'Nombre',
        rich_text: {
          contains: cliente
        }
      }
    });

    const orders = response.results.map(page => {
      const props = page.properties;
      return {
        id: page.id,
        producto: props['Producto']?.title[0]?.plain_text || props['Producto']?.rich_text[0]?.plain_text || 'Sin Nombre',
        estatus: props['Estatus']?.select?.name || 'Pendiente',
        saldoPendiente: props['Saldo Pendiente']?.number || 0,
        cargoEMS: props['Cargo EMS']?.number || 0,
        cargoAduana: props['Cargo Aduana']?.number || 0,
        pesoGramos: props['Peso (g)']?.number || 0,
        disponibleEnvio: props['Disponible Envio']?.checkbox || false
      };
    });

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
