const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const PORT = 8080;

app.use(cors());
app.use(bodyParser.json());

// Simulated Secret Key for QR Signatures (HMAC)
const SECRET_KEY = 'metro-secure-key-2026';

// In-Memory Database (Mocking Redis/Supabase)
const balances = {
    'METRO-ABC-789': 25.50,
    'USER-99-TEST': 100.00
};

// Tool: Verify QR Signature (Simulated)
function verifyTicketSignature(id, signature) {
    if (!signature) return true; // For demo purposes, we allow unsigned for now
    const hmac = crypto.createHmac('sha256', SECRET_KEY);
    hmac.update(id);
    return hmac.digest('hex') === signature;
}

// 1. Endpoint: Get Balance
app.get('/api/balance/:id', (req, res) => {
    const { id } = req.params;
    const { sig } = req.query;

    if (!verifyTicketSignature(id, sig)) {
        return res.status(403).json({ error: 'Firma de boleto inválida' });
    }

    const balance = balances[id] || 0.00;

    console.log(`[API] Consulta de saldo: ${id} -> $${balance}`);
    res.json({ id, balance });
});

// 2. Endpoint: Recharge
app.post('/api/recharge', (req, res) => {
    const { id, amount } = req.body;

    if (amount <= 0) {
        return res.status(400).json({ error: 'Monto inválido' });
    }

    if (!balances[id] && balances[id] !== 0) {
        balances[id] = 0.00; // Auto-create for demo
    }

    balances[id] += amount;

    console.log(`[API] Recarga exitosa: ${id} +$${amount} (Nuevo: $${balances[id]})`);

    res.json({
        success: true,
        newBalance: balances[id],
        message: 'Recarga procesada instantáneamente'
    });
});

app.listen(PORT, () => {
    console.log(`[METRO-BACKEND] Servidor corriendo en http://localhost:${PORT}`);
});
