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

    const orders = response.results.map(page => {
      const props = page.properties;

      // URL de la imagen en la columna 'Foto'
      const fotoUrl = props['Foto']?.files[0]?.file?.url || props['Foto']?.files[0]?.external?.url || '';

      return {
        id: page.id,
        articulo: props['Artículo']?.rich_text[0]?.plain_text || props['Artículo']?.title[0]?.plain_text || 'Sin especificación',
        claim: props['Pedido/claim']?.select?.name || props['Pedido/claim']?.rich_text[0]?.plain_text || 'General',
        precio: props['Precio']?.number || 0,
        restante: props['Restante']?.formula?.number ?? props['Restante']?.number ?? 0,
        fdvFacilidades: props['FdV. Facilidades']?.date?.start || 'N/A',
        estado: props['Estado']?.select?.name || 'Registrado',
        foto: fotoUrl
      };
    });

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
