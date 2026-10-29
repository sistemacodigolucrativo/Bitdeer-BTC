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
  await firstPage.locator('button[type="submit"]').click();
  await firstPage.getByText('Visão geral').first().waitFor({timeout:15000});
  await first.close();
  const ctx=await browser.newContext({viewport:{width:390,height:844},baseURL:base});
  const registration=await ctx.request.post('/api/index.php?action=register',{
    data:{login:'browsermember',password:'BrowserMemberPassword2026',displayName:'Browser Test'}});
  if(registration.status()!==201)throw Error('Member registration: '+registration.status());
  const login=await ctx.request.post('/api/index.php?action=login',{
    data:{login:'browsermember',password:'BrowserMemberPassword2026'}});
  if(login.status()!==200)throw Error('Member login: '+login.status());
  // Existing authenticated sessions without a saved choice must not silently
  // assume Portuguese just because local defaults are set.
  const restoredWithoutChoice=await ctx.newPage();
  restoredWithoutChoice.on('pageerror',e=>problems.push(e.message));
  await restoredWithoutChoice.goto('/');
  await restoredWithoutChoice.getByRole('button',{name:'Português'}).waitFor({timeout:15000});
  if(await restoredWithoutChoice.getByTestId('member-top-nav').count())
    throw Error('Unchosen language silently bypassed during session restore');
  await restoredWithoutChoice.close();
  const device=await browser.newContext({viewport:{width:390,height:844},baseURL:base,locale:'pt-BR'});
  const screen=await device.newPage();
  await screen.goto('/');
  await screen.locator('input[autocomplete="username"]').fill('browsermember');
  await screen.locator('input[autocomplete="current-password"]').fill('BrowserMemberPassword2026');
  await screen.locator('button[type="submit"]').click();
  await screen.getByRole('button',{name:'Português'}).waitFor({timeout:15000});
  await screen.getByRole('button',{name:'Português'}).click();
  await screen.getByRole('button',{name:'Continuar'}).click();
  const enter=screen.getByRole('button',{name:'ENTRAR NO PAINEL'});
  await enter.waitFor({timeout:15000});
  await enter.click({timeout:15000});
  await screen.getByTestId('member-top-nav').waitFor({timeout:15000});
  await screen.getByRole('button',{name:'Sair'}).click();
  await screen.locator('input[autocomplete="username"]').fill('browsermember');
  await screen.locator('input[autocomplete="current-password"]').fill('BrowserMemberPassword2026');
  await screen.locator('button[type="submit"]').click();
  await enter.waitFor({timeout:15000});
  if(await screen.getByRole('button',{name:'Português'}).count())
    throw Error('Language picker was repeated after previously saving the language');
  await enter.click({timeout:15000});
  await screen.getByTestId('member-top-nav').waitFor({timeout:15000});
  await device.close();
  const page=await ctx.newPage();
  page.on('pageerror',e=>problems.push(e.message));
  await page.goto('/');
  await page.getByText('Bitdeer BTC').first().waitFor({timeout:15000});
  await page.locator('nav button').first().waitFor({timeout:15000});
  if(await page.locator('nav button').count()!==5)throw Error('Member navigation must have five tabs');
  const topMenu=page.getByTestId('member-top-nav');
  await topMenu.waitFor({timeout:10000});
  await page.locator('nav button').nth(1).click();
  const store=page.getByTestId('store-view');
  await store.getByTestId('store-active-plan').waitFor({timeout:10000});
  if(await store.evaluate(el=>el.firstElementChild?.getAttribute('data-testid'))!=='store-active-plan')throw Error('Active plan must appear first');
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
  await page.locator('nav button').first().click();
  const bonus=page.getByTestId('daily-bonus-card');
  await bonus.waitFor({timeout:10000});
  if(await bonus.locator('button').count()!==1)throw Error('Daily bonus must have one redeem button');
  if(await bonus.getByText('USD').count()!==1||await bonus.getByText('Satoshis').count()!==1)
    throw Error('Daily bonus card must present both reward types');
  await bonus.locator('button').click();
  const claimButton=page.getByTestId('claim-daily-rewards');
  await claimButton.waitFor({timeout:10000});
  if(await claimButton.isDisabled())throw Error('Initial daily bonus should be claimable');
  await claimButton.click();
  await page.waitForFunction(()=>/Próximo resgate|Next claim|Próximo reclamo/i.test(
    document.querySelector('[data-testid="claim-daily-rewards"]')?.textContent||''),null,{timeout:10000});
  if(!(await claimButton.isDisabled()))
    throw Error('Daily bonus claim did not enforce the 24-hour wait');
  await page.locator('nav button').first().click();
  // Verify visual interpolation uses backend-authoritative running state and increases
  // while mining, without writing local browser balances.
  const homeValue=page.getByTestId('mining-live-usd');
  await homeValue.waitFor({timeout:10000});
  await page.getByRole('button',{name:/Iniciar Mineração|Start Mining|Iniciar Minería/}).click();
  await page.getByRole('button',{name:/Mineração Ativa|Mining Active|Minería Activa/}).waitFor({timeout:10000});
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
  await page.locator('nav button').nth(3).click();
  const walletBalance=page.getByTestId('wallet-live-usd');
  await walletBalance.waitFor({timeout:10000});
  const firstWallet=await walletBalance.innerText();
  await page.waitForTimeout(2100);
  const secondWallet=await walletBalance.innerText();
  if(!(displayedUsd(secondWallet)>displayedUsd(firstWallet)))throw Error('Live wallet USD not increasing');
  const feed=page.getByTestId('simulated-payments');
  await feed.waitFor({timeout:10000});
  await page.getByTestId('simulated-payment-row').first().waitFor({timeout:10000});
  if(await page.getByTestId('simulated-payment-row').count()!==10)
    throw Error('Wallet feed must display ten rows');
  const firstIds=await page.getByTestId('simulated-payment-row').locator('p.font-mono').allTextContents();
  await page.getByTestId('simulated-payments-next').click();
  await page.waitForFunction(old=>
    document.querySelector('[data-testid="simulated-payment-row"] p.font-mono')?.textContent!==old,
    firstIds[0],{timeout:10000});
  const secondIds=await page.getByTestId('simulated-payment-row').locator('p.font-mono').allTextContents();
  if(secondIds.some(id=>firstIds.includes(id)))throw Error('Wallet feed repeated rows');
  await page.screenshot({path:'release-build/wallet-feed-mobile.png',fullPage:true});
  const walletBtc=displayedBtc(await page.getByTestId('wallet-live-btc').innerText());
  if(!Number.isFinite(walletBtc)||Math.abs(walletBtc-displayedUsd(secondWallet)/quoteRate)>0.000000011)
    throw Error('Wallet BTC/USD equivalents not synchronized at quoted rate');
  await page.locator('nav button').first().click();
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
    await page.locator('nav button').nth(i).click();
    await page.waitForTimeout(200);
    if(await page.getByText('Sincronizando interface...').count())throw Error('React error boundary shown on tab '+i);
  }
  await page.locator('nav button').nth(2).click();
  await page.getByTestId('rewards-premium').waitFor({timeout:10000});
  await page.getByTestId('rewards-compact-claim').waitFor({timeout:10000});
  if(await page.getByTestId('reward-bonus-grid').locator(':scope > div').count()!==2)
    throw Error('Compact reward grid must have two bonus tiles');
  await page.getByTestId('claim-daily-rewards').waitFor({timeout:10000});
  await page.getByTestId('referrals-in-rewards').waitFor({timeout:10000});
  await page.getByTestId('referrals-in-rewards').getByRole('button',{name:'Copiar convite'}).waitFor({timeout:10000});
  await page.screenshot({path:'release-build/rewards-slim-mobile.png',fullPage:true});
  await page.locator('nav button').nth(4).click();
  if(await page.getByRole('button',{name:/Indicações|Referrals|Referidos|Ver histórico|View history/}).count())
    throw Error('Redundant settings button is visible');
  const goldButton=page.getByTestId('settings-top-miners');
  await goldButton.waitFor({timeout:10000});
  const firstSettingsButton=await page.locator('[data-testid="settings-top-miners"]').evaluate(
    node=>node.parentElement?.querySelectorAll('button')[0]===node);
  if(!firstSettingsButton)throw Error('Top Miners must be first settings action');
  const gold=await goldButton.evaluate(node=>getComputedStyle(node).backgroundImage);
  if(!gold.includes('gradient'))throw Error('Top Miners gold styling missing');
  await goldButton.click();
  await page.getByText('James Hudson').waitFor({timeout:10000});
  const minerCards=page.locator('[data-testid="miner-card"]');
  if(await minerCards.count()!==200)throw Error('Top Miners must show exactly 200 demonstration profiles');
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
  if(brazilian.at(-1).rank<185 || brazilian[1].rank>18)
    throw Error('Brazilian profiles must be distributed across the whole ranking');
  await page.screenshot({path:'release-build/top-miners-mobile.png',fullPage:true});
  await page.getByText(/Ranking demonstrativo|Demonstration ranking|Ranking demostrativo/i).waitFor({timeout:10000});
  const navBox=await topMenu.boundingBox();
  await minerCards.last().scrollIntoViewIfNeeded();
  const scrolledBox=await topMenu.boundingBox();
  if(!navBox||!scrolledBox||Math.abs(navBox.y-scrolledBox.y)>2)
    throw Error('Fixed header navigation moved during vertical scroll');
  await page.locator('nav button').nth(4).click();
  await page.getByRole('button',{name:/Histórico VIP|Subscriptions|Suscripciones/}).click();
  await page.getByText(/Histórico de assinaturas|Subscription history|Historial de suscripciones/).first()
    .waitFor({timeout:10000});
  await page.locator('nav button').nth(4).click();
  await page.locator('nav button').nth(3).click();
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
  await page.getByText(/Cadastrar carteira Bitcoin|Register Bitcoin wallet|Registrar billetera Bitcoin/).waitFor({timeout:10000});
  await page.screenshot({path:'release-build/member-mobile.png',fullPage:true});
  await page.locator('input[placeholder="bc1..."]').fill('bc1qzcvwxv8vl4c0ryel3m6efed9zrcyyu0sk8fm4z');
  await page.getByRole('button',{name:/Salvar carteira|Save wallet|Guardar billetera/}).click();
  await page.getByRole('button',{name:/Sacar|Withdraw|Retirar/}).waitFor({timeout:10000});
  if(await page.getByRole('button',{name:/Editar carteira|Edit wallet|Editar billetera/}).count())
    throw Error('Saved BTC wallet address card should be hidden');
  await page.getByRole('button',{name:/Sacar|Withdraw|Retirar/}).click();
  await page.getByTestId('withdraw-form-heading').getByText('SOLICITAR SAQUE',{exact:true}).waitFor({timeout:10000});
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
  await page.locator('nav button').nth(4).click();
  await page.getByRole('button',{name:/Meu perfil|My profile|Mi perfil/}).click();
  const phone=page.locator('input[type="tel"]');
  await phone.fill('31999999999');
  if(await phone.inputValue()!=='(31) 99999-9999')throw Error('Mobile phone mask failed');
  await phone.fill('3133333333');
  if(await phone.inputValue()!=='(31) 3333-3333')throw Error('Landline mask failed');
  if(await phone.getAttribute('maxlength')!=='15')throw Error('Phone maxlength is missing');
  await page.setViewportSize({width:1280,height:800});
  await page.locator('nav button').first().click();
  await page.waitForTimeout(250);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+3);
  if(overflow)throw Error('Horizontal overflow on desktop member view');
  await page.screenshot({path:'release-build/member-desktop.png',fullPage:true});
  // Change the member language, verify localStorage, SQLite and page reload.
  await page.locator('nav button').nth(4).click();
  await page.locator('select').selectOption('es');
  await page.waitForTimeout(500);
  const storedLanguage=await page.evaluate(()=>Object.entries(localStorage).filter(
    ([key])=>key.startsWith('btc_member_language_')).map(([,value])=>value));
  if(!storedLanguage.includes('es'))throw Error('Member-specific language not persisted locally');
  const pref=await ctx.request.get('/api/index.php?action=language.preference');
  if((await pref.json()).language!=='es')throw Error('Member language not persisted in SQLite');
  await page.reload();
  await page.locator('nav button').nth(4).click();
  if(await page.locator('select').inputValue()!=='es')
    throw Error('Language was reset after reload');
  // Member-facing panels must follow the selected locale, not retain PT-only copy.
  await page.locator('nav button').nth(3).click();
  await page.getByRole('heading',{name:'Billetera'}).waitFor({timeout:10000});
  await page.getByRole('button',{name:'Retirar'}).click();
  await page.getByRole('heading',{name:'Solicitud de Retiro'}).waitFor({timeout:10000});
  await page.getByRole('button',{name:'Volver a la billetera'}).click();
  await page.locator('nav button').nth(4).click();
  await page.locator('select').selectOption('en');
  await page.locator('nav button').nth(1).click();
  if(await page.getByText('Activation follows manual payment confirmation. No fixed deadline is guaranteed.').count())
    throw Error('Removed activation note appears in English store');
  await page.locator('nav button').nth(3).click();
  await page.getByRole('button',{name:'Withdraw'}).click();
  await page.getByRole('heading',{name:'Withdrawal Request'}).waitFor({timeout:10000});
  await page.getByRole('button',{name:'Back to wallet'}).click();
  // A real outage cannot be described indefinitely as "being calculated".
  // Stub only the public quote request in this browser, not any PHP balances.
  const quotePattern='**/api/index.php?action=withdraw.quote';
  await page.route(quotePattern,route=>route.fulfill({
    status:503,contentType:'application/json',body:'{"error":"BTC/USD price unavailable"}'
  }));
  await page.reload();
  await page.locator('nav button').first().click();
  await page.getByRole('status').filter({hasText:'BTC quote unavailable'}).waitFor({timeout:10000});
  await page.unroute(quotePattern);
  await page.getByRole('button',{name:'Retry'}).click();
  await page.waitForFunction(()=>document.querySelector('[data-testid="mining-live-btc"]')?.textContent?.trim()!=='— BTC',
    null,{timeout:10000});
  await page.evaluate(()=>{
    const key='btc_mining_user_preferences_v1';
    const data=JSON.parse(localStorage.getItem(key)||'{}');
    localStorage.setItem(key,JSON.stringify({...data,theme:'light'}));
  });
  await page.reload();
  await page.locator('nav button').nth(4).click();
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
  // The admin editor is available only for a real member; mock history is labelled.
  await adminPage.getByRole('button',{name:'Abrir menu administrativo'}).click();
  await adminPage.getByRole('button',{name:'Membros',exact:true}).click();
  const memberCard=adminPage.locator('article').filter({hasText:'browsermember'}).first();
  await memberCard.getByRole('button',{name:'Detalhes / Editar'}).click();
  const editor=adminPage.getByTestId('admin-member-records');
  await editor.waitFor({timeout:10000});
  await editor.getByTestId('admin-member-balance').waitFor({timeout:10000});
  await adminPage.screenshot({path:'release-build/admin-member-editor.png',fullPage:true});
  await editor.getByTestId('admin-history-kind').selectOption('bonus');
  await editor.getByRole('button',{name:'Adicionar registro'}).click();
  await editor.getByTestId('admin-history-form').waitFor({timeout:10000});
  await editor.getByRole('button',{name:'Salvar registro'}).click();
  await editor.getByTestId('admin-history-rows').getByText('Registro ajustado / simulação').first().waitFor({timeout:10000});
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
  await admin.close();
  const withdrawal=await browser.newContext({viewport:{width:390,height:844},baseURL:base});
  const memberAuth=await withdrawal.request.post('/api/index.php?action=login',{
    data:{login:'browsermember',password:'BrowserMemberPassword2026'}});
  if(memberAuth.status()!==200)throw Error('Member login for modal test');
  const withdrawalPage=await withdrawal.newPage();
  withdrawalPage.on('pageerror',e=>problems.push(e.message));
  await withdrawalPage.goto('/');
  await withdrawalPage.getByTestId('member-top-nav').waitFor({timeout:15000});
  await withdrawalPage.locator('nav button').nth(3).click();
  await withdrawalPage.getByRole('button',{name:/Sacar|Withdraw|Retirar/}).click();
  await withdrawalPage.getByTestId('withdraw-request-amount').fill('1.00');
  await withdrawalPage.getByRole('button',{name:/Registrar solicitação|Submit request|Register request|Registrar solicitud/}).click();
  const modal=withdrawalPage.getByTestId('withdraw-awaiting-vip-modal');
  await modal.waitFor({timeout:12000});
  await modal.getByText('US$ 1.00').waitFor({timeout:10000});
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
