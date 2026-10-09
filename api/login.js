const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
// Agrega esta variable en Vercel con el ID de tu nueva base de datos 'Clientas'
const CLIENTAS_DATABASE_ID = process.env.NOTION_CLIENTAS_DB_ID || process.env.NOTION_DATABASE_ID;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  const { usuario, password } = req.body; // 'usuario' puede ser correo o teléfono

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
            property: 'Correo',
            email: {
              equals: cleanUser
            }
          },
          {
            property: 'Teléfono',
            rich_text: {
              contains: cleanUser
            }
          },
          {
            property: 'Teléfono',
            phone_number: {
              equals: cleanUser
            }
          }
        ]
      }
    });

    if (response.results.length === 0) {
      return res.status(401).json({ success: false, message: 'Correo o teléfono no encontrado' });
    }

    const clienta = response.results[0].properties;
    const realPassword = clienta['Password']?.rich_text[0]?.plain_text || '';
    const nombreCliente = clienta['Nombre']?.title[0]?.plain_text || '';
    const correoCliente = clienta['Correo']?.email || clienta['Correo']?.rich_text[0]?.plain_text || '';

    if (realPassword !== password) {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }

    // Login exitoso: devolvemos los datos de la clienta
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
