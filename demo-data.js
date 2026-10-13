// Demo model: agent metadata and 30 synthetic issues. No real tickets or APIs.
const agents=[{id:'collect',name:'데이터 수집',color:'#0072c3',state:'수집 중',role:'티켓과 대상 모듈의 코드, upstream 자료를 수집합니다.',prop:'folder'},{id:'validate',name:'가공·검증',color:'#008575',state:'검증 중',role:'입력 자료의 누락과 중복을 확인하고 검토 맥락을 정리합니다.',prop:'check'},{id:'attack',name:'공격',color:'#da1e28',state:'재검증 중',role:'재현 조건을 만들고 수정된 코드의 우회 가능성을 다시 확인합니다.',prop:'glass'},{id:'defense',name:'방어',color:'#4f46e5',state:'수정안 생성',role:'공격 에이전트의 재현 조건을 반영해 수정안을 보완합니다.',prop:'shield'},{id:'internal',name:'사내 결과 처리',color:'#8a3ffc',state:'결과 정리 중',role:'검증 근거를 정리하고 사내 티켓 및 코드 리뷰 요청을 준비합니다.',prop:'report'},{id:'opensource',name:'오픈소스 기여',color:'#525252',state:'대기',role:'대상 여부가 확인된 경우에만 외부 기여 초안을 준비합니다.',prop:'rest'}];

