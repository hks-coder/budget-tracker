// Profile Management
let currentProfile = localStorage.getItem('currentProfile') || 'hemank';
let profileLocked = localStorage.getItem('profileLocked') === 'true';

// Données
let transactions = JSON.parse(localStorage.getItem(`transactions_${currentProfile}`)) || [];
let archivedMonths = JSON.parse(localStorage.getItem(`archived_${currentProfile}`)) || [];

// Éléments du DOM
const profileSelect = document.getElementById('profileSelect');
const profileLockIndicator = document.getElementById('profileLockIndicator');
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

// Initialize profile
initializeProfile();

// Profile change handler
profileSelect.addEventListener('change', (e) => {
    // Once a profile is selected, lock it permanently for this session
    if (profileLocked || currentProfile) {
        showNotification('⚠️ Le profil est verrouillé. Rechargez la page pour changer de profil.', 'warning');
        profileSelect.value = currentProfile;
        return;
    }
    
    switchProfile(e.target.value);
});

// Initialize profile on load
function initializeProfile() {
    profileSelect.value = currentProfile;
    
    // Lock profile immediately after page load - each profile is isolated
    profileLocked = true;
    localStorage.setItem('profileLocked', 'true');
    
    // Show lock indicator
    profileLockIndicator.style.display = 'inline-block';
    profileSelect.disabled = true;
    
    updateHeaderProfileInfo();
}

// Switch profile
function switchProfile(newProfile) {
    // Save current transactions before switching
    saveTransactions();
    
    // Update current profile
    currentProfile = newProfile;
    localStorage.setItem('currentProfile', newProfile);
    
    // Lock profile immediately
    profileLocked = true;
    localStorage.setItem('profileLocked', 'true');
    profileLockIndicator.style.display = 'inline-block';
    profileSelect.disabled = true;
    showNotification(`🔒 Profil ${newProfile === 'hemank' ? 'Hemank' : 'Jullian'} sélectionné et verrouillé`, 'info');
    
    // Load new profile's transactions and archives
    transactions = JSON.parse(localStorage.getItem(`transactions_${currentProfile}`)) || [];
    archivedMonths = JSON.parse(localStorage.getItem(`archived_${currentProfile}`)) || [];
    
    // Update UI
    updateUI();
    updateHeaderProfileInfo();
}

// Update header to show current profile info
function updateHeaderProfileInfo() {
    const profileName = currentProfile === 'hemank' ? 'Hemank (Individuel)' : 'Jullian (Partagé)';
    document.querySelector('header p').textContent = `Gérez vos finances personnelles facilement - ${profileName}`;
}

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
    localStorage.setItem(`transactions_${currentProfile}`, JSON.stringify(transactions));
}

// Mettre à jour l'interface
function updateUI() {
    updateSummary();
    displayTransactions();
    updateCategoryFilter();
    updateExpenseChart();
    updateMonthInfo();
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

// Graphique des dépenses par catégorie
function updateExpenseChart() {
    const chartSection = document.querySelector('.chart-section');
    if (!chartSection) return;
    
    // Calculer les dépenses par catégorie
    const expensesByCategory = {};
    transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            if (expensesByCategory[t.category]) {
                expensesByCategory[t.category] += t.amount;
            } else {
                expensesByCategory[t.category] = t.amount;
            }
        });
    
    const categories = Object.keys(expensesByCategory);
    const totalExpenses = Object.values(expensesByCategory).reduce((a, b) => a + b, 0);
    
    // Si aucune dépense, afficher un message
    if (categories.length === 0) {
        chartSection.innerHTML = `
            <h2>📈 Dépenses par Catégorie</h2>
            <div style="text-align: center; padding: 40px; color: #7f8c8d;">
                <p style="font-size: 1.2em;">Aucune dépense pour le moment</p>
            </div>
        `;
        return;
    }
    
    // Couleurs pour les barres
    const colors = [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF',
        '#FF9F40',
        '#E74C3C',
        '#3498DB',
        '#2ECC71'
    ];
    
    // Créer le graphique en barres HTML/CSS
    let chartHTML = '<h2>📈 Dépenses par Catégorie</h2><div style="padding: 20px;">';
    
    categories.forEach((category, index) => {
        const amount = expensesByCategory[category];
        const percentage = ((amount / totalExpenses) * 100).toFixed(1);
        const color = colors[index % colors.length];
        
        chartHTML += `
            <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-weight: 600; color: #2c3e50;">${category}</span>
                    <span style="color: #7f8c8d;">${formatCurrency(amount)} (${percentage}%)</span>
                </div>
                <div style="background: #e0e0e0; border-radius: 10px; height: 25px; overflow: hidden;">
                    <div style="background: ${color}; height: 100%; width: ${percentage}%; border-radius: 10px; transition: width 0.5s ease;"></div>
                </div>
            </div>
        `;
    });
    
    chartHTML += '</div>';
    chartSection.innerHTML = chartHTML;
}

// Notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    const colors = {
        success: '#27ae60',
        info: '#3498db',
        warning: '#f39c12'
    };
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
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

// Monthly Operations
const archiveMonthBtn = document.getElementById('archiveMonth');
const startNewMonthBtn = document.getElementById('startNewMonth');
const viewArchivesBtn = document.getElementById('viewArchives');
const archivesModal = document.getElementById('archivesModal');
const closeModal = document.getElementById('closeModal');
const currentMonthInfo = document.getElementById('currentMonthInfo');

// Get current month and year
function getCurrentMonthYear() {
    const now = new Date();
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                       'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return {
        month: monthNames[now.getMonth()],
        year: now.getFullYear(),
        key: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    };
}

