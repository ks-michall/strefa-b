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

/** Neutral weekly patrol transmissions beyond the opening four chapters.
 * They continue the atmosphere without revealing evidence in still-locked sectors.
 * The actual investigation and ending remain tied to class-wide discoveries.
 */
const PATROL_MESSAGES=[
 {title:"Głos za murem",body:["Zwiadowcy wrócili z obserwacji najbliższych ruin. Na skraju widocznego terenu odnaleźli świeże ślady, których nie było na poprzednim patrolu.","Ktoś jeszcze może korzystać z Bezdroży. Brakuje danych, by ustalić kto. Strefa B potrzebuje więcej zapasów na dłuższą wyprawę."]},
 {title:"Nocny patrol",body:["W nocy na północnym niebie przez chwilę migało pojedyncze światło. Świadkowie nie zgadzają się co do kierunku.","Dyżurny zanotował to wydarzenie, ale odmawia wskazania źródła bez dokładniejszego rozpoznania terenu."]},
 {title:"Znaki na szlaku",body:["Patrol znalazł trzy kamienie ułożone w równy trójkąt. Ktoś mógł zostawić znak dla następnej grupy wędrowców.","Nie wiemy, czy to ostrzeżenie, wskazówka czy przypadek. Osada gromadzi zasoby przed następną wyprawą."]},
 {title:"Cisza w eterze",body:["Radiostacja odebrała szum o nietypowym rytmie. Nie udało się odczytać słów ani potwierdzić, czy ktokolwiek nadawał.","W raporcie technika pojawia się jedno zdanie: «Nie dopowiadajmy tego, czego jeszcze nie wiemy»."]},
 {title:"Porzucone ślady",body:["Ulewa odsłoniła na poboczu fragment starej metalowej tablicy. Nie ma na niej nazwy miejsca, tylko zatarty symbol.","Dalsza droga biegnie przez obszar ukryty pod mgłą. Nie podejmujemy wyprawy bez odpowiednich zapasów."]},
 {title:"Warta o świcie",body:["Wczesnym rankiem wartownik widział cień przesuwający się między ruinami. Drugi obserwator niczego nie zauważył.","Strefa B nie wydaje pochopnych rozkazów. Zapis trafia do dziennika, a zwiadowcy przygotowują kolejny rekonesans."]},
 {title:"Nieznany odgłos",body:["Poza widocznym terenem rozległ się metaliczny huk. Echo wracało przez kilkanaście sekund.","Czy uruchomiono dawną maszynę? A może zawalił się opuszczony budynek? Bez wyprawy pozostają tylko pytania."]},
 {title:"Dopisek do mapy",body:["Kartograf dostrzegł, że jeden z dawnych traktów nie zgadza się z zapisami ocalałych map. Ktoś mógł zmienić jego przebieg.","Na razie oznaczyliśmy teren znakiem zapytania. Prawdę poznamy, gdy Strefa B sięgnie dalej."]},
] as const

function patrolMondayUtc(week:number){
  // Convert each Monday at 18:00 Warsaw time separately: DST can change.
  const noonUtc=new Date(Date.UTC(2026,11,21+week*7,12))
  const offsetPart=new Intl.DateTimeFormat("en-GB",{
    timeZone:"Europe/Warsaw",timeZoneName:"shortOffset",
  }).formatToParts(noonUtc).find(p=>p.type==="timeZoneName")?.value??"GMT+1"
  const hour=Number(offsetPart.match(/GMT([+-]\d+)/)?.[1]??"1")
  return Date.UTC(noonUtc.getUTCFullYear(),noonUtc.getUTCMonth(),noonUtc.getUTCDate(),18-hour)
}

export function nextExpedition(state:WorldState){
  const found=new Set(state.unlocked.map(x=>x.sector))
  return WORLD_SECTORS.find(s=>s.id!=="baza"&&!found.has(s.id))??null
}
export function worldEvents(state:WorldState):WorldEvent[]{
  const now=Date.parse(state.serverNow)
  const weekly:WorldEvent[]=WORLD_TRANSMISSIONS
    .filter(e=>Date.parse(e.at)<=now)
    .map(e=>({...e,kind:"transmission" as const,body:[...e.body]}))
  const finale=state.unlocked.find(item=>item.sector==="wezel")
  const finaleAt=finale?Date.parse(finale.unlocked_at):Infinity
  for(let week=0;week<52;week++){
    const time=patrolMondayUtc(week)
    if(time>now||time>finaleAt)break
    const episode=PATROL_MESSAGES[week%PATROL_MESSAGES.length]
    weekly.push({
      id:"patrol-"+(week+5),kind:"transmission",at:new Date(time).toISOString(),
      eyebrow:"RAPORT PATROLU • TYDZIEŃ "+(week+5),
      title:episode.title,body:[...episode.body],
    })
  }
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
