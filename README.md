# 🚀 GaleriumAuth - Backend Otimizado para Railway

Backend completo para Galerium com autenticação, pagamentos e gerenciamento de assets, otimizado para deploy no Railway Free Plan.

## 📋 Características

- ✅ **Autenticação JWT** completa
- ✅ **Integração Mercado Pago** (PIX e Checkout)
- ✅ **PostgreSQL** otimizado para Railway
- ✅ **Healthcheck** avançado
- ✅ **Rate limiting** para proteção
- ✅ **Compressão** para reduzir bandwidth
- ✅ **Otimizações de performance** para Free Plan

## 🛠️ Tecnologias

- **Node.js** 18+
- **Express.js** - Framework web
- **Prisma** - ORM para PostgreSQL
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas
- **Mercado Pago SDK** - Pagamentos
- **Compression** - Otimização de bandwidth

## 🚀 Deploy no Railway

### 1. Preparação do Repositório

```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### 2. Deploy no Railway

1. Acesse [Railway.app](https://railway.app)
2. Conecte seu repositório GitHub
3. Adicione um **PostgreSQL Database**
4. Configure as variáveis de ambiente:

```env
# Será configurado automaticamente pelo Railway
DATABASE_URL=postgresql://...

# Configure manualmente
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=production

# Mercado Pago (use suas credenciais de produção)
MP_ACCESS_TOKEN=your-production-access-token
MP_PUBLIC_KEY=your-production-public-key
MP_WEBHOOK_SECRET=your-webhook-secret

# URLs (Railway fornecerá automaticamente)
FRONTEND_URL=https://your-frontend-domain.railway.app
BACKEND_URL=https://your-backend-domain.railway.app

# Preços
MONTHLY_PRICE=2990
ANNUAL_PRICE=29990
PREMIUM_PRICE=4990
```

### 3. Configurações Automáticas

O Railway detectará automaticamente:
- ✅ **Build Command**: `npm ci && npm run build`
- ✅ **Start Command**: `npm run deploy && npm start`
- ✅ **Healthcheck**: `/health`
- ✅ **Port**: Configurado automaticamente

## 📊 Otimizações para Free Plan

### Consumo de Recursos Minimizado

- **Logs otimizados**: Apenas erros em produção
- **Compressão**: Reduz bandwidth em 60-80%
- **Rate limiting**: Protege contra abuso
- **Conexões de banco otimizadas**: Pool de conexões eficiente
- **Healthcheck inteligente**: Monitora recursos

### Monitoramento

- **GET /health** - Status completo do sistema
- **GET /metrics** - Métricas de performance
- **Graceful shutdown** - Desconexão limpa do banco

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Servidor com nodemon
npm run db:studio    # Interface do Prisma

# Produção
npm run build        # Gerar Prisma Client
npm run start        # Iniciar servidor
npm run deploy       # Executar migrações

# Testes
npm run test         # Testes básicos
npm run test:mp      # Testes Mercado Pago
```

## 📡 Endpoints da API

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Dados do usuário

### Pagamentos
- `POST /api/payments/create-preference` - Criar preferência MP
- `POST /api/payments/create-pix` - Gerar PIX
- `POST /api/payments/webhook` - Webhook MP

### Assets
- `GET /api/assets` - Listar assets
- `GET /api/assets/:id` - Obter asset específico

### Sistema
- `GET /health` - Healthcheck
- `GET /metrics` - Métricas do sistema

## 💰 Estimativa de Custos Railway

### Free Plan ($1/mês)
- **Aplicação**: ~$0.50-0.70/mês
- **PostgreSQL**: ~$0.30-0.50/mês
- **Total**: ~$0.80-1.20/mês

### Otimizações Implementadas
- Compressão reduz bandwidth
- Rate limiting previne abuso
- Logs mínimos em produção
- Conexões de banco otimizadas
- Healthcheck eficiente

## 🔒 Segurança

- ✅ **JWT** com expiração configurável
- ✅ **bcrypt** para hash de senhas
- ✅ **CORS** configurado para produção
- ✅ **Rate limiting** contra ataques
- ✅ **Validação** de entrada em todas as rotas
- ✅ **Secrets** para dados sensíveis

## 📈 Escalabilidade

Quando precisar fazer upgrade:

1. **Hobby Plan** ($5/mês) - Mais recursos
2. **Pro Plan** ($20/mês) - Recursos dedicados
3. **Adicionar Redis** - Cache e sessões
4. **CDN** - Para assets estáticos
5. **Load Balancer** - Múltiplas instâncias

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro de conexão com banco**
   - Verifique se o PostgreSQL está ativo
   - Confirme a `DATABASE_URL`

2. **Migrações não executam**
   - Execute `npm run deploy` manualmente
   - Verifique logs do Railway

3. **Mercado Pago não funciona**
   - Confirme credenciais de produção
   - Verifique webhook URL

### Logs e Monitoramento

```bash
# Ver logs no Railway
railway logs

# Healthcheck local
curl http://localhost:3000/health

# Métricas
curl http://localhost:3000/metrics
```

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique os logs no Railway Dashboard
2. Teste endpoints com `/health` e `/metrics`
3. Confirme variáveis de ambiente

---

**🎯 Objetivo**: Maximizar o uso do Railway Free Plan ($1/mês) com performance otimizada e fácil escalabilidade.
