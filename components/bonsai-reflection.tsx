"use client"

import {useEffect,useState} from "react"

export function BonsaiReflection({treeId}:{treeId:string}){
  const [helped,setHelped]=useState("")
  const [nextTime,setNextTime]=useState("")
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [saved,setSaved]=useState(false)
  const [error,setError]=useState("")
  useEffect(()=>{
    let active=true
    async function read(){
      try{
        const r=await fetch("/api/bonsai/reflection?tree="+encodeURIComponent(treeId),{cache:"no-store"})
        const data=await r.json()
        if(!r.ok)throw new Error(data.error||"Nie udało się pobrać refleksji.")
        if(active && data.reflection){
          setHelped(data.reflection.helped||"")
          setNextTime(data.reflection.nextTime||"")
          setSaved(true)
        }
      }catch(error){if(active)setError(error instanceof Error?error.message:"Błąd połączenia.")}
      finally{if(active)setLoading(false)}
    }
    void read()
    return ()=>{active=false}
  },[treeId])
  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault()
    setSaving(true);setError("")
    try{
      const r=await fetch("/api/bonsai/reflection",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({treeId,helped,nextTime}),
      })
      const data=await r.json()
      if(!r.ok)throw new Error(data.error||"Nie udało się zapisać.")
      setSaved(true)
    }catch(error){setError(error instanceof Error?error.message:"Błąd zapisu.")}
    finally{setSaving(false)}
  }
  return <section style={{marginTop:16,padding:17,border:"1px solid #d5e7d8",borderRadius:17,background:"#fafdf9"}}>
    <h3 style={{margin:"0 0 8px",fontSize:18,color:"#315f43"}}>Chwila refleksji</h3>
    <p style={{fontSize:14,lineHeight:1.6,color:"#5e7866",margin:"0 0 14px"}}>
      Dwa krótkie pytania. Odpowiedzi są dobrowolne i prywatne — możesz z nich skorzystać podczas rozmowy z wychowawcą.
    </p>
    {loading?<p>Wczytywanie…</p>:<form onSubmit={submit} style={{display:"grid",gap:10}}>
      <label htmlFor={treeId+"-helped"} style={{fontWeight:700,fontSize:14}}>Co pomogło Ci wytrwać w tym nawyku?</label>
      <textarea id={treeId+"-helped"} value={helped} maxLength={500} rows={2}
        onChange={event=>{setHelped(event.target.value);setSaved(false)}}
        style={{border:"1px solid #c8dacf",borderRadius:12,padding:12,font:"inherit",resize:"vertical"}}/>
      <label htmlFor={treeId+"-next"} style={{fontWeight:700,fontSize:14}}>Co następnym razem zrobisz inaczej?</label>
      <textarea id={treeId+"-next"} value={nextTime} maxLength={500} rows={2}
        onChange={event=>{setNextTime(event.target.value);setSaved(false)}}
        style={{border:"1px solid #c8dacf",borderRadius:12,padding:12,font:"inherit",resize:"vertical"}}/>
      <button type="submit" disabled={saving || (!helped.trim()&&!nextTime.trim())}
        style={{padding:"12px 14px",borderRadius:12,border:0,fontWeight:700,
          background:"#326c4a",color:"white",opacity:saving||(!helped.trim()&&!nextTime.trim())?.55:1}}>
        {saving?"Zapisywanie…":"Zapisz moją refleksję"}
      </button>
      {saved && <p role="status" style={{margin:0,color:"#346f4a",fontSize:13}}>✓ Refleksja zapisana. Możesz ją później uzupełnić.</p>}
      {error && <p role="alert" style={{margin:0,color:"#a02626",fontSize:13}}>{error}</p>}
    </form>}
  </section>
}
