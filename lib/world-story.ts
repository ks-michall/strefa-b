/** Shared story universe for Strefa B. All releases use Polish local time. */
export type WorldState={
  food:number;morale:number;serverNow:string;
  unlocked:{sector:string;unlocked_at:string}[]
}
export type WorldEvent={
  id:string;kind:"transmission"|"discovery";title:string;eyebrow:string;
  body:string[];at:string;sector?:string
}
export const WORLD_SECTORS=[
 {id:"baza",name:"Strefa B",x:48,y:52,food:0,morale:0,tag:"OSADA GŁÓWNA",
  description:"Nasz dom. Stąd wyruszamy w nieznane. Biostacja zaopatruje wyprawy, a Biuletyn przypomina, że przetrwamy tylko razem.",
  story:"Ostatni działający posterunek w tej części regionu. Za murami rozciągają się Bezdroża.",clue:"Zapis radiowy: 03:17. Świat milknie.",icon:"⌂"},
 {id:"przepompownia",name:"Stara Przepompownia",x:27,y:66,food:15,morale:2,tag:"SEKTOR 02",
  description:"Nieużywane zbiorniki, zardzewiałe zawory i dziennik dyżurnego.",
  story:"Log techniczny pokazuje, że sektor B-03 odłączono ręcznie o 03:16. Cała sieć przestała odpowiadać dopiero minutę później. Ktoś przeczuwał katastrofę.",clue:"03:16 — ręczne odłączenie. 03:17 — Wielka Cisza.",icon:"◈"},
 {id:"obwodnica",name:"Martwa Obwodnica",x:38,y:29,food:45,morale:4,tag:"SEKTOR 03",
  description:"Pusta szosa prowadząca poza dotychczasową granicę Strefy B.",
  story:"Pośród pojazdów zwiadowcy znajdują świeże ślady opon i mapę z napisem LATARNIA. Ktoś podróżował tą drogą już po Wielkiej Ciszy.",clue:"Zaznaczona na mapie trasa urywa się u podnóża wzgórz.",icon:"⌁"},
 {id:"wieza",name:"Wieża Północna",x:63,y:20,food:100,morale:8,tag:"SEKTOR 04",
  description:"Dawny przekaźnik radiowy. Nie powinien mieć zasilania.",
  story:"Antena nadal emituje słaby sygnał. Nieznajoma odpowiada na wezwanie Strefy B, ale po usłyszeniu oznaczenia B-03 pyta: «Nie wiecie, co zrobiliście?» i przerywa połączenie.",clue:"W archiwum transmisji pojawia się nazwa: KASKADA.",icon:"⌁"},
 {id:"latarnia",name:"Latarnia",x:81,y:48,food:180,morale:14,tag:"SEKTOR 05",
  description:"Światła w opuszczonej stacji kolejowej. Pierwszy pewny znak innych ocalałych.",
  story:"Społeczność Latarni twierdzi, że to z B-03 wysłano rozkaz odcięcia infrastruktury. Nie wszyscy mieszkańcy wierzą, że Strefa B przybywa w pokoju.",clue:"Jeden z ocalałych oddaje zaszyfrowaną kartę dostępu do archiwum B-7.",icon:"✶"},
 {id:"archiwum",name:"Archiwum B-7",x:69,y:78,food:300,morale:23,tag:"SEKTOR 06",
  description:"Podziemny magazyn danych sprzed katastrofy.",
  story:"Dokumenty opisują projekt KASKADA — system zarządzania energią i transportem. Awaria jednego węzła przenosiła się na następny. Ręczne odłączenie B-03 mogło uratować region przed większą katastrofą.",clue:"Ostatni raport wskazuje centrum systemu: WĘZEŁ ZERO.",icon:"▤"},
 {id:"wezel",name:"Węzeł Zero",x:20,y:18,food:480,morale:36,tag:"SEKTOR 07",
  description:"Prawdziwe centrum Wielkiej Ciszy.",
  story:"Węzeł Zero wciąż działa w trybie uśpienia. W dziennikach potwierdzono, że KASKADA wysyłała błędne instrukcje do innych regionów. B-03 przerwał reakcję łańcuchową, ale nie wszystkie węzły wyłączono. Ostatni ekran wyświetla: «TO WĘZEŁ ODNALAZŁ WAS».",clue:"14 aktywnych połączeń. Pochodzenie nieznane. Koniec sezonu 1.",icon:"◉"},
] as const

