// ═══════════════════════════════════════
// UTILS
// ═══════════════════════════════════════
function fmt(n){
  if(isNaN(n)||!isFinite(n)) return '—';
  const a=Math.abs(n); const s=n<0?'-':'';
  if(a>=10000000) return s+'₹'+(a/10000000).toFixed(2)+'Cr';
  if(a>=100000) return s+'₹'+(a/100000).toFixed(2)+'L';
  return s+'₹'+Math.round(a).toLocaleString('en-IN');
}
function fmtT(n){ return isNaN(n)||!isFinite(n)?'—':Math.round(n).toLocaleString('en-IN'); }

// Animated number update
function setRV(id, val){
  const el=document.getElementById(id);
  if(!el) return;
  el.classList.remove('bump');
  void el.offsetWidth;
  el.textContent=val;
  el.classList.add('bump');
  el.style.animation='none';
  requestAnimationFrame(()=>{el.style.animation='';el.classList.add('bump')});
}

const charts={};
function mkChart(id,cfg){
  if(charts[id]) charts[id].destroy();
  const el=document.getElementById(id);
  if(!el) return;
  charts[id]=new Chart(el.getContext('2d'),cfg);
}

function tog(id){
  const b=document.getElementById(id);
  const a=document.getElementById(id+'-arr');
  b.classList.toggle('open');
  a.classList.toggle('open',b.classList.contains('open'));
}

function faqTog(el){
  el.closest('.faq-item').classList.toggle('open');
}

function switchTab(i){
  document.querySelectorAll('.tab-btn').forEach((b,j)=>b.classList.toggle('active',i===j));
  document.querySelectorAll('.section').forEach((s,j)=>{
    if(i===j){s.style.display='block'; void s.offsetWidth; s.classList.add('active');}
    else{s.classList.remove('active');s.style.display='none';}
  });
  [calc1,calc2,calc3,calc4,calc5,calcAdv][i]?.();
  setTimeout(()=>{
    document.querySelectorAll('#sec-'+i+' .card-enter').forEach((el,j)=>{
      el.style.transitionDelay=(j*0.07)+'s';
      el.classList.add('visible');
    });
  },100);
}

// ── SIP FORMULA ──
function sipFV(P,annRate,years){
  const r=annRate/100/12, n=years*12;
  if(r===0) return P*n;
  return P*(((Math.pow(1+r,n)-1)/r)*(1+r));
}

// ═══════════════════════════════════════
// CALC 1 – SIP
// ═══════════════════════════════════════
function calc1(){
  const P=+document.getElementById('s1-p').value;
  const rate=+document.getElementById('s1-r').value;
  const years=+document.getElementById('s1-y').value;
  const fv=sipFV(P,rate,years);
  const inv=P*years*12;
  const ret=fv-inv;
  const g=((ret/inv)*100).toFixed(0);

  setRV('s1-ri',fmt(inv)); setRV('s1-rr',fmt(ret)); setRV('s1-rf',fmt(fv));
  document.getElementById('s1-rg').textContent=g+'% gain on invested';
  document.getElementById('d1-i').textContent=fmt(inv);
  document.getElementById('d1-r').textContent=fmt(ret);
  document.getElementById('d1-t').textContent=fmt(fv);

  const labs=[],inv2=[],ret2=[];
  for(let y=1;y<=years;y++){
    const fvy=sipFV(P,rate,y);
    const i2=P*y*12;
    labs.push('Y'+y); inv2.push(Math.round(i2)); ret2.push(Math.round(fvy-i2));
  }
  mkChart('c1',{type:'bar',data:{labels:labs,datasets:[
    {label:'Invested',data:inv2,backgroundColor:'#224c87',borderRadius:4,stack:'s'},
    {label:'Returns',data:ret2,backgroundColor:'#da3832',borderRadius:4,stack:'s'}
  ]},options:chartOpts()});

  mkChart('d1',donutCfg([Math.round(inv),Math.round(ret)],['#224c87','#da3832'],['Invested','Returns']));

  const tbody=document.getElementById('t1'); tbody.innerHTML='';
  for(let y=1;y<=years;y++){
    const fvy=sipFV(P,rate,y),i=P*y*12;
    addRow(tbody,[y,fmtT(i),fmtT(fvy-i),fmtT(fvy)]);
  }
  addRow(tbody,['Total',fmtT(inv),fmtT(ret),fmtT(fv)]);

  // Update growth chart in SIP section
  updateGrowthChart('growth-chart-1', P, rate, years);
}