// Update month info display
function updateMonthInfo() {
    const { month, year } = getCurrentMonthYear();
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    currentMonthInfo.innerHTML = `
        📅 Mois en cours: <strong>${month} ${year}</strong> | 
        💰 Revenus: <strong>${formatCurrency(income)}</strong> | 
        💸 Dépenses: <strong>${formatCurrency(expense)}</strong> | 
        📊 Transactions: <strong>${transactions.length}</strong>
    `;
}

// Archive current month
archiveMonthBtn.addEventListener('click', () => {
    if (transactions.length === 0) {
        showNotification('⚠️ Aucune transaction à sauvegarder pour ce mois', 'warning');
        return;
    }
    
    if (confirm('💾 Sauvegarder le mois en cours dans les archives?\nLes transactions actuelles resteront visibles.')) {
        const { month, year, key } = getCurrentMonthYear();
        
        // Check if this month is already archived
        const existingArchive = archivedMonths.find(a => a.key === key);
        if (existingArchive) {
            if (!confirm('⚠️ Ce mois a déjà été archivé. Voulez-vous le mettre à jour?')) {
                return;
            }
            // Remove existing archive
            archivedMonths = archivedMonths.filter(a => a.key !== key);
        }
        
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const expense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const archive = {
            key: key,
            month: month,
            year: year,
            archivedDate: new Date().toISOString(),
            transactions: [...transactions],
            summary: {
                income: income,
                expense: expense,
                balance: income - expense,
                transactionCount: transactions.length
            }
        };
        
        archivedMonths.unshift(archive);
        localStorage.setItem(`archived_${currentProfile}`, JSON.stringify(archivedMonths));
        
        showNotification(`✅ Mois de ${month} ${year} sauvegardé avec succès!`, 'success');
    }
});

// Start new month
startNewMonthBtn.addEventListener('click', () => {
    if (transactions.length === 0) {
        showNotification('ℹ️ Aucune transaction à archiver. Vous pouvez commencer un nouveau mois directement.', 'info');
        return;
    }
    
    if (confirm('🆕 Démarrer un nouveau mois?\n\n⚠️ Cette action va:\n1. Sauvegarder le mois actuel dans les archives\n2. Effacer toutes les transactions actuelles\n3. Vous permettre de démarrer sur une base vierge\n\nContinuer?')) {
        // First archive the current month
        const { month, year, key } = getCurrentMonthYear();
        
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const expense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const archive = {
            key: key,
            month: month,
            year: year,
            archivedDate: new Date().toISOString(),
            transactions: [...transactions],
            summary: {
                income: income,
                expense: expense,
                balance: income - expense,
                transactionCount: transactions.length
            }
        };
        
        // Remove existing archive for this month if any
        archivedMonths = archivedMonths.filter(a => a.key !== key);
        archivedMonths.unshift(archive);
        localStorage.setItem(`archived_${currentProfile}`, JSON.stringify(archivedMonths));
        
        // Clear current transactions
        transactions = [];
        saveTransactions();
        updateUI();
        
        showNotification(`🎉 Nouveau mois démarré! Le mois de ${month} ${year} a été archivé.`, 'success');
    }
});

// View archives
viewArchivesBtn.addEventListener('click', () => {
    displayArchives();
    archivesModal.style.display = 'block';
});

// Close modal
closeModal.addEventListener('click', () => {
    archivesModal.style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === archivesModal) {
        archivesModal.style.display = 'none';
    }
});

// Display archives
function displayArchives() {
    const archivesList = document.getElementById('archivesList');
    
    if (archivedMonths.length === 0) {
        archivesList.innerHTML = `
            <div class="empty-state">
                <h3>📭 Aucune archive</h3>
                <p>Sauvegardez vos mois pour créer des archives</p>
            </div>
        `;
        return;
    }
    
    archivesList.innerHTML = archivedMonths.map(archive => {
        const transactionsHTML = archive.transactions
            .slice(0, 5)
            .map(t => `
                <div class="archive-transaction ${t.type}">
                    <span>${t.category} - ${t.description}</span>
                    <span>${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}</span>
                </div>
            `).join('');
        
        const moreCount = archive.transactions.length - 5;
        
        return `
            <div class="archive-item">
                <h3>📅 ${archive.month} ${archive.year}</h3>
                <p style="color: #7f8c8d; font-size: 0.9em; margin-bottom: 10px;">
                    Archivé le ${formatDate(archive.archivedDate.split('T')[0])}
                </p>
                <div class="archive-stats">
                    <div class="archive-stat income">
                        <div class="label">Revenus</div>
                        <div class="value">${formatCurrency(archive.summary.income)}</div>
                    </div>
                    <div class="archive-stat expense">
                        <div class="label">Dépenses</div>
                        <div class="value">${formatCurrency(archive.summary.expense)}</div>
                    </div>
                    <div class="archive-stat balance">
                        <div class="label">Solde</div>
                        <div class="value">${formatCurrency(archive.summary.balance)}</div>
                    </div>
                    <div class="archive-stat">
                        <div class="label">Transactions</div>
                        <div class="value">${archive.summary.transactionCount}</div>
                    </div>
                </div>
                <div class="archive-transactions">
                    <h4>🔍 Aperçu des transactions:</h4>
                    ${transactionsHTML}
                    ${moreCount > 0 ? `<p style="text-align: center; color: #7f8c8d; margin-top: 10px;">... et ${moreCount} autre${moreCount > 1 ? 's' : ''} transaction${moreCount > 1 ? 's' : ''}</p>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Initialiser
updateUI();
updateMonthInfo();
