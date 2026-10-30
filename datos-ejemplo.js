// Datos de ejemplo (se usan solo si config.js no tiene enlaces).
// Las fechas se calculan desde hoy para que la demo siempre se vea "viva".
const DATOS_EJEMPLO = (() => {
  const f = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  };

  const trabajadores = [
    { nombre: "Administrador", rol: "admin", pin: "0000" },
    { nombre: "Juan Quispe", rol: "guia", pin: "1111" },
    { nombre: "Rosa Huamán", rol: "guia", pin: "2222" },
    { nombre: "Pedro Mendoza", rol: "cocinero", pin: "3333" },
    { nombre: "Elena Ramírez", rol: "cocinero", pin: "4444" },
    { nombre: "Carlos Flores", rol: "chofer", pin: "5555" },
    { nombre: "Luis Torres", rol: "asistente", pin: "6666" },
    { nombre: "Teodoro Cruz", rol: "arriero", pin: "7777" }
  ];

  const salidas = [
    {
      id: "SC-001", ruta: "Santa Cruz", dias: "5", fecha_salida: f(-2), fecha_llegada: f(2),
      grupo: "Familia Miller (USA)", tipo_grupo: "Familia", pax: "4", idioma: "Inglés",
      hotel_recojo: "Hotel San Sebastián, Huaraz", hora_recojo: "05:30",
      punto_inicio: "Vaquería", punto_final: "Cashapampa", hora_retorno: "15:00",
      guia: "Juan Quispe", cocinero: "Pedro Mendoza", chofer: "Carlos Flores",
      asistentes: "Luis Torres", arrieros: "Teodoro Cruz", burros: "6",
      comida_gusta: "Pasta, pollo a la plancha, sopas de verduras, chocolate caliente",
      comida_no_gusta: "Comida muy picante, cuy",
      restricciones: "1 niño sin lactosa",
      notas: "Celebran el cumpleaños de la hija el día 3: llevar torta pequeña."
    },
    {
      id: "HH-001", ruta: "Huayhuash", dias: "10", fecha_salida: f(3), fecha_llegada: f(12),
      grupo: "Grupo Alpine Club (Alemania)", tipo_grupo: "Montañistas expertos", pax: "6", idioma: "Inglés",
      hotel_recojo: "Churup Guest House", hora_recojo: "05:00",
      punto_inicio: "Quartelhuain", punto_final: "Llamac", hora_retorno: "14:00",
      guia: "Rosa Huamán", cocinero: "Elena Ramírez", chofer: "Carlos Flores",
      asistentes: "Luis Torres", arrieros: "Teodoro Cruz", burros: "12",
      comida_gusta: "Quinua, trucha, desayunos contundentes, pan fresco",
      comida_no_gusta: "Hígado, comidas muy dulces",
      restricciones: "2 vegetarianos",
      notas: "Quieren hacer Siula Grande Viewpoint. Llevar oxímetro."
    },
    {
      id: "SC-002", ruta: "Santa Cruz", dias: "5", fecha_salida: f(8), fecha_llegada: f(12),
      grupo: "Pareja Dupont (Francia)", tipo_grupo: "Privado / pareja", pax: "2", idioma: "Francés / Inglés",
      hotel_recojo: "Hotel El Patio", hora_recojo: "06:00",
      punto_inicio: "Vaquería", punto_final: "Cashapampa", hora_retorno: "15:30",
      guia: "Juan Quispe", cocinero: "Pedro Mendoza", chofer: "Carlos Flores",
      asistentes: "", arrieros: "Teodoro Cruz", burros: "4",
      comida_gusta: "Vino tinto en la cena, quesos, ensaladas",
      comida_no_gusta: "Arroz todos los días",
      restricciones: "Sin gluten (1 persona)",
      notas: "Luna de miel: carpa matrimonial."
    },
    {
      id: "HH-002", ruta: "Huayhuash", dias: "8", fecha_salida: f(16), fecha_llegada: f(23),
      grupo: "Grupo compartido Noviembre", tipo_grupo: "Compartido", pax: "8", idioma: "Inglés / Español",
      hotel_recojo: "Plaza de Armas Huaraz", hora_recojo: "05:00",
      punto_inicio: "Quartelhuain", punto_final: "Llamac", hora_retorno: "14:00",
      guia: "Juan Quispe", cocinero: "Elena Ramírez", chofer: "Carlos Flores",
      asistentes: "Luis Torres", arrieros: "Teodoro Cruz", burros: "14",
      comida_gusta: "Variado: menú estándar de la agencia",
      comida_no_gusta: "",
      restricciones: "1 vegano, 1 alérgico al maní",
      notas: ""
    },
    {
      id: "HH-003", ruta: "Huayhuash", dias: "12", fecha_salida: f(20), fecha_llegada: f(31),
      grupo: "Expedición Wilson (UK)", tipo_grupo: "Privado", pax: "3", idioma: "Inglés",
      hotel_recojo: "Hotel Andino", hora_recojo: "05:30",
      punto_inicio: "Quartelhuain", punto_final: "Llamac", hora_retorno: "13:00",
      guia: "Rosa Huamán", cocinero: "Pedro Mendoza", chofer: "Carlos Flores",
      asistentes: "", arrieros: "Teodoro Cruz", burros: "9",
      comida_gusta: "Té inglés, avena en el desayuno, carnes",
      comida_no_gusta: "Pescado",
      restricciones: "",
      notas: "Incluye día de descanso en Huayllapa."
    },
    {
      id: "HH-004", ruta: "Huayhuash", dias: "15", fecha_salida: f(35), fecha_llegada: f(49),
      grupo: "Club Andino Chile", tipo_grupo: "Montañistas expertos", pax: "10", idioma: "Español",
      hotel_recojo: "Plaza de Armas Huaraz", hora_recojo: "04:30",
      punto_inicio: "Llamac", punto_final: "Llamac", hora_retorno: "15:00",
      guia: "Juan Quispe; Rosa Huamán", cocinero: "Elena Ramírez", chofer: "Carlos Flores",
      asistentes: "Luis Torres", arrieros: "Teodoro Cruz", burros: "18",
      comida_gusta: "Asados, sopas, mate de coca",
      comida_no_gusta: "Comida enlatada",
      restricciones: "",
      notas: "Circuito completo con Alpamayo de despedida."
    }
  ];

  return { salidas, trabajadores };
})();