// ═══════════════════════════════════════
// CALC 2 – SWP
// ═══════════════════════════════════════
function calc2(){
  const PV=+document.getElementById('s2-c').value;
  const W=+document.getElementById('s2-w').value;
  const rate=+document.getElementById('s2-r').value;
  const years=+document.getElementById('s2-y').value;
  const r=rate/100/12;

  let depMonth=-1, b=PV;
  for(let m=1;m<=years*12;m++){b=b*(1+r)-W; if(b<=0){depMonth=m;break;}}

  let bal=PV;
  for(let m=1;m<=years*12;m++){bal=bal*(1+r)-W; if(bal<0){bal=0;break;}}

  const totalW=W*years*12;
  setRV('s2-rw',fmt(totalW));
  if(depMonth>0){
    const dy=Math.floor(depMonth/12),dm=depMonth%12;
    setRV('s2-rd','Year '+(dy)+(dm>0?' M'+dm:''));
    document.getElementById('s2-rg').textContent='Corpus depletes at month '+depMonth;
    setRV('s2-rb','₹0');
    document.getElementById('s2-rb-card').className='rc warn';
    document.getElementById('s2-hl').className='rc hl warn';
  } else {
    setRV('s2-rd','Year '+years+'+');
    document.getElementById('s2-rg').textContent='Corpus remains positive';
    setRV('s2-rb',fmt(Math.max(bal,0)));
    document.getElementById('s2-rb-card').className='rc';
    document.getElementById('s2-hl').className='rc hl';
  }

  const labs=[],balArr=[],cumW=[];
  let b2=PV;
  for(let y=1;y<=years;y++){
    for(let m=0;m<12;m++){b2=b2*(1+r)-W; if(b2<0){b2=0;break;}}
    labs.push('Y'+y); balArr.push(Math.round(Math.max(b2,0))); cumW.push(Math.round(W*y*12));
  }
  mkChart('c2',{type:'line',data:{labels:labs,datasets:[
    {label:'Corpus',data:balArr,borderColor:'#224c87',backgroundColor:'rgba(34,76,135,.1)',fill:true,tension:.35,pointRadius:3,borderWidth:2.5},
    {label:'Withdrawn',data:cumW,borderColor:'#da3832',backgroundColor:'rgba(218,56,50,.06)',fill:true,tension:.35,pointRadius:3,borderWidth:2,borderDash:[5,4]}
  ]},options:lineOpts()});

  const tbody=document.getElementById('t2'); tbody.innerHTML='';
  let b3=PV;
  for(let y=1;y<=years;y++){
    for(let m=0;m<12;m++){b3=b3*(1+r)-W; if(b3<0){b3=0;break;}}
    addRow(tbody,[y,fmtT(W*12),fmtT(Math.max(b3,0))]);
  }
}

