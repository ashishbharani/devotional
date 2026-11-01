"""Finite, auditable local regression runner. Never merges, deploys or edits data."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import time

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'work/release-qa'
UV = shutil.which('uv') or 'uv'
NODE = shutil.which('node') or 'node'
py = lambda script, *args: [UV, 'run', 'python', script, *args]
js = lambda script: [NODE, 'scripts/' + script + '.mjs']
STEPS = [
 ('default-build', [UV,'run','mkdocs','build','--strict'], False),
 ('default-gate', py('scripts/test_practice_release_gate.py','disabled'), False),
 ('default-seo', py('scripts/test_seo_structure.py','disabled'), False),
 ('preview-build', [UV,'run','mkdocs','build','--strict'], True),
 ('preview-gate', py('scripts/test_practice_release_gate.py','enabled'), True),
 ('preview-seo', py('scripts/test_seo_structure.py','enabled'), True),
 ('panchang', js('test_panchang'), True), ('ephemeris', js('test_ephemeris'), True),
 ('hook', [UV,'run','python','-I','scripts/test_homepage_hook.py'], True),
 *[(name,py('scripts/'+script+'.py'),True) for name,script in [
  ('site','check_site'),('metadata','test_social_metadata'),('pager','test_section_pager'),
  ('i18n','check_i18n'),('pdfs','check_project_pdfs'),('reading-data','test_reading_links'),('deity-art','test_deity_art')]],
 ('search-unit',js('test_universal_search'),True),('festival-unit',js('test_festival_themes'),True),('lab-unit',js('test_lab_metrics'),True),
 *[(name,js(script),True) for name,script in [
  ('search-browser','test_search_browser'),('project-info','test_project_info_browser'),
  ('panchang-browser','test_panchang_browser'),('navigation','test_navigation'),
  ('royal-home','test_royal_homepage'),('sacred-site','test_sacred_site'),
  ('plugins','test_hdc_plugins_browser'),('approved-header','test_approved_header_browser'),
  ('header-fidelity','test_header_fidelity_browser'),('translation','test_translation_browser'),
  ('reading-browser','test_reading_links_browser'),('feedback','test_feedback_browser'),
  ('daily','test_daily_darshan_browser'),('practice','test_practice_browser'),
  ('continuation','test_continuation_browser'),
  ('routine-library','test_routine_library_browser'),
  ('festivals','test_festival_browser'),('journeys','test_journey_discovery_browser'),
  ('design-system','test_design_system_browser'),('pwa-upgrade','test_pwa_upgrade_browser'),
  ('pwa-release','test_pwa_release_browser')]],
]
PROTECTED = ['data/collection.json','data/corrections.csv','data/additions.csv','data/search-registry.json',
 'docs/assets/panchang/astronomy.mjs','docs/assets/panchang/panchang-adapter.mjs',
 'docs/assets/ephemeris/ephemeris-engine.mjs','docs/assets/ephemeris/time-conversion.mjs',
 'docs/javascripts/abp-firebase-config.js','firestore.rules',
 'hooks/sw.template.js','docs/assets/panchang/settings.mjs',
 'docs/assets/images/royal-home/temple-ghat-hero.webp','docs/assets/images/hdc-brand/source.json']
def hashes():
 return {name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in PROTECTED}
def main():
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--only',nargs='+',choices=[s[0] for s in STEPS])
 args=parser.parse_args();OUT.mkdir(parents=True,exist_ok=True)
 run=OUT/'runs'/str(time.time_ns());run.mkdir(parents=True)
 report={'started':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'mode':'selected' if args.only else 'full',
  'limitations':['Not field Core Web Vitals','No physical-device installation certification','No real authenticated cloud-sync test','Remaining editorial/festival/source gaps still block final release'],
  'state':'running','planned':[s[0] for s in STEPS if not args.only or s[0] in args.only],
  'gitHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
  'gitStatusBefore':subprocess.check_output(['git','status','--short'],cwd=ROOT,text=True),
  'protectedBefore':hashes(),'results':[]}
 def record():
  temp=OUT/'validation.tmp';temp.write_text(json.dumps(report,indent=2),encoding='utf-8');temp.replace(OUT/'validation.json')
 record()
 for name,command,preview in STEPS:
  if args.only and name not in args.only:continue
  print('START '+name,flush=True);started=time.monotonic();env=os.environ.copy();env['HDC_PRACTICE_PREVIEW']='1' if preview else ''
  log_path=run/(name+'.log')
  with log_path.open('w',encoding='utf-8') as log:
   try:
    result=subprocess.run(command,cwd=ROOT,env=env,stdout=log,stderr=subprocess.STDOUT,timeout=1800)
    code=result.returncode
   except (OSError,subprocess.TimeoutExpired) as error:
    log.write(str(error));code=-1
  report['results'].append({'name':name,'command':command,'preview':preview,'returnCode':code,'seconds':round(time.monotonic()-started,2),'log':log_path.relative_to(OUT).as_posix()})
  record();print(('PASS ' if code==0 else 'FAIL ')+name,flush=True)
  if code and name in {'default-build','preview-build'}:break # do not audit a partial artifact
 report['protectedAfter']=hashes();report['protectedUnchanged']=report['protectedBefore']==report['protectedAfter']
 report['allStepsExecuted']=len(report['results'])==len(report['planned'])
 report['state']='passed' if report['allStepsExecuted'] and report['protectedUnchanged'] and not any(r['returnCode'] for r in report['results']) else 'failed'
 record();(run/'validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
 assert report['protectedUnchanged'],'Protected source data changed during validation'
 raise SystemExit(1 if any(r['returnCode'] for r in report['results']) else 0)
if __name__=='__main__':main()
