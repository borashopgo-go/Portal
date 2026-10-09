const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
// Variable de entorno en Vercel para la base de datos de Clientas
const CLIENTAS_DATABASE_ID = process.env.NOTION_CLIENTAS_DB_ID;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  const { nombre, correo, telefono, password } = req.body;

  if (!nombre || !correo || !telefono || !password) {
    return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
  }

  try {
    const cleanEmail = correo.trim().toLowerCase();
    const cleanPhone = telefono.trim();

    // 1. Verificamos si el correo o teléfono ya están registrados
    const existingUser = await notion.databases.query({
      database_id: CLIENTAS_DATABASE_ID,
      filter: {
        or: [
          {
            property: 'Correo electrónico',
            email: { equals: cleanEmail }
          },
          {
            property: 'Teléfono',
            rich_text: { contains: cleanPhone }
          }
        ]
      }
    });

    if (existingUser.results.length > 0) {
      return res.status(400).json({ success: false, message: 'El correo o teléfono ya están registrados.' });
    }

    // 2. Creamos la nueva página (registro) en la base de datos de Notion
    await notion.pages.create({
      parent: { database_id: CLIENTAS_DATABASE_ID },
      properties: {
        'Nombre': {
          title: [
            { text: { content: nombre.trim() } }
          ]
        },
        'Correo electrónico': {
          email: cleanEmail
        },
        'Teléfono': {
          rich_text: [
            { text: { content: cleanPhone } }
          ]
        },
        'Contraseña': {
          rich_text: [
            { text: { content: password.trim() } }
          ]
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: '¡Cuenta creada con éxito!',
      user: {
        nombre: nombre.trim(),
        correo: cleanEmail
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