// ═══════════════════════════════════════
// CALC 3 – TOP-UP SIP
// ═══════════════════════════════════════
function calc3(){
  const P0=+document.getElementById('s3-p').value;
  const topup=+document.getElementById('s3-t').value/100;
  const rate=+document.getElementById('s3-r').value/100/12;
  const years=+document.getElementById('s3-y').value;

  let sip=P0, exactFV=0, exactInv=0;
  for(let y=1;y<=years;y++){
    for(let m=1;m<=12;m++){
      const mLeft=(years-y)*12+(12-m+1);
      exactFV+=sip*Math.pow(1+rate,mLeft);
    }
    exactInv+=sip*12;
    sip=sip*(1+topup);
  }
  const flatFV=sipFV(P0,rate*100*12,years);
  const extra=exactFV-flatFV;

  setRV('s3-ri',fmt(exactInv)); setRV('s3-rr',fmt(exactFV-exactInv)); setRV('s3-rf',fmt(exactFV));
  document.getElementById('s3-rg').textContent='Extra '+fmt(extra)+' vs flat SIP ('+fmt(flatFV)+')';
  document.getElementById('d3-i').textContent=fmt(exactInv);
  document.getElementById('d3-r').textContent=fmt(exactFV-exactInv);
  document.getElementById('d3-t').textContent=fmt(exactFV);

  const labsC=[],invC=[],retC=[],flatC=[];
  sip=P0; let cumFV=0,cumInv=0;
  for(let y=1;y<=years;y++){
    let yFV=0;
    for(let m=1;m<=12;m++){
      const mLeft=(years-y)*12+(12-m+1);
      yFV+=sip*Math.pow(1+rate,mLeft);
    }
    cumInv+=sip*12; cumFV+=yFV;
    labsC.push('Y'+y); invC.push(Math.round(cumInv));
    retC.push(Math.round(Math.max(cumFV-cumInv,0)));
    flatC.push(Math.round(sipFV(P0,rate*1200,y)));
    sip=sip*(1+topup);
  }
  mkChart('c3',{type:'bar',data:{labels:labsC,datasets:[
    {label:'Invested',data:invC,backgroundColor:'#224c87',borderRadius:4,stack:'s'},
    {label:'Returns',data:retC,backgroundColor:'#da3832',borderRadius:4,stack:'s'},
    {type:'line',label:'Flat SIP',data:flatC,borderColor:'rgba(145,144,144,.7)',borderDash:[5,4],borderWidth:2,pointRadius:2,fill:false,tension:.3}
  ]},options:chartOpts()});

  mkChart('d3',donutCfg([Math.round(exactInv),Math.round(Math.max(exactFV-exactInv,0))],['#224c87','#da3832'],['Invested','Returns']));

  const tbody=document.getElementById('t3'); tbody.innerHTML='';
  sip=P0; let ci=0,cf=0;
  for(let y=1;y<=years;y++){
    let yFV=0;
    for(let m=1;m<=12;m++){
      const mLeft=(years-y)*12+(12-m+1);
      yFV+=sip*Math.pow(1+rate,mLeft);
    }
    ci+=sip*12; cf+=yFV;
    addRow(tbody,[y,fmtT(sip),fmtT(ci),fmtT(cf)]);
    sip=sip*(1+topup);
  }
}

// ═══════════════════════════════════════
// CALC 4 – GOAL-BASED
// ═══════════════════════════════════════
let goalMode='investment';
function setGoalMode(mode){
  goalMode=mode;
  // Update radio buttons
  document.getElementById('gb-radio-inv').checked = (mode==='investment');
  document.getElementById('gb-radio-goal').checked = (mode==='goal');
  document.getElementById('gb-inv-mode').style.display=mode==='investment'?'block':'none';
  document.getElementById('gb-goal-mode').style.display=mode==='goal'?'block':'none';
  document.getElementById('s4-res-inv').style.display=mode==='investment'?'grid':'none';
  document.getElementById('s4-res-goal').style.display=mode==='goal'?'grid':'none';
  calc4();
}

function calc4(){
  if(goalMode==='investment') calc4Investment();
  else calc4Goal();
}

function calc4Investment(){
  const cost=+document.getElementById('s4-c').value;
  const years=+document.getElementById('s4-y').value;
  const inf=+document.getElementById('s4-i').value/100;
  const ret=+document.getElementById('s4-r').value;
  const fvGoal=cost*Math.pow(1+inf,years);
  const r=ret/100/12, n=years*12;
  let reqSIP = r===0 ? fvGoal/n : fvGoal*r/((Math.pow(1+r,n)-1)*(1+r));
  const totalInv=reqSIP*n;
  const returns=fvGoal-totalInv;

  setRV('s4-rg',fmt(fvGoal)); setRV('s4-ri',fmt(totalInv)); setRV('s4-rs',fmt(reqSIP)+'/mo');
  document.getElementById('s4-rn').textContent='For '+document.getElementById('s4-gn').value+' in '+years+'yrs';
  document.getElementById('d4-i').textContent=fmt(totalInv);
  document.getElementById('d4-r').textContent=fmt(Math.max(returns,0));
  document.getElementById('d4-t').textContent=fmt(fvGoal);

  const labs=[],sipArr=[],goalArr=[];
  for(let y=1;y<=years;y++){
    sipArr.push(Math.round(sipFV(reqSIP,ret,y)));
    goalArr.push(Math.round(cost*Math.pow(1+inf,y)));
    labs.push('Y'+y);
  }
  mkChart('c4',{type:'line',data:{labels:labs,datasets:[
    {label:'Corpus',data:sipArr,borderColor:'#224c87',backgroundColor:'rgba(34,76,135,.08)',fill:true,tension:.35,pointRadius:2,borderWidth:2.5},
    {label:'Goal',data:goalArr,borderColor:'#da3832',borderDash:[5,4],fill:false,tension:.35,pointRadius:2,borderWidth:2}
  ]},options:lineOpts()});

  mkChart('d4',donutCfg([Math.round(totalInv),Math.round(Math.max(returns,0))],['#224c87','#da3832'],['Invested','Returns']));

  const tbody=document.getElementById('t4'); tbody.innerHTML='';
  for(let y=1;y<=years;y++){
    const fvy=sipFV(reqSIP,ret,y);
    addRow(tbody,[y,fmtT(reqSIP*y*12),fmtT(fvy),fmtT(cost*Math.pow(1+inf,y))]);
  }
}