export const WORLD_TRANSMISSIONS=[
 {id:"radio-001",at:"2026-11-23T00:00:00+01:00",eyebrow:"TRANSMISJA 001 • NIEZNANY NADAWCA",
  title:"Dwanaście dni ciszy",body:[
    "Najpierw zamilkła łączność. Potem stanęły elektrownie i transport. Nikt nie wie, ile społeczności przetrwało. Strefa B ma jeszcze wodę i kilka działających generatorów. Zapasy nie wystarczą jednak na długo.",
    "03:17. Odbiornik radiowy ożywa po raz pierwszy od dwunastu dni.",
    "«Tu R-17… Jeżeli mnie słyszycie, nie włączajcie dawnych przekaźników. Nie wszystko zostało wyłączone. Oni myślą, że system nie żyje, ale…»",
    "[SYGNAŁ UTRACONY].",
    "CEL: rozwijać uprawy i rozpoznać tereny wokół Strefy B. Każde potwierdzenie nawyku dostarcza żywność, każde dostrzeżone dobro wzmacnia morale.",
  ]},
 {id:"radio-002",at:"2026-11-30T18:00:00+01:00",eyebrow:"TRANSMISJA 002 • TYDZIEŃ DRUGI",
  title:"Brakujące minuty",body:[
    "Stary zegar w radiostacji uruchomił się na chwilę, ale jego wskazówki stanęły o godzinie 03:17. Tyle wiemy. Z pozostałych rejestrów zostały tylko uszkodzone znaczniki czasu.",
    "W nocy ktoś nadał trzy krótkie impulsy. Sygnał był zbyt słaby, by ustalić kierunek.",
    "«Jeśli szukacie odpowiedzi, nie szukajcie ich w radiu» — to jedyny fragment, jaki udało się odzyskać.",
    "Zwiadowcy proszą o większe zapasy. Dopiero wyprawa poza mury Strefy B może wyjaśnić, co działo się tuż przed Wielką Ciszą.",
  ]},
 {id:"radio-003",at:"2026-12-07T18:00:00+01:00",eyebrow:"TRANSMISJA 003 • TYDZIEŃ TRZECI",
  title:"Głos w zakłóceniach",body:[
    "Odbiornik zarejestrował coś, co przypomina ludzką mowę. Analiza nie daje pewności: to może być żywy nadawca, dawne nagranie albo przypadkowe zakłócenie.",
    "Słychać tylko: «...nie wracajcie...». Potem cisza.",
    "W Strefie B pojawiają się dwa pytania. Czy poza osadą ktoś jeszcze żyje? A jeśli tak — dlaczego nie chce zostać odnaleziony?",
    "Wyprawy na Bezdroża pozostają jedyną szansą na sprawdzenie, skąd pochodzi sygnał.",
  ]},
 {id:"radio-004",at:"2026-12-14T18:00:00+01:00",eyebrow:"TRANSMISJA 004 • TYDZIEŃ CZWARTY",
  title:"Ostatnia współrzędna",body:[
    "W trakcie nocnego dyżuru urządzenia zanotowały impuls podobny do tego, który poprzedził Wielką Ciszę. Tym razem trwał zaledwie sekundę.",
    "Zespół zwiadowców odczytał fragment współrzędnych, ale reszta mapy jest uszkodzona. Nie znamy źródła sygnału ani tego, czy stanowi zagrożenie.",
    "«Nie ufajcie gotowym odpowiedziom» — ktoś dopisał ręcznie do odnalezionego formularza.",
    "Strefa B może poznać prawdę tylko przez kolejne odkrycia na mapie. Najważniejsze dokumenty nie znajdują się w tej transmisji.",
  ]},
] as const

export function nextExpedition(state:WorldState){
  const found=new Set(state.unlocked.map(x=>x.sector))
  return WORLD_SECTORS.find(s=>s.id!=="baza"&&!found.has(s.id))??null
}
export function worldEvents(state:WorldState):WorldEvent[]{
  const now=Date.parse(state.serverNow)
  const weekly:WorldEvent[]=WORLD_TRANSMISSIONS
    .filter(e=>Date.parse(e.at)<=now)
    .map(e=>({...e,kind:"transmission" as const,body:[...e.body]}))
  const discovered:WorldEvent[]=state.unlocked.flatMap(item=>{
    const sector=WORLD_SECTORS.find(s=>s.id===item.sector)
    if(!sector)return []
    return [{
      id:"sector-"+item.sector,kind:"discovery" as const,at:item.unlocked_at,
      eyebrow:"RAPORT Z WYPRAWY • "+sector.tag,title:"Odkryto: "+sector.name,
      body:[sector.description,sector.story,"ODNALEZIONY ŚLAD: "+sector.clue],
      sector:sector.id,
    }]
  })
  return [...weekly,...discovered].sort((a,b)=>Date.parse(b.at)-Date.parse(a.at))
}
export const WORLD_EMPTY:WorldState={food:0,morale:0,serverNow:"2026-11-23T00:00:00+01:00",unlocked:[]}
