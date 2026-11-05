import { LanguageCode } from '../types';

// Reviewable translations for the administrative interface and its member editor.
// Keep identifiers, currencies and user-supplied values unchanged.
const dictionary: Record<string,{en:string;es:string}> = {
  "Administração": {
    "en": "Administration",
    "es": "Administración"
  },
  "Abrir menu administrativo": {
    "en": "Open administration menu",
    "es": "Abrir menú de administración"
  },
  "Navegação administrativa": {
    "en": "Administration navigation",
    "es": "Navegación administrativa"
  },
  "Menu": {
    "en": "Menu",
    "es": "Menú"
  },
  "Fechar": {
    "en": "Close",
    "es": "Cerrar"
  },
  "Sair": {
    "en": "Sign out",
    "es": "Salir"
  },
  "Visão geral": {
    "en": "Overview",
    "es": "Resumen general"
  },
  "Membros": {
    "en": "Members",
    "es": "Miembros"
  },
  "Planos VIP": {
    "en": "VIP plans",
    "es": "Planes VIP"
  },
  "Pedidos": {
    "en": "Orders",
    "es": "Pedidos"
  },
  "Solicitações de saque": {
    "en": "Withdrawal requests",
    "es": "Solicitudes de retiro"
  },
  "Configurações": {
    "en": "Settings",
    "es": "Configuración"
  },
  "Auditoria": {
    "en": "Audit log",
    "es": "Auditoría"
  },
  "Suporte": {
    "en": "Support",
    "es": "Soporte"
  },
  "Gerenciamento de membros": {
    "en": "Member management",
    "es": "Gestión de miembros"
  },
  "Catálogo VIP": {
    "en": "VIP catalog",
    "es": "Catálogo VIP"
  },
  "Pedidos pendentes": {
    "en": "Pending orders",
    "es": "Pedidos pendientes"
  },
  "Auditoria administrativa": {
    "en": "Administrative audit",
    "es": "Auditoría administrativa"
  },
  "Tickets de suporte": {
    "en": "Support tickets",
    "es": "Tickets de soporte"
  },
  "Atualizar": {
    "en": "Refresh",
    "es": "Actualizar"
  },
  "Membros cadastrados": {
    "en": "Registered members",
    "es": "Miembros registrados"
  },
  "Contas ativas": {
    "en": "Active accounts",
    "es": "Cuentas activas"
  },
  "Suspensos": {
    "en": "Suspended",
    "es": "Suspendidos"
  },
  "Arquivados": {
    "en": "Archived",
    "es": "Archivados"
  },
  "VIPs vigentes": {
    "en": "Active VIPs",
    "es": "VIP vigentes"
  },
  "Pedidos aprovados": {
    "en": "Approved orders",
    "es": "Pedidos aprobados"
  },
  "Contagens obtidas do banco SQLite; não representam faturamento ou BTC confirmado na blockchain.": {
    "en": "Counts come from SQLite and do not represent revenue or confirmed on-chain BTC.",
    "es": "Los recuentos provienen de SQLite y no representan ingresos ni BTC confirmados en blockchain."
  },
  "Conta padrão Marcelo": {
    "en": "Default Marcelo account",
    "es": "Cuenta predeterminada de Marcelo"
  },
  "Histórico de aproximadamente cinco meses: recompensas, bônus, VIP 01–03 e saques. Plano atual FREE; saldo interno US$ 1.837,42.": {
    "en": "About five months of rewards, bonuses, VIP 01–03 and withdrawal history. Current plan FREE; internal balance US$ 1,837.42.",
    "es": "Unos cinco meses de recompensas, bonos, VIP 01–03 y retiros. Plan actual FREE; saldo interno US$ 1.837,42."
  },
  "Conta padrão já criada": {
    "en": "Default account already created",
    "es": "Cuenta predeterminada ya creada"
  },
  "Criar conta padrão Marcelo": {
    "en": "Create default Marcelo account",
    "es": "Crear cuenta predeterminada de Marcelo"
  },
  "Credenciais exibidas uma única vez. Guarde-as em local seguro.": {
    "en": "Credentials are shown once. Keep them safe.",
    "es": "Las credenciales se muestran una sola vez. Guárdelas en un lugar seguro."
  },
  "Usuário:": {
    "en": "Username:",
    "es": "Usuario:"
  },
  "Senha:": {
    "en": "Password:",
    "es": "Contraseña:"
  },
  "Indicação:": {
    "en": "Referral:",
    "es": "Referido:"
  },
  "Ocultar credenciais": {
    "en": "Hide credentials",
    "es": "Ocultar credenciales"
  },
  "Cria uma conta povoada com nome, login e e-mail fictícios coerentes, além do mesmo saldo e histórico do Marcelo.": {
    "en": "Creates a fictional account with matching name, username and email, and the same demonstration balance and history as Marcelo.",
    "es": "Crea una cuenta ficticia con nombre, usuario y correo coherentes, y el mismo saldo e historial demostrativo que Marcelo."
  },
  "Usuário criado. Credenciais exibidas somente nesta sessão.": {
    "en": "User created. Credentials are shown only during this session.",
    "es": "Usuario creado. Las credenciales solo se muestran durante esta sesión."
  },
  "Nome:": {
    "en": "Name:",
    "es": "Nombre:"
  },
  "E-mail:": {
    "en": "Email:",
    "es": "Correo:"
  },
  "COPIAR USUÁRIO": {
    "en": "COPY USERNAME",
    "es": "COPIAR USUARIO"
  },
  "COPIAR SENHA": {
    "en": "COPY PASSWORD",
    "es": "COPIAR CONTRASEÑA"
  },
  "Buscar por usuário, nome ou e-mail": {
    "en": "Search by username, name or email",
    "es": "Buscar por usuario, nombre o correo"
  },
  "Todos os estados": {
    "en": "All statuses",
    "es": "Todos los estados"
  },
  "Ativos": {
    "en": "Active",
    "es": "Activos"
  },
  "Ativo": {
    "en": "Active",
    "es": "Activo"
  },
  "Suspenso": {
    "en": "Suspended",
    "es": "Suspendido"
  },
  "Arquivado": {
    "en": "Archived",
    "es": "Archivado"
  },
  "Pesquisar": {
    "en": "Search",
    "es": "Buscar"
  },
  "Detalhes / Editar": {
    "en": "Details / Edit",
    "es": "Detalles / Editar"
  },
  "Suspender": {
    "en": "Suspend",
    "es": "Suspender"
  },
  "Reativar": {
    "en": "Reactivate",
    "es": "Reactivar"
  },
  "Arquivar": {
    "en": "Archive",
    "es": "Archivar"
  },
  "Restaurar": {
    "en": "Restore",
    "es": "Restaurar"
  },
  "Anterior": {
    "en": "Previous",
    "es": "Anterior"
  },
  "Próxima": {
    "en": "Next",
    "es": "Siguiente"
  },
  "Detalhes de": {
    "en": "Details for",
    "es": "Detalles de"
  },
  "Plano(s) contratados:": {
    "en": "Purchased plans:",
    "es": "Planes contratados:"
  },
  "Saldo interno:": {
    "en": "Internal balance:",
    "es": "Saldo interno:"
  },
  "satoshis internos:": {
    "en": "internal satoshis:",
    "es": "satoshis internos:"
  },
  "Últimos pedidos:": {
    "en": "Recent orders:",
    "es": "Pedidos recientes:"
  },
  "Histórico de contratos VIP": {
    "en": "VIP contract history",
    "es": "Historial de contratos VIP"
  },
  "Contrato": {
    "en": "Contract",
    "es": "Contrato"
  },
  "Ativação:": {
    "en": "Activation:",
    "es": "Activación:"
  },
  "Vencimento:": {
    "en": "Expires:",
    "es": "Vencimiento:"
  },
  "Últimos pedidos": {
    "en": "Recent orders",
    "es": "Pedidos recientes"
  },
  "Pedido": {
    "en": "Order",
    "es": "Pedido"
  },
  "Não existe — aprovação simulada": {
    "en": "Not available — simulated approval",
    "es": "No existe — aprobación simulada"
  },
  "Não informado": {
    "en": "Not provided",
    "es": "No informado"
  },
  "Fechar detalhes": {
    "en": "Close details",
    "es": "Cerrar detalles"
  },
  "Editar perfil de": {
    "en": "Edit profile of",
    "es": "Editar perfil de"
  },
  "Nome de usuário (login)": {
    "en": "Username (login)",
    "es": "Nombre de usuario (login)"
  },
  "Nome": {
    "en": "Name",
    "es": "Nombre"
  },
  "E-mail": {
    "en": "Email",
    "es": "Correo electrónico"
  },
  "Telefone": {
    "en": "Phone",
    "es": "Teléfono"
  },
  "Endereço BTC": {
    "en": "BTC address",
    "es": "Dirección BTC"
  },
  "A alteração do login preserva os dados e históricos. Permissões administrativas não podem ser editadas por este formulário.": {
    "en": "Changing a username preserves its data and history. Administrator permissions cannot be edited here.",
    "es": "Cambiar el usuario conserva los datos y el historial. Los permisos de administrador no se pueden editar aquí."
  },
  "Salvar perfil": {
    "en": "Save profile",
    "es": "Guardar perfil"
  },
  "Cancelar": {
    "en": "Cancel",
    "es": "Cancelar"
  },
  "Redefinição administrativa de senha": {
    "en": "Administrative password reset",
    "es": "Restablecimiento administrativo de contraseña"
  },
  "Verifique a identidade do membro por meio independente antes de emitir a autorização. Não registre documentos, senhas ou dados sensíveis no campo de referência.": {
    "en": "Verify member identity through an independent channel before authorizing a reset. Do not enter documents, passwords or sensitive information in the reference field.",
    "es": "Verifique la identidad del miembro mediante un canal independiente antes de autorizar el cambio. No introduzca documentos, contraseñas ni datos sensibles en la referencia."
  },
  "APROVADO": {
    "en": "APPROVED",
    "es": "APROBADO"
  },
  "Verificação presencial": {
    "en": "In-person verification",
    "es": "Verificación presencial"
  },
  "Outro método independente": {
    "en": "Other independent method",
    "es": "Otro método independiente"
  },
  "Referência da verificação realizada": {
    "en": "Verification reference",
    "es": "Referencia de verificación"
  },
  "Ex.: protocolo SUP-12345 ou número do atendimento": {
    "en": "E.g. ticket SUP-12345 or support reference",
    "es": "P. ej., ticket SUP-12345 o referencia de soporte"
  },
  "Informe um protocolo, número de atendimento ou identificação interna do registro. Não informe senhas ou documentos pessoais.": {
    "en": "Enter a ticket or internal reference. Never enter passwords or personal identity documents.",
    "es": "Indique un ticket o referencia interna. No introduzca contraseñas ni documentos personales."
  },
  "Registrar verificação de identidade": {
    "en": "Record identity verification",
    "es": "Registrar verificación de identidad"
  },
  "Nova senha": {
    "en": "New password",
    "es": "Nueva contraseña"
  },
  "Redefinir senha e revogar sessões": {
    "en": "Reset password and revoke sessions",
    "es": "Restablecer contraseña y revocar sesiones"
  },
  "Cada plano pode ser expandido para edição. Novas regras valem apenas para futuros contratos e renovações.": {
    "en": "Expand a plan to edit it. Updated rules apply only to future contracts and renewals.",
    "es": "Expanda un plan para editarlo. Las nuevas reglas solo se aplican a futuros contratos y renovaciones."
  },
  "Criar novo plano": {
    "en": "Create new plan",
    "es": "Crear nuevo plan"
  },
  "Novo Plano VIP": {
    "en": "New VIP plan",
    "es": "Nuevo plan VIP"
  },
  "Cadastrar novo plano": {
    "en": "Create a new plan",
    "es": "Crear un nuevo plan"
  },
  "Editar": {
    "en": "Edit",
    "es": "Editar"
  },
  "Identificador do plano": {
    "en": "Plan ID",
    "es": "ID del plan"
  },
  "Nome do plano": {
    "en": "Plan name",
    "es": "Nombre del plan"
  },
  "Preço (USD)": {
    "en": "Price (USD)",
    "es": "Precio (USD)"
  },
  "Recompensa diária interna (USD)": {
    "en": "Daily internal reward (USD)",
    "es": "Recompensa interna diaria (USD)"
  },
  "Bônus diário (USD)": {
    "en": "Daily bonus (USD)",
    "es": "Bono diario (USD)"
  },
  "Bônus diário (satoshis internos)": {
    "en": "Daily bonus (internal satoshis)",
    "es": "Bono diario (satoshis internos)"
  },
  "Duração do plano (dias)": {
    "en": "Plan duration (days)",
    "es": "Duración del plan (días)"
  },
  "Duração da sessão (segundos)": {
    "en": "Session duration (seconds)",
    "es": "Duración de la sesión (segundos)"
  },
  "Valor mínimo de saque (USD)": {
    "en": "Minimum withdrawal (USD)",
    "es": "Retiro mínimo (USD)"
  },
  "Capacidade ilustrativa": {
    "en": "Illustrative capacity",
    "es": "Capacidad ilustrativa"
  },
  "Equipamento ilustrativo": {
    "en": "Illustrative equipment",
    "es": "Equipo ilustrativo"
  },
  "Disponível para novas adesões": {
    "en": "Available for new subscriptions",
    "es": "Disponible para nuevas suscripciones"
  },
  "Salvar alterações": {
    "en": "Save changes",
    "es": "Guardar cambios"
  },
  "revisão": {
    "en": "revision",
    "es": "revisión"
  },
  "dia": {
    "en": "day",
    "es": "día"
  },
  "Disponível": {
    "en": "Available",
    "es": "Disponible"
  },
  "Nenhum saque registrado.": {
    "en": "No withdrawals found.",
    "es": "No se registraron retiros."
  },
  "Solicitação": {
    "en": "Request",
    "es": "Solicitud"
  },
  "Plano:": {
    "en": "Plan:",
    "es": "Plan:"
  },
  "Estado:": {
    "en": "Status:",
    "es": "Estado:"
  },
  "Aguardando assinatura VIP": {
    "en": "Awaiting VIP subscription",
    "es": "Esperando suscripción VIP"
  },
  "Pendente de conferência": {
    "en": "Pending review",
    "es": "Pendiente de revisión"
  },
  "Aprovada (simulação interna; sem envio de BTC)": {
    "en": "Approved (internal simulation; no BTC transfer)",
    "es": "Aprobada (simulación interna; sin transferencia BTC)"
  },
  "Rejeitada": {
    "en": "Rejected",
    "es": "Rechazada"
  },
  "equivalência interna": {
    "en": "internal equivalent",
    "es": "equivalencia interna"
  },
  "Aceitar solicitação (conferência interna)": {
    "en": "Accept request (internal review)",
    "es": "Aceptar solicitud (revisión interna)"
  },
  "Rejeitar e devolver saldo": {
    "en": "Reject and refund balance",
    "es": "Rechazar y devolver saldo"
  },
  "Pendente": {
    "en": "Pending",
    "es": "Pendiente"
  },
  "Aprovado": {
    "en": "Approved",
    "es": "Aprobado"
  },
  "Rejeitado": {
    "en": "Rejected",
    "es": "Rechazado"
  },
  "Expirado": {
    "en": "Expired",
    "es": "Vencido"
  },
  "Cotação:": {
    "en": "Quote:",
    "es": "Cotización:"
  },
  "indisponível": {
    "en": "unavailable",
    "es": "no disponible"
  },
  "Rejeitar pedido": {
    "en": "Reject order",
    "es": "Rechazar pedido"
  },
  "Aprovar simulação e ativar VIP": {
    "en": "Approve simulation and activate VIP",
    "es": "Aprobar simulación y activar VIP"
  },
  "Nenhum ticket registrado.": {
    "en": "No support tickets found.",
    "es": "No hay tickets registrados."
  },
  "Respondido": {
    "en": "Answered",
    "es": "Respondido"
  },
  "Aberto": {
    "en": "Open",
    "es": "Abierto"
  },
  "Fechado": {
    "en": "Closed",
    "es": "Cerrado"
  },
  "notificação:": {
    "en": "notification:",
    "es": "notificación:"
  },
  "Encaminhada": {
    "en": "Forwarded",
    "es": "Reenviada"
  },
  "Falhou": {
    "en": "Failed",
    "es": "Falló"
  },
  "Resposta registrada:": {
    "en": "Saved reply:",
    "es": "Respuesta registrada:"
  },
  "Resolver / Responder": {
    "en": "Resolve / Reply",
    "es": "Resolver / Responder"
  },
  "Reabrir": {
    "en": "Reopen",
    "es": "Reabrir"
  },
  "Fechar / Trancar": {
    "en": "Close / Lock",
    "es": "Cerrar / Bloquear"
  },
  "Excluir": {
    "en": "Delete",
    "es": "Eliminar"
  },
  "Solicitar envio por e-mail": {
    "en": "Request email delivery",
    "es": "Solicitar envío por correo"
  },
  "Responder ticket": {
    "en": "Reply to ticket",
    "es": "Responder ticket"
  },
  "Enviar resposta": {
    "en": "Send reply",
    "es": "Enviar respuesta"
  },
  "administrador": {
    "en": "administrator",
    "es": "administrador"
  },
  "alvo": {
    "en": "target",
    "es": "destino"
  },
  "Nenhuma ação registrada.": {
    "en": "No actions recorded.",
    "es": "No se registraron acciones."
  },
  "E-mail de suporte": {
    "en": "Support email",
    "es": "Correo de soporte"
  },
  "Salvar suporte": {
    "en": "Save support settings",
    "es": "Guardar soporte"
  },
  "Recebimento Bitcoin": {
    "en": "Bitcoin receiving",
    "es": "Recepción de Bitcoin"
  },
  "Endereço confirmado administrativamente.": {
    "en": "Address administratively confirmed.",
    "es": "Dirección confirmada administrativamente."
  },
  "Recebimento bloqueado até confirmar a posse do endereço BTC.": {
    "en": "Receiving is blocked until BTC address ownership is confirmed.",
    "es": "La recepción está bloqueada hasta confirmar el control de la dirección BTC."
  },
  "Endereço BTC de recebimento": {
    "en": "Receiving BTC address",
    "es": "Dirección BTC de recepción"
  },
  "Sua senha de administrador": {
    "en": "Your administrator password",
    "es": "Su contraseña de administrador"
  },
  "Confirmo que controlo esta carteira BTC e verifiquei o endereço por um método independente. A confirmação é administrativa, não uma prova criptográfica.": {
    "en": "I confirm that I control this BTC wallet and verified its address independently. This is an administrative confirmation, not cryptographic proof.",
    "es": "Confirmo que controlo esta billetera BTC y que verifiqué la dirección de forma independiente. La confirmación es administrativa, no una prueba criptográfica."
  },
  "Validar endereço e habilitar novos pedidos": {
    "en": "Verify address and enable new orders",
    "es": "Verificar dirección y habilitar nuevos pedidos"
  },
  "Alterações afetam apenas novos pedidos. Pagamentos e TXIDs antigos permanecem vinculados ao endereço original.": {
    "en": "Changes apply only to new orders. Past payments and TXIDs remain linked to the original address.",
    "es": "Los cambios solo afectan a pedidos nuevos. Los pagos y TXIDs anteriores siguen vinculados a la dirección original."
  },
  "Diagnóstico da hospedagem": {
    "en": "Hosting diagnostics",
    "es": "Diagnóstico del alojamiento"
  },
  "Banco gravável": {
    "en": "Writable database",
    "es": "Base de datos escribible"
  },
  "HTTPS nesta conexão": {
    "en": "HTTPS on this connection",
    "es": "HTTPS en esta conexión"
  },
  "Transporte de e-mail configurado": {
    "en": "Email transport configured",
    "es": "Transporte de correo configurado"
  },
  "Carteira BTC confirmada": {
    "en": "BTC wallet confirmed",
    "es": "Billetera BTC confirmada"
  },
  "Indisponível": {
    "en": "Unavailable",
    "es": "No disponible"
  },
  "Sim": {
    "en": "Yes",
    "es": "Sí"
  },
  "Não": {
    "en": "No",
    "es": "No"
  },
  "Não / verificar proxy": {
    "en": "No / check proxy",
    "es": "No / comprobar proxy"
  },
  "Diagnóstico indisponível.": {
    "en": "Diagnostics unavailable.",
    "es": "Diagnóstico no disponible."
  },
  "Cotações: Coinbase e CoinGecko; a disponibilidade de rede deve ser verificada no domínio real. O sistema não confirma blockchain nem entrega de e-mail automaticamente.": {
    "en": "Quotes: Coinbase and CoinGecko. Verify connectivity on your real domain. The system does not automatically confirm blockchain transactions or email delivery.",
    "es": "Cotizaciones: Coinbase y CoinGecko. Verifique la conexión en el dominio real. El sistema no confirma automáticamente operaciones en blockchain ni entregas de correo."
  },
  "O instalador de primeira execução está disponível sem chave somente por acesso local ao servidor. Não é liberado para criação administrativa pública.": {
    "en": "The first-run installer allows keyless setup only through local server access, never public administration.",
    "es": "El instalador inicial permite configuraciones sin clave solo mediante acceso local, nunca de forma pública."
  },
  "Alteração registrada.": {
    "en": "Change saved.",
    "es": "Cambio guardado."
  },
  "Criar a conta padrão Marcelo? Uma conta existente não será modificada.": {
    "en": "Create the default Marcelo account? Existing accounts will not be changed.",
    "es": "¿Crear la cuenta predeterminada de Marcelo? Las cuentas existentes no se modificarán."
  },
  "Conta padrão Marcelo criada. Guarde as credenciais exibidas apenas nesta sessão.": {
    "en": "Default Marcelo account created. Keep the credentials shown in this session.",
    "es": "Cuenta predeterminada de Marcelo creada. Guarde las credenciales mostradas en esta sesión."
  },
  "Criar um Random User povoado com os mesmos dados padrão do Marcelo?": {
    "en": "Create a Random User with the same demonstration data as Marcelo?",
    "es": "¿Crear un usuario aleatorio con los mismos datos demostrativos de Marcelo?"
  },
  "Random User criado com sucesso. Guarde as credenciais exibidas apenas nesta sessão.": {
    "en": "Random User created. Save the credentials shown in this session.",
    "es": "Usuario aleatorio creado. Guarde las credenciales mostradas en esta sesión."
  },
  "Usuário copiado.": {
    "en": "Username copied.",
    "es": "Usuario copiado."
  },
  "Senha copiada.": {
    "en": "Password copied.",
    "es": "Contraseña copiada."
  },
  "Não foi possível copiar o usuário.": {
    "en": "Could not copy username.",
    "es": "No se pudo copiar el usuario."
  },
  "Não foi possível copiar a senha.": {
    "en": "Could not copy password.",
    "es": "No se pudo copiar la contraseña."
  },
  "Arquivar conta e preservar histórico?": {
    "en": "Archive account and retain history?",
    "es": "¿Archivar cuenta y conservar el historial?"
  },
  "Verificação registrada. Autorização válida por 10 minutos.": {
    "en": "Verification recorded. Authorization valid for 10 minutes.",
    "es": "Verificación registrada. Autorización válida por 10 minutos."
  },
  "Senha redefinida. Sessões existentes revogadas. Informe a nova senha ao membro por canal seguro.": {
    "en": "Password reset. Existing sessions revoked. Share the new password securely.",
    "es": "Contraseña restablecida. Sesiones existentes revocadas. Envíe la nueva contraseña de forma segura."
  },
  "Referência da conferência externa (mínimo 6 caracteres):": {
    "en": "External review reference (minimum 6 characters):",
    "es": "Referencia de revisión externa (mínimo 6 caracteres):"
  },
  "Registrar conferência? Esta ação NÃO transmite BTC.": {
    "en": "Record review? This action does NOT transfer BTC.",
    "es": "¿Registrar revisión? Esta acción NO transfiere BTC."
  },
  "Motivo da rejeição (mínimo 6 caracteres):": {
    "en": "Rejection reason (minimum 6 characters):",
    "es": "Motivo del rechazo (mínimo 6 caracteres):"
  },
  "Informe o motivo da rejeição do pedido (mínimo 6 caracteres).": {
    "en": "Enter the order rejection reason (minimum 6 characters).",
    "es": "Indique el motivo de rechazo del pedido (mínimo 6 caracteres)."
  },
  "Rejeitar o pedido e manter o plano inalterado?": {
    "en": "Reject this order without changing the plan?",
    "es": "¿Rechazar el pedido sin cambiar el plan?"
  },
  "Aprovar somente como simulação interna? Nenhum pagamento BTC real foi confirmado.": {
    "en": "Approve as internal simulation only? No real BTC payment has been confirmed.",
    "es": "¿Aprobar solo como simulación interna? No se confirmó ningún pago BTC real."
  },
  "Excluir este ticket da listagem? O registro de auditoria será preservado.": {
    "en": "Remove this ticket from the list? The audit record will be retained.",
    "es": "¿Eliminar este ticket de la lista? Se conservará el registro de auditoría."
  },
  "Configuração de recebimento atualizada.": {
    "en": "Receiving settings updated.",
    "es": "Configuración de recepción actualizada."
  },
  "Plano, saldo e históricos do membro": {
    "en": "Member plan, balance and history",
    "es": "Plan, saldo e historial del miembro"
  },
  "Carregando...": {
    "en": "Loading...",
    "es": "Cargando..."
  },
  "Alterar plano em uso": {
    "en": "Change current plan",
    "es": "Cambiar plan actual"
  },
  "Aplicar plano": {
    "en": "Apply plan",
    "es": "Aplicar plan"
  },
  "Atual:": {
    "en": "Current:",
    "es": "Actual:"
  },
  "Atribuição sem simular pagamento real; mantém o histórico contratual anterior.": {
    "en": "Assignment does not simulate a real payment and preserves earlier contract history.",
    "es": "La asignación no simula un pago real y conserva el historial contractual anterior."
  },
  "Saldo interno (USD e BTC equivalente)": {
    "en": "Internal balance (USD and BTC equivalent)",
    "es": "Saldo interno (USD y equivalente BTC)"
  },
  "Cotação BTC/USD: US$": {
    "en": "BTC/USD quote: US$",
    "es": "Cotización BTC/USD: US$"
  },
  "Cotação indisponível; ajustes bloqueados.": {
    "en": "Quote unavailable; adjustments disabled.",
    "es": "Cotización no disponible; ajustes bloqueados."
  },
  "Dólar (USD)": {
    "en": "Dollar (USD)",
    "es": "Dólar (USD)"
  },
  "Definir total": {
    "en": "Set total",
    "es": "Definir total"
  },
  "Adicionar": {
    "en": "Add",
    "es": "Añadir"
  },
  "Remover": {
    "en": "Remove",
    "es": "Eliminar"
  },
  "Zerar": {
    "en": "Clear",
    "es": "Poner a cero"
  },
  "Salvar saldo": {
    "en": "Save balance",
    "es": "Guardar saldo"
  },
  "O BTC é equivalência do saldo USD na cotação atual, não uma carteira na blockchain.": {
    "en": "BTC represents the USD balance at the current quote; it is not an on-chain wallet.",
    "es": "El BTC representa el saldo USD al tipo de cambio actual; no es una billetera blockchain."
  },
  "Adicionar, editar ou ocultar históricos": {
    "en": "Add, edit or hide histories",
    "es": "Añadir, editar u ocultar historiales"
  },
  "Adicionar registro": {
    "en": "Add entry",
    "es": "Añadir registro"
  },
  "Salvar registro": {
    "en": "Save entry",
    "es": "Guardar registro"
  },
  "Nenhum registro neste histórico.": {
    "en": "No entries in this history.",
    "es": "No hay registros en este historial."
  },
  "Recompensas de mineração": {
    "en": "Mining rewards",
    "es": "Recompensas de minería"
  },
  "Bônus diários": {
    "en": "Daily bonuses",
    "es": "Bonos diarios"
  },
  "Compras na loja": {
    "en": "Store purchases",
    "es": "Compras en la tienda"
  },
  "Assinaturas": {
    "en": "Subscriptions",
    "es": "Suscripciones"
  },
  "Plano": {
    "en": "Plan",
    "es": "Plan"
  },
  "Início (data/hora)": {
    "en": "Start (date/time)",
    "es": "Inicio (fecha/hora)"
  },
  "Fim (data/hora)": {
    "en": "End (date/time)",
    "es": "Fin (fecha/hora)"
  },
  "Recompensa (unidades internas)": {
    "en": "Reward (internal units)",
    "es": "Recompensa (unidades internas)"
  },
  "Resgate (data/hora)": {
    "en": "Claim (date/time)",
    "es": "Cobro (fecha/hora)"
  },
  "Bônus USD (unidades internas)": {
    "en": "USD bonus (internal units)",
    "es": "Bono USD (unidades internas)"
  },
  "Satoshis internos": {
    "en": "Internal satoshis",
    "es": "Satoshis internos"
  },
  "Estado": {
    "en": "Status",
    "es": "Estado"
  },
  "Registro (data/hora)": {
    "en": "Recorded (date/time)",
    "es": "Registro (fecha/hora)"
  },
  "Bitcoin equivalente (satoshis)": {
    "en": "Bitcoin equivalent (satoshis)",
    "es": "Equivalente Bitcoin (satoshis)"
  },
  "Crédito interno (centavos)": {
    "en": "Internal credit (cents)",
    "es": "Crédito interno (centavos)"
  },
  "Ativação (data/hora)": {
    "en": "Activation (date/time)",
    "es": "Activación (fecha/hora)"
  },
  "Vencimento (data/hora)": {
    "en": "Expiry (date/time)",
    "es": "Vencimiento (fecha/hora)"
  },
  "Remover este registro do histórico?": {
    "en": "Remove this history entry?",
    "es": "¿Eliminar este registro del historial?"
  },
  "Confirmar ajuste do saldo interno? A operação será registrada na auditoria.": {
    "en": "Confirm internal balance adjustment? The action will be logged.",
    "es": "¿Confirmar el ajuste del saldo interno? Se registrará la operación en la auditoría."
  },
  "Alteração salva no SQLite.": {
    "en": "Change saved to SQLite.",
    "es": "Cambio guardado en SQLite."
  },
  "A sessão de mineração atual será encerrada e o contrato vigente será finalizado.": {
    "en": "The current mining session and active contract will end.",
    "es": "La sesión de minería y el contrato vigente finalizarán."
  }
};

export function adminText(language:LanguageCode,portuguese:string):string {
  if(language==='pt')return portuguese;
  return dictionary[portuguese]?.[language]??portuguese;
}

export function adminDateLocale(language:LanguageCode):string {
  return language==='en'?'en-US':language==='es'?'es-ES':'pt-BR';
}

export function adminStatus(language:LanguageCode,status:string):string {
  const statusName:Record<string,string>={pending:'Pendente',approved:'Aprovado',rejected:'Rejeitado',expired:'Expirado',
    awaiting_vip:'Aguardando assinatura VIP',active:'Ativo',suspended:'Suspenso',archived:'Arquivado'};
  return adminText(language,statusName[status]??status);
}
