const { connectDB, Prospect } = require('./_db');
const { verifyToken }         = require('./_auth');

/* ── Ciudades con coordenadas y zona ─────────────────── */
const CITIES = {
  naranjo:     { lat: 10.1011, lon: -84.3986, zone: 'occidente', label: 'Naranjo' },
  palmares:    { lat: 10.0719, lon: -84.4361, zone: 'occidente', label: 'Palmares' },
  san_ramon:   { lat: 10.0886, lon: -84.4708, zone: 'occidente', label: 'San Ramón' },
  grecia:      { lat: 10.0667, lon: -84.3167, zone: 'occidente', label: 'Grecia' },
  sarchi:      { lat: 10.0942, lon: -84.4039, zone: 'occidente', label: 'Sarchí' },
  atenas:      { lat: 9.9789,  lon: -84.3786, zone: 'occidente', label: 'Atenas' },
  zarcero:     { lat: 10.1808, lon: -84.3978, zone: 'norte',     label: 'Zarcero' },
  alfaro_ruiz: { lat: 10.1808, lon: -84.3978, zone: 'norte',     label: 'Alfaro Ruiz' },
  san_carlos:  { lat: 10.3342, lon: -84.5200, zone: 'norte',     label: 'San Carlos' },
  upala:       { lat: 10.8961, lon: -85.0164, zone: 'norte',     label: 'Upala' },
  los_chiles:  { lat: 11.0318, lon: -84.7147, zone: 'norte',     label: 'Los Chiles' },
};

/* ── Tipos de negocio → tag OSM ──────────────────────── */
const BIZ_TYPES = {
  hoteles:       { tag: 'tourism',  value: 'hotel',       label: 'Hoteles y Hospedajes' },
  restaurantes:  { tag: 'amenity',  value: 'restaurant',  label: 'Restaurantes' },
  hospitales:    { tag: 'amenity',  value: 'hospital',    label: 'Hospitales y Clínicas' },
  farmacias:     { tag: 'amenity',  value: 'pharmacy',    label: 'Farmacias' },
  escuelas:      { tag: 'amenity',  value: 'school',      label: 'Escuelas y Colegios' },
  gasolineras:   { tag: 'amenity',  value: 'fuel',        label: 'Gasolineras' },
  supermercados: { tag: 'shop',     value: 'supermarket', label: 'Supermercados' },
  bancos:        { tag: 'amenity',  value: 'bank',        label: 'Bancos' },
  talleres:      { tag: 'shop',     value: 'car_repair',  label: 'Talleres Mecánicos' },
  ferreterias:   { tag: 'shop',     value: 'doityourself',label: 'Ferreterías' },
};

