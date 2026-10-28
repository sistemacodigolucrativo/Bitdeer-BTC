import { chromium } from 'playwright';

const base = 'http://127.0.0.1:8777';
const browser = await chromium.launch({headless:true});
const problems=[];
try {
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
  for(let i=0;i<5;i++){
    await page.locator('nav button').nth(i).click();
    await page.waitForTimeout(200);
    if(await page.getByText('Sincronizando interface...').count())throw Error('React error boundary shown on tab '+i);
  }
  await page.screenshot({path:'release-build/member-mobile.png',fullPage:true});
  await page.setViewportSize({width:1280,height:800});
  await page.locator('nav button').first().click();
  await page.waitForTimeout(250);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+3);
  if(overflow)throw Error('Horizontal overflow on desktop member view');
  await page.screenshot({path:'release-build/member-desktop.png',fullPage:true});
  await ctx.close();

  const admin=await browser.newContext({viewport:{width:1280,height:800},baseURL:base});
  const auth=await admin.request.post('/api/index.php?action=login',{
    data:{login:'browseradmin',password:'BrowserAdminPassword2026'}});
  if(auth.status()!==200)throw Error('Admin login: '+auth.status());
  const adminPage=await admin.newPage();
  adminPage.on('pageerror',e=>problems.push(e.message));
  await adminPage.goto('/');
  await adminPage.getByText('Visão geral').first().waitFor({timeout:15000});
  await adminPage.screenshot({path:'release-build/admin-desktop.png',fullPage:true});
  if(await adminPage.getByText('Sincronizando interface...').count())throw Error('Admin React error boundary shown');
  await admin.close();
  if(problems.length)throw Error('Browser JS errors: '+problems.join('; '));
  console.log('PASS: responsive member navigation, screenshot captures, admin browser route');
} finally {
  await browser.close();
}
