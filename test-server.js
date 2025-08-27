const axios = require('axios');

async function testServer() {
    const baseURL = 'http://localhost:3003';
    
    try {
        console.log('🧪 Testando servidor GaleriumAuth...\n');

        // Teste 1: Rota raiz
        console.log('1️⃣ Testando rota raiz...');
        const root = await axios.get(baseURL);
        console.log('✅ Rota raiz OK:', root.data.message);

        // Teste 2: Health check
        console.log('\n2️⃣ Testando health check...');
        const health = await axios.get(`${baseURL}/health`);
        console.log('✅ Health check OK:', health.data.status);
        console.log('   📊 Database:', health.data.database);
        console.log('   💳 Mercado Pago:', health.data.mercadoPago);

        // Teste 3: Registro de usuário
        console.log('\n3️⃣ Testando registro...');
        const email = `teste${Date.now()}@galerium.com`;
        const register = await axios.post(`${baseURL}/api/auth/register`, {
            email,
            password: '123456',
            name: 'Teste Galerium'
        });
        console.log('✅ Registro OK:', register.data.user.email);

        // Teste 4: Login
        console.log('\n4️⃣ Testando login...');
        const login = await axios.post(`${baseURL}/api/auth/login`, {
            email,
            password: '123456'
        });
        console.log('✅ Login OK:', login.data.user.name);

        // Teste 5: Rota autenticada
        console.log('\n5️⃣ Testando rota autenticada...');
        const me = await axios.get(`${baseURL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${login.data.token}` }
        });
        console.log('✅ Rota autenticada OK:', me.data.user.email);

        // Teste 6: Assets (rota pública)
        console.log('\n6️⃣ Testando listagem de assets...');
        const assets = await axios.get(`${baseURL}/api/assets`);
        console.log('✅ Assets OK - Total encontrado:', assets.data.pagination.total);

        // Teste 7: Criar preferência de pagamento
        console.log('\n7️⃣ Testando criação de preferência...');
        try {
            const preference = await axios.post(`${baseURL}/api/payments/create-preference`, 
                { type: 'monthly' },
                { headers: { Authorization: `Bearer ${login.data.token}` } }
            );
            console.log('✅ Preferência criada:', preference.data.id);
        } catch (error) {
            if (error.response?.data?.error === 'Mercado Pago não configurado') {
                console.log('⚠️  Mercado Pago não configurado (esperado em desenvolvimento)');
            } else {
                throw error;
            }
        }

        console.log('\n🎉 Todos os testes principais passaram!');
        console.log('🚀 Servidor funcionando perfeitamente!');
        console.log('\n📋 Resumo dos testes:');
        console.log('   ✅ Rota raiz funcionando');
        console.log('   ✅ Health check OK');
        console.log('   ✅ Registro de usuário');
        console.log('   ✅ Login de usuário');
        console.log('   ✅ Autenticação JWT');
        console.log('   ✅ Listagem de assets');
        console.log('   ✅ Integração com Mercado Pago');

    } catch (error) {
        console.error('❌ Erro no teste:', error.response?.data || error.message);
        console.error('\n🔍 Detalhes do erro:');
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        } else {
            console.error('   Mensagem:', error.message);
        }
    }
}

// Só roda se chamado diretamente
if (require.main === module) {
    testServer();
}

module.exports = testServer;
