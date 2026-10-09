const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

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
    case 'relation':
      return prop.relation?.length > 0 ? 'Relación presente' : 'N/A';
    case 'rollup':
      if (prop.rollup?.type === 'array') {
        const item = prop.rollup.array[0];
        if (!item) return 'N/A';
        return item.title?.[0]?.plain_text || item.select?.name || item.status?.name || item.rich_text?.[0]?.plain_text || 'N/A';
      }
      return prop.rollup?.number?.toString() || 'N/A';
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

    if (response.results.length > 0) {
      // Imprime las llaves exactas de tus propiedades para ver sus nombres reales
      console.log('PROPIEDADES DISPONIBLES EN NOTION:', Object.keys(response.results[0].properties));
    }

    const orders = response.results.map(page => {
      const props = page.properties;
      const fotoUrl = props['Foto']?.files[0]?.file?.url || props['Foto']?.files[0]?.external?.url || '';

      // Buscamos ignorando espacios o pequeñas diferencias de mayúsculas
      const findProp = (name) => {
        const key = Object.keys(props).find(k => k.trim().toLowerCase() === name.trim().toLowerCase());
        return key ? props[key] : null;
      };

      return {
        id: page.id,
        articulo: getPropValue(findProp('Artículo')),
        claim: getPropValue(findProp('Pedido/claim')),
        precio: props['Precio']?.number || 0,
        restante: props['Restante']?.formula?.number ?? props['Restante']?.number ?? 0,
        fdvFacilidades: getPropValue(findProp('FdV. Facilidades')),
        
        estado: getPropValue(findProp('Estado')),
        
        // Mapeo flexible
        estadoEms: getPropValue(findProp('E. Ems') || findProp('E.EMS') || findProp('Estado EMS')),
        vencimientoEms: getPropValue(findProp('FdV de Ems') || findProp('FdV EMS') || findProp('FdV de EMS')),
        estadoCruce: getPropValue(findProp('E. Cruce') || findProp('Estado Cruce')),
        vencimientoCruce: getPropValue(findProp('FdV Cruce') || findProp('FdV de Cruce')),
        
        foto: fotoUrl
      };
    });

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
