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
  const page=await ctx.newPage();
  page.on('pageerror',e=>problems.push(e.message));
  await page.goto('/');
  await page.getByText('Bitdeer BTC').first().waitFor({timeout:15000});
  await page.locator('nav button').first().waitFor({timeout:15000});
  if(await page.locator('nav button').count()!==5)throw Error('Member navigation must have five tabs');
  const bonus=page.getByTestId('daily-bonus-card');
  await bonus.waitFor({timeout:10000});
  if(await bonus.locator('button').count()!==1)throw Error('Daily bonus must have one redeem button');
  if(await bonus.getByText('USD').count()!==1||await bonus.getByText('Satoshis').count()!==1)
    throw Error('Daily bonus card must present both reward types');
  await bonus.locator('button').click();
  await page.getByRole('button',{name:/Resgatar ambos os bônus diários|Claim both daily bonuses|Reclamar ambos bonos diarios/i})
    .waitFor({timeout:10000});
  await page.locator('nav button').first().click();
  for(let i=0;i<5;i++){
    await page.locator('nav button').nth(i).click();
    await page.waitForTimeout(200);
    if(await page.getByText('Sincronizando interface...').count())throw Error('React error boundary shown on tab '+i);
  }
  // Legacy settings destinations must open real member views backed by SQLite.
  await page.locator('nav button').nth(4).click();
  await page.getByRole('button',{name:/Indicações|Referrals|Referidos/}).click();
  await page.getByText(/Histórico de indicações|Referral history|Historial de referidos/).first()
    .waitFor({timeout:10000});
  await page.locator('nav button').nth(4).click();
  await page.getByRole('button',{name:/Top Miners|Mejores mineros/}).click();
  await page.getByText('James Hudson').waitFor({timeout:10000});
  const minerCards=page.locator('[data-testid="miner-card"]');
  if(await minerCards.count()!==200)throw Error('Top Miners must show exactly 200 demonstration profiles');
  const minerNames=await minerCards.locator('h3').allTextContents();
  if(new Set(minerNames).size!==200)throw Error('Duplicated Top Miners profile name');
  const brazilCount=await minerCards.filter({hasText:/Brasil|Brazil/}).count();
  if(brazilCount<60)throw Error('Top Miners must have at least 60 Brazilian profiles');
  await page.screenshot({path:'release-build/top-miners-mobile.png',fullPage:true});
  await page.getByText(/Ranking demonstrativo|Demonstration ranking|Ranking demostrativo/i).waitFor({timeout:10000});
  await page.locator('nav button').nth(4).click();
  await page.getByRole('button',{name:/Histórico VIP|Subscriptions|Suscripciones/}).click();
  await page.getByText(/Histórico de assinaturas|Subscription history|Historial de suscripciones/).first()
    .waitFor({timeout:10000});
  await page.locator('nav button').nth(4).click();
  await page.locator('nav button').nth(3).click();
  await page.getByRole('button',{name:/Sacar|Withdraw|Retirar/}).click();
  await page.getByText('Solicitação de Saque').waitFor({timeout:10000});
  await page.getByTestId('withdraw-available-card').waitFor({timeout:10000});
  await page.getByText('Cadastrar carteira Bitcoin').waitFor({timeout:10000});
  await page.screenshot({path:'release-build/member-mobile.png',fullPage:true});
  await page.locator('input[placeholder="bc1..."]').fill('bc1qzcvwxv8vl4c0ryel3m6efed9zrcyyu0sk8fm4z');
  await page.getByRole('button',{name:'Salvar carteira'}).click();
  await page.getByRole('button',{name:/Sacar|Withdraw|Retirar/}).waitFor({timeout:10000});
  if(await page.getByRole('button',{name:/Editar carteira|Edit wallet|Editar billetera/}).count())
    throw Error('Saved BTC wallet address card should be hidden');
  await page.getByRole('button',{name:/Sacar|Withdraw|Retirar/}).click();
  await page.getByText('Solicitar saque interno').waitFor({timeout:10000});
  await page.getByRole('button',{name:'Voltar à carteira'}).click();
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
  await adminPage.screenshot({path:'release-build/admin-desktop.png',fullPage:true});
  if(await adminPage.getByText('Sincronizando interface...').count())throw Error('Admin React error boundary shown');
  await admin.close();
  if(problems.length)throw Error('Browser JS errors: '+problems.join('; '));
  console.log('PASS: responsive member navigation, screenshot captures, admin browser route');
} finally {
  await browser.close();
}
