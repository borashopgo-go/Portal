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
      const p = page.properties;
      return {
        id: page.id,
        articulo: p['Artículo']?.rich_text[0]?.plain_text || p['Artículo']?.title[0]?.plain_text || '',
        claim: p['Claim']?.rich_text[0]?.plain_text || '',
        precio: p['Precio']?.number || 0,
        restante: p['Resta']?.number || 0,
        // Captura Pago ya sea como Select, Status o Texto
        pago: p['Pago']?.select?.name || p['Pago']?.status?.name || p['Pago']?.rich_text[0]?.plain_text || '',
        estado: p['Estado']?.status?.name || p['Estado']?.select?.name || '',
        foto: p['Foto']?.files[0]?.file?.url || p['Foto']?.files[0]?.external?.url || '',
        // Captura Fechas ya sea como propiedad Date de Notion o Texto
        fdvFacilidades: p['FDV Facilidades']?.date?.start || p['FDV Facilidades']?.rich_text[0]?.plain_text || '',
        montoEms: p['Monto EMS']?.number || 0,
        estadoEms: p['Estado EMS']?.status?.name || p['Estado EMS']?.select?.name || '',
        vencimientoEms: p['Vencimiento EMS']?.date?.start || p['Vencimiento EMS']?.rich_text[0]?.plain_text || '',
        montoCruce: p['Monto Cruce']?.number || 0,
        estadoCruce: p['Estado Cruce']?.status?.name || p['Estado Cruce']?.select?.name || '',
        vencimientoCruce: p['Vencimiento Cruce']?.date?.start || p['Vencimiento Cruce']?.rich_text[0]?.plain_text || ''
      };
    });

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