function calc4Goal(){
  const goalAmt=+document.getElementById('s4g-g').value||50000;
  const ret=+document.getElementById('s4g-r').value;
  const tenure=+document.getElementById('s4g-t').value;
  const r=ret/100/12, n=tenure*12;
  let reqSIP = r===0 ? goalAmt/n : goalAmt*r/((Math.pow(1+r,n)-1)*(1+r));
  const totalInv=reqSIP*n;

  setRV('s4g-goal',fmt(goalAmt));
  setRV('s4g-inv',fmt(totalInv));
  setRV('s4g-sip',fmt(reqSIP)+'/mo');
  document.getElementById('s4g-note').textContent='Invest for '+tenure+' yrs at '+ret+'% p.a.';
  document.getElementById('d4-i').textContent=fmt(totalInv);
  document.getElementById('d4-r').textContent=fmt(Math.max(goalAmt-totalInv,0));
  document.getElementById('d4-t').textContent=fmt(goalAmt);

  const labs=[],sipArr=[],goalArr=[];
  for(let y=1;y<=tenure;y++){
    sipArr.push(Math.round(sipFV(reqSIP,ret,y)));
    goalArr.push(Math.round(goalAmt));
    labs.push('Y'+y);
  }
  mkChart('c4',{type:'line',data:{labels:labs,datasets:[
    {label:'Corpus',data:sipArr,borderColor:'#224c87',backgroundColor:'rgba(34,76,135,.08)',fill:true,tension:.35,pointRadius:2,borderWidth:2.5},
    {label:'Goal',data:goalArr,borderColor:'#da3832',borderDash:[5,4],fill:false,tension:0,pointRadius:0,borderWidth:2}
  ]},options:lineOpts()});

  mkChart('d4',donutCfg([Math.round(totalInv),Math.round(Math.max(goalAmt-totalInv,0))],['#224c87','#da3832'],['Invested','Returns']));

  const tbody=document.getElementById('t4'); tbody.innerHTML='';
  for(let y=1;y<=tenure;y++){
    const fvy=sipFV(reqSIP,ret,y);
    addRow(tbody,[y,fmtT(reqSIP*y*12),fmtT(fvy),fmtT(goalAmt)]);
  }

  // Update goal growth chart
  updateGoalGrowthChart(reqSIP, ret, tenure, goalAmt);
}

