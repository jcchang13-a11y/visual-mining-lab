// ZENOMORPH usefulness runner v0.1.0
// Reads a completed cross-food robustness receipt and evaluates whether the
// candidate improved structural routing rather than merely changing it.
import fs from 'node:fs/promises';
import {evaluateCrossFoodUsefulness} from './big-meal-usefulness-gate.mjs';

export async function runUsefulnessGate({inputPath,outputPath=null}={}){
  if(!inputPath) throw new Error('INPUT_PATH_REQUIRED');
  const robustness=JSON.parse(await fs.readFile(inputPath,'utf8'));
  const result={
    ...evaluateCrossFoodUsefulness(robustness),
    observedAt:new Date().toISOString(),
    sourceRobustnessSchema:robustness?.schema||null,
    stableUnchanged:Array.isArray(robustness?.heldouts)&&robustness.heldouts.every(x=>x.stableUnchanged===true)
  };
  if(outputPath) await fs.writeFile(outputPath,JSON.stringify(result,null,2)+'\n','utf8');
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`){
  const inputArg=process.argv.find(x=>x.startsWith('--input='));
  const outputArg=process.argv.find(x=>x.startsWith('--output='));
  const result=await runUsefulnessGate({inputPath:inputArg?inputArg.slice(8):null,outputPath:outputArg?outputArg.slice(9):null});
  console.log(JSON.stringify(result,null,2));
}
