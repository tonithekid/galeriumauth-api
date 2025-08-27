require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

const app = express();

// Otimização do Prisma para Railway
const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

// Configurar Mercado Pago
let mpClient, preference, payment;
if (process.env.MP_ACCESS_TOKEN) {
    mpClient = new MercadoPagoConfig({
        accessToken: process.env.MP_ACCESS_TOKEN,
    });
    preference = new Preference(mpClient);
    payment = new Payment(mpClient);
}

// Middlewares otimizados para Railway
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? [process.env.FRONTEND_URL, process.env.BACKEND_URL].filter(Boolean)
        : true,
    credentials: true,
    optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de compressão para reduzir bandwidth
if (process.env.NODE_ENV === 'production') {
    const compression = require('compression');
    app.use(compression({
        filter: (req, res) => {
            if (req.headers['x-no-compression']) {
                return false;
            }
            return compression.filter(req, res);
        },
        level: 6,
        threshold: 1024
    }));
}

// Rate limiting básico para proteger recursos
const rateLimit = {};
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutos
const RATE_LIMIT_MAX = 100; // máximo de requests por IP

const rateLimitMiddleware = (req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        return next();
    }
    
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimit[ip]) {
        rateLimit[ip] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
        return next();
    }
    
    if (now > rateLimit[ip].resetTime) {
        rateLimit[ip] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
        return next();
    }
    
    if (rateLimit[ip].count >= RATE_LIMIT_MAX) {
        return res.status(429).json({ 
            error: 'Muitas requisições. Tente novamente em alguns minutos.' 
        });
    }
    
    rateLimit[ip].count++;
    next();
};

app.use(rateLimitMiddleware);

// Middleware de autenticação
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acesso necessário' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });

        if (!user) {
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido' });
    }
};

// ROTA RAIZ - TESTE
app.get('/', (req, res) => {
    res.json({ 
        message: '🚀 GaleriumAuth API funcionando!',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// ROTA DE SAÚDE AVANÇADA
app.get('/health', async (req, res) => {
    const healthCheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        port: process.env.PORT || 3001,
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
            external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100
        }
    };

    try {
        // Teste de conexão com o banco
        await prisma.$queryRaw`SELECT 1`;
        healthCheck.database = 'Connected';
        
        // Verificar Mercado Pago
        healthCheck.mercadoPago = process.env.MP_ACCESS_TOKEN ? 'Configured' : 'Not configured';
        
        res.status(200).json(healthCheck);
    } catch (error) {
        healthCheck.message = 'ERROR';
        healthCheck.database = 'Disconnected';
        healthCheck.error = error.message;
        res.status(503).json(healthCheck);
    }
});

// ROTA DE MÉTRICAS SIMPLES
app.get('/metrics', (req, res) => {
    const metrics = {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.version,
        platform: process.platform,
        arch: process.arch
    };
    
    res.json(metrics);
});

// ==================== AUTENTICAÇÃO ====================

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
        }

        // Verificar se usuário existe
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Criar usuário
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                isAdmin: false
            }
        });

        // Gerar token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            message: 'Usuário criado com sucesso',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }

        // Buscar usuário
        const user = await prisma.user.findUnique({ 
            where: { email },
            include: { subscriptions: true }
        });
        
        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Verificar senha
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Gerar token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            message: 'Login realizado com sucesso',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                isAdmin: user.isAdmin,
                subscriptions: user.subscriptions
            }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                isAdmin: true,
                createdAt: true,
                subscriptions: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ==================== PAGAMENTOS ====================

app.post('/api/payments/create-preference', authenticateToken, async (req, res) => {
    try {
        if (!preference) {
            return res.status(500).json({ error: 'Mercado Pago não configurado' });
        }

        const { type } = req.body;
        
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        const plans = {
            monthly: { title: 'Plano Mensal', price: 29.90 },
            annual: { title: 'Plano Anual', price: 299.90 },
            premium: { title: 'Plano Premium', price: 49.90 }
        };

        const plan = plans[type];
        if (!plan) {
            return res.status(400).json({ error: 'Tipo de plano inválido' });
        }

        const preferenceData = {
            items: [{
                id: `galerium-${type}`,
                title: `Galerium Assets - ${plan.title}`,
                description: `Acesso completo aos assets IA - ${plan.title}`,
                unit_price: plan.price,
                quantity: 1,
                currency_id: 'BRL'
            }],
            payer: {
                name: user.name,
                email: user.email
            },
            external_reference: `${user.id}_${type}_${Date.now()}`,
            notification_url: `${process.env.BACKEND_URL}/api/payments/webhook`
        };

        const response = await preference.create({ body: preferenceData });
        
        res.json({
            id: response.id,
            init_point: response.init_point,
            sandbox_init_point: response.sandbox_init_point
        });
    } catch (error) {
        console.error('Erro ao criar preferência:', error);
        res.status(500).json({ error: 'Erro ao processar pagamento' });
    }
});

