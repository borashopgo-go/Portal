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

    // Depuración: Imprime en la consola de Vercel el primer resultado crudo de Notion
    if (response.results.length > 0) {
      console.log("PROPIEDADES CRUDAS DE NOTION:", JSON.stringify(response.results[0].properties, null, 2));
    }

    const orders = response.results.map(page => {
      const p = page.properties;
      return {
        id: page.id,
        articulo: p['Artículo']?.rich_text[0]?.plain_text || p['Artículo']?.title[0]?.plain_text || '',
        claim: p['Pedido/claim']?.rich_text[0]?.plain_text || '',
        precio: p['Precio']?.number || 0,
        restante: p['Resta']?.number || 0,
        pago: p['Tipo de pago']?.select?.name || p['Tipo de pago']?.status?.name || p['Tipo de pago']?.rich_text[0]?.plain_text || '',
        estado: p['Estado']?.status?.name || p['Estado']?.select?.name || '',
        foto: p['Foto']?.files[0]?.file?.url || p['Foto']?.files[0]?.external?.url || '',
        fdvFacilidades: p['FdV Facilidades']?.date?.start || p['FdV Facilidades']?.rich_text[0]?.plain_text || '',
        montoEms: p['EMS']?.number || 0,
        estadoEms: p['E. EMS']?.status?.name || p['E. EMS']?.select?.name || '',
        vencimientoEms: p['FdV EMS']?.date?.start || p['FdV EMS']?.rich_text[0]?.plain_text || '',
        montoCruce: p['Cruce']?.number || 0,
        estadoCruce: p['E. Cruce']?.status?.name || p['Estado Cruce']?.select?.name || '',
        vencimientoCruce: p['FdV Cruce']?.date?.start || p['Vencimiento Cruce']?.rich_text[0]?.plain_text || ''
      };
    });

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
