// ════════════════════════════════════════════════════════
//  HOSPITAL OLVIDADO — Datos del juego
//  Edita aquí los trabajos del portafolio y los acertijos
// ════════════════════════════════════════════════════════

/**
 * TRABAJOS DEL PORTAFOLIO
 * Cada entrada se desbloquea con una llave (tras resolver el acertijo)
 * 
 * Campos:
 *  id          - identificador único
 *  room        - nombre narrativo del cuarto
 *  icon        - emoji para el HUD / modal
 *  keyColor    - color de la llave (#hex)
 *  title       - título del trabajo
 *  description - descripción del trabajo
 *  images      - array de rutas a imágenes (en assets/images/)
 *  link        - URL externa (opcional)
 *  tools       - herramientas / software usadas
 */
export const PORTFOLIO_ITEMS = [
  {
    id: 'work-1',
    room: 'Sala de Cirugía',
    icon: '🔪',
    keyColor: '#cc3333',
    title: 'Trabajo 1 — Título aquí',
    description: 'Descripción de este trabajo de diseño gráfico. Explica el proceso, el cliente, los resultados.',
    images: ['assets/images/work1.jpg'],
    link: '',
    tools: ['Illustrator', 'Photoshop'],
  },
  {
    id: 'work-2',
    room: 'Morgue',
    icon: '☠',
    keyColor: '#6633cc',
    title: 'Trabajo 2 — Título aquí',
    description: 'Descripción del segundo trabajo.',
    images: ['assets/images/work2.jpg'],
    link: '',
    tools: ['After Effects', 'Premiere'],
  },
  {
    id: 'work-3',
    room: 'Laboratorio',
    icon: '🧪',
    keyColor: '#33cc66',
    title: 'Trabajo 3 — Título aquí',
    description: 'Descripción del tercer trabajo.',
    images: ['assets/images/work3.jpg'],
    link: '',
    tools: ['Figma', 'Blender'],
  },
  {
    id: 'work-4',
    room: 'Psiquiátrico',
    icon: '🧠',
    keyColor: '#cc6633',
    title: 'Trabajo 4 — Título aquí',
    description: 'Descripción del cuarto trabajo.',
    images: ['assets/images/work4.jpg'],
    link: '',
    tools: ['Photoshop', 'InDesign'],
  },
  {
    id: 'work-5',
    room: 'Archivo Médico',
    icon: '📁',
    keyColor: '#3399cc',
    title: 'Trabajo 5 — Título aquí',
    description: 'Descripción del quinto trabajo.',
    images: ['assets/images/work5.jpg'],
    link: '',
    tools: ['Illustrator'],
  },
  {
    id: 'work-6',
    room: 'Capilla',
    icon: '⛪',
    keyColor: '#cccc33',
    title: 'Trabajo 6 — Título aquí',
    description: 'Descripción del sexto trabajo.',
    images: ['assets/images/work6.jpg'],
    link: '',
    tools: ['Cinema 4D'],
  },
  {
    id: 'work-7',
    room: 'Sala de Rayos X',
    icon: '🦴',
    keyColor: '#cc33cc',
    title: 'Trabajo 7 — Título aquí',
    description: 'Descripción del séptimo trabajo.',
    images: ['assets/images/work7.jpg'],
    link: '',
    tools: ['Procreate', 'Illustrator'],
  },
  {
    id: 'work-8',
    room: 'Despacho del Director',
    icon: '🗂',
    keyColor: '#d4af37',
    title: 'Trabajo 8 — Título aquí',
    description: 'El trabajo final. El secreto más guardado del hospital.',
    images: ['assets/images/work8.jpg'],
    link: '',
    tools: ['Photoshop', 'Illustrator', 'After Effects'],
  },
];

/**
 * ACERTIJOS
 * Uno por trabajo. El jugador debe resolverlo para obtener la llave.
 * 
 * Tipos:
 *  'multiple'  - opciones múltiples (options: [])
 *  'text'      - respuesta de texto libre (answer: string)
 * 
 * Campos narrative: texto ambiental que aparece antes de la pregunta
 */