/* ── Puntos de dolor por tipo ────────────────────────── */
const PAIN_POINTS = {
  hoteles: [
    { title: 'Señalización solo en español',  description: 'Los turistas extranjeros no entienden las señales, lo que afecta su experiencia.',   severity: 4, category: 'comercial' },
    { title: 'Parqueo sin demarcación visible', description: 'Sin líneas claras, los conductores se estacionan de forma desorganizada.',           severity: 3, category: 'vial'      },
    { title: 'Rótulo de fachada deteriorado',  description: 'Un rótulo en mal estado proyecta una imagen negativa ante los clientes potenciales.', severity: 3, category: 'comercial' },
  ],
  restaurantes: [
    { title: 'Falta señalización de parqueo',      description: 'Los clientes no saben dónde estacionarse, reduciendo la afluencia al local.',   severity: 4, category: 'vial'      },
    { title: 'Sin señales de salida de emergencia', description: 'Incumplimiento normativo que puede generar multas del Cuerpo de Bomberos.',     severity: 5, category: 'seguridad' },
    { title: 'Rótulo sin iluminación nocturna',     description: 'El negocio pierde visibilidad en las horas pico de la noche.',                  severity: 3, category: 'comercial' },
  ],
  hospitales: [
    { title: 'Señalización interna confusa',          description: 'Los pacientes pierden tiempo buscando departamentos en situaciones de emergencia.', severity: 5, category: 'seguridad' },
    { title: 'Sin señales de discapacitados en parqueo', description: 'Incumplimiento de la Ley 7600, con exposición a sanciones.',                  severity: 5, category: 'seguridad' },
    { title: 'Señales de evacuación incompletas',     description: 'Riesgo legal y de seguridad en caso de emergencia o desastre.',                   severity: 5, category: 'seguridad' },
  ],
  farmacias: [
    { title: 'Sin señal de acceso para discapacitados', description: 'La Ley 7600 obliga acceso universal en establecimientos de salud.',   severity: 5, category: 'seguridad' },
    { title: 'Rótulo de farmacia de turno ilegible',    description: 'El MINSA exige que el letrero de guardia sea visible desde la calle.', severity: 4, category: 'comercial' },
    { title: 'Sin señalización de salida de emergencia', description: 'Normativa de bomberos requiere señalización visible en todo momento.', severity: 4, category: 'seguridad' },
  ],
  escuelas: [
    { title: 'Sin señales de velocidad en el acceso',  description: 'Alta velocidad vehicular cerca del plantel pone en riesgo a los niños.',        severity: 5, category: 'vial'      },
    { title: 'Falta demarcación de zona peatonal',     description: 'Sin paso de cebra definido, existe riesgo de atropellamiento en la entrada.',    severity: 5, category: 'vial'      },
    { title: 'Señalización de emergencia obsoleta',    description: 'Las señales del MEP requieren actualización periódica según normativa vigente.', severity: 3, category: 'seguridad' },
  ],
  gasolineras: [
    { title: 'Demarcación de pistas desgastada',  description: 'Las líneas de circulación borrosas generan confusión y riesgo de accidentes.',      severity: 4, category: 'vial'      },
    { title: 'Sin señales de peligro de combustible', description: 'Obligatorio por normativa del MOPT y del Cuerpo de Bomberos.',                    severity: 5, category: 'seguridad' },
    { title: 'Rótulo de precios sin iluminación',     description: 'RECOPE exige visibilidad de precios las 24 horas del día.',                       severity: 4, category: 'comercial' },
  ],
  supermercados: [
    { title: 'Parqueo sin líneas de espacios',          description: 'Sin demarcación, los clientes ocupan más espacios de los necesarios.',           severity: 3, category: 'vial'      },
    { title: 'Sin señalización de dirección de tráfico', description: 'Flujo vehicular desorganizado genera congestionamiento y roces entre vehículos.', severity: 4, category: 'vial'      },
    { title: 'Señales de seguridad internas obsoletas', description: 'Normativa INTECO exige actualización periódica de señalización interna.',        severity: 3, category: 'seguridad' },
  ],
  bancos: [
    { title: 'Sin demarcación de filas exteriores',      description: 'Los clientes forman filas desordenadas en la acera, generando conflictos.',   severity: 3, category: 'vial'      },
    { title: 'Señalización de emergencia desactualizada', description: 'Los bancos deben cumplir normativas SUGEF y BCCR de seguridad.',              severity: 4, category: 'seguridad' },
    { title: 'Rótulos de cajeros sin mantenimiento',      description: 'La identidad visual deteriorada afecta la imagen institucional del banco.',   severity: 3, category: 'comercial' },
  ],
  talleres: [
    { title: 'Sin señalización de zona de peligro',  description: 'Obligatorio por normativa del INS en riesgos laborales para talleres.',         severity: 5, category: 'seguridad' },
    { title: 'Entrada de taller sin señal de ceder', description: 'Sin "Ceder el paso" o señal de entrada, hay riesgo de accidentes con clientes.',  severity: 4, category: 'vial'      },
    { title: 'Falta rótulo de identificación visible', description: 'Clientes potenciales pasan de largo por falta de rotulación en la fachada.',    severity: 3, category: 'comercial' },
  ],
  ferreterias: [
    { title: 'Área de carga sin señalización',          description: 'Riesgo de accidentes en zona de carga y descarga de materiales pesados.',         severity: 4, category: 'seguridad' },
    { title: 'Sin señalización de pasillos internos',    description: 'Dificulta la ubicación de productos y degrada la experiencia del cliente.',        severity: 3, category: 'comercial' },
    { title: 'Parqueo sin demarcación para camiones',   description: 'Clientes con camión no encuentran dónde estacionar para cargar materiales.',        severity: 3, category: 'vial'      },
  ],
};