// ═══════════════════════════════════════
// CALC 5 – RETIREMENT
// ═══════════════════════════════════════
function calc5(){
  const ca=+document.getElementById('s5-ca').value;
  const ra=+document.getElementById('s5-ra').value;
  const le=+document.getElementById('s5-le').value;
  const expA=+document.getElementById('s5-e').value;
  const inf=+document.getElementById('s5-i').value/100;
  const preR=+document.getElementById('s5-pr').value;
  const postR=+document.getElementById('s5-por').value/100;

  const workYrs=Math.max(ra-ca,1);
  const retDur=Math.max(le-ra,1);
  const retExp=expA*Math.pow(1+inf,workYrs);
  const corpus=retExp*((1-Math.pow(1+postR,-retDur))/postR);
  const r2=preR/100/12, n2=workYrs*12;
  let sip2 = r2===0 ? corpus/n2 : corpus*r2/((Math.pow(1+r2,n2)-1)*(1+r2));

  setRV('s5-re',fmt(retExp)); setRV('s5-wy',workYrs+' years');
  setRV('s5-rc',fmt(corpus));
  document.getElementById('s5-rg').textContent='Covers '+retDur+' years of retirement';
  setRV('s5-rs',fmt(sip2)+'/mo');
  document.getElementById('s5-rsg').textContent='Invest for '+workYrs+' years at '+preR+'% p.a.';

  const labs=[],corpArr=[],targetLine=[];
  for(let y=1;y<=workYrs;y++){
    labs.push('Age '+(ca+y));
    corpArr.push(Math.round(sipFV(sip2,preR,y)));
    targetLine.push(Math.round(corpus));
  }
  mkChart('c5',{type:'line',data:{labels:labs,datasets:[
    {label:'Corpus',data:corpArr,borderColor:'#224c87',backgroundColor:'rgba(34,76,135,.1)',fill:true,tension:.35,pointRadius:2,borderWidth:2.5},
    {label:'Target',data:targetLine,borderColor:'#da3832',borderDash:[6,4],fill:false,tension:0,pointRadius:0,borderWidth:2}
  ]},options:lineOpts()});

  const tbody=document.getElementById('t5'); tbody.innerHTML='';
  const ms=[5,10,15,20,25,30].filter(m=>m<=workYrs);
  if(!ms.includes(workYrs)) ms.push(workYrs);
  ms.forEach(m=>{
    const cv=sipFV(sip2,preR,m);
    const inv=sip2*m*12;
    const pct=((cv/corpus)*100).toFixed(1);
    addRow(tbody,['Age '+(ca+m),fmtT(inv),fmtT(cv),pct+'%']);
  });
}

// ═══════════════════════════════════════
// CALC 6 – ADVANCED SIP
// ═══════════════════════════════════════
function toggleInf(){
  const cb=document.getElementById('adv-inf');
  cb.checked=!cb.checked;
  calcAdv();
}
function calcAdv(){
  const P=parseFloat(document.getElementById('adv-p').value)||5000;
  const rate=parseFloat(document.getElementById('adv-r').value)||14.27;
  const years=parseInt(document.getElementById('adv-y').value)||20;
  const withInf=document.getElementById('adv-inf').checked;
  const infRate=parseFloat(document.getElementById('adv-ir').value)||6;

  document.getElementById('adv-inf-rate-wrap').style.display=withInf?'block':'none';
  document.getElementById('adv-real-wrap').style.display=withInf?'block':'none';
  document.getElementById('adv-inf-legend').style.display=withInf?'flex':'none';
  if(withInf) document.getElementById('adv-th-real').textContent='Real FV (₹)';
  else document.getElementById('adv-th-real').textContent='Returns (₹)';

  const fv=sipFV(P,rate,years);
  const inv=P*years*12;
  const ret=fv-inv;
  const g=((ret/inv)*100).toFixed(0);

  const realFV=withInf ? fv/Math.pow(1+infRate/100,years) : null;

  setRV('adv-ri',fmt(inv)); setRV('adv-rr',fmt(ret)); setRV('adv-rf',fmt(fv));
  document.getElementById('adv-rg').textContent=g+'% gain on invested amount';
  if(withInf){
    document.getElementById('adv-real').textContent=fmt(realFV);
    document.getElementById('adv-real-note').textContent='Real value in today\'s ₹, after '+infRate+'% inflation';
  }

  const scenarios=[
    {label:'Conservative',rate:8,color:'#5b8dd9'},
    {label:'Moderate',rate:12,color:'#224c87'},
    {label:'Aggressive',rate:18,color:'#1a3a6b'},
    {label:'Custom ('+rate.toFixed(2)+'%)',rate:rate,color:'#da3832'},
  ];
  const scnEl=document.getElementById('adv-scenarios');
  scnEl.innerHTML='';
  const maxFV=Math.max(...scenarios.map(s=>sipFV(P,s.rate,years)));
  scenarios.forEach(s=>{
    const sfv=sipFV(P,s.rate,years);
    const pct=(sfv/maxFV)*100;
    const div=document.createElement('div');
    div.style.cssText='display:flex;align-items:center;gap:10px;font-size:11px;';
    div.innerHTML=`
      <span style="min-width:95px;font-weight:600;color:var(--dark)">${s.label}</span>
      <div style="flex:1;height:8px;background:var(--grey-mid);border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${pct.toFixed(1)}%;background:${s.color};border-radius:4px;transition:width .6s cubic-bezier(.22,.88,.36,1)"></div>
      </div>
      <span style="min-width:70px;text-align:right;font-weight:700;color:${s.color}">${fmt(sfv)}</span>
    `;
    scnEl.appendChild(div);
  });

  const labs=[],invArr=[],retArr=[],realArr=[];
  for(let y=1;y<=years;y++){
    const fvy=sipFV(P,rate,y);
    const iy=P*y*12;
    labs.push('Y'+y); invArr.push(Math.round(iy)); retArr.push(Math.round(fvy-iy));
    if(withInf) realArr.push(Math.round(fvy/Math.pow(1+infRate/100,y)));
  }
  const datasets=[
    {label:'Invested',data:invArr,backgroundColor:'#224c87',borderRadius:4,stack:'s'},
    {label:'Nominal Returns',data:retArr,backgroundColor:'#da3832',borderRadius:4,stack:'s'},
  ];
  if(withInf) datasets.push({type:'line',label:'Real Value',data:realArr,borderColor:'#ff9800',borderWidth:2.5,pointRadius:3,fill:false,tension:.3});

  mkChart('c6',{type:'bar',data:{labels:labs,datasets},options:chartOpts()});

  const tbody=document.getElementById('t6'); tbody.innerHTML='';
  for(let y=1;y<=years;y++){
    const fvy=sipFV(P,rate,y);
    const iy=P*y*12;
    const rv=withInf ? fmtT(fvy/Math.pow(1+infRate/100,y)) : fmtT(fvy-iy);
    addRow(tbody,[y,fmtT(iy),fmtT(fvy),rv]);
  }
}

