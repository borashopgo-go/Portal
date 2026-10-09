const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Extrae el texto real de CUALQUIER tipo de propiedad de Notion
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
    case 'date':
      return prop.date?.start || 'N/A';
    case 'number':
      return prop.number !== null && prop.number !== undefined ? prop.number : 0;
    case 'formula':
      if (prop.formula?.type === 'string') return prop.formula.string || 'N/A';
      if (prop.formula?.type === 'number') return prop.formula.number ?? 0;
      if (prop.formula?.type === 'boolean') return prop.formula.boolean ? 'Sí' : 'No';
      if (prop.formula?.type === 'date') return prop.formula.date?.start || 'N/A';
      return 'N/A';
    case 'rollup':
      if (prop.rollup?.type === 'array' && prop.rollup.array.length > 0) {
        return getPropValue(prop.rollup.array[0]);
      }
      if (prop.rollup?.type === 'number') return prop.rollup.number ?? 0;
      return 'N/A';
    case 'relation':
      return prop.relation?.length > 0 ? 'Conectado' : 'N/A';
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
      const fotoUrl = props['Foto']?.files[0]?.file?.url || props['Foto']?.files[0]?.external?.url || '';

      // Función de búsqueda flexible de columnas por si varían espacios o mayúsculas
      const getValByName = (possibleNames) => {
        for (const name of possibleNames) {
          const key = Object.keys(props).find(k => k.trim().toLowerCase() === name.trim().toLowerCase());
          if (key) return getPropValue(props[key]);
        }
        return 'N/A';
      };

      return {
        id: page.id,
        articulo: getValByName(['Artículo', 'Articulo']),
        claim: getValByName(['Pedido/claim', 'Claim']),
        precio: props['Precio']?.number || 0,
        restante: props['Restante']?.formula?.number ?? props['Restante']?.number ?? 0,
        pago: getValByName(['Pago', 'Tipo de pago']),
        estado: getValByName(['Estado']),
        fdvFacilidades: getValByName(['FdV. Facilidades', 'FdV Facilidades']),
        
        // Mapeos con búsqueda flexible de encabezados
        estadoEms: getValByName(['E. Ems', 'E.EMS', 'Estado EMS', 'Ems Estado']),
        vencimientoEms: getValByName(['FdV de Ems', 'FdV EMS', 'FdV de EMS', 'FdV Ems']),
        estadoCruce: getValByName(['E. Cruce', 'E.CRUCE', 'Estado Cruce', 'Cruce Estado']),
        vencimientoCruce: getValByName(['FdV Cruce', 'FdV de Cruce', 'FdV CRUCE']),
        
        foto: fotoUrl
      };
    });

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
