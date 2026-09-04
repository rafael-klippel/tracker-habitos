# Tracker

App pessoal (PWA) para acompanhar hábitos saudáveis e não saudáveis, no computador e no celular:
check-in diário, streaks, estatísticas, notas do dia, lembretes push e exportação de dados para
análise com IA (Claude).

**Stack:** React + Vite + TypeScript + Tailwind CSS · Supabase (Postgres + Auth) · Web Push · Vercel.

---

## 1. Rodar localmente (primeira vez)

### 1.1. Instalar dependências

```bash
npm install
```

### 1.2. Criar o projeto no Supabase

1. Crie uma conta grátis em https://supabase.com e um novo projeto.
2. No painel do projeto, vá em **SQL Editor**, cole o conteúdo de
   `supabase/migrations/0001_init.sql` e rode. Isso cria as tabelas (`habits`, `habit_entries`,
   `daily_notes`, `push_subscriptions`) já com as regras de segurança (RLS) para que cada usuário
   só veja os próprios dados.
3. Em **Authentication > Providers**, confirme que "Email" está habilitado (é o padrão). Se quiser
   pular a confirmação por email (mais rápido para uso pessoal), desative "Confirm email" em
   **Authentication > Settings**.
4. Em **Project Settings > API**, copie a **Project URL** e a **anon public key**.

### 1.3. Configurar variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_VAPID_PUBLIC_KEY=...   (veja passo 3 — pode deixar em branco por enquanto)
```

### 1.4. Rodar

```bash
npm run dev
```

Abra o endereço mostrado no terminal, crie sua conta (tela de cadastro) e comece a usar.

---

## 2. Publicar na internet (para acessar do celular de qualquer lugar)

1. Suba este projeto para um repositório no GitHub.
2. Crie uma conta grátis em https://vercel.com e importe o repositório.
3. Em **Settings > Environment Variables** no Vercel, adicione as mesmas 3 variáveis do
   `.env.local`.
4. Deploy. O Vercel te dá uma URL pública (ex: `tracker-seu-nome.vercel.app`).
5. No celular, abra essa URL no navegador (Chrome/Android ou Safari/iOS) e use "Adicionar à tela
   de início" — o Tracker vira um app instalável, com ícone próprio.

Sempre que você der `git push`, o Vercel republica automaticamente.

---

## 3. Notificações push (lembretes)

As notificações push exigem um par de chaves **VAPID** e uma Edge Function no Supabase que roda
periodicamente para disparar os avisos.

### 3.1. Gerar as chaves VAPID

```bash
npx web-push generate-vapid-keys
```

Isso gera uma chave pública e uma privada. Coloque:

- a **pública** em `VITE_VAPID_PUBLIC_KEY` (no `.env.local` e também nas env vars do Vercel);
- a **privada** você NUNCA coloca no frontend — só como secret da Edge Function (próximo passo).

### 3.2. Publicar a Edge Function

Instale a CLI do Supabase (`npm install -g supabase`), faça login (`supabase login`) e rode, na
raiz do projeto:

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase functions deploy send-reminders
```

Depois, em **Project Settings > Edge Functions > Secrets**, cadastre:

- `VAPID_PUBLIC_KEY` (a pública gerada acima)
- `VAPID_PRIVATE_KEY` (a privada gerada acima)
- `SUPABASE_URL` (a mesma Project URL)
- `SUPABASE_SERVICE_ROLE_KEY` (em Project Settings > API — **nunca** exponha essa chave no
  frontend, só aqui)

### 3.3. Agendar a execução (a cada minuto)

No painel do Supabase, vá em **Database > Cron Jobs** (ou **Integrations > Cron**) e crie um job
que chama a Edge Function `send-reminders` a cada 1 minuto via HTTP, usando o header
`Authorization: Bearer <sua anon key ou service role key>`. O painel do Supabase tem um assistente
visual para isso — basta apontar para a URL da função
(`https://SEU_PROJETO.supabase.co/functions/v1/send-reminders`).

### 3.4. Ativar no app

Depois de configurado, vá em **Ajustes > Notificações push > Ativar neste dispositivo** dentro do
Tracker (em cada dispositivo/navegador onde você quiser receber avisos) e cadastre um horário de
lembrete em cada hábito (tela **Hábitos > Editar**).

> Nota: o cálculo de horário na Edge Function assume fuso de Brasília (UTC-3), fixo, para manter a
> lógica simples — ajuste `TIMEZONE_OFFSET_HOURS` em
> `supabase/functions/send-reminders/index.ts` se precisar de outro fuso.

Sem esse passo 3, o resto do app funciona normalmente — as notificações são a única parte que
depende dele.

---

## 4. Como funciona a análise com IA

Na aba **Análise IA**, escolha um período e gere um documento: ele inclui um prompt já pronto
("você é um coach de hábitos...") seguido dos seus dados reais (hábitos, streaks, taxa de sucesso,
registro dia a dia, notas). Baixe o arquivo ou copie o texto e cole numa conversa com o Claude
(https://claude.ai) para receber feedback, pontos de atenção e sugestões. Nada é enviado
automaticamente — você decide quando e com quem compartilhar.

---

## 5. Estrutura do projeto

```
src/
  pages/        Telas: Hoje (dashboard), Hábitos, Estatísticas, Análise IA, Ajustes, Login/Cadastro
  components/   Layout (nav), formulário de hábito, proteção de rotas
  context/      Autenticação (Supabase Auth)
  lib/          Cliente Supabase, API de dados, cálculo de streaks, push notifications, exportação
  sw.ts         Service worker (cache do PWA + push notifications)
supabase/
  migrations/   SQL do banco de dados
  functions/    Edge Function que dispara os lembretes push
```
