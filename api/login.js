const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const CLIENTAS_DATABASE_ID = process.env.NOTION_CLIENTAS_DB_ID || process.env.NOTION_DATABASE_ID;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({ success: false, message: 'Usuario y contraseña requeridos' });
  }

  try {
    const cleanUser = usuario.trim().toLowerCase();

    // Consultamos la tabla de Clientas en Notion buscando por Correo o por Teléfono
    const response = await notion.databases.query({
      database_id: CLIENTAS_DATABASE_ID,
      filter: {
        or: [
          {
            property: 'Correo electrónico',
            email: {
              equals: cleanUser
            }
          },
          {
            property: 'Teléfono',
            rich_text: {
              contains: cleanUser
            }
          }
        ]
      }
    });

    if (response.results.length === 0) {
      return res.status(401).json({ success: false, message: 'Correo o teléfono no encontrado' });
    }

    const clienta = response.results[0].properties;
    
    // CORREGIDO: Coincide exactamente con la propiedad 'Contraseña' que se crea en el registro
    const realPassword = clienta['Contraseña']?.rich_text[0]?.plain_text || '';
    const nombreCliente = clienta['Nombre']?.title[0]?.plain_text || '';
    const correoCliente = clienta['Correo electrónico']?.email || clienta['Correo electrónico']?.rich_text[0]?.plain_text || '';

    if (realPassword !== password.trim()) {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }

    // Login exitoso
    return res.status(200).json({
      success: true,
      user: {
        nombre: nombreCliente,
        correo: correoCliente
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
