import {
  LayoutDashboard, Map, Globe2, Sun, Droplets, Search, BellRing,
  TrendingUp, GitCompare, Clock, MessageCircle,
} from "lucide-react";

export const RNAME = {
  akm:{kz:"Ақмола облысы",ru:"Акмолинская",en:"Akmola"},
  akt:{kz:"Ақтөбе облысы",ru:"Актюбинская",en:"Aktobe"},
  alm:{kz:"Алматы облысы",ru:"Алматинская",en:"Almaty"},
  atr:{kz:"Атырау облысы",ru:"Атырауская",en:"Atyrau"},
  vko:{kz:"Шығыс Қазақстан",ru:"ВКО",en:"East Kazakhstan"},
  zhm:{kz:"Жамбыл облысы",ru:"Жамбылская",en:"Zhambyl"},
  zko:{kz:"Батыс Қазақстан",ru:"ЗКО",en:"West Kazakhstan"},
  krg:{kz:"Қарағанды облысы",ru:"Карагандинская",en:"Karaganda"},
  kst:{kz:"Қостанай облысы",ru:"Костанайская",en:"Kostanay"},
  kyz:{kz:"Қызылорда облысы",ru:"Кызылординская",en:"Kyzylorda"},
  mng:{kz:"Маңғыстау облысы",ru:"Мангистауская",en:"Mangystau"},
  pvl:{kz:"Павлодар облысы",ru:"Павлодарская",en:"Pavlodar"},
  skz:{kz:"Солтүстік Қазақстан",ru:"СКО",en:"North Kazakhstan"},
  trk:{kz:"Түркістан облысы",ru:"Туркестанская",en:"Turkestan"},
  ult:{kz:"Ұлытау облысы",ru:"Улытауская",en:"Ulytau"},
  aba:{kz:"Абай облысы",ru:"Абайская",en:"Abai"},
  zht:{kz:"Жетісу облысы",ru:"Жетісу",en:"Zhetysu"},
};


export const REGIONS = [
  { id:"akm", name:"Акмолинская",    code:"АКМ", lat:51.92, lng:69.41, crop:5480, city:"Кокшетау" },
  { id:"akt", name:"Актюбинская",    code:"АКТ", lat:50.28, lng:57.21, crop:2100, city:"Актобе" },
  { id:"alm", name:"Алматинская",    code:"АЛМ", lat:44.85, lng:77.05, crop:1950, city:"Талдыкорган" },
  { id:"atr", name:"Атырауская",     code:"АТР", lat:47.10, lng:51.92, crop:85,   city:"Атырау" },
  { id:"vko", name:"ВКО",            code:"ВКО", lat:49.95, lng:82.61, crop:1450, city:"Усть-Каменогорск" },
  { id:"zhm", name:"Жамбылская",     code:"ЖМБ", lat:43.35, lng:71.37, crop:890,  city:"Тараз" },
  { id:"zko", name:"ЗКО",            code:"ЗКО", lat:50.27, lng:51.37, crop:1820, city:"Уральск" },
  { id:"krg", name:"Карагандинская", code:"КРГ", lat:49.80, lng:73.10, crop:1650, city:"Караганда" },
  { id:"kst", name:"Костанайская",   code:"КСТ", lat:53.21, lng:63.63, crop:5120, city:"Костанай" },
  { id:"kyz", name:"Кызылординская", code:"КЫЗ", lat:44.85, lng:65.50, crop:320,  city:"Кызылорда" },
  { id:"mng", name:"Мангистауская",  code:"МНГ", lat:43.35, lng:52.06, crop:12,   city:"Актау" },
  { id:"pvl", name:"Павлодарская",   code:"ПВЛ", lat:52.29, lng:76.95, crop:2340, city:"Павлодар" },
  { id:"skz", name:"СКО",            code:"СКО", lat:54.87, lng:69.15, crop:3850, city:"Петропавловск" },
  { id:"trk", name:"Туркестанская",  code:"ТРК", lat:41.20, lng:68.25, crop:680,  city:"Туркестан" },
  { id:"ult", name:"Улытауская",     code:"УЛТ", lat:48.00, lng:67.50, crop:180,  city:"Жезказган" },
  { id:"aba", name:"Абайская",       code:"АБА", lat:47.80, lng:80.30, crop:520,  city:"Семей" },
  { id:"zht", name:"Жетісу",         code:"ЖТС", lat:45.50, lng:79.00, crop:640,  city:"Талдыкорган" },
];


export const getNav = (t) => [
  { id:"overview", label:t.overview,  Icon:LayoutDashboard },
  { id:"map",      label:t.map,       Icon:Map },
  { id:"regions",  label:t.regions,   Icon:Globe2 },
  { id:"forecast", label:t.forecast,  Icon:TrendingUp },
  { id:"compare",  label:t.compare,   Icon:GitCompare },
  { id:"drought",  label:t.drought,   Icon:Sun },
  { id:"water",    label:t.water,     Icon:Droplets },
  { id:"timeline", label:t.timeline,  Icon:Clock },
  { id:"ai",       label:t.ai,        Icon:Search },
  { id:"chat",     label:t.chat,      Icon:MessageCircle },
  { id:"alerts",   label:t.alerts,    Icon:BellRing },
];


export const NAME_TO_ID = {
  "aqmola":"akm","akmola":"akm","акмолинская":"akm",
  "aqtöbe":"akt","aktobe":"akt","aqtobe":"akt","актюбинская":"akt","актобе":"akt",
  "almaty":"alm","алматинская":"alm",
  "atyrau":"atr","атырауская":"atr",
  "east kazakhstan":"vko","shyghys qazaqstan":"vko","вко":"vko","восточно-казахстанская":"vko",
  "zhambyl":"zhm","jambyl":"zhm","жамбылская":"zhm",
  "west kazakhstan":"zko","batys qazaqstan":"zko","зко":"zko","западно-казахстанская":"zko",
  "qaraghandy":"krg","karaganda":"krg","karagandy":"krg","карагандинская":"krg",
  "qostanay":"kst","kostanay":"kst","костанайская":"kst",
  "qyzylorda":"kyz","kyzylorda":"kyz","кызылординская":"kyz",
  "mangghystau":"mng","mangystau":"mng","мангистауская":"mng",
  "pavlodar":"pvl","павлодарская":"pvl",
  "soltüstik qazaqstan":"skz","north kazakhstan":"skz","ско":"skz","северо-казахстанская":"skz",
  "turkistan":"trk","turkestan":"trk","south kazakhstan":"trk","туркестанская":"trk",
  "ulytau":"ult","улытауская":"ult",
  "abai":"aba","abay":"aba","абайская":"aba",
  "jetisu":"zht","zhetysu":"zht","жетісу":"zht","жетисуская":"zht",
};


export function matchFeatureToRegion(feature) {
  const props = feature.properties || {};
  const candidates = [props.NAME_1, props.name, props.shapeName, props.NAME, props.name_en, props.ADM1_EN, props.iso_3166_2].filter(Boolean);
  for (const c of candidates) {
    const key = c.toLowerCase().trim();
    if (NAME_TO_ID[key]) return NAME_TO_ID[key];
    for (const [pattern, id] of Object.entries(NAME_TO_ID)) {
      if (key.includes(pattern) || pattern.includes(key)) return id;
    }
  }
  return null;
}