function setScenario(n){
  document.querySelectorAll('.adv-tab').forEach((b,i)=>b.classList.toggle('active',i===n-1));
  const rates=[8,12,18,null];
  if(rates[n-1]!==null){
    document.getElementById('adv-r').value=rates[n-1];
    document.getElementById('adv-rn').value=rates[n-1];
    document.getElementById('adv-rv').textContent=rates[n-1];
  }
  calcAdv();
}

// ═══════════════════════════════════════
// GROWTH CHART (line chart like image)
// ═══════════════════════════════════════
function updateGrowthChart(canvasId, sip, rate, years){
  const startYear = new Date().getFullYear();
  const labs=[], worthArr=[], investedArr=[];
  for(let y=0;y<=years;y++){
    labs.push(startYear+y);
    const inv = sip*y*12;
    const fv = y===0 ? 0 : sipFV(sip,rate,y);
    worthArr.push(Math.round(fv));
    investedArr.push(Math.round(inv));
  }
  mkChart(canvasId,{
    type:'line',
    data:{labels:labs,datasets:[
      {label:'Worth of Investment',data:worthArr,borderColor:'#1a3a6b',backgroundColor:'rgba(26,58,107,0)',fill:false,tension:.35,pointRadius:3,borderWidth:2.5,pointBackgroundColor:'#1a3a6b'},
      {label:'Amount Invested',data:investedArr,borderColor:'#4ec97e',backgroundColor:'rgba(78,201,126,0)',fill:false,tension:.35,pointRadius:3,borderWidth:2.5,pointBackgroundColor:'#4ec97e'}
    ]},
    options:{
      responsive:true,maintainAspectRatio:false,
      animation:{duration:700,easing:'easeOutQuart'},
      plugins:{
        legend:{display:true,position:'bottom',labels:{usePointStyle:true,pointStyle:'line',font:{family:'Montserrat',size:11},color:'#333',padding:20}},
        tooltip:{callbacks:{label:c=>' ₹'+c.raw.toLocaleString('en-IN')},backgroundColor:'rgba(26,26,46,.9)',padding:10,cornerRadius:8}
      },
      scales:{
        x:{ticks:{font:{family:'Montserrat',size:9},color:'#919090'},grid:{color:'rgba(0,0,0,.05)'}},
        y:{ticks:{font:{family:'Montserrat',size:9},color:'#919090',callback:v=>v>=1000000?(v/1000000).toFixed(1)+'M':v>=1000?v.toLocaleString('en-IN'):v},grid:{color:'rgba(0,0,0,.05)'}}
      }
    }
  });
}

