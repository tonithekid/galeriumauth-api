const axios = require('axios');
require('dotenv').config();

async function testFullPaymentFlow() {
    const baseURL = 'http://localhost:3000/api';
    
    try {
        console.log('🚀 Testando fluxo completo de pagamento Galerium...\n');

        // 1. Registrar usuário de teste
        console.log('1️⃣ Registrando usuário...');
        const email = `teste${Date.now()}@galerium.com`;
        const user = await axios.post(`${baseURL}/auth/register`, {
            email: email,
            password: '123456',
            name: 'Usuário Galerium'
        });
        console.log('✅ Usuário registrado:', user.data.user.email);

        const token = user.data.token;

        // 2. Criar preferência de pagamento mensal
        console.log('\n2️⃣ Criando preferência de pagamento mensal...');
        const preference = await axios.post(
            `${baseURL}/payments/create-preference`,
            { type: 'monthly' },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('✅ Preferência criada!');
        console.log('🔗 Link de pagamento:', preference.data.init_point);
        console.log('🧪 Link de teste:', preference.data.sandbox_init_point);

        // 3. Criar PIX
        console.log('\n3️⃣ Criando pagamento PIX...');
        const pix = await axios.post(
            `${baseURL}/payments/create-pix`,
            { type: 'monthly' },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('✅ PIX criado!');
        console.log('📄 ID do pagamento:', pix.data.id);
        console.log('🔢 Status:', pix.data.status);
        
        if (pix.data.qr_code) {
            console.log('📱 QR Code PIX gerado com sucesso!');
        }

        // 4. Verificar perfil do usuário
        console.log('\n4️⃣ Verificando perfil...');
        const profile = await axios.get(`${baseURL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Perfil verificado:', profile.data.user.name);

        console.log('\n🎉 Fluxo completo testado com sucesso!');
        console.log('📋 Próximos passos:');
        console.log('   1. Use o link de teste para simular pagamento');
        console.log('   2. Configure ngrok para testar webhook');
        console.log('   3. Teste com dados de cartão de teste do Mercado Pago');

    } catch (error) {
        console.error('❌ Erro no teste:', error.response?.data || error.message);
    }
}

testFullPaymentFlow();
