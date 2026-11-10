export function generateSimulatedAIAnalysis(bounds, hectares, lang = "ru") {
  const isKz = lang === "kz";
  const isEn = lang === "en";

  const ndvi = +(0.48 + Math.random() * 0.25).toFixed(2);
  const moisture = +(0.22 + Math.random() * 0.15).toFixed(2);
  const cover = Math.round(55 + Math.random() * 35);
  const usability = Math.round(72 + Math.random() * 20);

  const problemsRu = [
    "Локальный дефицит влаги в верхнем слое почвы (0-10 см)",
    "Неравномерность всходов на юго-восточном склоне участка",
    "Признаки умеренной ветровой эрозии на открытых участках",
  ];
  const recsRu = [
    "Рекомендуется провести глубокое безотвальное рыхление почвы",
    "Внесение фосфорно-калийных удобрений перед посевной кампанией",
    "Организация снегозадержания и посадка полезащитных лесополос",
    "Корректировка нормы высева яровой пшеницы на 10-15%",
  ];

  const problemsKz = [
    "Топырақтың үстіңгі қабатында (0-10 см) ылғал тапшылығы",
    "Оңтүстік-шығыс беткейде көшеттердің біркелкі шықпауы",
    "Жел эрозиясының орташа деңгейдегі белгілері",
  ];
  const recsKz = [
    "Топырақты аудармай терең қопсыту ұсынылады",
    "Егіс алдында фосфор-калий тыңайтқыштарын енгізу",
    "Қар тоқтату шараларын ұйымдастыру және алқап қорғау белдеулері",
    "Жаздық бидай себу мөлшерін 10-15%-ға реттеу",
  ];

  const problemsEn = [
    "Local moisture deficit in the topsoil layer (0-10 cm)",
    "Uneven crop emergence on the southeastern field slope",
    "Signs of moderate wind erosion on open areas",
  ];
  const recsEn = [
    "Deep subsoiling tillage recommended to preserve moisture",
    "Apply phosphorus-potassium fertilizers before sowing",
    "Organize snow retention and plant shelterbelts",
    "Adjust spring wheat seeding rate by 10-15%",
  ];

  return {
    land_type: isKz ? "Егістік алқап (Богарное)" : isEn ? "Rainfed Arable Land" : "Пашня (Богарное земледелие)",
    status: "active",
    ndvi_estimate: ndvi,
    moisture_estimate: moisture,
    vegetation_cover: cover,
    erosion_risk: "low",
    soil_condition: isKz
      ? "Қара-қоңыр топырақ, құрылымы жақсы, органикалық зат орташа"
      : isEn
      ? "Dark chestnut soil, well-structured, moderate organic matter"
      : "Темно-каштановая почва, структура удовлетворительная, гумус 3.2%",
    crops_detected: isKz ? "Жаздық бидай, арпа" : isEn ? "Spring wheat, barley" : "Яровая пшеница, ячмень",
    problems: isKz ? problemsKz : isEn ? problemsEn : problemsRu,
    recommendations: isKz ? recsKz : isEn ? recsEn : recsRu,
    recovery_potential: 88,
    summary: isKz
      ? `Учаске жақсы агрономиялық күйде. NDVI ${ndvi} өсімдік жамылғысының қалыпты дамуын көрсетеді. Топырақ ылғалдылығын сақтау шаралары қажет.`
      : isEn
      ? `Field plot is in good agronomical condition. Estimated NDVI of ${ndvi} confirms healthy vegetative growth. Moisture preservation techniques advised.`
      : `Участок находится в хорошем агротехническом состоянии. Оценка NDVI ${ndvi} подтверждает активную вегетацию. Рекомендуются меры по влагосбережению.`,
    season_estimate: isKz ? "Жазғы вегетация" : isEn ? "Summer Vegetation" : "Летняя вегетация",
    irrigation_needed: moisture < 0.25,
    usability_score: usability,
  };
}

export function generateSmartChatReply(userQuestion, selected, data, lang = "ru") {
  const isKz = lang === "kz";
  const isEn = lang === "en";

  const selData = selected ? data[selected.id] : null;
  const regionName = selected ? selected.name : (isKz ? "Қазақстан" : isEn ? "Kazakhstan" : "Казахстан");
  const temp = selData?.cur?.temperature_2m ? `${selData.cur.temperature_2m.toFixed(1)}°C` : "18°C";
  const moist = selData?.cur?.soil_moisture_0_to_1cm ? `${(selData.cur.soil_moisture_0_to_1cm * 100).toFixed(0)}%` : "22%";
  const ndvi = selData?.ndvi ? selData.ndvi.toFixed(2) : "0.52";

  const q = userQuestion.toLowerCase();

  if (q.includes("сажа") || q.includes("егу") || q.includes("сея") || q.includes("plant") || q.includes("crop")) {
    if (isKz) {
      return `${regionName} аймағындағы ағымдағы ауа-райы (t=${temp}, топырақ ылғалдылығы=${moist}): ең қолайлы дақылдар — жаздық бидай, арпа және күнбағыс. Топырақ температурасы оңтайлы шектерде.`;
    }
    if (isEn) {
      return `For ${regionName} under current conditions (t=${temp}, soil moisture=${moist}, NDVI=${ndvi}): recommended crops are spring wheat, barley, and sunflower. Weather balance is suitable for sowing.`;
    }
    return `Для региона ${regionName} с учётом текущих данных (температура ${temp}, влажность почвы ${moist}, NDVI ${ndvi}): оптимально подходят яровая пшеница, ячмень и подсолнечник. Рекомендуется контролировать глубину заделки семян.`;
  }

  if (q.includes("погод") || q.includes("ауа") || q.includes("weather") || q.includes("темп") || q.includes("дожд") || q.includes("жаңбыр")) {
    if (isKz) {
      return `${regionName} бойынша нақты метеодеректер: ауа температурасы ${temp}, топырақ ылғалдылығы ${moist}, соңғы 7 күндегі жауын-шашын: ${selData?.p7 || 12} мм. Құрғақшылық қаупі төмен/қалыпты.`;
    }
    if (isEn) {
      return `Current weather in ${regionName}: air temperature ${temp}, soil moisture ${moist}, 7-day precipitation: ${selData?.p7 || 12} mm. Water stress is within manageable levels.`;
    }
    return `Метеосводка по региону ${regionName}: температура ${temp}, влажность почвы ${moist}, сумма осадков за 7 дней — ${selData?.p7 || 12} мм, индекс испарения ET₀ — ${selData?.et || 3.1} мм/день.`;
  }

  // Общий ответ
  if (isKz) {
    return `DalaSpace сараптамасы (${regionName}): Топырақ ылғалдылығы ${moist}, вегетациялық индекс NDVI ${ndvi}. Агротехникалық жұмыстарды жоспарлы түрде жүргізуге болады. Қосымша сұрағыңыз болса, жазыңыз!`;
  }
  if (isEn) {
    return `DalaSpace field analytics (${regionName}): Soil moisture is ${moist}, NDVI index is ${ndvi}. Conditions are favorable for regular seasonal field operations. Ask me anything about specific crops or drought risks!`;
  }
  return `Аналитика DalaSpace по региону ${regionName}: влажность почвы составляет ${moist}, вегетационный индекс NDVI ${ndvi}. Условия благоприятны для полевых работ. Задайте вопрос о посевах, прогнозе урожайности или поливе!`;
}
