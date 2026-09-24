import {useEffect,useRef,useState} from 'react';

export type StyledSelectOption={value:string;label:string;disabled?:boolean};
type Props={name:string;label:string;value:string;options:StyledSelectOption[];onChange?:(value:string)=>void;className?:string};

export default function StyledSelect({name,label,value,options,onChange,className=''}:Props){
  const [open,setOpen]=useState(false),[current,setCurrent]=useState(value),root=useRef<HTMLDivElement>(null),selected=options.find(option=>option.value===current);
  useEffect(()=>{const close=(event:MouseEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false)};const key=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false)};document.addEventListener('mousedown',close);document.addEventListener('keydown',key);return()=>{document.removeEventListener('mousedown',close);document.removeEventListener('keydown',key)}},[]);
  useEffect(()=>setCurrent(value),[value]);
  return <div className={`team-select styled-select ${className}`} ref={root}>
    <span className="team-select-label" id={`${name}-label`}>{label}</span>
    <input type="hidden" name={name} value={current}/>
    <button type="button" className="team-select-trigger" aria-haspopup="listbox" aria-expanded={open} aria-labelledby={`${name}-label`} onClick={()=>setOpen(current=>!current)}>
      <span className={selected?'team-select-current-name':'team-select-placeholder'}>{selected?.label||'Selecione'}</span><span className="team-select-chevron" aria-hidden="true">⌄</span>
    </button>
    {open&&<div className="team-select-menu"><div className="team-select-options" role="listbox" aria-labelledby={`${name}-label`}>
      {options.map(option=><button type="button" role="option" aria-selected={option.value===current} disabled={option.disabled} className={`team-select-option${option.value===current?' is-selected':''}`} key={option.value} onClick={()=>{setCurrent(option.value);onChange?.(option.value);setOpen(false)}}><span className="team-select-option-name">{option.label}</span>{option.value===current&&<span className="team-select-check" aria-hidden="true">✓</span>}</button>)}
    </div></div>}
  </div>;
}
