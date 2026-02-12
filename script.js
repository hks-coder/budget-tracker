// Données
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// Éléments du DOM
const incomeForm = document.getElementById('incomeForm');
const expenseForm = document.getElementById('expenseForm');
const transactionsList = document.getElementById('transactionsList');
const totalBalance = document.getElementById('totalBalance');
const totalIncome = document.getElementById('totalIncome');
const totalExpense = document.getElementById('totalExpense');
const filterType = document.getElementById('filterType');
const filterCategory = document.getElementById('filterCategory');
const clearAllBtn = document.getElementById('clearAll');

// Initialiser la date d'aujourd'hui
document.getElementById('incomeDate').valueAsDate = new Date();
document.getElementById('expenseDate').valueAsDate = new Date();

// Ajouter un revenu
incomeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const transaction = {
        id: Date.now(),
        type: 'income',
        amount: parseFloat(document.getElementById('incomeAmount').value),
        category: document.getElementById('incomeCategory').value,
        description: document.getElementById('incomeDescription').value,
        date: document.getElementById('incomeDate').value
    };
    
    transactions.push(transaction);
    saveTransactions();
    incomeForm.reset();
    document.getElementById('incomeDate').valueAsDate = new Date();
    updateUI();
    
    showNotification('Revenu ajouté avec succès !', 'success');
});

// Ajouter une dépense
expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const transaction = {
        id: Date.now(),
        type: 'expense',
        amount: parseFloat(document.getElementById('expenseAmount').value),
        category: document.getElementById('expenseCategory').value,
        description: document.getElementById('expenseDescription').value,
        date: document.getElementById('expenseDate').value
    };
    
    transactions.push(transaction);
    saveTransactions();
    expenseForm.reset();
    document.getElementById('expenseDate').valueAsDate = new Date();
    updateUI();
    
    showNotification('Dépense ajoutée avec succès !', 'success');
});

// Sauvegarder dans localStorage
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Mettre à jour l'interface
function updateUI() {
    updateSummary();
    displayTransactions();
    updateCategoryFilter();
}

// Mettre à jour le résumé
function updateSummary() {
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expense;
    
    totalIncome.textContent = formatCurrency(income);
    totalExpense.textContent = formatCurrency(expense);
    totalBalance.textContent = formatCurrency(balance);
}

// Afficher les transactions
function displayTransactions() {
    const typeFilter = filterType.value;
    const categoryFilter = filterCategory.value;
    
    let filtered = transactions;
    
    if (typeFilter !== 'all') {
        filtered = filtered.filter(t => t.type === typeFilter);
    }
    
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(t => t.category === categoryFilter);
    }
    
    // Trier par date (plus récent en premier)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (filtered.length === 0) {
        transactionsList.innerHTML = `
            <div class="empty-state">
                <h3>📭 Aucune transaction</h3>
                <p>Commencez par ajouter vos revenus et dépenses</p>
            </div>
        `;
        return;
    }
    
    transactionsList.innerHTML = filtered.map(transaction => `
        <div class="transaction-item ${transaction.type}">
            <div class="transaction-info">
                <h4>${transaction.category}</h4>
                <p>${transaction.description}</p>
                <p style="font-size: 0.85em; color: #999;">${formatDate(transaction.date)}</p>
            </div>
            <div class="transaction-amount">
                ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
            </div>
            <button class="delete-btn" onclick="deleteTransaction(${transaction.id})">
                🗑️
            </button>
        </div>
    `).join('');
}

// Supprimer une transaction
function deleteTransaction(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        updateUI();
        showNotification('Transaction supprimée', 'info');
    }
}

// Tout effacer
clearAllBtn.addEventListener('click', () => {
    if (confirm('⚠️ Êtes-vous sûr de vouloir supprimer TOUTES les transactions ?\nCette action est irréversible !')) {
        transactions = [];
        saveTransactions();
        updateUI();
        showNotification('Toutes les transactions ont été supprimées', 'info');
    }
});

// Mettre à jour le filtre des catégories
function updateCategoryFilter() {
    const categories = [...new Set(transactions.map(t => t.category))];
    
    filterCategory.innerHTML = '<option value="all">Toutes les catégories</option>';
    categories.forEach(cat => {
        filterCategory.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
}

// Filtres
filterType.addEventListener('change', displayTransactions);
filterCategory.addEventListener('change', displayTransactions);

// Formater la monnaie
function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
}

// Formater la date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
}

// Notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : '#3498db'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Animations CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialiser
updateUI();
