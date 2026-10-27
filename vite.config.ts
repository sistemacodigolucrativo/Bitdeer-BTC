import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function referralBackendPlugin(): Plugin {
  return {
    name: 'referral-backend-api',
    configureServer(server) {
      server.middlewares.use('/api/referrals/register', (req, res, next) => {
        if (req.method !== 'POST') {
          return next();
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });

        req.on('end', () => {
          try {
            const payload = JSON.parse(body || '{}');
            const rawName = String(payload.fullName || '').trim();
            const rawEmail = String(payload.email || '').trim().toLowerCase();
            const inviteCode = String(payload.inviteCode || '').trim().toUpperCase();
            const rawRate = Number(payload.btcUsdRate);

            if (inviteCode !== '8ZPTC') {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Código de convite inválido.' }));
              return;
            }

            // Aplica a máscara no backend (ex.: jo***@dominio.com) e descarta o e-mail completo
            const atIdx = rawEmail.indexOf('@');
            let maskedEmail = 'us***@dominio.com';
            if (atIdx > 0 && atIdx < rawEmail.length - 1) {
              const local = rawEmail.slice(0, atIdx);
              const domain = rawEmail.slice(atIdx + 1);
              const prefix = local.length >= 2 ? local.slice(0, 2) : local.slice(0, 1);
              maskedEmail = `${prefix}***@${domain}`;
            }

            // Normaliza nome e sobrenome do indicado (nunca retorna o nome do indicador)
            const nameParts = rawName.replace(/\s+/g, ' ').split(' ').filter(Boolean);
            const fullName =
              nameParts.length >= 2
                ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}`
                : nameParts.length === 1
                ? `${nameParts[0]} Silva`
                : 'Novo Indicado';

            const btcUsdRateUsed =
              Number.isFinite(rawRate) && rawRate > 1000 ? Number(rawRate.toFixed(2)) : 80285.58;
            const rewardUsd = 1.0;
            const amountBtc = Number((rewardUsd / btcUsdRateUsed).toFixed(12));
            const now = Date.now();
            const d = new Date(now);
            const createdAtFormatted = `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}`;

            const record = {
              id: `ref-${now}-${Math.floor(1000 + Math.random() * 9000)}`,
              fullName,
              maskedEmail,
              rewardUsd,
              amountBtc,
              btcUsdRateUsed,
              createdAt: now,
              createdAtFormatted,
            };

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ record }));
          } catch {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Falha ao processar cadastro de indicação.' }));
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), referralBackendPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

