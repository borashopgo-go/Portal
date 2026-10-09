const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Función auxiliar para extraer texto o estado de cualquier propiedad de Notion
function getPropValue(prop) {
  if (!prop) return 'N/A';
  
  switch (prop.type) {
    case 'select':
      return prop.select?.name || 'N/A';
    case 'status':
      return prop.status?.name || 'N/A';
    case 'rich_text':
      return prop.rich_text[0]?.plain_text || 'N/A';
    case 'title':
      return prop.title[0]?.plain_text || 'N/A';
    case 'formula':
      return prop.formula?.string || prop.formula?.number?.toString() || 'N/A';
    case 'date':
      return prop.date?.start || 'N/A';
    case 'number':
      return prop.number ?? 0;
    default:
      return 'N/A';
  }
}

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
        articulo: getPropValue(props['Artículo']),
        claim: getPropValue(props['Pedido/claim']),
        precio: props['Precio']?.number || 0,
        restante: props['Restante']?.formula?.number ?? props['Restante']?.number ?? 0,
        fdvFacilidades: getPropValue(props['FdV. Facilidades']),
        
        // CORRECCIÓN DE ESTADO Y LOGÍSTICA
        estado: getPropValue(props['Estado']),
        estadoEms: getPropValue(props['E. Ems']),
        vencimientoEms: getPropValue(props['FdV de Ems']),
        estadoCruce: getPropValue(props['E. Cruce']),
        vencimientoCruce: getPropValue(props['FdV Cruce']),
        
        foto: fotoUrl
      };
    });

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
