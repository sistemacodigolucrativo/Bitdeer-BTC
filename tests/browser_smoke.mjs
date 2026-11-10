import { chromium } from 'playwright';

const base = 'http://127.0.0.1:8777';
const browser = await chromium.launch({headless:true});
const problems=[];
try {
  // First sign-in must lead to language, mining now, system ready, then workspace.
  const first=await browser.newContext({viewport:{width:390,height:844},baseURL:base,locale:'pt-BR'});
  const firstPage=await first.newPage();
  firstPage.on('pageerror',error=>problems.push(error.message));
  await firstPage.goto('/');
  await firstPage.locator('input[autocomplete="username"]').waitFor({timeout:15000});
  await firstPage.locator('input[autocomplete="username"]').fill('browseradmin');
  await firstPage.locator('input[autocomplete="current-password"]').fill('BrowserAdminPassword2026');
  if(await firstPage.getByLabel(/Salvar usuário|Save username|Guardar usuario/).count())
    throw Error('The login form must not show a save-username checkbox');
  await firstPage.locator('button[type="submit"]').click();
  await firstPage.getByTestId('stay-connected-dialog')
    .getByRole('button',{name:'Sim, permanecer conectado'}).click();
  await firstPage.getByText('Visão geral').first().waitFor({timeout:15000});
  await firstPage.getByRole('button',{name:/Menu/}).click();
  await firstPage.getByRole('navigation',{name:'Navegação administrativa'})
    .getByRole('button',{name:'Configurações'}).click();
  const previewForm=firstPage.getByTestId('admin-legit-copy-preview-form');
  const previewDays=firstPage.getByTestId('admin-legit-copy-preview-days');
  await previewDays.fill('5');
  await firstPage.getByTestId('admin-legit-copy-preview-start').click();
  await firstPage.getByTestId('admin-legit-copy-countdown').waitFor({timeout:5000});
  if(await previewForm.count()!==1)
    throw Error('The preview duration form must remain available while the preview is active');
  await previewDays.fill('9');
  await firstPage.getByRole('button',{name:'Aplicar nova duração'}).click();
  const updatedPreviewUntil=Number(await firstPage.evaluate(
    ()=>localStorage.getItem('bitdeer-legit-copy-preview-until')));
  if(updatedPreviewUntil<Date.now()+8*86400000)
    throw Error('The active preview duration was not updated');
  await previewDays.fill('0');
  await firstPage.getByRole('button',{name:'Aplicar nova duração'}).click();
  if(await firstPage.evaluate(()=>document.documentElement.dataset.projectCopyMode)!=='mockup' ||
     await firstPage.evaluate(()=>localStorage.getItem('bitdeer-legit-copy-preview-until'))!==null)
    throw Error('Entering 0 must end the legitimate-copy preview and restore Mockup');
  await first.close();
  const ctx=await browser.newContext({viewport:{width:390,height:844},baseURL:base});
  const registration=await ctx.request.post('/api/index.php?action=register',{
    data:{login:'browsermember',password:'BrowserMemberPassword2026',displayName:'Browser Test'}});
  if(registration.status()!==201)throw Error('Member registration: '+registration.status());
  const login=await ctx.request.post('/api/index.php?action=login',{
    data:{login:'browsermember',password:'BrowserMemberPassword2026',rememberSession:false}});
  if(login.status()!==200)throw Error('Member login: '+login.status());
  const sessionCookie=login.headers()['set-cookie']||'';
  if(/expires=|max-age=/i.test(sessionCookie))
    throw Error('A refused persistent session must use a browser-session cookie');
  // Existing authenticated sessions without a saved choice must not silently
  // assume Portuguese just because local defaults are set.
  const restoredWithoutChoice=await ctx.newPage();
  restoredWithoutChoice.on('pageerror',e=>problems.push(e.message));
  await restoredWithoutChoice.goto('/');
  await restoredWithoutChoice.getByRole('button',{name:'Português'}).waitFor({timeout:15000});
  if(await restoredWithoutChoice.getByTestId('member-bottom-nav').count())
    throw Error('Unchosen language silently bypassed during session restore');
  await restoredWithoutChoice.close();
  const device=await browser.newContext({viewport:{width:390,height:844},baseURL:base,locale:'pt-BR'});
  const screen=await device.newPage();
  await screen.goto('/');
  await screen.locator('input[autocomplete="username"]').fill('browsermember');
  await screen.locator('input[autocomplete="current-password"]').fill('BrowserMemberPassword2026');
  await screen.locator('button[type="submit"]').click();
  await screen.getByTestId('stay-connected-dialog')
    .getByRole('button',{name:'Não, apenas nesta sessão'}).click();
  await screen.getByRole('button',{name:'Português'}).waitFor({timeout:15000});
  await screen.getByRole('button',{name:'Português'}).click();
  await screen.getByRole('button',{name:'Continuar'}).click();
  const enter=screen.getByRole('button',{name:'ENTRAR NO PAINEL'});
  await enter.waitFor({timeout:15000});
  await enter.click({timeout:15000});
  await screen.getByTestId('member-bottom-nav').waitFor({timeout:15000});
  await screen.getByTestId('member-bottom-nav').locator('button').nth(4).click();
  await screen.getByTestId('settings-exit').click();
  await screen.locator('input[autocomplete="username"]').fill('browsermember');
  await screen.locator('input[autocomplete="current-password"]').fill('BrowserMemberPassword2026');
  await screen.locator('button[type="submit"]').click();
  await enter.waitFor({timeout:15000});
  await enter.click({timeout:15000});
  await screen.getByTestId('member-bottom-nav').waitFor({timeout:15000});
  if(await screen.getByTestId('stay-connected-dialog').count())
    throw Error('The saved choice for the same account must be reused without asking again');
  const savedMemberPreference=JSON.parse(await screen.evaluate(
    ()=>localStorage.getItem('bitdeer:stay-connected')));
  if(savedMemberPreference.login!=='browsermember'||savedMemberPreference.stayConnected!==false)
    throw Error('The session preference must be saved locally for the selected account');
  await screen.getByTestId('member-bottom-nav').locator('button').nth(4).click();
  await screen.getByTestId('settings-exit').click();
  await screen.locator('input[autocomplete="username"]').fill('browseradmin');
  await screen.locator('input[autocomplete="current-password"]').fill('BrowserAdminPassword2026');
  await screen.locator('button[type="submit"]').click();
  await screen.getByTestId('stay-connected-dialog').waitFor({timeout:10000});
  await screen.getByTestId('stay-connected-dialog')
    .getByRole('button',{name:'Sim, permanecer conectado'}).click();
  await screen.getByText('Visão geral').first().waitFor({timeout:15000});
  const savedAdminPreference=JSON.parse(await screen.evaluate(
    ()=>localStorage.getItem('bitdeer:stay-connected')));
  if(savedAdminPreference.login!=='browseradmin'||savedAdminPreference.stayConnected!==true)
    throw Error('Switching accounts must ask again and save the new account choice');
  const persistentCookie=(await device.cookies(base)).find(cookie=>cookie.name==='bitdeer_session');
  if(!persistentCookie||!persistentCookie.httpOnly||persistentCookie.expires<Date.now()/1000+29*86400)
    throw Error('Opting in must create a secure persistent session cookie');
  await screen.getByRole('button',{name:/Menu/}).click();
  await screen.getByRole('navigation',{name:'Navegação administrativa'}).getByRole('button',{name:'Sair'}).click();
  await screen.locator('input[autocomplete="username"]').fill('browsermember');
  await screen.locator('input[autocomplete="current-password"]').fill('BrowserMemberPassword2026');
  await screen.locator('button[type="submit"]').click();
  await screen.getByTestId('stay-connected-dialog').waitFor({timeout:10000});
  await screen.getByTestId('stay-connected-dialog')
    .getByRole('button',{name:'Não, apenas nesta sessão'}).click();
  await enter.waitFor({timeout:15000});
  await enter.click({timeout:15000});
  await screen.getByTestId('member-bottom-nav').waitFor({timeout:15000});
  await screen.getByTestId('member-bottom-nav').locator('button').nth(4).click();
  await screen.getByTestId('settings-exit').click();
  await screen.locator('input[autocomplete="username"]').fill('browsermember');
  await screen.locator('input[autocomplete="current-password"]').fill('BrowserMemberPassword2026');
  await screen.locator('button[type="submit"]').click();
  if(await screen.getByTestId('stay-connected-dialog').count())
    throw Error('The latest choice must be reused after the other account choice was replaced');
  await enter.waitFor({timeout:15000});
  await enter.click({timeout:15000});
  await screen.getByTestId('member-bottom-nav').waitFor({timeout:15000});
  await device.close();
  const page=await ctx.newPage();
  page.on('pageerror',e=>problems.push(e.message));
  await page.goto('/');
  await page.getByTestId('home-welcome-card').waitFor({timeout:15000});
  if(await page.locator('div.px-5.pb-3').count())throw Error('Legacy member top header should be removed');
  await page.getByTestId('member-bottom-nav').locator('button').first().waitFor({timeout:15000});
  if(await page.getByTestId('member-bottom-nav').locator('button').count()!==5)throw Error('Member navigation must have five tabs');
  const bottomMenu=page.getByTestId('member-bottom-nav');
  await bottomMenu.waitFor({timeout:10000});
  const menuPosition=await bottomMenu.boundingBox();
  const welcomePosition=await page.getByTestId('home-welcome-card').boundingBox();
  if(!menuPosition||!welcomePosition||menuPosition.y<=welcomePosition.y||
     menuPosition.y+menuPosition.height<page.viewportSize().height-24)
    throw Error('Member navigation must remain beneath content at viewport bottom');
  const mobileBounds=await page.evaluate(()=>{
    const shell=document.querySelector('.btc-app-shell')?.getBoundingClientRect();
    const menu=document.querySelector('[data-testid="member-bottom-nav"]')?.getBoundingClientRect();
    return {shellBottom:shell?.bottom??0,menuBottom:menu?.bottom??0,
      visualHeight:window.visualViewport?.height??window.innerHeight};
  });
  if(mobileBounds.shellBottom>mobileBounds.visualHeight+3 ||
     mobileBounds.menuBottom>mobileBounds.visualHeight+3)
    throw Error('Mobile viewport clips the bottom menu or app shell');
  const contentScroller=page.locator('.member-vertical-scroll').first();
  await contentScroller.evaluate(el=>{el.scrollTop=300;});
  const scrolledMenu=await bottomMenu.boundingBox();
  if(!scrolledMenu||Math.abs(scrolledMenu.y-menuPosition.y)>2)
    throw Error('Bottom navigation must not move with content scrolling');
  await page.getByTestId('member-bottom-nav').locator('button').nth(1).click();
  const store=page.getByTestId('store-view');
  await store.getByTestId('store-active-plan').waitFor({timeout:10000});
  if(await store.evaluate(el=>el.firstElementChild?.getAttribute('data-testid'))!=='store-active-plan')throw Error('Active plan must appear first');
  await store.getByTestId('store-plan-shield').waitFor({timeout:10000});
  const currentPlan=store.getByTestId('store-active-plan');
  if(await currentPlan.locator('svg.lucide-shield-check').count()!==1)
    throw Error('Current plan shield should remain beside the card title');
  if(await store.getByText('Plano atual',{exact:true}).count()!==1)
    throw Error('The active plan label must not be duplicated in the purchase card');
  const figure=store.getByTestId('store-plan-illustration');
  await figure.waitFor({timeout:10000});
  if(await figure.evaluate(el=>el.getBoundingClientRect().height)>112)
    throw Error('Store selected plan illustration is not slim');
  if(await store.getByText(/Escolha um plano. Valores e condições|Choose a plan. Rates and conditions/).count())
    throw Error('Store top banner is still visible');
  await page.screenshot({path:'release-build/store-slim-mobile.png',fullPage:true});
  if(await store.getByText(/Solicitações|Requests/,{exact:true}).count())
    throw Error('Removed requests block is still visible');
  if(await store.getByText(/Ativação após conferência manual|Activation follows manual payment confirmation|La activación requiere la confirmación manual/).count())
    throw Error('Store activation explanatory text must not be shown');
  await page.getByTestId('member-bottom-nav').locator('button').first().click();
  await page.getByTestId('home-rewards-shortcut').waitFor({timeout:10000});
  const welcomeCard=page.getByTestId('home-welcome-card');
  await welcomeCard.waitFor({timeout:10000});
  if(await page.getByTestId('home-plan-badge').count())
    throw Error('The plan badge must not cover the profile avatar');
  const greetingStyles=await page.getByTestId('home-welcome-name').evaluate(el=>{
    const name=el.querySelector('strong');
    const welcome=document.querySelector('[data-testid="home-welcome-message"]');
    return {greeting:getComputedStyle(el).fontWeight,name:name?getComputedStyle(name).fontWeight:'',
      welcome:welcome?getComputedStyle(welcome).fontWeight:'',
      welcomeSize:welcome?getComputedStyle(welcome).fontSize:'',welcomeWrap:welcome?getComputedStyle(welcome).whiteSpace:''};
  });
  if(Number(greetingStyles.greeting)>=600||Number(greetingStyles.name)<700||
     Number(greetingStyles.welcome)>=600||greetingStyles.welcomeWrap!=='nowrap')
    throw Error('The welcome greeting must keep a bold single-line name above normal welcome copy');
  const dailyPlanStyles=await page.getByTestId('home-plan-daily-card').evaluate(el=>{
    const text=el.firstElementChild;
    return {text:text?.textContent?.trim()??'',align:getComputedStyle(el).textAlign,
      wrap:text?getComputedStyle(text).whiteSpace:'',scrollWidth:el.scrollWidth,clientWidth:el.clientWidth};
  });
  if(dailyPlanStyles.align!=='center'||dailyPlanStyles.wrap!=='nowrap'||
     !dailyPlanStyles.text.includes('US$')||!dailyPlanStyles.text.includes('/dia')||
     /…|\.{3}/.test(dailyPlanStyles.text)||dailyPlanStyles.scrollWidth>dailyPlanStyles.clientWidth)
    throw Error('The green plan/daily-value card must show its full centered value without truncation');
  if(await welcomeCard.getByText(/Plano atual:|Current plan:|Plan actual:|Plano Free/i).count())
    throw Error('Welcome card must not display the active plan');
  if(await welcomeCard.getByRole('button',{name:/Atualizar|Refresh|Actualizar/i}).count())
    throw Error('Redundant manual profile-refresh button remains in welcome card');
  if(await page.getByText(/Projeção interna entre atualizações|Internal projection between server updates|Proyección interna entre actualizaciones/i).count())
    throw Error('Removed internal projection note remains visible');
  await page.getByTestId('home-rewards-shortcut').click();
  await page.getByTestId('rewards-premium').waitFor({timeout:10000});
  if(await page.getByTestId('reward-bonus-grid').locator(':scope > div').count()!==2)
    throw Error('Rewards page must contain the two daily bonuses');
  const claimButton=page.getByTestId('claim-daily-rewards');
  await claimButton.waitFor({timeout:10000});
  if(await claimButton.isDisabled())throw Error('Initial daily bonus should be claimable');
  await claimButton.click();
  await page.waitForFunction(()=>/Próximo resgate|Next claim|Próximo reclamo/i.test(
    document.querySelector('[data-testid="claim-daily-rewards"]')?.textContent||''),null,{timeout:10000});
  if(!(await claimButton.isDisabled()))
    throw Error('Daily bonus claim did not enforce the 24-hour wait');
  await page.getByTestId('member-bottom-nav').locator('button').first().click();
  // Verify visual interpolation uses backend-authoritative running state and increases
  // while mining, without writing local browser balances.
  const homeValue=page.getByTestId('mining-live-usd');
  await homeValue.waitFor({timeout:10000});
  const welcomeTopBeforeMining=(await welcomeCard.boundingBox())?.y;
  const miningToggle=page.getByTestId('mining-session-toggle');
  await miningToggle.click();
  await page.getByTestId('session-countdown').waitFor({timeout:10000});
  const savedToast=page.getByTestId('saved-toast');
  await savedToast.waitFor({timeout:5000});
  const toastLayout=await savedToast.evaluate(el=>({position:getComputedStyle(el).position,opacity:getComputedStyle(el).opacity}));
  const welcomeTopAfterMining=(await welcomeCard.boundingBox())?.y;
  if(toastLayout.position!=='fixed'||welcomeTopBeforeMining!==welcomeTopAfterMining)
    throw Error('The saved notice must float without shifting the home cards');
  const toastBounds=await savedToast.boundingBox();
  const activeButtonBounds=await miningToggle.boundingBox();
  const welcomeBounds=await welcomeCard.boundingBox();
  const menuBounds=await page.getByTestId('member-bottom-nav').boundingBox();
  const homeFeedback=page.getByTestId('home-feedback-notice');
  if(await homeFeedback.count()&&await homeFeedback.evaluate(el=>getComputedStyle(el).position)!=='fixed')
    throw Error('Home feedback must not remain in the scrolling layout');
  const intersects=(a,b)=>!!a&&!!b&&a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
  if(intersects(toastBounds,activeButtonBounds)||intersects(toastBounds,welcomeBounds)||intersects(toastBounds,menuBounds))
    throw Error('The saved notice must avoid important home content and controls');
  const firstUsd=await homeValue.innerText();
  await page.waitForTimeout(2500);
  const secondUsd=await homeValue.innerText();
  const displayedUsd=s=>Number(s.match(/US\$\s*([\d.]+)/)?.[1]??NaN);
  if(!(displayedUsd(secondUsd)>displayedUsd(firstUsd)))throw Error('Live mining USD not increasing');
  const displayedBtc=s=>Number(s.replace(' BTC','').trim());
  await page.waitForFunction(()=>/^\d+\.\d{8} BTC$/.test(
    document.querySelector('[data-testid="mining-live-btc"]')?.textContent?.trim()||''),null,{timeout:15000});
  const initialBtc=displayedBtc(await page.getByTestId('mining-live-btc').innerText());
  // Verify against the rate the backend actually supplies to this browser;
  // never assume a hard-coded market price or a particular CI test fixture.
  const rateResponse=await ctx.request.get('/api/index.php?action=withdraw.quote');
  if(!rateResponse.ok())throw Error('Backend BTC/USD quotation unavailable in browser test');
  const quoteRate=Number((await rateResponse.json()).btcUsd);
  if(!Number.isFinite(quoteRate)||quoteRate<=0)throw Error('Invalid backend quotation');
  const syncedUsd=displayedUsd(await homeValue.innerText());
  if(!Number.isFinite(initialBtc)||!Number.isFinite(syncedUsd)||
    Math.abs(initialBtc-syncedUsd/quoteRate)>0.000000011)
    throw Error('Mining BTC/USD equivalents not synchronized at quoted rate: '+
      JSON.stringify({btc:initialBtc,usd:syncedUsd,expected:syncedUsd/quoteRate}));
  // Missing BTC address can be dismissed without saving; registration remains available.
  const registeredWallet='bc1qzcvwxv8vl4c0ryel3m6efed9zrcyyu0sk8fm4z';
  await page.getByTestId('member-bottom-nav').locator('button').nth(3).click();
  const requiredWallet=page.getByTestId('wallet-required-modal');
  await requiredWallet.waitFor({timeout:10000});
  await requiredWallet.getByTestId('wallet-required-close').click();
  await requiredWallet.waitFor({state:'detached',timeout:10000});
  await page.getByTestId('wallet-live-btc').waitFor({timeout:10000});
  await page.getByTestId('member-bottom-nav').locator('button').first().click();
  await page.getByTestId('member-bottom-nav').locator('button').nth(3).click();
  if(await requiredWallet.count())
    throw Error('Dismissed wallet dialog should not block later navigation in this session');
  await page.reload();
  await page.getByTestId('member-bottom-nav').locator('button').nth(3).click();
  await requiredWallet.waitFor({timeout:10000});
  await requiredWallet.getByTestId('wallet-required-start').click();
  const requiredAddress=requiredWallet.getByTestId('wallet-required-address');
  await requiredAddress.fill('not-a-bitcoin-address');
  await requiredWallet.getByTestId('wallet-required-save').click();
  await requiredWallet.getByRole('alert').waitFor({timeout:10000});
  if(await requiredWallet.count()!==1)
    throw Error('Invalid BTC address incorrectly dismissed required dialog');
  await requiredAddress.fill(registeredWallet);
  await requiredWallet.getByTestId('wallet-required-save').click();
  await requiredWallet.getByText(/Confirme o endereço Bitcoin|Confirm the Bitcoin address|Confirme la dirección Bitcoin/).waitFor({timeout:10000});
  await requiredWallet.getByTestId('wallet-required-save').click();
  await requiredWallet.waitFor({state:'detached',timeout:15000});
  const savedWalletResponse=await ctx.request.get('/api/index.php?action=profile');
  if(!savedWalletResponse.ok()||(await savedWalletResponse.json()).profile.walletAddress!==registeredWallet)
    throw Error('Required BTC address was not persisted in PHP/SQLite');
  await page.reload();
  await page.getByTestId('member-bottom-nav').locator('button').nth(3).click();
  const btcValueBox=await page.getByTestId('wallet-live-btc').boundingBox();
  const usdValueBox=await page.getByTestId('wallet-live-usd').boundingBox();
  if(!btcValueBox||!usdValueBox||btcValueBox.y>=usdValueBox.y)
    throw Error('Bitcoin amount must appear above its USD equivalent');
  await page.getByTestId('wallet-live-usd').waitFor({timeout:10000});
  if(await requiredWallet.count())
    throw Error('Required wallet dialog appeared again after successful registration');
  await page.getByTestId('member-bottom-nav').locator('button').first().click();
  // Fake only the response for this browser to verify real UI pagination.
  const withdrawFixture=Array.from({length:25},(_,i)=>({
    id:1000+i,usd_cents:1000+i,btc_satoshis:5000+i,
    status:i%3===0?'approved':'pending',created_at:1800000000-i*60
  }));
  const withdrawalRoute='**/api/index.php?action=withdraw.mine';
  await page.route(withdrawalRoute,route=>route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({requests:withdrawFixture,simulation:true})
  }));
  await page.getByTestId('member-bottom-nav').locator('button').nth(3).click();
  await page.getByTestId('withdraw-history-row').first().waitFor({timeout:10000});
  if(await page.getByTestId('withdraw-history-row').count()!==10)
    throw Error('Withdrawals must show ten rows on the first page');
  if((await page.getByTestId('withdraw-page-indicator').innerText()).trim()!=='1 / 3')
    throw Error('Withdrawal pagination should display three pages');
  if(!((await page.getByTestId('withdraw-status').first().getAttribute('class'))||'').includes('text-emerald'))
    throw Error('Approved withdrawals must be displayed in green');
  if((await page.getByTestId('withdraw-history-row').first().innerText()).includes('equivalência interna'))
    throw Error('The redundant internal equivalent label is still visible');
  await page.getByTestId('withdraw-page-next').click();
  if(!(await page.getByTestId('withdraw-history-row').first().innerText()).includes('#1010'))
    throw Error('Withdrawal page two did not show the next ten records');
  await page.getByTestId('withdraw-page-next').click();
  if(await page.getByTestId('withdraw-history-row').count()!==5)
    throw Error('Withdrawal last page should contain only the remaining five');
  await page.getByTestId('withdraw-page-prev').click();
  await page.unroute(withdrawalRoute);
  const walletBalance=page.getByTestId('wallet-live-usd');
  await walletBalance.waitFor({timeout:10000});
  const firstWallet=await walletBalance.innerText();
  await page.waitForTimeout(2100);
  const secondWallet=await walletBalance.innerText();
  if(!(displayedUsd(secondWallet)>displayedUsd(firstWallet)))throw Error('Live wallet USD not increasing');
  const walletBtc=displayedBtc(await page.getByTestId('wallet-live-btc').innerText());
  if(!Number.isFinite(walletBtc)||Math.abs(walletBtc-displayedUsd(secondWallet)/quoteRate)>0.000000011)
    throw Error('Wallet BTC/USD equivalents not synchronized at quoted rate');
  // Payment feed moved from Wallet to Home; fetch records from the visible Home visit.
  const mockFeedResponse=page.waitForResponse(response=>
    response.url().includes('action=mock.payments.latest'),{timeout:15000});
  await page.getByTestId('member-bottom-nav').locator('button').first().click();
  const mockFeed=await (await mockFeedResponse).json();
  const feed=page.getByTestId('simulated-payments');
  await feed.waitFor({timeout:10000});
  await page.getByTestId('simulated-payment-row').first().waitFor({timeout:10000});
  if(await feed.getByText('Últimos Pagamentos BTC',{exact:true}).count()!==1)
    throw Error('Wallet feed title must be Últimos Pagamentos BTC');
  if(await page.getByTestId('simulated-payment-row').count()!==10 ||
      mockFeed.total!==10||mockFeed.records.length!==10)
    throw Error('Wallet feed must display exactly ten fictional records');
  if(await page.getByTestId('simulated-payments-next').count() ||
     await page.getByTestId('simulated-payments-exhausted').count() ||
     await feed.getByText(/200 registros demonstrativos/i).count())
    throw Error('Wallet must not show the legacy pagination or 200-record footer');
  if(await feed.locator('table thead th').count()!==5)
    throw Error('Latest BTC payments must have five aligned columns');
  if(await feed.getByText(/Registros fictícios de demonstração|Fictional demonstration records|Datos ficticios de demostración/).count())
    throw Error('Remove the technical demonstration paragraph from payment table');
  const hashes=mockFeed.records.map(record=>record.hash);
  if(new Set(hashes).size!==10||hashes.some(hash=>!hash.startsWith('SIM-')))
    throw Error('Wallet mock hashes must be unique and clearly fictional');
  const displayedIds=await page.getByTestId('payment-hash').evaluateAll(nodes=>nodes.map(x=>x.getAttribute('title')||''));
  if(displayedIds.join('|')!==hashes.join('|'))
    throw Error('Wallet must render the backend mock samples in descending date order');
  const displayedTransactionIds=await page.getByTestId('payment-hash').allTextContents();
  const expectedTransactionIds=hashes.map(id=>id.length>12?id.slice(0,6)+'...'+id.slice(-6):id);
  if(displayedTransactionIds.join('|')!==expectedTransactionIds.join('|'))
    throw Error('Transaction IDs must show six characters, an ellipsis and six trailing characters');
  const localDates=await page.evaluate(stamps=>{
    const today=new Date();
    const yesterday=new Date(today);
    yesterday.setDate(yesterday.getDate()-1);
    return {today:today.toLocaleDateString('pt-BR'),
      yesterday:yesterday.toLocaleDateString('pt-BR'),
      records:stamps.map(stamp=>new Date(stamp*1000).toLocaleDateString('pt-BR'))};
  },mockFeed.records.map(record=>record.createdAt));
  if(localDates.records.filter(day=>day===localDates.today).length!==5||
     localDates.records.filter(day=>day===localDates.yesterday).length!==5)
    throw Error('Mock records must use the visitor’s today and yesterday');
  const rate=Number(mockFeed.quoteUsd);
  if(!Number.isFinite(rate)||rate<=0||!mockFeed.quoteSource||
     mockFeed.records.some(record=>Math.abs(Number(record.valueUsd)-
      Number(record.btc)*rate)>.01))
    throw Error('Mock BTC and USD amounts must match the verified market quote');
  const paymentScroll=await page.getByTestId('btc-payments-scroll').evaluate(el=>{
    const ancestor=el.closest('.member-vertical-scroll');
    el.scrollLeft=180;
    return {gesture:getComputedStyle(el).touchAction,
      parentGesture:ancestor?getComputedStyle(ancestor).touchAction:'',
      scrollLeft:el.scrollLeft,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth};
  });
  if(paymentScroll.gesture!=='auto'||paymentScroll.parentGesture!=='auto'||
     paymentScroll.scrollWidth<=paymentScroll.clientWidth||paymentScroll.scrollLeft<100)
    throw Error('Payments table must scroll horizontally without blocking vertical gestures');
  await page.screenshot({path:'release-build/wallet-feed-mobile.png',fullPage:true});
  if(await page.getByText(/Próxima sessão|Next session|Próxima sesión/).count())
    throw Error('Legacy cooldown warning is still shown');
  await page.getByRole('button',{name:/Mineração Ativa|Mining Active|Minería Activa/}).click();
  await page.getByRole('button',{name:/Iniciar Mineração|Start Mining|Iniciar Minería/}).waitFor({timeout:10000});
  if(await page.getByText(/Fim da sessão|Session ends|Fin de sesión/).count())
    throw Error('Old session end timestamp should not remain visible after stopping');
  const restart=page.getByRole('button',{name:/Iniciar Mineração|Start Mining|Iniciar Minería/});
  if(await restart.isDisabled())throw Error('FREE session restart must be available immediately');
  await restart.click();
  await page.getByRole('button',{name:/Mineração Ativa|Mining Active|Minería Activa/}).waitFor({timeout:10000});
  for(let i=0;i<5;i++){
    await page.getByTestId('member-bottom-nav').locator('button').nth(i).click();
    await page.waitForTimeout(200);
    if(await page.getByText('Sincronizando interface...').count())throw Error('React error boundary shown on tab '+i);
  }
  await page.getByTestId('member-bottom-nav').locator('button').nth(2).click();
  await page.getByTestId('rewards-premium').waitFor({timeout:10000});
  await page.getByTestId('rewards-compact-claim').waitFor({timeout:10000});
  if(await page.getByTestId('reward-bonus-grid').locator(':scope > div').count()!==2)
    throw Error('Compact reward grid must have two bonus tiles');
  await page.getByTestId('claim-daily-rewards').waitFor({timeout:10000});
  const referralsToggle=page.getByTestId('referral-history-toggle');
  if(await referralsToggle.getAttribute('aria-expanded')!=='false')
    throw Error('Referral history should start collapsed');
  await referralsToggle.click();
  await page.getByTestId('referrals-in-rewards').waitFor({timeout:10000});
  await page.getByTestId('referrals-in-rewards').getByRole('button',{name:'Copiar convite'}).waitFor({timeout:10000});
  if(await page.getByText('USD é crédito interno, não BTC.').count())
    throw Error('Redundant USD/BTC referral note remains visible');
  const rewardToggle=page.getByTestId('reward-history-toggle');
  if(await page.getByText('A cada 24 horas',{exact:true}).count())
    throw Error('The 24-hour phrase must not appear on Rewards');
  if(await rewardToggle.getAttribute('aria-expanded')!=='false')throw Error('Reward history should start collapsed');
  await rewardToggle.click();
  const inlineHistory=page.getByTestId('reward-history-panel');
  await inlineHistory.waitFor({timeout:10000});
  await inlineHistory.getByTestId('reward-history-log').waitFor({timeout:10000});
  if(await rewardToggle.getAttribute('aria-expanded')!=='true'||await page.getByTestId('rewards-premium').count()!==1)
    throw Error('Reward history should open below Rewards without leaving this page');
  await inlineHistory.getByRole('button',{name:/Atualizar|Refresh|Actualizar/}).click();
  await rewardToggle.click();
  if(await inlineHistory.count()||await rewardToggle.getAttribute('aria-expanded')!=='false')
    throw Error('Reward history should collapse in place');
  if(await page.getByText('Não BTC efetivamente minerado').count())
    throw Error('Removed reward explanation remains visible');

  await page.screenshot({path:'release-build/rewards-slim-mobile.png',fullPage:true});
  await page.getByTestId('member-bottom-nav').locator('button').nth(4).click();
  if(await page.getByRole('button',{name:/Indicações|Referrals|Referidos|Ver histórico|View history/}).count())
    throw Error('Redundant settings button is visible');
  const goldButton=page.getByTestId('settings-top-miners');
  await goldButton.waitFor({timeout:10000});
  const firstSettingsAction=await page.locator('[data-testid="settings-top-miners"]').evaluate(
    node=>node.parentElement?.querySelectorAll('button')[1]===node);
  if(!firstSettingsAction)throw Error('Top Miners must follow only the settings logout header');
  const gold=await goldButton.evaluate(node=>getComputedStyle(node).backgroundImage);
  if(!gold.includes('gradient'))throw Error('Top Miners gold styling missing');
  await goldButton.click();
  await page.getByText('James Hudson').waitFor({timeout:10000});
  await page.getByTestId('top-miners-demo-count').waitFor({timeout:10000});
  await page.getByTestId('top-miners-demo-status').waitFor({timeout:10000});
  const demoMinerCount=Number((await page.getByTestId('top-miners-demo-count').innerText()).replace(/\D/g,''));
  if(demoMinerCount<2349||demoMinerCount>2631)
    throw Error('The simulated live miner count is outside the requested range');
  const minerCards=page.locator('[data-testid="miner-card"]');
  if(await minerCards.count()!==200)throw Error('Top Miners must show exactly 200 demonstration profiles');
  const onlineCount=await page.getByTestId('miner-online-indicator').count();
  if(onlineCount<50||onlineCount>142)
    throw Error('The simulated online list must contain 50 to 142 indicators');
  const minerNames=await minerCards.locator('h3').allTextContents();
  if(new Set(minerNames).size!==200)throw Error('Duplicated Top Miners profile name');
  const brazilCount=await minerCards.filter({hasText:/Brasil|Brazil/}).count();
  if(brazilCount<60)throw Error('Top Miners must have at least 60 Brazilian profiles');
  const ranked=await minerCards.evaluateAll(cards=>cards.map((card,i)=>({
    name:card.querySelector('h3')?.textContent?.trim()??'',
    brazilian:!!card.querySelector('span[aria-label="Brazil"]'),
    btc:Number((card.querySelector('p.font-mono')?.textContent??'').replace(' BTC','').trim()),
    rank:i
  })));
  const brazilian=ranked.filter(x=>x.brazilian);
  if(brazilian.length!==61)throw Error('Top Miners should contain 61 Brazilian profiles');
  const familyNames=brazilian.map(x=>x.name.split(' ').at(-1));
  if(new Set(familyNames).size!==brazilian.length)
    throw Error('A Brazilian surname was repeated in the Top Miners ranking');
  if(ranked.some((x,i)=>i>0&&x.name.split(' ')[0]===ranked[i-1].name.split(' ')[0]))
    throw Error('Adjacent miners share the same first name');
  if(ranked.some((x,i)=>i>0&&!(ranked[i-1].btc>x.btc)))
    throw Error('Top Miners BTC balances must descend in ranking order');
  if(ranked.some((x,i)=>{
    const original=423000000-i*1965713;
    const expected=original<=200000000?Math.round(original/2):original-100000000;
    return Math.round(x.btc*100000000)!==expected;
  }))throw Error('Top Miners reduction must match the 1–4 BTC mapping at every rank');
  if(brazilian.at(-1).rank<185 || brazilian[1].rank>18)
    throw Error('Brazilian profiles must be distributed across the whole ranking');
  const minerScroller=page.getByTestId('top-miners-scroll');
  if(await minerScroller.evaluate(el=>getComputedStyle(el).touchAction)!=='pan-y')
    throw Error('Top Miners scrolling must allow vertical touch gestures');
  await minerScroller.evaluate(el=>{el.scrollTop=250;});
  if(await minerScroller.evaluate(el=>el.scrollTop)<150)
    throw Error('Top Miners list did not scroll independently');
  await page.screenshot({path:'release-build/top-miners-mobile.png',fullPage:true});
  await page.getByText(/Ranking demonstrativo|Demonstration ranking|Ranking demostrativo/i).waitFor({timeout:10000});
  const navBox=await bottomMenu.boundingBox();
  await minerCards.last().scrollIntoViewIfNeeded();
  const scrolledBox=await bottomMenu.boundingBox();
  if(!navBox||!scrolledBox||Math.abs(navBox.y-scrolledBox.y)>2)
    throw Error('Fixed bottom navigation moved during vertical scroll');
  await page.evaluate(()=>localStorage.setItem(
    'bitdeer-legit-copy-preview-until',String(Date.now()+2*60*60*1000)));
  await page.reload();
  await page.getByTestId('member-bottom-nav').waitFor({timeout:15000});
  await page.getByTestId('member-bottom-nav').locator('button').nth(4).click();
  await page.getByTestId('settings-top-miners').click();
  await page.getByText('James Hudson').waitFor({timeout:10000});
  const legitimatePreviewCount=page.getByTestId('top-miners-demo-count');
  await legitimatePreviewCount.waitFor({timeout:10000});
  const legitimatePreviewText=await legitimatePreviewCount.innerText();
  if(/simulad|simulated/i.test(legitimatePreviewText))
    throw Error('Legitimate-copy preview must hide the mockup label');
  if(await page.getByTestId('top-miners-demo-status').count())
    throw Error('Legitimate-copy preview must hide the mockup status notice');
  const legitimateOnlineCount=await page.getByTestId('miner-online-indicator').count();
  if(legitimateOnlineCount<50||legitimateOnlineCount>142)
    throw Error('Legitimate-copy preview must show the simulated online indicators');
  const legitimateMinerCount=Number(legitimatePreviewText.replace(/\D/g,''));
  if(legitimateMinerCount!==demoMinerCount)
    throw Error('Miner counts should remain stable within the same browser session');
  await page.evaluate(()=>localStorage.removeItem('bitdeer-legit-copy-preview-until'));
  await page.reload();
  await page.getByTestId('member-bottom-nav').waitFor({timeout:15000});
  await page.getByTestId('member-bottom-nav').locator('button').nth(4).click();
  await page.getByRole('button',{name:/Histórico VIP|Subscriptions|Suscripciones/}).click();
  await page.getByText(/Histórico de assinaturas|Subscription history|Historial de suscripciones/).first()
    .waitFor({timeout:10000});
  if(await page.getByText(/Histórico dos contratos registrados|Subscription contracts saved|Contratos de suscripción guardados/).count())
    throw Error('Technical VIP contract notice must be removed');
  await page.getByTestId('member-bottom-nav').locator('button').nth(4).click();
  await page.getByTestId('member-bottom-nav').locator('button').nth(3).click();
  await page.getByRole('button',{name:/Sacar|Withdraw|Retirar/}).click();
  await page.getByText(/Solicitação de Saque|Withdrawal Request|Solicitud de Retiro/).waitFor({timeout:10000});
  await page.getByTestId('withdraw-available-card').waitFor({timeout:10000});
  if(await page.locator('p.text-amber-300').filter({hasText:/Todos os membros podem registrar|All members can submit|Todos los miembros pueden registrar/}).count())
    throw Error('Withdrawal yellow informational paragraph must be removed');
  const cardPadding=await page.getByTestId('withdraw-available-card').evaluate(node=>{
    const s=getComputedStyle(node);return {top:parseFloat(s.paddingTop),bottom:parseFloat(s.paddingBottom)};
  });
  if(cardPadding.top>15||cardPadding.bottom>15)
    throw Error('Withdrawal balance card has not been slimmed');
  await page.getByTestId('withdraw-form-heading').getByText('SOLICITAR SAQUE',{exact:true}).waitFor({timeout:10000});
  if(await page.getByTestId('wallet-required-modal').count())
    throw Error('Already registered wallet must not trigger mandatory modal on withdrawal');
  await page.screenshot({path:'release-build/member-mobile.png',fullPage:true});
  const amountField=page.getByTestId('withdraw-request-amount');
  const totalUsd=(await page.getByTestId('withdraw-available-amount').innerText())
    .replace(/[^0-9,\.]/g,'').replace(',','.');
  await page.waitForFunction(expected=>document.querySelector('[data-testid="withdraw-request-amount"]')?.value===expected,
    Number(totalUsd).toFixed(2),{timeout:10000});
  const displayedAddress=page.getByText('bc1qzcvwxv8vl4c0ryel3m6efed9zrcyyu0sk8fm4z',{exact:true});
  if(await displayedAddress.count())
    throw Error('Saved BTC wallet address must not appear in the withdrawal form');
  if(await page.getByText(/O servidor verifica a cotação ao registrar|The server verifies the rate when|El servidor verifica la cotización al/).count())
    throw Error('BTC quote details should be removed from withdrawal form');
  await amountField.fill('0.12');
  await page.waitForTimeout(700);
  if(await amountField.inputValue()!=='0.12')
    throw Error('Autofill must not overwrite a manually edited withdrawal amount');
  await page.getByRole('button',{name:'Bitcoin (BTC)'}).click();
  await page.getByTestId('withdraw-available-card').getByText(/Saldo disponível em BTC|Available balance in BTC|Saldo disponible en BTC/)
    .waitFor({timeout:10000});
  const totalBtc=(await page.getByTestId('withdraw-available-amount').innerText()).replace(' BTC','').trim();
  await page.waitForFunction(expected=>document.querySelector('[data-testid="withdraw-request-amount"]')?.value===expected,
    totalBtc,{timeout:10000});
  if(!/^\d+\.\d{8}$/.test(await amountField.inputValue()))
    throw Error('BTC autofill must use exactly eight decimal places');
  await page.getByRole('button',{name:/Dólar \(USD\)|Dollar \(USD\)/}).click();
  await page.getByTestId('withdraw-available-card').getByText(/Saldo disponível em USD|Available balance in USD|Saldo disponible en USD/)
    .waitFor({timeout:10000});
  await page.waitForFunction(expected=>document.querySelector('[data-testid="withdraw-request-amount"]')?.value===expected,
    Number(totalUsd).toFixed(2),{timeout:10000});
  if(await page.getByText(/não saldo BTC na blockchain|not a blockchain BTC balance|no es saldo BTC en blockchain/).count())
    throw Error('Removed blockchain phrase is still visible in the withdrawal card');
  await page.getByRole('button',{name:/Voltar à carteira|Back to wallet|Volver a la billetera/}).click();
  await page.getByTestId('member-bottom-nav').locator('button').nth(4).click();
  await page.getByRole('button',{name:/Meu perfil|My profile|Mi perfil/}).click();
  const phone=page.locator('input[type="tel"]');
  await phone.fill('+5531999999999');
  if(await phone.inputValue()!=='+55 31 99999 9999')throw Error('Brazil international phone format failed');
  await phone.fill('+12125551234');
  if(await phone.inputValue()!=='+1 212 555 1234')throw Error('US international phone format failed');
  await phone.fill('+442079460958');
  if(await phone.inputValue()!=='+44 20 7946 0958')throw Error('UK international phone format failed');
  if(await phone.getAttribute('maxlength')!=='24')throw Error('International phone maxlength is missing');
  await page.setViewportSize({width:1280,height:800});
  await page.getByTestId('member-bottom-nav').locator('button').first().click();
  await page.waitForTimeout(250);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+3);
  if(overflow)throw Error('Horizontal overflow on desktop member view');
  await page.screenshot({path:'release-build/member-desktop.png',fullPage:true});
  // Change the member language, verify localStorage, SQLite and page reload.
  await page.getByTestId('member-bottom-nav').locator('button').nth(4).click();
  await page.locator('select').selectOption('es');
  await page.waitForTimeout(500);
  const storedLanguage=await page.evaluate(()=>Object.entries(localStorage).filter(
    ([key])=>key.startsWith('btc_member_language_')).map(([,value])=>value));
  if(!storedLanguage.includes('es'))throw Error('Member-specific language not persisted locally');
  const pref=await ctx.request.get('/api/index.php?action=language.preference');
  if((await pref.json()).language!=='es')throw Error('Member language not persisted in SQLite');
  await page.reload();
  await page.getByTestId('member-bottom-nav').locator('button').nth(4).click();
  if(await page.locator('select').inputValue()!=='es')
    throw Error('Language was reset after reload');
  // Member-facing panels must follow the selected locale, not retain PT-only copy.
  await page.getByTestId('member-bottom-nav').locator('button').nth(3).click();
  await page.getByRole('heading',{name:'Billetera'}).waitFor({timeout:10000});
  await page.getByRole('button',{name:'Retirar'}).click();
  await page.getByRole('heading',{name:'Solicitud de Retiro'}).waitFor({timeout:10000});
  await page.getByRole('button',{name:'Volver a la billetera'}).click();
  await page.getByTestId('member-bottom-nav').locator('button').nth(4).click();
  await page.locator('select').selectOption('en');
  await page.getByTestId('member-bottom-nav').locator('button').nth(1).click();
  if(await page.getByText('Activation follows manual payment confirmation. No fixed deadline is guaranteed.').count())
    throw Error('Removed activation note appears in English store');
  await page.getByTestId('member-bottom-nav').locator('button').nth(3).click();
  await page.getByRole('button',{name:'Withdraw'}).click();
  await page.getByRole('heading',{name:'Withdrawal Request'}).waitFor({timeout:10000});
  await page.getByRole('button',{name:'Back to wallet'}).click();
  // Outages preserve a stored display quote and recover automatically without
  // exposing technical errors. Fresh quotes are still required for withdrawals.
  const quotePattern='**/api/index.php?action=withdraw.quote';
  const cachedBefore=await page.evaluate(()=>localStorage.getItem('bitdeer_btc_usd_last_quote_v1'));
  if(!cachedBefore||!(JSON.parse(cachedBefore).rate>0))
    throw Error('Verified BTC/USD rate must be cached for reload recovery');
  await page.route(quotePattern,route=>route.fulfill({
    status:503,contentType:'application/json',body:'{"error":"BTC/USD price unavailable"}'
  }));
  await page.reload();
  await page.getByTestId('member-bottom-nav').locator('button').first().click();
  await page.waitForFunction(()=>/^\d+\.\d{8} BTC$/.test(
    document.querySelector('[data-testid="mining-live-btc"]')?.textContent?.trim()||''),
    null,{timeout:10000});
  if(await page.getByText(/BTC quote unavailable|Cotação BTC indisponível|Cotización BTC no disponible/).count())
    throw Error('Last-known quote failures must not be shown to the member');
  if(await page.getByRole('button',{name:/Retry|Reintentar|Tentar novamente/}).count())
    throw Error('Manual BTC quote retry must not be required');
  await page.getByTestId('member-bottom-nav').locator('button').nth(4).click();
  await page.getByTestId('settings-top-miners').click();
  // content-visibility:auto deliberately defers offscreen ranking cards.
  // Scroll the first card into view and check its rendered numerical value
  // against the last verified quote; do not mistake offscreen innerText for
  // a missing USD amount.
  const firstMiner=page.getByTestId('miner-card').first();
  await firstMiner.scrollIntoViewIfNeeded();
  const cachedMinerUsd=await firstMiner.getByTestId('miner-usd-amount').evaluate(node=>{
    const btcNode=node.closest('[data-testid="miner-card"]')?.querySelector('p.font-mono');
    const btc=Number((btcNode?.textContent||'').replace(' BTC','').trim());
    const quote=JSON.parse(localStorage.getItem('bitdeer_btc_usd_last_quote_v1')||'null');
    const rate=Number(node.getAttribute('data-btc-usd-rate'));
    const observed=(node.textContent||'').trim();
    const render=node.innerText.trim();
    const expected=['pt-BR','en-US','es-ES'].map(locale=>
      '$ '+new Intl.NumberFormat(locale,{minimumFractionDigits:4,maximumFractionDigits:4})
        .format(btc*Number(quote?.rate)));
    return {btc,rate,cachedRate:quote?.rate,observed,render,expected};
  });
  if(!(cachedMinerUsd.btc>0)||!(cachedMinerUsd.rate>0)||
     Math.abs(cachedMinerUsd.rate-cachedMinerUsd.cachedRate)>0.000001||
     !cachedMinerUsd.expected.includes(cachedMinerUsd.observed)||
     cachedMinerUsd.render!==cachedMinerUsd.observed)
    throw Error('Top Miners must reuse last BTC/USD price during quote outages: '+
      JSON.stringify(cachedMinerUsd));
  const recovered=page.waitForResponse(response=>
    response.url().includes('action=withdraw.quote')&&response.status()===200,{timeout:30000});
  await page.unroute(quotePattern);
  await recovered;
  await page.getByTestId('member-bottom-nav').locator('button').first().click();
  await page.waitForFunction(()=>/^\d+\.\d{8} BTC$/.test(
    document.querySelector('[data-testid="mining-live-btc"]')?.textContent?.trim()||''),
    null,{timeout:10000});
  await page.evaluate(()=>{
    const key='btc_mining_user_preferences_v1';
    const data=JSON.parse(localStorage.getItem(key)||'{}');
    localStorage.setItem(key,JSON.stringify({...data,theme:'light'}));
  });
  await page.reload();
  await page.getByTestId('member-bottom-nav').locator('button').nth(4).click();
  const lightGold=await page.getByTestId('settings-top-miners').evaluate(el=>({
    foreground:getComputedStyle(el).color,
    background:getComputedStyle(el).backgroundImage,
  }));
  if(lightGold.foreground!=='rgb(35, 25, 5)'||!lightGold.background.includes('gradient'))
    throw Error('Top Miners gold contrast incorrect in light theme');
  const sessionResponse=await ctx.request.get('/api/index.php?action=session');
  const sessionData=await sessionResponse.json();
  const ticketResponse=await ctx.request.post('/api/index.php?action=support.ticket.create',{
    headers:{'X-CSRF-Token':sessionData.csrfToken},
    data:{subject:'Atendimento pelo navegador',message:'Precisamos testar o retorno do suporte no painel.'}
  });
  if(ticketResponse.status()!==201)throw Error('Support ticket create failed in browser');
  const browserTicketId=(await ticketResponse.json()).ticket.id;
  await ctx.close();

  const admin=await browser.newContext({viewport:{width:1280,height:800},baseURL:base});
  const auth=await admin.request.post('/api/index.php?action=login',{
    data:{login:'browseradmin',password:'BrowserAdminPassword2026'}});
  if(auth.status()!==200)throw Error('Admin login: '+auth.status());
  const adminPage=await admin.newPage();
  adminPage.on('pageerror',e=>problems.push(e.message));
  await adminPage.goto('/');
  await adminPage.getByTestId('admin-language-selector').waitFor({timeout:15000});
  await adminPage.getByTestId('admin-language-selector').selectOption('pt');
  await adminPage.getByText('Visão geral').first().waitFor({timeout:15000});
  await adminPage.getByRole('button',{name:'Abrir menu administrativo'}).click();
  await adminPage.getByRole('button',{name:/Planos VIP/}).click();
  await adminPage.getByRole('button',{name:/FREE/}).click();
  await adminPage.getByText('Valor mínimo de saque (USD)').waitFor({timeout:10000});
  await adminPage.getByRole('button',{name:'Abrir menu administrativo'}).click();
  await adminPage.getByRole('button',{name:'Suporte',exact:true}).click();
  await adminPage.getByText('#'+browserTicketId+' · Atendimento pelo navegador').waitFor({timeout:10000});
  const ticketCard=adminPage.getByTestId('admin-ticket').filter({hasText:'Atendimento pelo navegador'});
  await ticketCard.getByRole('button',{name:'Resolver / Responder'}).click();
  await ticketCard.locator('textarea').fill('Resposta validada no navegador.');
  await ticketCard.getByRole('button',{name:'Enviar resposta'}).click();
  await ticketCard.getByText('Respondido').waitFor({timeout:10000});
  await adminPage.screenshot({path:'release-build/support-admin-reply.png',fullPage:true});
  // The founding Marcelo fixture must be visible but protected from reseeding.
  await adminPage.getByRole('button',{name:'Abrir menu administrativo'}).click();
  await adminPage.getByRole('button',{name:'Membros',exact:true}).click();
  const marceloSeedButton=adminPage.getByTestId('admin-seed-marcelo');
  await marceloSeedButton.waitFor({timeout:10000});
  await adminPage.waitForFunction(()=>
    document.querySelector('[data-testid="admin-seed-marcelo"]')?.hasAttribute('disabled'),
    null,{timeout:10000});
  const marceloMember=adminPage.locator('article').filter({hasText:/marcelo/i}).first();
  await marceloMember.getByText(/Marcelo.*FREE/).waitFor({timeout:10000});
  // The admin editor is available only for a real member.
  const memberCard=adminPage.locator('article').filter({hasText:'browsermember'}).first();
  await memberCard.getByRole('button',{name:'Detalhes / Editar'}).click();
  const memberEditPage=adminPage.getByTestId('admin-member-editor');
  await memberEditPage.waitFor({timeout:10000});
  const profileForm=adminPage.getByTestId('admin-member-profile-form');
  await profileForm.waitFor({timeout:10000});
  if(await profileForm.locator('input').count()!==5)
    throw Error('Member profile editor is missing a field');
  const profileSave=adminPage.getByTestId('admin-member-profile-save');
  await profileSave.waitFor({timeout:10000});
  await profileSave.click();
  await adminPage.getByRole('status').filter({hasText:'Alteração registrada.'}).waitFor({timeout:10000});
  await adminPage.getByTestId('admin-member-editor-close').click();
  await memberEditPage.waitFor({state:'detached',timeout:10000});
  await memberCard.getByRole('button',{name:'Detalhes / Editar'}).waitFor({timeout:10000});
  await memberCard.getByRole('button',{name:'Detalhes / Editar'}).click();
  const editor=adminPage.getByTestId('admin-member-records');
  await editor.waitFor({timeout:10000});
  await editor.getByTestId('admin-member-balance').waitFor({timeout:10000});
  await adminPage.screenshot({path:'release-build/admin-member-editor.png',fullPage:true});
  await editor.getByTestId('admin-history-kind').selectOption('bonus');
  await editor.getByRole('button',{name:'Adicionar registro'}).click();
  await editor.getByTestId('admin-history-form').waitFor({timeout:10000});
  await editor.getByRole('button',{name:'Salvar registro'}).click();
  await editor.getByTestId('admin-history-form').waitFor({state:'detached',timeout:10000});
  if(await editor.getByTestId('admin-history-rows').locator('> div').count() < 1)
    throw Error('Admin history record was not saved');
  const adminSession=await admin.request.get('/api/index.php?action=session');
  const adminCsrf=(await adminSession.json()).csrfToken;
  const membersResp=await admin.request.get('/api/index.php?action=admin.members');
  const matching=(await membersResp.json()).members.find(x=>x.login==='browsermember');
  if(!matching)throw Error('Browser member missing from admin members');
  const setBalance=await admin.request.post('/api/index.php?action=admin.member.balance.adjust',{
    headers:{'X-CSRF-Token':adminCsrf},
    data:{userId:matching.id,currency:'USD',mode:'set',amount:'5.00'}
  });
  if(!setBalance.ok())throw Error('Admin balance adjustment failed: '+setBalance.status());
  await adminPage.screenshot({path:'release-build/admin-desktop.png',fullPage:true});
  if(await adminPage.getByText('Sincronizando interface...').count())throw Error('Admin React error boundary shown');
  // All administration sections, not just member pages, must follow the selected language.
  await adminPage.getByTestId('admin-language-selector').selectOption('en');
  await adminPage.getByRole('heading',{name:'Edit member'}).waitFor({timeout:10000});
  await editor.getByText(/Member plan, balance and history/).waitFor({timeout:10000});
  await adminPage.getByTestId('admin-member-editor-close').click();
  await memberEditPage.waitFor({state:'detached',timeout:10000});
  await adminPage.getByRole('heading',{name:'Member management'}).waitFor({timeout:10000});
  await adminPage.getByRole('button',{name:'Open administration menu'}).click();
  await adminPage.getByRole('button',{name:'Overview',exact:true}).click();
  await adminPage.getByRole('heading',{name:'Overview'}).waitFor({timeout:10000});
  await adminPage.getByTestId('admin-language-selector').selectOption('es');
  await adminPage.getByRole('heading',{name:'Resumen general'}).waitFor({timeout:10000});
  await adminPage.getByRole('button',{name:'Abrir menú de administración'}).click();
  await adminPage.getByRole('button',{name:'Miembros',exact:true}).click();
  await adminPage.getByRole('heading',{name:'Gestión de miembros'}).waitFor({timeout:10000});
  await admin.close();
  const withdrawal=await browser.newContext({viewport:{width:390,height:844},baseURL:base});
  const memberAuth=await withdrawal.request.post('/api/index.php?action=login',{
    data:{login:'browsermember',password:'BrowserMemberPassword2026'}});
  if(memberAuth.status()!==200)throw Error('Member login for modal test');
  const withdrawalPage=await withdrawal.newPage();
  withdrawalPage.on('pageerror',e=>problems.push(e.message));
  await withdrawalPage.goto('/');
  await withdrawalPage.getByTestId('member-bottom-nav').waitFor({timeout:15000});
  await withdrawalPage.getByTestId('member-bottom-nav').locator('button').nth(3).click();
  await withdrawalPage.getByRole('button',{name:/Sacar|Withdraw|Retirar/}).click();
  await withdrawalPage.getByTestId('withdraw-request-amount').fill('1.00');
  await withdrawalPage.getByRole('button',{name:/Enviar para minha carteira|Send to my wallet|Enviar a mi billetera|Submit request|Registrar solicitud/}).click();
  const modal=withdrawalPage.getByTestId('withdraw-awaiting-vip-modal');
  await modal.waitFor({timeout:12000});
  // The withdrawal modal is localized according to the member's selected language,
  // which can differ from the browser locale in a restored session.
  await modal.getByText(/Você não pode realizar outros saques no momento!|You cannot make other withdrawals right now|No puede realizar más retiros por ahora/).waitFor({timeout:10000});
  await withdrawalPage.screenshot({path:'release-build/withdraw-awaiting-vip-modal.png',fullPage:true});
  await modal.getByTestId('withdraw-go-to-store').click();
  await withdrawalPage.getByTestId('store-view').waitFor({timeout:10000});
  if(!/VIP 01/.test(await withdrawalPage.getByTestId('store-plan-illustration').innerText()))
    throw Error('Free member not directed to next VIP plan');
  await withdrawal.close();
  if(problems.length)throw Error('Browser JS errors: '+problems.join('; '));
  console.log('PASS: responsive member navigation, screenshot captures, admin browser route');
} finally {
  await browser.close();
}
