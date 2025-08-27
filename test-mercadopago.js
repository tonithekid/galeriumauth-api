const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
require('dotenv').config();

// Configurar Mercado Pago
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
});

const preference = new Preference(client);
const payment = new Payment(client);

async function testCredentials() {
    console.log('🔍 Testando credenciais do Mercado Pago...\n');
    
    try {
        // Teste 1: Criar preferência básica
        console.log('1️⃣ Testando criação de preferência...');
        const preferenceData = {
            items: [{
                id: 'galerium-monthly',
                title: 'Galerium Assets - Plano Mensal',
                description: 'Acesso completo aos assets IA',
                unit_price: 29.90,
                quantity: 1,
                currency_id: 'BRL'
            }],
            external_reference: `test_${Date.now()}`
        };

        const response = await preference.create({ body: preferenceData });
        console.log('✅ Preferência criada com sucesso!');
        console.log('📄 ID:', response.id);
        console.log('🔗 Link de pagamento:', response.init_point);
        console.log('💳 Sandbox URL:', response.sandbox_init_point);

        // Teste 2: Criar pagamento PIX
        console.log('\n2️⃣ Testando pagamento PIX...');
        const pixPaymentData = {
            transaction_amount: 29.90,
            description: 'Galerium Assets - Teste PIX',
            payment_method_id: 'pix',
            payer: {
                email: 'test@galerium.com',
                first_name: 'Test',
                last_name: 'User',
                identification: {
                    type: 'CPF',
                    number: '12345678909'
                }
            }
        };

        const pixResponse = await payment.create({ body: pixPaymentData });
        console.log('✅ PIX criado com sucesso!');
        console.log('📄 ID:', pixResponse.id);
        console.log('🔢 Status:', pixResponse.status);
        
        if (pixResponse.point_of_interaction?.transaction_data) {
            console.log('📱 QR Code disponível!');
        }

        console.log('\n🎉 Todas as credenciais estão funcionando perfeitamente!');
        
    } catch (error) {
        console.error('❌ Erro ao testar credenciais:');
        console.error('Código:', error.status);
        console.error('Mensagem:', error.message);
        if (error.response?.data) {
            console.error('Detalhes:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Executar teste
testCredentials();
