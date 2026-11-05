# Procedimento de identidade e redefinição administrativa

O processo é manual e não realiza verificação automática de identidade.

1. O membro solicita suporte por canal de atendimento.
2. O administrador verifica a identidade por um meio independente: contato já cadastrado e verificado ou confirmação presencial, nunca apenas pela mensagem que solicita a troca.
3. No painel, abre Membros > Detalhes e seleciona a conta correta.
4. Na seção de redefinição, registra o método de verificação (known_contact, in_person ou other_offline) e uma referência não sensível, como o número do ticket.
5. O administrador declara que verificou a identidade e informa a própria senha para reautenticar.
6. O backend registra a confirmação, horário e operador, e gera uma autorização de uso único válida por 10 minutos.
7. O administrador define uma nova senha, sem ver a senha antiga. Todas as sessões anteriores do membro são revogadas.
8. A nova credencial é entregue ao membro por um canal apropriado. Não anexe documentos, segredos ou senhas aos tickets.

## Limites

A confirmação é uma declaração operacional do administrador; o software não comprova que a verificação externa ocorreu. Caso haja dúvida, suspenda a redefinição e solicite verificação adicional. E-mail não é obrigatório no cadastro.

## Auditoria

Os registros permitem rastrear método, operador, destino e horário. A recuperação administrativa não libera contas suspensas e não altera plano nem saldo.