function updateGoalGrowthChart(sip, rate, years, goalAmt){
  const wrap=document.getElementById('goal-growth-wrap');
  if(wrap) wrap.style.display='block';
  updateGrowthChart('growth-chart-goal', sip, rate, years);
}

// ═══════════════════════════════════════
// CHART HELPERS
// ═══════════════════════════════════════
function chartOpts(){
  return {responsive:true,maintainAspectRatio:false,
    animation:{duration:600,easing:'easeOutQuart'},
    plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>' ₹'+c.raw.toLocaleString('en-IN')},backgroundColor:'rgba(26,26,46,.9)',padding:10,cornerRadius:8}},
    scales:{x:{stacked:true,ticks:{font:{family:'Montserrat',size:9},color:'#919090',maxRotation:45},grid:{display:false}},
            y:{stacked:true,ticks:{font:{family:'Montserrat',size:9},color:'#919090',callback:v=>v>=100000?'₹'+(v/100000).toFixed(0)+'L':'₹'+v},grid:{color:'#f5f5f5'}}}};
}
function lineOpts(){
  return {responsive:true,maintainAspectRatio:false,
    animation:{duration:700,easing:'easeOutQuart'},
    plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>' ₹'+c.raw.toLocaleString('en-IN')},backgroundColor:'rgba(26,26,46,.9)',padding:10,cornerRadius:8}},
    scales:{x:{ticks:{font:{family:'Montserrat',size:9},color:'#919090',maxTicksLimit:10,maxRotation:45},grid:{display:false}},
            y:{ticks:{font:{family:'Montserrat',size:9},color:'#919090',callback:v=>v>=100000?'₹'+(v/100000).toFixed(0)+'L':'₹'+v},grid:{color:'#f5f5f5'}}}};
}
function donutCfg(data,colors,labels){
  return {type:'doughnut',data:{labels,datasets:[{data,backgroundColor:colors,borderWidth:3,borderColor:'#fff',hoverOffset:6}]},
    options:{responsive:false,cutout:'68%',animation:{duration:500},plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>' ₹'+c.raw.toLocaleString('en-IN')}}}}};
}
function addRow(tbody,cells){
  const tr=document.createElement('tr');
  tr.innerHTML=cells.map((c)=>`<td>${c}</td>`).join('');
  tbody.appendChild(tr);
}

// ═══════════════════════════════════════
// WIRE UP ALL INPUTS
// ═══════════════════════════════════════
function wire(sliderId, dispId, prefix, suffix, numId, calc){
  const s=document.getElementById(sliderId);
  const d=document.getElementById(dispId);
  if(!s||!d) return;
  const upd=()=>{
    const v=parseFloat(s.value);
    const txt=(prefix||'')+Number(v).toLocaleString('en-IN')+(suffix||'');
    d.textContent=txt;
    d.classList.remove('bump'); void d.offsetWidth; d.classList.add('bump');
    calc();
  };
  s.addEventListener('input',upd);
  if(numId){
    const n=document.getElementById(numId);
    if(n) n.addEventListener('input',()=>{
      let v=Math.min(Math.max(parseFloat(n.value)||0,parseFloat(s.min)),parseFloat(s.max));
      s.value=v; upd();
    });
  }
}
function wireSimple(sliderId,dispId,suffix,calc){
  const s=document.getElementById(sliderId);
  const d=document.getElementById(dispId);
  if(!s||!d) return;
  s.addEventListener('input',function(){
    d.textContent=parseFloat(this.value)+suffix;
    d.classList.remove('bump'); void d.offsetWidth; d.classList.add('bump');
    calc();
  });
}

