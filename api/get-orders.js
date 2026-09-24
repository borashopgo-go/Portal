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
        // La columna 'Nombre' es la columna principal (Title)
        property: 'Nombre',
        title: {
          contains: cliente
        }
      }
    });

    const orders = response.results.map(page => {
      const props = page.properties;

      return {
        id: page.id,
        nombreCliente: props['Nombre']?.title[0]?.plain_text || '',
        pedidoClaim: props['Pedido/claim']?.select?.name || 'General',
        articulo: props['Artículo']?.rich_text[0]?.plain_text || 'Sin especificación',
        cantidad: props['Cantidad']?.number || 1,
        precio: props['Precio']?.number || 0,
        tipoPago: props['Tipo de pago']?.select?.name || 'Pendiente',
        abonos: props['Abonos']?.number || 0,
        restante: props['Restante']?.formula?.number ?? props['Restante']?.number ?? 0,
        estado: props['Estado']?.select?.name || 'Registrado'
      };
    });

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
