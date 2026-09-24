const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Función para extraer texto de cualquier tipo de propiedad de Notion
function extractText(property) {
  if (!property) return null;
  if (property.title && property.title.length > 0) return property.title[0].plain_text;
  if (property.rich_text && property.rich_text.length > 0) return property.rich_text[0].plain_text;
  if (property.select) return property.select.name;
  return null;
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
        rich_text: {
          contains: cliente
        }
      }
    });

    const orders = response.results.map(page => {
      const props = page.properties;

      // Busca el nombre del producto en varias columnas comunes de Notion
      let nombreProducto = 
        extractText(props['Producto']) ||
        extractText(props['Articulo']) ||
        extractText(props['Artículo']) ||
        extractText(props['Descripción']) ||
        extractText(props['Item']) ||
        extractText(props['Name']) ||
        'Sin Nombre';

      // Si no encontró en las anteriores, busca la columna principal (tipo title)
      if (nombreProducto === 'Sin Nombre') {
        for (const key in props) {
          if (props[key].type === 'title' && props[key].title && props[key].title.length > 0) {
            nombreProducto = props[key].title[0].plain_text;
            break;
          }
        }
      }

      return {
        id: page.id,
        producto: nombreProducto,
        estatus: props['Estatus']?.select?.name || props['Estado']?.select?.name || 'Pendiente',
        saldoPendiente: props['Saldo Pendiente']?.number || props['Saldo']?.number || 0,
        cargoEMS: props['Cargo EMS']?.number || props['EMS']?.number || 0,
        cargoAduana: props['Cargo Aduana']?.number || props['Aduana']?.number || 0,
        pesoGramos: props['Peso (g)']?.number || props['Peso']?.number || 0,
        disponibleEnvio: props['Disponible Envio']?.checkbox || props['En Bodega']?.checkbox || false
      };
    });

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