// SIP
wire('s1-p','s1-pv','₹','','s1-pn',calc1);
wireSimple('s1-r','s1-rv','',calc1);
wireSimple('s1-y','s1-yv','',calc1);
// SWP
wire('s2-c','s2-cv','₹','','s2-cn',calc2);
wire('s2-w','s2-wv','₹','','s2-wn',calc2);
wireSimple('s2-r','s2-rv','',calc2);
wireSimple('s2-y','s2-yv','',calc2);
// Top-Up
wire('s3-p','s3-pv','₹','','s3-pn',calc3);
wireSimple('s3-t','s3-tv','',calc3);
wireSimple('s3-r','s3-rv','',calc3);
wireSimple('s3-y','s3-yv','',calc3);
// Goal inv mode
wire('s4-c','s4-cv','₹','','s4-cn',calc4);
wireSimple('s4-y','s4-yv','',calc4);
wireSimple('s4-i','s4-iv','',calc4);
wireSimple('s4-r','s4-rv','',calc4);
document.getElementById('s4-gn').addEventListener('change',calc4);
// Goal - I know my goal mode
wire('s4g-g','s4g-gv','₹','','s4g-gn',calc4);
const s4gr=document.getElementById('s4g-r');
const s4grn=document.getElementById('s4g-rn');
s4gr.addEventListener('input',()=>{document.getElementById('s4g-rv').textContent=s4gr.value;calcAdv4g();});
s4grn.addEventListener('input',()=>{let v=Math.min(Math.max(parseFloat(s4grn.value)||0,0),50);s4gr.value=v;document.getElementById('s4g-rv').textContent=v;calcAdv4g();});
document.getElementById('s4g-t').addEventListener('input',function(){
  document.getElementById('s4g-tv').textContent=this.value;
  const tn=document.getElementById('s4g-tn');
  if(tn) tn.value=this.value;
  calc4();
});
const s4gtn=document.getElementById('s4g-tn');
if(s4gtn) s4gtn.addEventListener('input',function(){
  let v=Math.min(Math.max(parseInt(this.value)||0,0),50);
  document.getElementById('s4g-t').value=v;
  document.getElementById('s4g-tv') && (document.getElementById('s4g-tv').textContent=v);
  calc4();
});
function calcAdv4g(){if(goalMode==='goal') calc4();}
// Retirement
wireSimple('s5-ca','s5-cav','',calc5);
wireSimple('s5-ra','s5-rav','',calc5);
wireSimple('s5-le','s5-lev','',calc5);
wire('s5-e','s5-ev','₹','','s5-en',calc5);
wireSimple('s5-i','s5-iv','',calc5);
wireSimple('s5-pr','s5-prv','',calc5);
wireSimple('s5-por','s5-porv','',calc5);
// Advanced SIP
document.getElementById('adv-y').addEventListener('input',function(){document.getElementById('adv-yv').textContent=this.value;calcAdv();});
document.getElementById('adv-r').addEventListener('input',function(){
  document.getElementById('adv-rv').textContent=parseFloat(this.value).toFixed(2);
  document.getElementById('adv-rn').value=parseFloat(this.value).toFixed(2);
  document.querySelectorAll('.adv-tab').forEach(b=>b.classList.remove('active'));
  document.getElementById('scn-btn-4').classList.add('active');
  calcAdv();
});
document.getElementById('adv-rn').addEventListener('input',function(){
  let v=Math.min(Math.max(parseFloat(this.value)||8,1),30);
  document.getElementById('adv-r').value=v;
  document.getElementById('adv-rv').textContent=v.toFixed(2);
  calcAdv();
});
document.getElementById('adv-p').addEventListener('input',calcAdv);

// ── INTERSECTION OBSERVER FOR CARD ANIMATIONS ──
const observer=new IntersectionObserver((entries)=>{
  entries.forEach(e=>{if(e.isIntersecting) e.target.classList.add('visible');});
},{threshold:.1});
document.querySelectorAll('.card-enter').forEach(el=>observer.observe(el));

// ── INIT ──
calc1();
setTimeout(()=>{calc2();calc3();calc4();calc5();calcAdv();},200);

setTimeout(()=>{
  document.querySelectorAll('#sec-0 .card-enter').forEach((el,j)=>{
    el.style.transitionDelay=(j*0.08)+'s';
    el.classList.add('visible');
  });
},300);

document.querySelectorAll('.section').forEach((s,i)=>{if(i!==0) s.style.display='none';});
