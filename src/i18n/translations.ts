import { LanguageCode } from '../types';

export interface Translations {
  screenTitle: string;
  continueBtn: string;
  languages: {
    en: { name: string; nativeName: string; region: string };
    es: { name: string; nativeName: string; region: string };
    pt: { name: string; nativeName: string; region: string };
  };
  onboardingPreview: {
    stepTitle: string;
    stepSubtitle: string;
    mineNowBtn: string;
  };
  terminal: {
    systemReady: string;
    enterWorkspace: string;
  };
  login: {
    title: string;
    subtitle: string;
    loginLabel: string;
    loginPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    accessBtn: string;
    validationError: string;
    terms: string;
    privacy: string;
    disclaimer: string;
  };
  congratulations: {
    title: string;
    desc1: string;
    desc2: string;
    actionBtn: string;
  };
  tabs: {
    home: string;
    store: string;
    reward: string;
    wallet: string;
    setting: string;
  };
  home: {
    greeting: string;
    totalBtc: string;
    miningPanel: string;
    activeMiners: string;
    startMining: string;
    stopMining: string;
    miningNotice: string;
    dailyReward: string;
    boostMining: string;
    reward2Title: string;
    reward3Title: string;
    reward3Subtitle: string;
    reward3Btn: string;
    cooldownNotice: string;
    faqs: string;
  };
  store: {
    hashingPower: string;
    viewBtn: string;
    upgradeTitle: string;
    detailsBtn: string;
    boostBtn: string;
    bullet1: string;
    bullet2: string;
  };
  reward: {
    title: string;
    subtitle: string;
    speedBooster: string;
    speedBoosterSub: string;
    proBooster: string;
    silver: string;
    gold: string;
    diamond: string;
    jackpot: string;
    locked: string;
    claim: string;
    claimed: string;
  };
  wallet: {
    miningTab: string;
    referralTab: string;
    balance: string;
    withdraw: string;
    setupAccount: string;
    setupDesc: string;
    referralBalance: string;
    referralDesc: string;
    shareToEarn: string;
    howToEarn: string;
    step1: string;
  };
  setting: {
    title: string;
    account: string;
    language: string;
    changeLanguage: string;
    activeLanguage: string;
    resetApp: string;
    version: string;
  };
}