const demoPatches={
  authorization:{
    before:'- return execute(request);',
    after:'+ if (!isAuthorized(request.caller)) {\n+   return { errorText: "denied" };\n+ }\n+ return execute(request);',
    summary:'서비스 요청 실행 전에 호출자 권한 검증을 추가했습니다.',
    test:'권한이 없는 호출자의 서비스 실행 요청',
    beforeResult:'미인가 요청으로 서비스 실행 가능',afterResult:'미인가 요청 차단 · denied 응답',
    tests:'148 / 148',size:'+27 / −6',impact:'미인가 호출은 차단됩니다. 인가된 호출자의 기존 서비스 동작은 유지됩니다.'
  },
  session:{
    before:'- const session = decode(token);\n- return session.user;',
    after:'+ const session = verify(token, trustedKey);\n+ if (session.expiresAt <= Date.now()) {\n+   throw new Error("expired token");\n+ }\n+ return session.user;',
    summary:'세션 토큰의 서명과 만료 시점을 검증해 변조되거나 만료된 토큰을 차단했습니다.',
    test:'서명이 변조된 토큰과 만료 토큰으로 인증 요청',
    beforeResult:'변조·만료 토큰으로 세션 접근 가능',afterResult:'변조·만료 토큰 차단 · 정상 토큰 통과',
    tests:'96 / 96',size:'+18 / −2',impact:'만료된 토큰은 재로그인이 필요합니다. 정상 토큰의 인증 흐름은 유지됩니다.'
  }
};
const detailedIssues=[
  {id:'LGPSVE-2445',title:'jsserver 권한 검증 누락',module:'com.webos.service.jsserver',component:'MS_TV',cwe:'CWE-862',source:'보안 티켓',state:'running',stage:'battle',risk:'Critical',cvss:9.1,owner:'minsuk.kang',round:3,step:2,queue:['attack','defense'],desc:'미인가 요청으로 서비스 기능이 실행되는 문제를 검토합니다.',detail:true,disposition:'investigate',patch:demoPatches.authorization,screeningOutcome:'candidate',impactReviewed:false},
  {id:'LGPSVE-2446',title:'세션 토큰 검증 보완',module:'auth.service',component:'MS_ID',cwe:'CWE-347',source:'CCC',state:'review',stage:'output',risk:'High',cvss:8.1,owner:'minsuk.kang',round:3,step:4,queue:[],desc:'변조되거나 만료된 세션 토큰의 인증 우회 가능성을 확인합니다.',detail:true,disposition:'investigate',patch:demoPatches.session,screeningOutcome:'candidate',impactReviewed:false,oss:{project:'Demo Session Library (샘플 오픈소스)',title:'토큰 검증 유틸리티의 서명·만료 확인 누락',fix:'decode 기반 처리를 서명 검증으로 대체하고 만료 시간 확인을 추가합니다.'}}
];
const listSamples=[
  ['로그 내 식별자 노출','logging.service',7.4,'CWE-532'],
  ['공유 파일 접근 제한 누락','file.share',8.2,'CWE-284'],
  ['미디어 서비스 인증 변경','media.service',7.8,'CWE-306'],
  ['알림 서비스 권한 설정','notification.service',6.5,'CWE-269'],
  ['설정 응답 내 민감 정보 노출','config.service',5.3,'CWE-200'],
  ['파일 경로 검증 누락','capture.service',9.0,'CWE-22'],
  ['API 역할 검증 누락','account.api',8.6,'CWE-862'],
  ['웹뷰 입력값 검증','webview.service',6.1,'CWE-79'],
  ['이미지 파서 경계값 처리','image.parser',8.8,'CWE-125'],
  ['다운로드 URL 검증','download.service',7.5,'CWE-918'],
  ['캐시 파일 권한 검토','cache.service',4.3,'CWE-732'],
  ['페어링 요청 인증 처리','pairing.service',9.4,'CWE-287'],
  ['암호화 키 저장 위치','crypto.service',7.1,'CWE-321'],
  ['업로드 파일 유형 검사','upload.service',8.0,'CWE-434'],
  ['디바이스 등록 요청 검증','device.api',6.8,'CWE-20'],
  ['프로세스 실행 인자 검증','process.service',9.8,'CWE-78'],
  ['IPC 호출자 검증','ipc.service',7.3,'CWE-862'],
  ['백업 파일 접근 범위','backup.service',5.8,'CWE-552'],
  ['리다이렉트 대상 검증','login.api',4.7,'CWE-601'],
  ['사용자 프로필 조회 권한','profile.api',7.2,'CWE-639'],
  ['임시 파일 생성 정책','temp.service',3.7,'CWE-377'],
  ['인증 실패 응답 정보','auth.api',5.1,'CWE-209']
];
const quickSamples=[
  ['테스트 코드의 하드코딩 토큰','test.fixture','운영 경로에서 사용되지 않는 테스트용 더미 토큰'],
  ['기존 이슈와 중복 신고','logging.test','기존 티켓과 동일한 재현 조건으로 중복 등록'],
  ['예제 파일의 HTTP 주소','examples.readme','실행 코드가 아닌 문서의 예시 주소'],
  ['주석에 포함된 샘플 경로','sample.config','실제 접근에 사용되지 않는 주석의 샘플 경로'],
  ['제거된 함수에 대한 경고','legacy.removed','현재 빌드에 포함되지 않는 삭제된 코드'],
  ['테스트 인증서 만료 경고','test.certificate','테스트 환경 전용 인증서로 운영 영향 없음']
];
const initial=[...detailedIssues,
  ...listSamples.map(([title,module,cvss,cwe],n)=>({id:`LGPSVE-${2500+n}`,title,module,cvss,cwe,component:n%3===0?'MS_ID':n%3===1?'MS_TV':'All',source:n%2?'CCC':'보안 티켓',state:'incoming',stage:'prepare',risk:cvss>=9?'Critical':cvss>=7?'High':cvss>=4?'Medium':'Low',owner:['minsuk.kang','jiwon.park','sora.lee'][n%3],round:1,step:0,queue:[],desc:`${title}에 대한 코드 탐색과 사전 검증이 필요합니다.`,detail:false,disposition:'investigate'})),
  ...quickSamples.map(([title,module,quickReason],n)=>({id:`CCC-${1100+n}`,title,module,quickReason,cvss:0,cwe:'N/A',component:'All',source:'CCC',state:'incoming',risk:'Low',owner:'minsuk.kang',round:1,step:0,queue:[],desc:quickReason,detail:false,disposition:'quick'}))
];
let issues=structuredClone(initial),selectedAgent=null,selectedIssue='LGPSVE-2445',view='home',detailPhase='battle',detailTab='history',resultTab='patch',filter='all',search='',sourceFilter='all',motion=true,auto=false,timer=null,toastTimer,carouselIndex=0,notificationOpen=false;
const stateNames={incoming:'추가 검토 필요',screening:'사전 검증 중',screened:'선별 완료',queued:'검증 대기',running:'보안 검증 중',review:'패치 승인 대기',done:'패치 완료',rejected:'패치 거절',dismissed:'Not a bug · 조치 완료',ready:'실행 전'};
