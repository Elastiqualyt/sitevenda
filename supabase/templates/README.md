# Email templates — Supabase Auth (TerraPlace)

HTML em **português**, estilo alinhado ao site (verde `#078c7a`), contacto **contacto@terraplace.pt**.

## Local (`supabase start`)

Os caminhos estão definidos em `supabase/config.toml` (`[auth.email.template.*]` e `[auth.email.notification.*]`). Os emails aparecem no **Inbucket**: `http://127.0.0.1:54324` (porta por defeito).

Reinicia após alterar ficheiros: `supabase stop && supabase start`.

## Produção (Supabase hosted)

O `config.toml` **não** sincroniza estes templates para o projeto na nuvem. No [Dashboard](https://supabase.com/dashboard) → **Authentication** → **Email templates**, cola o HTML de cada ficheiro no template correspondente:

| Ficheiro | Template no dashboard |
|----------|------------------------|
| `auth-confirm-signup.html` | Confirm sign up |
| `auth-reset-password.html` | Reset password |
| `auth-magic-link.html` | Magic link |
| `auth-email-change.html` | Change email address |
| `auth-reauthentication.html` | Reauthentication |
| `auth-invite.html` | Invite user |
| `notify-password-changed.html` | Password changed (security) |
| `notify-email-changed.html` | Email address changed (security) |

Variáveis Go template: `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .Email }}`, `{{ .NewEmail }}`, `{{ .OldEmail }}`, etc. — ver [documentação Supabase](https://supabase.com/docs/guides/auth/auth-email-templates).

Para remetente **contacto@terraplace.pt**, configura **SMTP** nas definições de Auth do projeto.