export const translations: Record<LanguageCode, Translations> = {
  en: {
    screenTitle: 'Language',
    continueBtn: 'Continue',
    languages: {
      en: { name: 'English', nativeName: 'English', region: 'Global' },
      es: { name: 'Español', nativeName: 'Spanish', region: 'Global' },
      pt: { name: 'Português', nativeName: 'Portuguese', region: 'Global' }
    },
    onboardingPreview: {
      stepTitle: 'Mine Bitcoin Instantly, No Setup Needed',
      stepSubtitle: 'One tap to start — track hashrate and earnings live from your phone.',
      mineNowBtn: 'Mine Now'
    },
    terminal: {
      systemReady: 'SYSTEM READY FOR OPERATION',
      enterWorkspace: 'ENTER WORKSPACE'
    },
    login: {
      title: 'BTC Cloud Mining',
      subtitle: 'Securely access your account and continue your mining journey.',
      loginLabel: 'Username or Email',
      loginPlaceholder: 'Enter your username or email',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your password',
      accessBtn: 'Log In',
      validationError: 'Please enter a valid login and password (minimum 4 characters).',
      terms: 'Terms of Use',
      privacy: 'Privacy Policy',
      disclaimer: 'Our platform utilizes cloud-based mining technology. Your mobile device is not used as a mining tool'
    },
    congratulations: {
      title: 'Congratulations',
      desc1: 'Your Free Plan (FREE) with a daily reward of US$ 1.00/day is now active on your account!',
      desc2: 'Thanks for signing up! Start your mining sessions in the panel to accumulate your daily reward.🎁',
      actionBtn: 'Enter Mining Panel'
    },
    tabs: {
      home: 'Home',
      store: 'Store',
      reward: 'Reward',
      wallet: 'Wallet',
      setting: 'Setting'
    },
    home: {
      greeting: 'Hi, Marcelo Robadel de Souza',
      totalBtc: 'Total BTC',
      miningPanel: 'MINING PANEL',
      activeMiners: 'Active Miners',
      startMining: 'Start Mining',
      stopMining: 'Mining Active (Pause)',
      miningNotice: 'Mining sessions run for 30 minutes. You can restart manually when the timer ends.',
      dailyReward: 'Daily Reward',
      boostMining: 'Claim Boost',
      reward2Title: '+2 Hours Mining',
      reward3Title: '10,000 Satoshis',
      reward3Subtitle: 'Instant Daily Bonus',
      reward3Btn: 'Claim 10,000 Satoshis',
      cooldownNotice: 'Available in',
      faqs: 'FAQs'
    },
    store: {
      hashingPower: 'Hashing Power',
      viewBtn: 'View',
      upgradeTitle: 'Upgrade Your HashRate',
      detailsBtn: 'Details & Benefits',
      boostBtn: 'FREE',
      bullet1: 'Get 100% uptime—backed by your dedicated miner, even during system downtimes.',
      bullet2: 'By subscribing, you agree to be charged. Your subscription auto-renews at the same price and duration unless canceled. You also agree to our Privacy Policy.'
    },
    reward: {
      title: 'Reward Zone',
      subtitle: 'Complete simple tasks, unlock exclusive rewards, and enjoy daily perks.',
      speedBooster: 'Speed Booster',
      speedBoosterSub: '15 TH/s • 10 min',
      proBooster: 'Pro Booster',
      silver: 'Silver',
      gold: 'Gold',
      diamond: 'Diamond',
      jackpot: 'Jackpot',
      locked: 'Locked 🔒',
      claim: 'Claim',
      claimed: 'Claimed'
    },
    wallet: {
      miningTab: 'Mining',
      referralTab: 'Referral',
      balance: 'BALANCE',
      withdraw: 'WITHDRAW',
      setupAccount: 'Complete Your Account Setup',
      setupDesc: 'Provide the required details to complete your account setup and enable fund withdrawal.',
      referralBalance: 'REFERRAL BALANCE',
      referralDesc: 'Grow your Referral balance every time someone joins using your referral code and earns BTC.',
      shareToEarn: 'Share to Earn',
      howToEarn: 'How to Earn Rewards?',
      step1: 'Step 1: Share your invite code with friends.'
    },
    setting: {
      title: 'Settings',
      account: 'Account Profile',
      language: 'Language',
      changeLanguage: 'Change Language',
      activeLanguage: 'Active Language',
      resetApp: 'Reset App Data',
      version: 'App Version 2.4.0'
    }
  },
  pt: {
    screenTitle: 'Language',
    continueBtn: 'Continuar',
    languages: {
      en: { name: 'English (Inglês)', nativeName: 'Inglês', region: 'Global' },
      es: { name: 'Español (Espanhol)', nativeName: 'Espanhol', region: 'Global' },
      pt: { name: 'Português', nativeName: 'Português', region: 'Global' }
    },
    onboardingPreview: {
      stepTitle: 'Minere Bitcoin Instantaneamente, Sem Complicações',
      stepSubtitle: 'Um toque para iniciar — acompanhe sua taxa de mineração e ganhos em tempo real pelo celular.',
      mineNowBtn: 'Minerar Agora'
    },
    terminal: {
      systemReady: 'SISTEMA PRONTO PARA OPERAÇÃO',
      enterWorkspace: 'ENTRAR NO PAINEL'
    },
    login: {
      title: 'BTC Cloud Mining',
      subtitle: 'Acesse sua conta com segurança e continue sua jornada de mineração.',
      loginLabel: 'Login ou E-mail',
      loginPlaceholder: 'Digite seu login ou e-mail',
      passwordLabel: 'Senha',
      passwordPlaceholder: 'Digite sua senha',
      accessBtn: 'Acessar Conta',
      validationError: 'Por favor, informe login e senha válidos (mínimo 4 caracteres).',
      terms: 'Termos de Uso',
      privacy: 'Política de Privacidade',
      disclaimer: 'Nossa plataforma utiliza tecnologia de mineração em nuvem. Seu aparelho não é usado como ferramenta de mineração.'
    },
    congratulations: {
      title: 'Parabéns!',
      desc1: 'Seu Plano Gratuito (FREE) com recompensa diária de US$ 1,00/dia já está ativo em sua conta!',
      desc2: 'Obrigado pelo cadastro! Inicie suas sessões no painel para acumular sua recompensa diária.🎁',
      actionBtn: 'Acessar Painel de Mineração'
    },
    tabs: {
      home: 'Início',
      store: 'Loja',
      reward: 'Recompensas',
      wallet: 'Carteira',
      setting: 'Configurações'
    },
    home: {
      greeting: 'Olá, Marcelo Robadel de Souza',
      totalBtc: 'Total BTC',
      miningPanel: 'PAINEL DE MINERAÇÃO',
      activeMiners: 'Mineradores Ativos',
      startMining: 'Iniciar Mineração',
      stopMining: 'Mineração Ativa (Pausar)',
      miningNotice: 'A sessão de mineração dura 30 minutos. Reinicie manualmente ao término do cronômetro.',
      dailyReward: 'Recompensa Diária',
      boostMining: 'Resgatar',
      reward2Title: '+2 Horas de Mineração',
      reward3Title: '10.000 Satoshis',
      reward3Subtitle: 'Bônus Diário Instantâneo',
      reward3Btn: 'Resgatar 10.000 Satoshis',
      cooldownNotice: 'Disponível em',
      faqs: 'Perguntas Frequentes (FAQs)'
    },
    store: {
      hashingPower: 'Poder de Mineração',
      viewBtn: 'Ver',
      upgradeTitle: 'Aumente seu HashRate',
      detailsBtn: 'Detalhes & Benefícios',
      boostBtn: 'FREE',
      bullet1: 'Disponibilidade de 100% garantida pelo seu minerador dedicado em nuvem.',
      bullet2: 'Ao assinar, você concorda com a cobrança recorrente conforme nossos Termos e Política de Privacidade.'
    },
    reward: {
      title: 'Área de Recompensas',
      subtitle: 'Complete tarefas simples, desbloqueie recompensas e aproveite as vantagens diárias.',
      speedBooster: 'Acelerador de Velocidade',
      speedBoosterSub: '15 TH/s • 10 min',
      proBooster: 'Acelerador Pro',
      silver: 'Prata',
      gold: 'Ouro',
      diamond: 'Diamante',
      jackpot: 'Jackpot',
      locked: 'Bloqueado 🔒',
      claim: 'Resgatar',
      claimed: 'Resgatado'
    },
    wallet: {
      miningTab: 'Mineração',
      referralTab: 'Indicação',
      balance: 'SALDO',
      withdraw: 'SACAR',
      setupAccount: 'Complete o Cadastro da sua Conta',
      setupDesc: 'Preencha os dados necessários para ativar transferências e saques de fundos.',
      referralBalance: 'SALDO DE INDICAÇÃO',
      referralDesc: 'Aumente seus ganhos de indicação sempre que alguém se cadastrar usando seu código.',
      shareToEarn: 'Compartilhar e Ganhar',
      howToEarn: 'Como Ganhar Recompensas?',
      step1: 'Passo 1: Compartilhe seu código de convite com amigos.'
    },
    setting: {
      title: 'Configurações',
      account: 'Perfil da Conta',
      language: 'Idioma',
      changeLanguage: 'Alterar Idioma',
      activeLanguage: 'Idioma Atual',
      resetApp: 'Restaurar Dados do App',
      version: 'Versão do App 2.4.0'
    }
  },
  es: {
    screenTitle: 'Language',
    continueBtn: 'Continuar',
    languages: {
      en: { name: 'English (Inglés)', nativeName: 'Inglés', region: 'Global' },
      es: { name: 'Español', nativeName: 'Español', region: 'Global' },
      pt: { name: 'Português', nativeName: 'Portugués', region: 'Global' }
    },
    onboardingPreview: {
      stepTitle: 'Mina Bitcoin al Instante, Sin Complicaciones',
      stepSubtitle: 'Un toque para comenzar — monitorea tu tasa de hash y ganancias en vivo desde tu teléfono.',
      mineNowBtn: 'Minar Ahora'
    },
    terminal: {
      systemReady: 'SISTEMA LISTO PARA OPERACIÓN',
      enterWorkspace: 'ENTRAR AL PANEL'
    },
    login: {
      title: 'BTC Cloud Mining',
      subtitle: 'Accede a tu cuenta de forma segura y continúa minando.',
      loginLabel: 'Usuario o Correo',
      loginPlaceholder: 'Ingresa tu usuario o correo',
      passwordLabel: 'Contraseña',
      passwordPlaceholder: 'Ingresa tu contraseña',
      accessBtn: 'Iniciar Sesión',
      validationError: 'Por favor, ingresa usuario y contraseña válidos (mínimo 4 caracteres).',
      terms: 'Términos de Uso',
      privacy: 'Política de Privacidade',
      disclaimer: 'Nuestra plataforma utiliza minería en la nube. Tu dispositivo no se usa para minar.'
    },
    congratulations: {
      title: '¡Felicitaciones!',
      desc1: '¡Tu Plan Gratuito (FREE) con recompensa diaria de US$ 1,00/día ya está activo en tu cuenta!',
      desc2: '¡Gracias por registrarte! Inicia tus sesiones en el panel para acumular tu recompensa diaria.🎁',
      actionBtn: 'Entrar al Panel de Minería'
    },
    tabs: {
      home: 'Inicio',
      store: 'Tienda',
      reward: 'Premios',
      wallet: 'Billetera',
      setting: 'Ajustes'
    },
    home: {
      greeting: 'Hola, Marcelo Robadel de Souza',
      totalBtc: 'Total BTC',
      miningPanel: 'PANEL DE MINERÍA',
      activeMiners: 'Mineros Activos',
      startMining: 'Iniciar Minería',
      stopMining: 'Minería Activa (Pausar)',
      miningNotice: 'La sesión dura 30 minutos. Reinicia manualmente al finalizar el cronómetro.',
      dailyReward: 'Recompensa Diaria',
      boostMining: 'Reclamar',
      reward2Title: '+2 Horas de Minería',
      reward3Title: '10.000 Satoshis',
      reward3Subtitle: 'Bono Diario Instantáneo',
      reward3Btn: 'Reclamar 10.000 Satoshis',
      cooldownNotice: 'Disponible en',
      faqs: 'Preguntas Frecuentes'
    },
    store: {
      hashingPower: 'Poder de Minería',
      viewBtn: 'Ver',
      upgradeTitle: 'Mejora tu HashRate',
      detailsBtn: 'Detalles y Beneficios',
      boostBtn: 'Acelerar Hashrate (5 minutos)',
      bullet1: 'Disponibilidad del 100% respaldada por tu minero dedicado en la nube.',
      bullet2: 'Al suscribirte, aceptas los cargos periódicos según nuestros Términos y Política de Privacidad.'
    },
    reward: {
      title: 'Zona de Recompensas',
      subtitle: 'Completa tareas sencillas, desbloquea recompensas y disfruta beneficios.',
      speedBooster: 'Acelerador de Velocidad',
      speedBoosterSub: '15 TH/s • 10 min',
      proBooster: 'Acelerador Pro',
      silver: 'Plata',
      gold: 'Oro',
      diamond: 'Diamante',
      jackpot: 'Jackpot',
      locked: 'Bloqueado 🔒',
      claim: 'Reclamar',
      claimed: 'Reclamado'
    },
    wallet: {
      miningTab: 'Minería',
      referralTab: 'Referidos',
      balance: 'SALDO',
      withdraw: 'RETIRAR',
      setupAccount: 'Completa la Configuración de tu Cuenta',
      setupDesc: 'Proporciona los datos requeridos para habilitar retiros.',
      referralBalance: 'SALDO DE REFERIDOS',
      referralDesc: 'Aumenta tu saldo cada vez que alguien use tu código de referido.',
      shareToEarn: 'Compartir y Ganar',
      howToEarn: '¿Cómo Ganar Recompensas?',
      step1: 'Paso 1: Comparte tu código de invitación con amigos.'
    },
    setting: {
      title: 'Configuraciones',
      account: 'Perfil de la Cuenta',
      language: 'Idioma',
      changeLanguage: 'Cambiar Idioma',
      activeLanguage: 'Idioma Activo',
      resetApp: 'Restablecer Datos',
      version: 'Versión de App 2.4.0'
    }
  }
};
