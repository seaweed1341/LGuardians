// Presentation workflow. All changes remain local; integration points are in README.
const menus = {home:'홈',board:'이슈 보드',screening:'검증 선별',security:'보안 검증',results:'결과처리'};
let screeningFilters={preset:'all',min:'',max:'',query:'',source:'all',component:'all',configured:false};
let screeningBatch=[],screeningSelection=new Set(),screeningResult=false,manualSelection=false;
let screeningTimer=null;
const statusLabel=i=>stateNames[i.state]||i.state;
const hasDetail=i=>i.detail===true;
const isCompleted=i=>i.state==='done'&&i.deployment==='complete';
const btn=(action,label,extra='')=>`<button class="btn" data-action="${action}" ${extra}>${label}</button>`;
const pageTitle=(title,extra='')=>`<div class="pagehead"><h1>${title}</h1>${extra}</div>`;
const findIssue=id=>issues.find(i=>i.id===id);

function go(v){
  stopAuto(); notificationOpen=false; view=menus[v]?v:'home'; detailTab='history';
  if(view==='home')selectedAgent=null;
  render();window.scrollTo(0,0);
}
function openIssue(id){
  const i=findIssue(id);if(!i)return;
  stopAuto();selectedIssue=id;
  if(!hasDetail(i))return issuePreview(i);
  detailPhase=phaseKey(issuePhaseIndex(i));detailTab='history';resultTab='patch';
  view='detail';$('dialog').close();render();window.scrollTo(0,0);
}
function render(){
  document.body.classList.toggle('paused',!motion);
  const active=view==='detail'?(['incoming','screening','screened'].includes(getIssue().state)?'screening':'security'):view;
  for(const key of Object.keys(menus))$('nav-'+key).classList.toggle('active',key===active);
  $('notification-count').textContent=issues.filter(i=>i.state==='review').length;
  const screens={home:homeScreen,board:boardScreen,screening:screeningScreen,security:securityScreen,results:resultsScreen,detail:detail};
  $('app').innerHTML=`<div class="screen">${(screens[view]||homeScreen)()}${footer()}</div>`;
  const np=$('notification-panel');np.innerHTML=notificationPanel();np.classList.toggle('hidden',!notificationOpen);
  $('notification-button').setAttribute('aria-expanded',String(notificationOpen));
  if(!motion)document.querySelector('.wires')?.pauseAnimations();
}
function homeScreen(){
  const running=issues.filter(i=>i.state==='running').length,queued=issues.filter(i=>i.state==='queued').length;
  const stats=[['board',issues.length],['screening',issues.filter(i=>i.disposition==='investigate'&&['incoming','screening','screened'].includes(i.state)).length],['security',running+queued+issues.filter(i=>i.state==='review').length],['results',issues.filter(isCompleted).length]];
  return `${pageTitle('홈',`<span class="workflow-status"><b>진행 중 ${running}</b><span>대기 ${queued}</span></span>`)}<div class="summary">${stats.map(([k,n])=>`<button class="stat" data-go="${k}"><strong>${n}</strong><span>${menus[k]} →</span></button>`).join('')}</div>${workflow().replace(/<div class="pagehead compact-title">[^]*?<\/div><div class="workflow-layout/, '<div class="workflow-layout')}`;
}
function boardScreen(){
  const quick=issues.filter(i=>i.disposition==='quick'),pending=quick.filter(i=>i.state!=='dismissed');
  return `${pageTitle('이슈 보드')}<div class="dashboard-grid"><section class="panel"><div class="sectionhead"><h2>이슈 목록 <span class="muted small">${issues.length}</span></h2><span class="tag gray">전체 유입 이슈</span></div><p class="small muted panel-intro">추가 검토가 필요한 이슈는 검증 선별에서 확인하세요.</p>${metadataTable(issues)}<div class="end-actions"><button class="btn" data-go="screening">검증 선별로 이동 →</button></div></section><aside class="panel"><div class="sectionhead"><h2>빠른 조치</h2><span class="tag">${pending.length}건</span></div><p class="small muted">Not a bug · 검증 없이 처리 가능한 항목</p><button class="btn full" data-action="quick-all" ${pending.length?'':'disabled'}>전체 자동 조치 →</button><div class="queue-scroll">${quick.map(i=>`<article class="queue-item"><div class="row">${riskTag(i)}${sourceTag(i)}</div><h3>${esc(i.title)}</h3><p class="mono small muted">${i.id}</p><p class="small muted">${esc(i.quickReason)}</p>${i.state==='dismissed'?'<span class="tag green">조치 완료 · Not a bug</span>':`<button class="btn secondary" data-quick="${i.id}">자동 조치 →</button>`}</article>`).join('')}</div></aside></div>`;
}
function metadataTable(list,mode='board'){
  return `<div class="tablewrap ${mode==='board'?'board-table':''}"><table><thead><tr>${manualSelection&&mode==='screening'?'<th><input type="checkbox" id="select-all" aria-label="실행 가능한 이슈 전체 선택" '+(eligibleResults().length&&eligibleResults().every(i=>screeningSelection.has(i.id))?'checked':'')+'></th>':''}<th>위험도</th><th>이슈 / 검토 대상</th><th>${mode==='screening'?'Component · CWE':'처리 상태'}</th><th>${mode==='screening'?'사전 검증 결과':'담당자'}</th><th></th></tr></thead><tbody>${list.map(i=>`<tr>${manualSelection&&mode==='screening'?`<td><input type="checkbox" data-select="${i.id}" aria-label="${i.id} 선택" ${canQueue(i)?'':'disabled'} ${screeningSelection.has(i.id)?'checked':''}></td>`:''}<td>${riskTag(i)}${mode==='screening'?`<small class="cvss">CVSS ${i.cvss.toFixed(1)}</small>`:''}</td><td><button data-issue="${i.id}"><b>${esc(i.title)}</b><br><span class="muted mono">${i.id}</span></button></td><td>${mode==='screening'?`<span class="mono small">${esc(i.module)}<br>${i.cwe}</span>`:`<span class="tag ${i.state==='done'||i.state==='dismissed'?'green':'gray'}">${statusLabel(i)}</span>`}</td><td>${mode==='screening'?`<span class="tag ${i.screeningOutcome==='candidate'?'green':'gray'}">${screeningText(i)}</span>`:esc(i.owner==='minsuk.kang'?'나':i.owner)}</td><td><button data-issue="${i.id}" aria-label="${i.id} 확인">↗</button></td></tr>`).join('')}</tbody></table>${list.length?'':'<div class="empty">조건에 맞는 이슈가 없습니다.</div>'}</div><p class="small muted table-count">${list.length}건 표시</p>`;
}
function screeningCandidates(){return issues.filter(i=>i.disposition==='investigate');}
function filteredCandidates(){
  const f=screeningFilters;
  return screeningCandidates().filter(i=>{
    const range=f.preset==='high'?i.cvss>=7:f.preset==='low'?i.cvss<7:f.preset==='custom'?i.cvss>=Number(f.min||0)&&i.cvss<=Number(f.max||10):true;
    return range&&(f.source==='all'||i.source===f.source)&&(f.component==='all'||i.component===f.component)&&(!f.configured||i.detail)&&(i.id+' '+i.title+' '+i.module+' '+i.cwe).toLowerCase().includes(f.query.toLowerCase());
  });
}
function canQueue(i){return i.detail&&i.screeningOutcome==='candidate'&&['screened','queued','running','review','done','rejected'].includes(i.state);}
function eligibleResults(){return screeningBatch.map(findIssue).filter(i=>i&&canQueue(i));}
function screeningText(i){
  if(i.state==='screening')return '선별 대기 · 실행 중';
  if(['queued','running','review','done','rejected'].includes(i.state)&&canQueue(i))return '재현 확인 · 다시 등록 가능';
  if(i.state==='queued')return '보안 검증 대기';
  if(i.screeningOutcome==='candidate')return '재현 확인 · 검증 필요';
  if(i.screeningOutcome==='skip')return '실행 대상 미구성 · 제외';
  return i.detail?'코드 실행 가능':'실행 대상 미구성';
}
function filterControls(){
  const f=screeningFilters,list=filteredCandidates();
  return `<section class="panel"><div class="sectionhead"><h2>선택 기준 · CVSS 점수 범위</h2><button class="btn ghost" data-action="screen-reset">필터 초기화</button></div><div class="screen-filter-row"><div class="chips">${[['all','전체'],['high','7.0 이상'],['low','7.0 미만']].map(([v,l])=>`<button class="chip ${f.preset===v?'active':''}" data-preset="${v}" aria-pressed="${f.preset===v}">${l}</button>`).join('')}</div><div class="range-fields"><span class="small muted">직접 지정</span><input type="number" min="0" max="10" step="0.1" id="cvss-min" aria-label="최소 CVSS" placeholder="최소" value="${esc(f.min)}"><span>–</span><input type="number" min="0" max="10" step="0.1" id="cvss-max" aria-label="최대 CVSS" placeholder="최대" value="${esc(f.max)}"><button class="btn secondary" data-action="apply-range">적용</button></div><input class="screen-search" id="screen-query" placeholder="Ticket, 요약, component 검색" aria-label="선별 이슈 검색" value="${esc(f.query)}"></div><div class="screen-filter-row second"><select id="screen-source" aria-label="입력 경로 필터"><option value="all">전체 입력</option>${['보안 티켓','CCC'].map(x=>`<option ${f.source===x?'selected':''}>${x}</option>`).join('')}</select><select id="screen-component" aria-label="컴포넌트 필터"><option value="all">전체 Component</option>${['MS_TV','MS_ID','All'].map(x=>`<option ${f.component===x?'selected':''}>${x}</option>`).join('')}</select><label class="checklabel"><input type="checkbox" id="screen-configured" ${f.configured?'checked':''}>실행 가능한 대상만</label><span id="filter-count" class="small muted">선택 범위 ${list.length}건 · 상세 시연 대상 ${list.filter(hasDetail).length}건</span><button class="btn" data-action="run-screening" ${screeningTimer||!list.length?'disabled':''}>선별 대기큐에 추가 · 사전 검증 실행 →</button></div><p class="small muted">코드 탐색과 1회 실행·테스트로 보안 검증 필요 여부를 확인합니다.</p><p class="small error" id="range-error" role="alert"></p></section>`;
}
function screeningScreen(){
  const list=filteredCandidates(),batch=screeningBatch.map(findIssue).filter(Boolean),levels=['Critical','High','Medium','Low'];
  if(screeningResult){
    const avg=batch.length?batch.reduce((n,i)=>n+i.cvss,0)/batch.length:0;
    return `${pageTitle('검증 선별',`<button class="btn secondary" data-action="back-filters">필터 다시 설정</button>`)}<div class="summary">${[['표시 이슈',batch.length],['평균 CVSS',avg.toFixed(1)],['검증 가능',eligibleResults().length],['Critical',batch.filter(i=>i.risk==='Critical').length]].map(([l,n])=>`<div class="stat"><strong>${n}</strong><span>${l}</span></div>`).join('')}</div><div class="screen-results-grid"><aside class="panel"><h2>심각도 분포</h2><p class="small muted">현재 필터링 결과</p>${levels.map(l=>{const n=batch.filter(i=>i.risk===l).length;return `<div class="distribution"><div class="spread"><span>${l}</span><b>${n}건</b></div><div class="bar ${l.toLowerCase()}"><i style="width:${batch.length?n/batch.length*100:0}%"></i></div></div>`}).join('')}<div class="notice">상세 시연 대상은 2개입니다. 실행 대상이 구성된 이슈만 보안 검증 대기열에 등록할 수 있습니다.</div></aside><section class="panel"><div class="sectionhead"><h2>필터링 결과 <span class="small muted">${batch.length}건</span></h2><span class="tag green">사전 검증 완료</span></div>${metadataTable(batch,'screening')}</section></div><div class="end-actions">${manualSelection?`<span class="muted">${screeningSelection.size}개 선택</span><button class="btn" data-action="queue-selected" ${screeningSelection.size?'':'disabled'}>선택한 이슈를 보안 검증 대기열로 →</button>`:`<button class="btn" data-action="manual-select" ${eligibleResults().length?'':'disabled'}>직접 선택하기 ↗</button><button class="btn dark" data-action="queue-all" ${eligibleResults().length?'':'disabled'}>필터된 검증 대상을 대기열로 · ${eligibleResults().length}건 →</button>`}</div><p class="small muted">이미 등록된 대상도 대기열로 다시 보낼 수 있습니다. 다시 등록하면 해당 대상의 진행 및 결과를 초기화하고 1라운드부터 시연합니다.</p>`;
  }
  return `${pageTitle('검증 선별')}<div class="stack">${filterControls()}<section class="panel"><div class="sectionhead"><h2>티켓 현황 요약</h2><span class="tag gray">현재 필터 기준</span></div><div class="tablewrap"><table><thead><tr><th>구분</th>${levels.map(l=>`<th>${l}</th>`).join('')}<th>전체</th></tr></thead><tbody>${[['추가 검토 대상',list],['실행 대상 구성됨 · 상세 시연 가능',list.filter(hasDetail)]].map(([name,rows])=>`<tr><td>${name}</td>${levels.map(l=>`<td>${rows.filter(i=>i.risk===l).length}</td>`).join('')}<td><b>${rows.length}</b></td></tr>`).join('')}</tbody></table></div></section><section class="panel"><div class="sectionhead"><h2>선별 대기큐</h2><span class="tag ${screeningTimer?'':'gray'}">${screeningTimer?'코드 탐색 · 1회 테스트 중':batch.length+'건'}</span></div>${batch.length?`<div class="screening-queue">${batch.map(i=>`<div class="assetrow"><b>${i.id}</b><span>${screeningText(i)}</span></div>`).join('')}</div>${screeningTimer?'<div class="loading-line"></div>':''}`:'<div class="empty">필터를 설정한 뒤 사전 검증을 실행하세요.</div>'}</section></div>`;
}
function securityScreen(){
  const running=issues.filter(i=>i.state==='running'),finished=issues.filter(i=>['review','done','rejected'].includes(i.state)),queued=issues.filter(i=>i.state==='queued');
  return `${pageTitle('보안 검증')}<div class="dashboard-grid"><div class="stack"><section class="panel"><div class="sectionhead"><h2>라운드 진행 중 <span class="small muted">${running.length}</span></h2></div>${runningCarousel(running)}</section><section class="panel"><div class="sectionhead"><h2>검증 대기열 <span class="tag gray">${queued.length}</span></h2><button class="btn ghost" data-go="screening">검증 대상 추가 →</button></div>${queued.length?`<div class="tablewrap"><table><thead><tr><th>위험도</th><th>이슈 / 검토 대상</th><th>담당자</th><th>동작</th></tr></thead><tbody>${queued.map(i=>`<tr><td>${riskTag(i)}</td><td><button data-issue="${i.id}"><b>${esc(i.title)}</b><br>${i.id}</button></td><td>${esc(i.owner)}</td><td><div class="btns"><button class="btn" data-start="${i.id}">검증 시작 →</button><button class="btn ghost" data-cancel="${i.id}">취소</button></div></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">대기 중인 검증이 없습니다.</div>'}</section></div><aside class="panel"><div class="sectionhead"><h2>완료된 라운드</h2><span class="tag">${finished.length}</span></div><div class="queue-scroll">${finished.map(i=>`<article class="queue-item"><div class="row">${riskTag(i)}${sourceTag(i)}</div><h3>${esc(i.title)}</h3><p class="mono small muted">${i.id}</p><p class="small muted">${i.state==='review'?'패치 검증 완료 · 승인 대기':i.state==='rejected'?'패치 거절': '패치 승인 · 배포 완료'}</p><button class="btn full" data-issue="${i.id}">패치 및 검증 결과 확인 →</button></article>`).join('')||'<div class="empty">완료된 라운드가 없습니다.</div>'}</div></aside></div>`;
}
function detail(){
  const i=getIssue(),before=['incoming','screening','screened'].includes(i.state);
  const current=issuePhaseIndex(i);if(['prepare','battle','result'].indexOf(detailPhase)>current)detailPhase=phaseKey(current);
  const body=before||i.state==='queued'?screeningDetail(i):detailPhase==='prepare'?informationPhase(i):detailPhase==='battle'?battle(i,current>1):result(i);
  return `<div class="bread"><button data-go="${before?'screening':'security'}">← ${before?'검증 선별':'보안 검증'}</button> / ${i.id}</div><div class="pagehead"><div><div class="row"><h1>${esc(i.title)}</h1>${riskTag(i)}</div><p class="small muted">${esc(i.module)} · ${i.cwe} · CVSS ${i.cvss}</p></div><div class="toolbar"><span class="small muted">담당자 ${esc(i.owner)}</span><button class="btn secondary" data-action="ticket">원본 티켓 ↗</button></div></div>${before||i.state==='queued'?'':phaseNavigation(i)}${i.state==='running'?`<div class="playback"><span class="small muted">DEMO · 라운드 진행 시연</span><div class="btns"><button class="btn secondary" data-action="advance">다음 단계 →</button><button class="btn" data-action="auto">${auto?'자동 진행 중지':'자동 진행'}</button></div></div>`:''}${i.feedback?`<div class="notice">패치 거절 사유: ${esc(i.feedback)}</div>`:''}${body}`;
}
function screeningDetail(i){return `<div class="detail-grid"><section class="panel"><h2>코드 탐색 · 사전 검증</h2><p>${esc(i.desc)}</p><dl class="meta-grid"><dt>대상</dt><dd>${esc(i.module)}</dd><dt>실행 환경</dt><dd>격리된 데모 환경 · target.json 구성됨</dd><dt>테스트</dt><dd>${i.patch.test}</dd><dt>실행 결과</dt><dd>${i.screeningOutcome==='candidate'?'1회 테스트에서 재현 · 공격/방어 검증 필요':'사전 검증 실행 전'}</dd></dl><pre class="code">${esc(i.patch.before)}</pre></section><aside class="panel"><h2>다음 단계</h2><p class="small muted">${screeningText(i)}</p>${i.state==='queued'?`<button class="btn full" data-start="${i.id}">보안 검증 시작 →</button>`:canQueue(i)?`<button class="btn full" data-queue-one="${i.id}">보안 검증 대기열로 →</button>`:`<button class="btn full" data-go="screening">선별 화면으로 →</button>`}</aside></div>`;}
function result(i){
  return `<div class="success-banner"><div class="spread"><div><h2>${i.state==='done'?'패치 승인 · 배포 완료':i.state==='rejected'?'패치 거절':'수정안 검증 완료 · 패치 승인 대기'}</h2><p class="small">공격·방어 검증을 마쳤습니다. 변경 코드와 영향도 분석을 확인하세요.</p></div>${stateTag(i)}</div></div><div class="result-metrics"><div><span>재공격 검증</span><b>차단 확인</b><span>${i.round}라운드 검토 기록</span></div><div><span>회귀 테스트</span><b>${i.patch.tests}</b><span>데모 테스트 전체 통과</span></div><div><span>변경 규모</span><b>${i.patch.size}</b><span>데모 코드 발췌</span></div></div><div class="detail-grid"><div class="stack"><section class="panel"><div class="sectionhead"><h2>생성된 산출물</h2><span class="tag gray">패치 검증 완료</span></div><div class="tabs">${[['patch','Patch'],['evidence','검증 근거'],['owner','담당자']].map(([k,l])=>`<button data-resulttab="${k}" class="${resultTab===k?'active':''}">${l}</button>`).join('')}</div>${resultTab==='patch'?`<p class="small muted">${esc(i.module)} · 실행용 코드 발췌</p><pre class="code"><span class="del">${esc(i.patch.before)}</span>\n<span class="add">${esc(i.patch.after)}</span></pre>`:resultTab==='evidence'?`<h3>${esc(i.patch.test)}</h3><div class="notice">수정 전: ${esc(i.patch.beforeResult)}<br>수정 후: ${esc(i.patch.afterResult)}<br>회귀 테스트 ${i.patch.tests} 통과</div>`:`<dl class="meta-grid"><dt>담당자</dt><dd>${esc(i.owner)}</dd><dt>원본 티켓</dt><dd>${i.id}</dd><dt>패치 상태</dt><dd>${statusLabel(i)}</dd></dl>`}</section><section class="panel"><div class="sectionhead"><h2>검증 기록</h2><button class="btn ghost" data-action="history-dialog">라운드 이력 보기 ↗</button></div><div class="assetrow"><span>담당자 매핑</span><span>${esc(i.owner)} · 완료</span></div><div class="assetrow"><span>재현 · 수정 전후 · 회귀 근거</span><span>준비 완료</span></div><div class="assetrow"><span>오픈소스 기여</span><span>${i.oss?'보고 가능한 항목 발견':'대상 아님'}</span></div></section></div><aside class="panel"><h2>다음 할 일</h2><p class="small muted">영향도 분석을 확인하고 패치를 승인하거나 거절하세요.</p><div class="stack approval-actions"><button class="btn full" data-action="impact">영향도 분석 확인 ↗</button>${i.state==='review'?`<button class="btn full" data-action="approve" ${i.impactReviewed?'':'disabled'}>패치 승인 및 배포 →</button><button class="btn secondary full" data-action="reject">패치 거절</button>${!i.impactReviewed?'<p class="small muted">영향도 분석 확인 후 승인이 가능합니다.</p>':''}`:i.state==='done'?'<button class="btn full" data-go="results">결과처리로 이동 →</button>':'<span class="tag gray">거절된 패치는 배포되지 않습니다.</span>'}</div><p class="workingnote">DEMO · 승인 시 배포 완료 상태를 시뮬레이션합니다.</p></aside></div>`;
}
function resultsScreen(){
  const done=issues.filter(isCompleted);
  return `${pageTitle('결과처리')}<section class="panel results-panel"><div class="sectionhead"><h2>패치 완료 <span class="small muted">${done.length}</span></h2><span class="tag green">승인 · 배포 완료 이슈</span></div><p class="small muted">완료된 패치의 후속 리포트와 코멘트를 작성합니다.</p>${done.map(i=>`<article class="result-row"><div><div class="row">${riskTag(i)}${sourceTag(i)}</div><h3>${esc(i.title)}</h3><p class="mono small muted">${i.id}</p><p class="small muted">${esc(i.patch.summary)}</p><span class="tag green">배포 완료</span>${i.commentSent?'<span class="tag gray">코멘트 전송 완료</span>':''}${i.ossReported?'<span class="tag gray">OSS 리포트 제출 완료</span>':''}</div><div class="stack"><button class="btn dark" data-comment="${i.id}">${i.comment?'생성된 코멘트 확인':'코멘트 자동 생성'} →</button><button class="btn" data-oss="${i.id}" ${i.oss?'':'disabled'}>${i.oss?'OSS 리포트':'OSS 리포트 · 대상 없음'} →</button></div></article>`).join('')||'<div class="empty">패치 승인 및 배포를 완료한 이슈가 없습니다.<br><button class="btn" data-go="security">보안 검증 결과 확인 →</button></div>'}</section>`;
}
function issuePreview(i){showDialog(i.id,`<div class="row">${riskTag(i)}${sourceTag(i)}</div><h3>${esc(i.title)}</h3><p>${esc(i.desc)}</p><dl class="meta-grid"><dt>모듈</dt><dd>${esc(i.module)}</dd><dt>분류</dt><dd>${i.disposition==='quick'?'Not a bug · 빠른 조치':'추가 검토 필요'}</dd><dt>상태</dt><dd>${statusLabel(i)}</dd></dl><p class="small muted">이 항목은 목록 시연용입니다. 코드 실행과 라운드 상세는 2개 시연 이슈에서 제공합니다.</p>`);}
function advance(){
  const i=getIssue();if(i.state!=='running')return;
  if(i.stage==='prepare'){i.stage='battle';i.step=0;}
  else if(i.step<4)i.step++;
  else if(i.round<3){i.round++;i.step=0;}
  else {i.state='review';i.stage='output';i.queue=[];detailPhase='result';stopAuto();}
  render();
}
function roundDialog(n){
  const i=getIssue(),done=n<i.round||['review','done','rejected'].includes(i.state),r=done?completedRoundResult(n):null;
  showDialog(`라운드 ${n} · ${done?r.winner:'진행 중'}`,done?`<div class="round-dialog-result ${r.winnerKey}"><span>WINNER</span><strong>${r.winner}</strong><small>${r.loser}</small></div><h3>${r.title}</h3><p>${r.desc}</p><p class="mono">poc_v${n}.py · patch_v${n}.diff</p>`:`<div class="round-dialog-result current"><strong>승부 진행 중</strong><p>${stepNames[i.step]}</p></div>`);
}
function enqueue(ids){
  const added=[...new Set(ids)].map(findIssue).filter(i=>i&&canQueue(i));
  added.forEach(i=>{
    i.state='queued';i.stage='prepare';i.round=1;i.step=0;i.queue=[];i.impactReviewed=false;
    for(const key of ['deployment','feedback','comment','commentSent','ossDraft','ossReported'])delete i[key];
  });
  screeningSelection.clear();notify(added.length?`${added.length}개 이슈를 보안 검증 대기열에 추가했습니다.`:'추가할 수 있는 이슈가 없습니다.');
  if(added.length)go('security');else render();
}
function startVerification(id){
  const i=findIssue(id);if(!i||i.state!=='queued')return;
  i.state='running';i.stage='battle';i.round=1;i.step=0;i.queue=['attack','defense'];i.impactReviewed=false;openIssue(id);
}
function runScreening(){
  if(screeningTimer)return;
  const batch=filteredCandidates();if(!batch.length)return;
  screeningBatch=batch.map(i=>i.id);screeningResult=false;manualSelection=false;screeningSelection.clear();
  batch.filter(i=>['incoming','screened'].includes(i.state)).forEach(i=>{i.state='screening';i.queue=['collect','validate'];});
  screeningTimer=setTimeout(()=>{
    batch.filter(i=>i.state==='screening').forEach(i=>{i.state='screened';i.queue=[];i.screeningOutcome=i.detail?'candidate':'skip';});
    screeningTimer=null;screeningResult=true;render();notify('사전 검증이 완료되었습니다. 보안 검증 대상을 확인하세요.');
  },1600);render();
}
function resetDemo(fromStart=false){
  stopAuto();clearTimeout(screeningTimer);screeningTimer=null;issues=structuredClone(initial);
  if(fromStart)issues.filter(hasDetail).forEach(i=>{i.state='incoming';i.stage='prepare';i.round=1;i.step=0;i.queue=[];i.impactReviewed=false;i.screeningOutcome=null;});
  screeningBatch=[];screeningSelection.clear();screeningResult=false;manualSelection=false;
  screeningFilters={preset:'all',min:'',max:'',query:'',source:'all',component:'all',configured:false};carouselIndex=0;
  $('dialog').close();go(fromStart?'screening':'home');notify(fromStart?'검증 선별부터 시연할 수 있도록 초기화했습니다.':'데모 초기 상태로 되돌렸습니다.');
}
function commentText(i){return `${i.id} · ${i.title}\n\n패치 요약: ${i.patch.summary}\n수정 전: ${i.patch.beforeResult}\n수정 후: ${i.patch.afterResult}\n검증: ${i.round}개 라운드에서 재공격 차단 확인, 회귀 테스트 ${i.patch.tests} 통과\n처리: 패치 승인 및 배포 완료\n담당자: ${i.owner}`;}
function commentDialog(id){
  const i=findIssue(id);if(!i||!isCompleted(i))return;selectedIssue=id;i.comment=i.comment||commentText(i);
  showDialog('코멘트 자동 생성',`<p class="small muted">패치 내용과 검증 근거로 생성한 요약입니다. 내용을 수정한 뒤 전송할 수 있습니다.</p><label for="comment-draft">코멘트 내용</label><textarea id="comment-draft" rows="10">${esc(i.comment)}</textarea><label for="comment-target">전송 대상</label><select id="comment-target"><option value="${i.source==='CCC'?'cCc':'Jira'}">${i.source==='CCC'?'cCc':'Jira'} · ${i.id}</option></select><p class="small muted">DEMO · 실제 서비스에는 전송되지 않습니다.</p><p id="draft-error" class="error small" role="alert"></p>`,`<button class="btn secondary" data-action="save-comment">초안 저장</button><button class="btn secondary" data-action="copy-comment">복사</button><button class="btn" data-action="send-comment" ${i.commentSent?'disabled':''}>${i.commentSent?'전송 완료':'코멘트 전송 →'}</button>`);
}
function ossDialog(id){
  const i=findIssue(id);if(!i?.oss||!isCompleted(i))return;selectedIssue=id;
  i.ossDraft=i.ossDraft||`${i.oss.project}\n\n취약점: ${i.oss.title}\n재현 조건: ${i.patch.test}\n조치 제안: ${i.oss.fix}\n검증 근거: ${i.patch.afterResult} · 회귀 테스트 ${i.patch.tests}\n\n사내 패치와 별도로 upstream에 보고할 내용을 검토하세요.`;
  showDialog('OSS 리포트',`<h3>${esc(i.oss.project)}</h3><p>${esc(i.oss.title)}</p><label for="oss-draft">기여자 리포트 초안</label><textarea id="oss-draft" rows="10">${esc(i.ossDraft)}</textarea><p class="small muted">DEMO · 프로젝트 관리자의 취약점 신고 채널에 제출하는 흐름입니다. 실제 제출은 하지 않습니다.</p><p id="draft-error" class="error small" role="alert"></p>`,`<button class="btn secondary" data-action="save-oss">초안 저장</button><button class="btn" data-action="submit-oss" ${i.ossReported?'disabled':''}>${i.ossReported?'제출 완료':'리포트 제출 →'}</button>`);
}

// One delegated handler owns mutations; legacy UI uses the same data attributes.
document.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.go)return go(b.dataset.go);
  if(b.dataset.issue)return openIssue(b.dataset.issue);
  if(b.dataset.quick){const i=findIssue(b.dataset.quick);if(i?.disposition==='quick'){i.state='dismissed';render();notify('Not a bug로 자동 조치했습니다.');}return;}
  if(b.dataset.preset){screeningFilters.preset=b.dataset.preset;render();return;}
  if(b.dataset.start)return startVerification(b.dataset.start);
  if(b.dataset.cancel){const i=findIssue(b.dataset.cancel);if(i?.state==='queued'){i.state='screened';i.screeningOutcome='candidate';render();notify('대기열에서 검증을 취소했습니다.');}return;}
  if(b.dataset.queueOne)return enqueue([b.dataset.queueOne]);
  if(b.dataset.comment)return commentDialog(b.dataset.comment);
  if(b.dataset.oss)return ossDialog(b.dataset.oss);
  if(b.dataset.agent){selectedAgent=selectedAgent===b.dataset.agent?null:b.dataset.agent;render();return;}
  if(b.dataset.carousel){carouselIndex=Number(b.dataset.carousel);render();return;}
  if(b.dataset.round)return roundDialog(Number(b.dataset.round));
  if(b.dataset.phase){if(['prepare','battle','result'].indexOf(b.dataset.phase)<=issuePhaseIndex(getIssue())){detailPhase=b.dataset.phase;render();}return;}
  if(b.dataset.tab){detailTab=b.dataset.tab;render();return;}
  if(b.dataset.resulttab){resultTab=b.dataset.resulttab;render();return;}
  const a=b.dataset.action,i=getIssue();
  if(a==='close')$('dialog').close();
  if(a==='motion'){motion=!motion;render();}
  if(a==='close-agent'){selectedAgent=null;render();}
  if(a==='notifications'){notificationOpen=!notificationOpen;render();}
  if(a==='carousel-prev'||a==='carousel-next'){const n=issues.filter(i=>i.state==='running').length;if(n){carouselIndex=(carouselIndex+(a==='carousel-next'?1:-1)+n)%n;render();}}
  if(a==='demo-menu')showDialog('데모 설정','<p>발표 중 원하는 시점부터 시연할 수 있습니다.</p><p class="small muted">이슈 30개 · 상세 시연 2개. 초기화하면 이 세션의 선택과 처리 내역이 지워집니다.</p>','<button class="btn secondary" data-action="close">닫기</button><button class="btn secondary" data-action="reset">기본 화면으로 초기화</button><button class="btn" data-action="reset-start">검증 선별부터 시연 →</button>');
  if(a==='reset'||a==='reset-start')resetDemo(a==='reset-start');
  if(a==='quick-all'){issues.filter(i=>i.disposition==='quick').forEach(i=>i.state='dismissed');render();notify('빠른 조치 대상 전체를 Not a bug로 처리했습니다.');}
  if(a==='screen-reset'){screeningFilters={preset:'all',min:'',max:'',query:'',source:'all',component:'all',configured:false};render();}
  if(a==='apply-range'){
    const min=$('cvss-min').value,max=$('cvss-max').value;
    if((min!==''&&(Number(min)<0||Number(min)>10))||(max!==''&&(Number(max)<0||Number(max)>10))||Number(min||0)>Number(max||10)){$('range-error').textContent='0~10 사이에서 최소 점수가 최대 점수보다 작거나 같도록 입력하세요.';return;}
    screeningFilters.min=min;screeningFilters.max=max;screeningFilters.preset='custom';render();
  }
  if(a==='run-screening')runScreening();
  if(a==='back-filters'){screeningResult=false;render();}
  if(a==='manual-select'){manualSelection=true;render();}
  if(a==='queue-all')enqueue(eligibleResults().map(i=>i.id));
  if(a==='queue-selected')enqueue([...screeningSelection]);
  if(a==='advance')advance();
  if(a==='auto'){if(auto)stopAuto();else if(i.state==='running'){auto=true;timer=setInterval(advance,1800);}render();}
  if(a==='ticket')showDialog(`${i.source} · ${i.id}`,`<h3>${esc(i.title)}</h3><p>${esc(i.desc)}</p><div class="notice">원본 티켓의 데모 미리보기입니다.</div>`);
  if(a==='impact')showDialog('영향도 분석',`<div class="notice">샘플 분석 결과입니다. 팀원이 준비 중인 실제 분석 화면으로 교체할 수 있습니다.</div><dl class="meta-grid"><dt>수정 범위</dt><dd>${esc(i.module)}</dd><dt>변경 내용</dt><dd>${esc(i.patch.summary)}</dd><dt>영향</dt><dd>${esc(i.patch.impact)}</dd><dt>검증</dt><dd>회귀 테스트 ${i.patch.tests} 통과 · 재공격 차단</dd></dl>`,`<button class="btn" data-action="ack-impact">분석 내용 확인 완료</button>`);
  if(a==='ack-impact'){i.impactReviewed=true;$('dialog').close();render();notify('영향도 분석을 확인했습니다.');}
  if(a==='approve'&&i.state==='review'&&i.impactReviewed){i.state='done';i.deployment='complete';i.queue=[];detailPhase='result';render();notify('패치를 승인하고 데모 배포를 완료했습니다.');}
  if(a==='reject'&&i.state==='review')showDialog('패치 거절','<label for="reason">거절 사유</label><textarea id="reason" rows="4" placeholder="패치를 거절하는 이유를 입력하세요."></textarea><p id="reason-error" class="small error" role="alert"></p>','<button class="btn secondary" data-action="close">취소</button><button class="btn danger" data-action="confirm-reject">패치 거절</button>');
  if(a==='confirm-reject'&&i.state==='review'){const reason=$('reason').value.trim();if(!reason){$('reason-error').textContent='거절 사유를 입력하세요.';return;}i.feedback=reason;i.state='rejected';i.deployment=null;i.queue=[];$('dialog').close();render();notify('패치를 거절했습니다.');}
  if(a==='history-dialog')showDialog('라운드 이력',Array.from({length:i.round},(_,k)=>`<button class="historyrow" data-round="${k+1}"><span>0${k+1}</span><span>라운드</span><span>검증 결과 확인</span><span>↗</span></button>`).join(''));
  if(['save-comment','copy-comment','send-comment','save-oss','submit-oss'].includes(a)){
    const oss=a.endsWith('oss'),text=$(oss?'oss-draft':'comment-draft').value.trim();
    if(!text){$('draft-error').textContent='내용을 입력하세요.';return;}
    if(oss)i.ossDraft=text;else i.comment=text;
    if(a==='copy-comment'){try{await navigator.clipboard.writeText(text);notify('코멘트를 복사했습니다.');}catch{notify('텍스트를 선택해 직접 복사하세요.');}return;}
    if(a==='send-comment')i.commentSent=true;
    if(a==='submit-oss')i.ossReported=true;
    $('dialog').close();render();notify(a==='send-comment'?'데모 코멘트 전송을 완료했습니다.':a==='submit-oss'?'데모 OSS 리포트 제출을 완료했습니다.':'초안을 저장했습니다.');
  }
});
document.addEventListener('input',e=>{
  if(e.target.id==='screen-query'){const caret=e.target.selectionStart;screeningFilters.query=e.target.value;render();$('screen-query').focus();$('screen-query').setSelectionRange(caret,caret);}
});
document.addEventListener('change',e=>{
  if(e.target.id==='screen-source'){screeningFilters.source=e.target.value;render();}
  if(e.target.id==='screen-component'){screeningFilters.component=e.target.value;render();}
  if(e.target.id==='screen-configured'){screeningFilters.configured=e.target.checked;render();}
  if(e.target.dataset.select){const id=e.target.dataset.select;if(canQueue(findIssue(id))){if(e.target.checked)screeningSelection.add(id);else screeningSelection.delete(id);}render();}
  if(e.target.id==='select-all'){screeningSelection=e.target.checked?new Set(eligibleResults().map(i=>i.id)):new Set();render();}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&auto){stopAuto();render();}});
render();