const DEFAULT_PAIN_POINTS = [
  { title: 'Señalización vial insuficiente',  description: 'La falta de señalización puede generar multas del MOPT.', severity: 3, category: 'vial'      },
  { title: 'Rótulo comercial deteriorado',    description: 'Un rótulo en mal estado afecta la imagen del negocio.',   severity: 3, category: 'comercial' },
  { title: 'Sin señales de seguridad internas', description: 'Obligatorio por normativa de riesgos laborales del INS.', severity: 4, category: 'seguridad' },
];

function calcScore(tags) {
  let s = 0;
  if (tags.name)                                        s += 20;
  if (tags.phone || tags['contact:phone'])              s += 25;
  if (tags.website || tags['contact:website'])          s += 25;
  if (tags['addr:street'])                              s += 15;
  if (tags.email || tags['contact:email'])              s += 15;
  return s;
}

async function queryOverpass(city, bizType) {
  const c   = CITIES[city];
  const bt  = BIZ_TYPES[bizType];
  const q   = `[out:json][timeout:20];(node["${bt.tag}"="${bt.value}"](around:8000,${c.lat},${c.lon});way["${bt.tag}"="${bt.value}"](around:8000,${c.lat},${c.lon}););out 40;`;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'SenalesDeCostaRica-Admin/1.0' },
    signal:  AbortSignal.timeout(22000)
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const data = await res.json();
  return data.elements || [];
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!verifyToken(req))     return res.status(401).json({ error: 'Unauthorized' });

  const { city, business_type } = req.body;
  if (!city || !business_type)   return res.status(400).json({ error: 'city y business_type son requeridos' });
  if (!CITIES[city])             return res.status(400).json({ error: 'Ciudad no válida' });
  if (!BIZ_TYPES[business_type]) return res.status(400).json({ error: 'Tipo de negocio no válido' });

  await connectDB();

  let elements;
  try {
    elements = await queryOverpass(city, business_type);
  } catch (err) {
    console.error('Overpass error:', err.message);
    return res.status(502).json({ error: 'No se pudo conectar al directorio. Intenta en unos segundos.' });
  }

  const cityInfo   = CITIES[city];
  const bizInfo    = BIZ_TYPES[business_type];
  const painPoints = PAIN_POINTS[business_type] || DEFAULT_PAIN_POINTS;

  let newCount = 0;

  for (const el of elements) {
    const t    = el.tags || {};
    const name = t.name || t['name:es'] || '';
    if (!name) continue;

    const phone   = (t.phone || t['contact:phone'] || t['phone:mobile'] || '').replace(/\s+/g, ' ').trim();
    const website = t.website || t['contact:website'] || '';
    const email   = t.email   || t['contact:email']   || '';
    const address = [t['addr:street'], t['addr:housenumber'], t['addr:city']].filter(Boolean).join(', ');

    const existing = await Prospect.findOne({ name, city: cityInfo.label });
    if (existing) continue;

    await Prospect.create({
      name,
      business_type: bizInfo.label,
      zone:          cityInfo.zone,
      city:          cityInfo.label,
      address,
      phone,
      email,
      website,
      rating:        t['stars'] ? parseFloat(t['stars']) : undefined,
      source:        'openstreetmap',
      data_score:    calcScore(t),
      stage:         'por_llamar',
      pain_points:   painPoints,
      scraped_at:    new Date(),
      updated_at:    new Date(),
    });
    newCount++;
  }

  return res.json({
    success:  true,
    found:    elements.filter(e => e.tags?.name).length,
    new:      newCount,
    city:     cityInfo.label,
    type:     bizInfo.label,
  });
};
