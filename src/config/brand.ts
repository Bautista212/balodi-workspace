import { env } from './env'

/**
 * Todo lo que dice o enlaza a Balodi vive aca.
 * Reemplazar por WhatsApp, Calendly o una landing comercial sin tocar componentes.
 */
export const brand = {
  product: 'Balodi Workspace',
  productShort: 'Workspace',
  company: 'Balodi Marketing',
  tagline: 'Tus ideas, tus tareas y tu proximo gran proyecto. Todo en un mismo lugar.',
  version: 'beta 0.1',

  links: {
    // Placeholders editables: reemplazar por las URLs reales antes de publicar.
    contact: env.contactUrl || 'https://balodi.example/contacto',
    instagram: env.instagramUrl || 'https://instagram.com/balodi.example',
    website: env.websiteUrl || 'https://balodi.example',
  },

  cta: {
    dashboard: {
      title: 'Vos hacé crecer el negocio. Nosotros hacemos que se note.',
      button: 'Conocé Balodi',
    },
    landing: {
      title: '¿Necesitás ayuda con el marketing de tu empresa?',
      button: 'Hablar con Balodi',
    },
    contextual: {
      title: '¿Tu empresa necesita algo más que un tablero lindo?',
      body: 'En Balodi convertimos estrategia, contenido y publicidad en crecimiento real.',
      button: 'Trabajemos juntos',
    },
  },

  about: {
    origin: 'Esta herramienta no cayó del cielo.',
    body: 'La creamos en Balodi porque trabajamos todos los días con ideas, contenido, clientes y proyectos que necesitan orden para crecer.',
  },

  /**
   * Fotografias de la landing. Vacio = se dibuja una composicion propia generada
   * por codigo. Cargar aca URLs de imagenes con derechos de Balodi.
   */
  media: {
    hero: '',
    aboutLeft: '',
    aboutRight: '',
  },
}
