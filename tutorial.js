(() => {
  const KEY='persona-tutorial-complete-v1';
  const steps=[
    {target:'.run-score',title:'击败镜厅守卫',copy:'在出牌次数耗尽前，让当前得分达到右侧目标分数。每一场首领战都有不同目标。',label:'目标与胜负'},
    {target:'.hand-zone',title:'选择你的手牌',copy:'点击手牌选择或取消，单手最多打出 5 张。可按点数或花色重新排序，不会改变牌库。',label:'选择与排序'},
    {target:'.score-preview',title:'组合决定得分',copy:'上方依次显示牌型、基础筹码、倍率和最终得分。左下角“牌型规则”可随时查看完整表格。',label:'牌型计分'},
    {target:'.persona-rail',title:'人格会回应选择',copy:'左侧装备的人格牌会在满足条件时为本手增加筹码、倍率或独立倍率。',label:'人格触发'},
    {target:'.protocol',title:'阅读首领规则',copy:'每场规则会限制出牌、花色或人格效果。开战弹窗会先揭示规则与随机介入事件。',label:'首领协议'}
  ];
  let index=0,active=false,returnToSettings=false;
  const overlay=document.querySelector('#tutorial-overlay'),focus=overlay.querySelector('.tutorial-focus'),card=overlay.querySelector('.tutorial-card');
  function position(){
    document.querySelectorAll('.tutorial-target').forEach(node=>node.classList.remove('tutorial-target'));
    const target=document.querySelector(steps[index].target);if(!target)return;target.classList.add('tutorial-target');
    const rect=target.getBoundingClientRect(),pad=8;focus.style.left=`${Math.max(8,rect.left-pad)}px`;focus.style.top=`${Math.max(8,rect.top-pad)}px`;focus.style.width=`${Math.min(innerWidth-16,rect.width+pad*2)}px`;focus.style.height=`${Math.min(innerHeight-16,rect.height+pad*2)}px`;
    const width=Math.min(430,innerWidth*.88),below=rect.bottom+18,top=below+210<innerHeight?below:Math.max(14,rect.top-224);card.style.left=`${Math.max(14,Math.min(innerWidth-width-14,rect.left+rect.width/2-width/2))}px`;card.style.top=`${top}px`;
  }
  function render(){const step=steps[index];document.querySelector('#tutorial-step-label').textContent=`${String(index+1).padStart(2,'0')} / ${String(steps.length).padStart(2,'0')} · ${step.label}`;document.querySelector('#tutorial-title').textContent=step.title;document.querySelector('#tutorial-copy').textContent=step.copy;document.querySelector('#tutorial-prev').disabled=index===0;document.querySelector('#tutorial-next').textContent=index===steps.length-1?'完成教学':'下一步';position()}
  function open(force=false){if(!force&&localStorage.getItem(KEY)==='1')return;active=true;index=0;overlay.classList.remove('hidden');render();window.gameSfx?.('button')}
  function close(completed=true){active=false;overlay.classList.add('hidden');document.querySelectorAll('.tutorial-target').forEach(node=>node.classList.remove('tutorial-target'));if(completed)localStorage.setItem(KEY,'1');if(returnToSettings){returnToSettings=false;window.openSettingsFromTutorial?.()}}
  function next(){if(index<steps.length-1){index++;render();window.gameSfx?.('button')}else close(true)}
  document.querySelector('#tutorial-next').onclick=next;document.querySelector('#tutorial-prev').onclick=()=>{if(index){index--;render();window.gameSfx?.('button')}};document.querySelector('#tutorial-skip').onclick=()=>close(true);
  document.querySelector('#replay-tutorial').onclick=()=>{returnToSettings=true;window.closeSettingsForTutorial?.();setTimeout(()=>open(true),50)};
  addEventListener('resize',()=>active&&position());addEventListener('keydown',event=>{if(!active)return;event.stopImmediatePropagation();if(event.key==='Escape'){event.preventDefault();close(true)}if(event.key==='ArrowRight'||event.key==='Enter'){event.preventDefault();next()}if(event.key==='ArrowLeft'&&index){event.preventDefault();index--;render()}},true);
  window.maybeOpenBattleTutorial=()=>setTimeout(()=>open(false),180);
  window.battleTutorial={open,close,get active(){return active},get index(){return index},steps};
})();
