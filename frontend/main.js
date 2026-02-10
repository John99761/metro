import './style.css'
import { Html5QrcodeScanner } from 'html5-qrcode'

// Configuration
const API_BASE_URL = window.location.origin.includes('localhost')
    ? 'http://localhost:8080/api'
    : '/api';

// State
let selectedAmount = 0;
let ticketId = null;
let currentBalance = 0;
let html5QrcodeScanner = null;

// DOM Elements
const scannerView = document.getElementById('scanner-view');
const rechargeForm = document.getElementById('recharge-form');
const ticketDisplay = document.getElementById('ticket-id-display');
const balanceDisplay = document.getElementById('balance-display');
const amountBtns = document.querySelectorAll('.amount-btn');
const payBtn = document.getElementById('pay-button');
const statusMsg = document.getElementById('status-message');
const scannerStatus = document.getElementById('scanner-status');

// Initialize
async function init() {
    // 1. Check if ID already exists in URL
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get('id');

    if (idFromUrl) {
        onScanSuccess(idFromUrl);
    } else {
        startScanner();
    }

    setupEventListeners();
}

function startScanner() {
    html5QrcodeScanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
    /* verbose= */ false
    );
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}

function onScanSuccess(decodedText) {
    ticketId = decodedText;

    // Update UI State
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear();
    }

    scannerView.style.display = 'none';
    rechargeForm.style.display = 'block';
    ticketDisplay.textContent = ticketId;

    fetchBalance();
}

function onScanFailure(error) {
    // Silence failures as they happen continuously
}

function setupEventListeners() {
    amountBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Toggle selection
            amountBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');

            selectedAmount = parseInt(btn.dataset.amount);
            payBtn.disabled = false;
            payBtn.textContent = `PAGAR $${selectedAmount}`;
        });
    });

    payBtn.addEventListener('click', handlePayment);
}

async function fetchBalance() {
    console.log(`Fetching balance for ${ticketId}...`);
    balanceDisplay.innerHTML = '<span class="loading-dots" style="font-size: 24px;"></span>';

    try {
        const response = await fetch(`${API_BASE_URL}/balance/${ticketId}`);
        const data = await response.json();
        currentBalance = data.balance;
        updateBalanceUI();
    } catch (error) {
        console.error('Error fetching balance:', error);
        showStatus('Error al conectar con el servidor.', 'error');
        balanceDisplay.textContent = '---';
    }
}

function updateBalanceUI() {
    balanceDisplay.textContent = `$${currentBalance.toFixed(2)}`;
}

async function handlePayment() {
    if (selectedAmount <= 0) return;

    payBtn.disabled = true;
    payBtn.innerHTML = '<span class="loading-dots">PROCESANDO PAGO</span>';

    try {
        const response = await fetch(`${API_BASE_URL}/recharge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: ticketId, amount: selectedAmount })
        });

        const data = await response.json();

        if (data.success) {
            currentBalance = data.newBalance;
            updateBalanceUI();

            showStatus('¡Recarga Exitosa! Tu saldo se ha actualizado.', 'success');
            payBtn.innerHTML = 'PAGO COMPLETADO';

            setTimeout(() => {
                payBtn.textContent = 'PAGAR AHORA';
                amountBtns.forEach(b => b.classList.remove('selected'));
                selectedAmount = 0;
            }, 3000);
        } else {
            throw new Error(data.error);
        }

    } catch (error) {
        showStatus('Error al procesar el pago. Intenta de nuevo.', 'error');
        payBtn.disabled = false;
        payBtn.textContent = 'REINTENTAR PAGO';
    }
}

function showStatus(text, type) {
    statusMsg.textContent = text;
    statusMsg.style.display = 'block';
    statusMsg.className = `status-message ${type}`;

    setTimeout(() => {
        statusMsg.style.display = 'none';
    }, 5000);
}

init();
