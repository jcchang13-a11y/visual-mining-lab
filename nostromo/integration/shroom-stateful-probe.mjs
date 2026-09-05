import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const compact=(s,n=1200)=>String(s??'').replace(/\s+/g,' ').trim().slice(0,n);
const hash=s=>crypto.createHash('sha256').update(String(s)).digest('hex').slice(0,16);
const IDS=['01','02','03','04','05','06','07','08','09','10'];

function profileTrace(events,id){
  const history=events.filter(e=>(e.participants||[]).includes(id)||(e.silent||[]).includes(id));
  let visible=0,silent=0,switches=0,previous=null,currentStreak=0;
  const modes=[];
  for(const e of history){
    const mode=(e.silent||[]).includes(id)?'silent':'participant';
    modes.push(mode);
    if(mode==='participant')visible++; else silent++;
    if(previous&&previous!==mode)switches++;
    currentStreak=previous===mode?currentStreak+1:1;
    previous=mode;
  }
  const latest=history.at(-1)||events.at(-1)||{};
  const latestMode=(latest.silent||[]).includes(id)?'silent':'participant';
  const total=Math.max(1,visible+silent);
  const recentModes=modes.slice(-3);
  const recentVisible=recentModes.filter(x=>x==='participant').length;
  const recentParticipationRate=recentModes.length?Number((recentVisible/recentModes.length).toFixed(3)):0;
  return {id,visible,silent,switches,latestMode,currentStreak,recentWindow:recentModes.length,recentParticipationRate,latestRound:latest.round||null,latestEvent:latest.event||null,participationRate:Number((visible/total).toFixed(3)),historyFingerprint:hash(history.map(e=>`${e.round}|${e.event}|${(e.participants||[]).includes(id)?'P':'S'}`).join(';'))};
}

function chooseDisposition(p){
  if(p.latestMode==='silent'&&p.currentStreak>=2)return {disposition:'SILENCE_RECOVERY',lens:'missing-position',preferredOrgan:'SHROOMING',reason:'trace is in a recent silent streak'};
  if(p.latestMode==='participant'&&p.currentStreak>=2&&p.recentParticipationRate>=0.667)return {disposition:'DOMINANCE_CHECK',lens:'counter-position',preferredOrgan:'VAJRA',reason:'trace is in a recent participation streak'};
  if(p.switches>=2)return {disposition:'INSTABILITY_AUDIT',lens:'transition',preferredOrgan:'VAJRA',reason:'trace repeatedly changes visible/silent mode'};
  if(p.participationRate<=0.35)return {disposition:'SILENCE_RECOVERY',lens:'missing-position',preferredOrgan:'SHROOMING',reason:'trace is historically under-represented'};
  if(p.participationRate>=0.8)return {disposition:'DOMINANCE_CHECK',lens:'counter-position',preferredOrgan:'VAJRA',reason:'trace is historically over-represented'};
  return {disposition:'BALANCED_READING',lens:'position',preferredOrgan:'SHROOMING',reason:'trace has mixed participation history'};
}

export async function shroomStatefulProbe({question='',statePath='greenhouse/r101-r110-open-social-ontology.json'}={}){
  const q=compact(question); if(!q)throw new Error('SHROOM_STATEFUL_QUESTION_REQUIRED');
  const state=JSON.parse(await fs.readFile(statePath,'utf8'));
  const events=Array.isArray(state.events)?state.events:[]; if(!events.length)throw new Error('SHROOM_STATEFUL_HISTORY_REQUIRED');
  const reactions=IDS.map(id=>{
    const profile=profileTrace(events,id),choice=chooseDisposition(profile);
    return {trace:id,...profile,...choice,questionFingerprint:hash(q),observation:`${choice.disposition} / ${choice.lens}: ${q}`};
  });
  return {executor:'SHROOMING_STATEFUL_HISTORY_PROBE',version:'0.2-candidate',status:'EXECUTED',source:statePath,questionFingerprint:hash(q),reactions,behaviorFingerprint:hash(reactions.map(r=>`${r.trace}|${r.disposition}|${r.preferredOrgan}|${r.latestMode}|${r.currentStreak}|${r.recentParticipationRate}`).join(';')),boundary:'ISOLATED DETERMINISTIC CANDIDATE. Behavior is conditioned by each trace’s recorded participation/silence history, including bounded recent streak and recent participation context, rather than assigning ten fixed lenses or collapsing history into lifetime totals. It does not mutate formal greenhouse history, claim ten persistent LLMs, infer personality, perform semantic learning, or prove causal path dependence.'};
}
