export type Choice={id:string;label:string}
export type SeasonVote={id:string;prompt:string;options:Choice[];deadline:number;submitted:number;myVote:string|null;winner:string|null;reason:string|null;counts:Record<string,number>|null;outcome:string|null;tiePriority:string[]}
export type Personal={round:number;title:string;scene:string;callbacks:string[];available:boolean;options:Choice[];choice:string|null;outcome:string|null}
export type SeasonEvent={id:string;title:string;scene:string[];cliffhanger:string|null;asset:string;images?:string[];forced:boolean;forcedMessage:string|null;openedAt:number;context:string[];vote?:SeasonVote;personal?:Personal}
export type SeasonLocation={id:string;name:string;position:[number,number]}
export type Clue={id:string;label:string;shared?:boolean}
export type SeasonView={season:string;start:string;finaleDate:string;totals:{food:number;morale:number};current:string|null;prolog:{title:string;image:string;text:string[];last:string}|null;events:SeasonEvent[];locations:SeasonLocation[];myClues:Clue[];commonClues:Clue[];ending:{title:string;text:string;epilogue:string[]}|null;thresholds?:{id:string;title:string;food:number;morale:number}[]}
export async function loadSeason(action?:Record<string,unknown>):Promise<SeasonView>{
  const response=await fetch("/api/season",action?{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(action),cache:"no-store"}:{cache:"no-store"})
  const data=await response.json()
  if(!response.ok)throw Error(data.error||"Nie udało się połączyć.")
  return data as SeasonView
}