export const RIDDLES = [
  {
    workId: 'work-1',
    narrative: 'Encuentras un expediente ensangrentado sobre la mesa de operaciones. Una nota dice:',
    question: '¿Qué herramienta siempre usa un diseñador gráfico para trazar vectores perfectos?',
    type: 'multiple',
    options: ['Microsoft Word', 'Adobe Illustrator', 'Excel', 'Notepad'],
    answer: 'Adobe Illustrator',
    wrongMsg: 'Las luces parpadean… respuesta incorrecta.',
    correctMsg: '🗝 La cerradura cede. Escuchas un click metálico.',
  },
  {
    workId: 'work-2',
    narrative: 'En la morgue hay un espejo roto. En los fragmentos puedes leer al revés:',
    question: '¿Cuántos fotogramas por segundo tiene el video estándar de cine (fps)?',
    type: 'multiple',
    options: ['12 fps', '30 fps', '24 fps', '60 fps'],
    answer: '24 fps',
    wrongMsg: 'Un frío extraño recorre tu columna…',
    correctMsg: '🗝 La gaveta se abre con un chirrido.',
  },
  {
    workId: 'work-3',
    narrative: 'Sobre la pizarra del laboratorio alguien escribió con sangre:',
    question: '¿Qué significan las siglas "UI" en diseño digital?',
    type: 'multiple',
    options: ['Unlimited Interface', 'User Interface', 'Unique Interaction', 'Universal Input'],
    answer: 'User Interface',
    wrongMsg: 'El microscopio cae al suelo…',
    correctMsg: '🗝 El tubo de ensayo contiene una pequeña llave.',
  },
  {
    workId: 'work-4',
    narrative: 'Las paredes acolchadas tienen inscripciones. Una repite sin parar:',
    question: '¿Cuál es el modo de color usado para pantallas digitales?',
    type: 'multiple',
    options: ['CMYK', 'RGB', 'HSL', 'PMS'],
    answer: 'RGB',
    wrongMsg: 'Algo se mueve detrás de ti…',
    correctMsg: '🗝 La camisa de fuerza suelta una llave oxidada.',
  },
  {
    workId: 'work-5',
    narrative: 'Los archivos médicos están desordenados. Uno tiene una nota:',
    question: '¿Qué formato de archivo preserva las capas en Photoshop?',
    type: 'multiple',
    options: ['.JPG', '.PNG', '.PSD', '.GIF'],
    answer: '.PSD',
    wrongMsg: 'Los archivos caen al suelo solos…',
    correctMsg: '🗝 Dentro de un sobre sellado encuentras una llave.',
  },
  {
    workId: 'work-6',
    narrative: 'El altar de la capilla tiene grabado:',
    question: '¿Qué significa "tipografía" en el contexto del diseño gráfico?',
    type: 'multiple',
    options: [
      'El estudio y uso de tipos de letra',
      'El proceso de impresión en 3D',
      'La técnica de fotografía',
      'El diseño de iconos',
    ],
    answer: 'El estudio y uso de tipos de letra',
    wrongMsg: 'Las velas se apagan solas…',
    correctMsg: '🗝 La biblia oculta una llave entre sus páginas.',
  },
  {
    workId: 'work-7',
    narrative: 'Las radiografías muestran algo extraño. Al iluminarlas con tu linterna lees:',
    question: '¿Qué extensión tienen los archivos de Adobe Illustrator?',
    type: 'text',
    answer: '.ai',
    wrongMsg: 'La máquina de rayos X zumba amenazante…',
    correctMsg: '🗝 La llave aparece donde antes no había nada.',
  },
  {
    workId: 'work-8',
    narrative: 'La nota sobre el escritorio del director dice: "Solo quien entiende el arte puede pasar."',
    question: '¿Cuál es el modelo de colores usado en IMPRESIÓN (no en pantalla)?',
    type: 'multiple',
    options: ['RGB', 'HSB', 'CMYK', 'HEX'],
    answer: 'CMYK',
    wrongMsg: 'La silla gira sola lentamente…',
    correctMsg: '🗝 El cajón secreto del director se abre. ¡Has ganado!',
  },
];

/**
 * PUNTOS INTERACTIVOS — Una caja por habitación
 * Distribuidas en zigzag por el pasillo del hospital.
 * El jugador empieza en (0, 6.44, 0) y camina hacia z negativo.
 * 
 * ⚙️ Si una caja está dentro de una pared, ajusta solo x y z.
 *    El valor y=6.44 es el nivel de suelo del hospital — no cambiar.
 */
export const INTERACTION_POINTS = [
  { workId: 'work-1', position: { x:  0.0, y: 6.44, z:  -3 }, radius: 2.6, label: 'Sala de Cirugía'       },
  { workId: 'work-2', position: { x: -3.0, y: 6.44, z:  -9 }, radius: 2.6, label: 'Morgue'                 },
  { workId: 'work-3', position: { x:  3.0, y: 6.44, z: -14 }, radius: 2.6, label: 'Laboratorio'            },
  { workId: 'work-4', position: { x:  0.0, y: 6.44, z: -20 }, radius: 2.6, label: 'Celda Psiquiátrica'     },
  { workId: 'work-5', position: { x: -3.0, y: 6.44, z: -25 }, radius: 2.6, label: 'Sala de Rayos X'        },
  { workId: 'work-6', position: { x:  3.0, y: 6.44, z: -30 }, radius: 2.6, label: 'Capilla'                },
  { workId: 'work-7', position: { x:  0.0, y: 6.44, z: -35 }, radius: 2.6, label: 'Pasillo del Fondo'      },
  { workId: 'work-8', position: { x:  0.0, y: 6.44, z: -40 }, radius: 2.6, label: 'Despacho del Director'  },
];

