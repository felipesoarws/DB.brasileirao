import {useEffect,useRef,useState} from 'react';

export type TeamOption={id:string;name:string;color?:string|null};
type TeamSelectProps={name:string;label:string;teams:TeamOption[];value:string;placeholder?:string;excludeIds?:string[];autoSubmit?:boolean;onChange?:(value:string)=>void};

const initials=(name:string)=>name.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('').toUpperCase();

export default function TeamSelect({name,label,teams,value,placeholder='Selecione um time',excludeIds=[],autoSubmit=false,onChange}:TeamSelectProps){
  const rootRef=useRef<HTMLDivElement>(null),triggerRef=useRef<HTMLButtonElement>(null);
  const [open,setOpen]=useState(false),[search,setSearch]=useState('');
  const selected=teams.find(team=>team.id===value);
  const visible=teams.filter(team=>team.name.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
  useEffect(()=>{if(!open)return;const closeOutside=(event:PointerEvent)=>{if(!rootRef.current?.contains(event.target as Node))setOpen(false)};const closeEscape=(event:KeyboardEvent)=>{if(event.key==='Escape'){setOpen(false);triggerRef.current?.focus()}};document.addEventListener('pointerdown',closeOutside);document.addEventListener('keydown',closeEscape);return()=>{document.removeEventListener('pointerdown',closeOutside);document.removeEventListener('keydown',closeEscape)}},[open]);
  const choose=(teamId:string)=>{onChange?.(teamId);setOpen(false);setSearch('');if(autoSubmit)window.requestAnimationFrame(()=>triggerRef.current?.closest('form')?.requestSubmit())};
  return <div className="team-select" ref={rootRef}>
    <span className="team-select-label">{label}</span>
    <input type="hidden" name={name} value={value}/>
    <button ref={triggerRef} className="team-select-trigger" type="button" aria-haspopup="listbox" aria-expanded={open} aria-label={label} onClick={()=>setOpen(current=>!current)}>
      {selected?<span className="team-select-current"><span className="team-select-crest"><span>{initials(selected.name)}</span><img key={selected.id} src={`/api/team-logo/${encodeURIComponent(selected.id)}`} alt="" onError={event=>{event.currentTarget.style.display='none'}}/></span><span className="team-select-current-name">{selected.name}</span></span>:<span className="team-select-placeholder">{placeholder}</span>}
      <span className="team-select-chevron" aria-hidden="true">⌄</span>
    </button>
    {open&&<div className="team-select-menu">
      <input className="team-select-search" type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Buscar time..." aria-label={`Buscar ${label.toLocaleLowerCase('pt-BR')}`}/>
      <div className="team-select-options" role="listbox" aria-label={label}>
        {!search&&<button type="button" role="option" aria-selected={!value} className={`team-select-option${!value?' is-selected':''}`} onClick={()=>choose('')}><span className="team-select-crest is-empty">—</span><span>{placeholder}</span></button>}
        {visible.map(team=>{const disabled=excludeIds.includes(team.id);return <button type="button" role="option" aria-selected={team.id===value} disabled={disabled} className={`team-select-option${team.id===value?' is-selected':''}`} key={team.id} onClick={()=>choose(team.id)}><span className="team-select-crest"><span>{initials(team.name)}</span><img src={`/api/team-logo/${encodeURIComponent(team.id)}`} alt="" loading="lazy" onError={event=>{event.currentTarget.style.display='none'}}/></span><span className="team-select-option-name">{team.name}</span>{team.id===value&&<span className="team-select-check" aria-hidden="true">✓</span>}</button>})}
        {!visible.length&&<span className="team-select-empty">Nenhum time encontrado.</span>}
      </div>
    </div>}
  </div>;
}
