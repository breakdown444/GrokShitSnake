(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e={up:`down`,down:`up`,left:`right`,right:`left`};function t(e,t){return e.x===t.x&&e.y===t.y}function n(e){let n=[];for(let r=0;r<20;r++)for(let i=0;i<20;i++){let a={x:i,y:r};e.some(e=>t(e,a))||n.push(a)}return n[Math.floor(Math.random()*n.length)]??{x:0,y:0}}var r=class{snake=[];food={x:10,y:4};dir=`right`;queued=null;phase=`ready`;score=0;highScore=Number(localStorage.getItem(`grok-shit-snake-high-score`)??`0`);tickMs=140;reset(){this.snake=[{x:8,y:10},{x:7,y:10},{x:6,y:10}],this.dir=`right`,this.queued=null,this.score=0,this.tickMs=140,this.food=n(this.snake),this.phase=`ready`}start(){this.phase===`dead`||this.phase===`ready`?(this.reset(),this.phase=`playing`):this.phase===`paused`&&(this.phase=`playing`)}togglePause(){this.phase===`playing`?this.phase=`paused`:this.phase===`paused`&&(this.phase=`playing`)}turn(t){this.phase===`ready`&&(this.phase=`playing`),this.phase===`playing`&&t!==e[this.queued??this.dir]&&(this.queued=t)}step(){if(this.phase!==`playing`)return;this.queued&&=(this.dir=this.queued,null);let e=this.snake[0],r={x:e.x+(this.dir===`left`?-1:+(this.dir===`right`)),y:e.y+(this.dir===`up`?-1:+(this.dir===`down`))},i=r.x<0||r.x>=20||r.y<0||r.y>=20,a=this.snake.some(e=>t(e,r));if(i||a){this.phase=`dead`,this.score>this.highScore&&(this.highScore=this.score,localStorage.setItem(`grok-shit-snake-high-score`,String(this.highScore)));return}this.snake.unshift(r),t(r,this.food)?(this.score+=10,this.tickMs=Math.max(70,140-Math.floor(this.score/40)*8),this.food=n(this.snake)):this.snake.pop()}};function i(e,t,n,r,i,a){let o=Math.min(a,r/2,i/2);e.beginPath(),e.moveTo(t+o,n),e.arcTo(t+r,n,t+r,n+i,o),e.arcTo(t+r,n+i,t,n+i,o),e.arcTo(t,n+i,t,n,o),e.arcTo(t,n,t+r,n,o),e.closePath()}function a(e,t,n){let{width:r,height:a}=e.canvas,o=Math.min(r/20,a/20),s=(r-o*20)/2,c=(a-o*20)/2;e.fillStyle=`#07140c`,e.fillRect(0,0,r,a);for(let t=0;t<20;t++)for(let n=0;n<20;n++)e.fillStyle=(n+t)%2==0?`#0b1c12`:`#0a1910`,e.fillRect(s+n*o,c+t*o,o,o);e.strokeStyle=`rgba(61, 255, 138, 0.08)`,e.lineWidth=1,e.strokeRect(s+.5,c+.5,o*20-1,o*20-1);let l=.5+.5*Math.sin(n/180),u=s+t.food.x*o,d=c+t.food.y*o,f=o*.18;e.shadowColor=`rgba(255, 77, 109, ${.45+l*.35})`,e.shadowBlur=12+l*8,e.fillStyle=`#ff4d6d`,e.beginPath(),e.arc(u+o/2,d+o/2,o/2-f,0,Math.PI*2),e.fill(),e.shadowBlur=0,e.fillStyle=`#ffe1e6`,e.beginPath(),e.arc(u+o*.4,d+o*.38,o*.1,0,Math.PI*2),e.fill(),t.snake.forEach((n,r)=>{let a=r/Math.max(t.snake.length-1,1),l=Math.round(255-a*90),u=Math.round(138-a*60);e.fillStyle=r===0?`#b8ffd4`:`rgb(46, ${l}, ${u})`,e.shadowColor=r===0?`rgba(61, 255, 138, 0.55)`:`transparent`,e.shadowBlur=r===0?14:0,i(e,s+n.x*o+o*.08,c+n.y*o+o*.08,o*.84,o*.84,o*.22),e.fill(),e.shadowBlur=0});let p=t.snake[0];if(p){let n=s+p.x*o,r=c+p.y*o,i=o*.12,a={right:[[.62,.32],[.62,.62]],left:[[.28,.32],[.28,.62]],up:[[.32,.28],[.62,.28]],down:[[.32,.62],[.62,.62]]}[t.dir];e.fillStyle=`#07140c`;for(let[t,s]of a)e.beginPath(),e.arc(n+o*t,r+o*s,i,0,Math.PI*2),e.fill()}}var o=document.querySelector(`#app`);o.innerHTML=`
  <main class="cabinet">
    <header class="hud">
      <div>
        <p class="label">Score</p>
        <p id="score" class="value">0</p>
      </div>
      <div class="titleblock">
        <h1>GrokShitSnake</h1>
        <p class="ver">0.1</p>
      </div>
      <div>
        <p class="label">Best</p>
        <p id="best" class="value">0</p>
      </div>
    </header>

    <div class="screen">
      <canvas id="board" width="640" height="640" aria-label="Snake board"></canvas>
      <div id="overlay" class="overlay">
        <p id="overlay-title">Ready</p>
        <p id="overlay-sub">Enter, tap, or mash GO. Try not to eat yourself.</p>
      </div>
    </div>

    <div class="pad" aria-label="Direction pad">
      <button type="button" data-dir="up" aria-label="Up">▲</button>
      <div class="pad-mid">
        <button type="button" data-dir="left" aria-label="Left">◀</button>
        <button type="button" id="action" aria-label="Start or pause">GO</button>
        <button type="button" data-dir="right" aria-label="Right">▶</button>
      </div>
      <button type="button" data-dir="down" aria-label="Down">▼</button>
    </div>

    <p class="hint">Arrows / WASD to steer · Space to pause · Enter to start</p>
  </main>
`;var s=document.querySelector(`#board`),c=s.getContext(`2d`),l=document.querySelector(`#score`),u=document.querySelector(`#best`),d=document.querySelector(`#overlay`),f=document.querySelector(`#overlay-title`),p=document.querySelector(`#overlay-sub`),m=document.querySelector(`#action`),h=new r;h.reset();var g=0,_=null;function v(){let e=Math.min(640,Math.floor(s.parentElement.clientWidth));s.width=e,s.height=e}function y(){if(l.textContent=String(h.score),u.textContent=String(h.highScore),m.textContent=h.phase===`playing`?`II`:`GO`,h.phase===`playing`){d.classList.add(`hidden`);return}d.classList.remove(`hidden`),h.phase===`ready`?(f.textContent=`Ready`,p.textContent=`Enter, tap, or mash GO. Try not to eat yourself.`):h.phase===`paused`?(f.textContent=`Paused`,p.textContent=`Space or GO to continue`):(f.textContent=`Game over`,p.textContent=`Score ${h.score} · Enter to play again`)}function b(e){h.phase===`playing`&&e-g>=h.tickMs&&(h.step(),g=e,y()),a(c,h,e),requestAnimationFrame(b)}function x(){let e={ArrowUp:`up`,ArrowDown:`down`,ArrowLeft:`left`,ArrowRight:`right`,KeyW:`up`,KeyS:`down`,KeyA:`left`,KeyD:`right`};window.addEventListener(`keydown`,t=>{let n=e[t.code];if(n){t.preventDefault(),h.turn(n),y();return}t.code===`Space`&&(t.preventDefault(),h.togglePause(),y()),t.code===`Enter`&&(t.preventDefault(),h.start(),g=performance.now(),y())})}function S(){document.querySelectorAll(`[data-dir]`).forEach(e=>{let t=e.dataset.dir,n=e=>{e.preventDefault(),h.turn(t),y()};e.addEventListener(`click`,n),e.addEventListener(`pointerdown`,n)}),m.addEventListener(`click`,()=>{h.phase===`playing`?h.togglePause():h.start(),g=performance.now(),y()}),s.addEventListener(`click`,()=>{h.phase!==`playing`&&(h.start(),g=performance.now(),y())})}function C(){s.addEventListener(`touchstart`,e=>{let t=e.changedTouches[0];_={x:t.clientX,y:t.clientY}},{passive:!0}),s.addEventListener(`touchend`,e=>{if(!_)return;let t=e.changedTouches[0],n=t.clientX-_.x,r=t.clientY-_.y;_=null,!(Math.hypot(n,r)<24)&&(Math.abs(n)>Math.abs(r)?h.turn(n>0?`right`:`left`):h.turn(r>0?`down`:`up`),y())},{passive:!0})}v(),window.addEventListener(`resize`,v),x(),S(),C(),y(),requestAnimationFrame(b);