app.post('/api/payments/create-pix', authenticateToken, async (req, res) => {
    try {
        if (!payment) {
            return res.status(500).json({ error: 'Mercado Pago não configurado' });
        }

        const { type } = req.body;
        
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        const prices = {
            monthly: 29.90,
            annual: 299.90,
            premium: 49.90
        };

        const amount = prices[type];
        if (!amount) {
            return res.status(400).json({ error: 'Tipo de plano inválido' });
        }

        const paymentData = {
            transaction_amount: amount,
            description: `Galerium Assets - Plano ${type}`,
            payment_method_id: 'pix',
            payer: {
                email: user.email,
                first_name: user.name.split(' ')[0],
                last_name: user.name.split(' ').slice(1).join(' ') || 'User',
                identification: {
                    type: 'CPF',
                    number: '12345678909'
                }
            },
            external_reference: `${user.id}_${type}_pix_${Date.now()}`
        };

        const response = await payment.create({ body: paymentData });
        
        res.json({
            id: response.id,
            status: response.status,
            qr_code: response.point_of_interaction?.transaction_data?.qr_code,
            qr_code_base64: response.point_of_interaction?.transaction_data?.qr_code_base64,
            ticket_url: response.point_of_interaction?.transaction_data?.ticket_url
        });

    } catch (error) {
        console.error('Erro ao criar PIX:', error);
        res.status(500).json({ error: 'Erro ao processar pagamento PIX' });
    }
});

app.post('/api/payments/webhook', async (req, res) => {
    try {
        const { type, data } = req.body;
        
        console.log('📥 Webhook recebido:', { type, data });

        if (type === 'payment' && payment) {
            const paymentId = data.id;
            
            const paymentInfo = await payment.get({ id: paymentId });
            console.log('💳 Status do pagamento:', paymentInfo.status);
            
            if (paymentInfo.status === 'approved') {
                const externalReference = paymentInfo.external_reference;
                const [userId, planType] = externalReference.split('_');

                await prisma.subscription.upsert({
                    where: { userId: userId },
                    update: {
                        status: 'active',
                        planId: planType,
                        planName: `Plano ${planType}`,
                        currentPeriodStart: new Date(),
                        currentPeriodEnd: new Date(Date.now() + (planType === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000),
                        mpPaymentId: paymentId.toString(),
                        amount: paymentInfo.transaction_amount
                    },
                    create: {
                        userId: userId,
                        planId: planType,
                        planName: `Plano ${planType}`,
                        status: 'active',
                        currentPeriodStart: new Date(),
                        currentPeriodEnd: new Date(Date.now() + (planType === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000),
                        cancelAtPeriodEnd: false,
                        amount: paymentInfo.transaction_amount,
                        mpPaymentId: paymentId.toString()
                    }
                });

                console.log('✅ Assinatura criada/atualizada para usuário:', userId);
            }
        }

        res.status(200).json({ received: true });

    } catch (error) {
        console.error('❌ Erro no webhook:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ==================== ASSETS ====================

app.get('/api/assets', async (req, res) => {
    try {
        const { page = 1, limit = 20, category, search } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        
        if (category) {
            where.category = category;
        }
        
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        const assets = await prisma.asset.findMany({
            where,
            take: parseInt(limit),
            skip: offset,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                description: true,
                category: true,
                tags: true,
                thumbnailUrl: true,
                isPremium: true,
                downloads: true,
                createdAt: true
            }
        });

        const total = await prisma.asset.count({ where });

        res.json({
            assets,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Erro ao buscar assets:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/assets/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const asset = await prisma.asset.findUnique({
            where: { id }
        });

        if (!asset) {
            return res.status(404).json({ error: 'Asset não encontrado' });
        }

        res.json(asset);
    } catch (error) {
        console.error('Erro ao obter asset:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Erro não tratado:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
    console.log(`💾 Banco: ${process.env.DATABASE_URL}`);
    console.log(`💳 Mercado Pago: ${process.env.MP_ACCESS_TOKEN ? 'Configurado' : 'Não configurado'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Encerrando servidor...');
    await prisma.$disconnect();
    process.exit(0);
});
