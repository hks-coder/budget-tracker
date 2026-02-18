// PIN Codes for profiles
// NOTE: These PINs are stored client-side for convenience/privacy protection only.
// They are visible in the source code and should not be considered secure.
// For true security, a server-side authentication system would be required.
const PIN_CODES = {
    'hemank': '1994',
    'jullian': '1991'
};

// PIN Modal Elements
const pinModal = document.getElementById('pinModal');
const pinProfileSelect = document.getElementById('pinProfileSelect');
const pinInput = document.getElementById('pinInput');
const pinSubmit = document.getElementById('pinSubmit');
const pinError = document.getElementById('pinError');
const container = document.querySelector('.container');

// Check if user is authenticated for current session
let isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';
let authenticatedProfile = sessionStorage.getItem('authenticatedProfile');

// Profile Management
let currentProfile = localStorage.getItem('currentProfile') || 'hemank';
let profileLocked = localStorage.getItem('profileLocked') === 'true';

// Données
let transactions = JSON.parse(localStorage.getItem(`transactions_${currentProfile}`)) || [];
let archivedMonths = JSON.parse(localStorage.getItem(`archived_${currentProfile}`)) || [];
let customFields = JSON.parse(localStorage.getItem(`customFields_${currentProfile}`)) || [];
let customFieldsData = JSON.parse(localStorage.getItem(`customFieldsData_${currentProfile}`)) || {};

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
const expenseCategory = document.getElementById('expenseCategory');
const customCategoryGroup = document.getElementById('customCategoryGroup');
const customCategory = document.getElementById('customCategory');

// Initialiser la date d'aujourd'hui
document.getElementById('incomeDate').valueAsDate = new Date();
document.getElementById('expenseDate').valueAsDate = new Date();

// Handle custom category selection
expenseCategory.addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
        customCategoryGroup.style.display = 'block';
        customCategory.required = true;
    } else {
        customCategoryGroup.style.display = 'none';
        customCategory.required = false;
        customCategory.value = '';
    }
});

// Show PIN modal on page load if not authenticated
if (!isAuthenticated || authenticatedProfile !== currentProfile) {
    showPinModal();
} else {
    hidePinModal();
}

// PIN Modal Functions
function showPinModal(targetProfile = null) {
    pinModal.style.display = 'flex';
    container.classList.add('locked');
    pinProfileSelect.value = targetProfile || currentProfile;
    pinInput.value = '';
    pinError.style.display = 'none';
    pinInput.focus();
}

function hidePinModal() {
    pinModal.style.display = 'none';
    container.classList.remove('locked');
}

function validatePin() {
    const selectedProfile = pinProfileSelect.value;
    const enteredPin = pinInput.value;
    
    if (enteredPin === PIN_CODES[selectedProfile]) {
        // PIN is correct
        isAuthenticated = true;
        authenticatedProfile = selectedProfile;
        sessionStorage.setItem('isAuthenticated', 'true');
        sessionStorage.setItem('authenticatedProfile', selectedProfile);
        
        // Switch to the authenticated profile if different
        if (currentProfile !== selectedProfile) {
            switchProfile(selectedProfile);
        } else {
            // Just update the UI if staying on same profile
            initializeProfile();
        }
        
        hidePinModal();
        showNotification(`✅ Accès autorisé au profil ${selectedProfile === 'hemank' ? 'Hemank' : 'Jullian'}`, 'success');
    } else {
        // PIN is incorrect
        pinError.textContent = '❌ Code incorrect. Veuillez réessayer.';
        pinError.style.display = 'block';
        pinInput.value = '';
        pinInput.focus();
        
        // Shake animation
        pinInput.style.animation = 'shake 0.5s';
        setTimeout(() => {
            pinInput.style.animation = '';
        }, 500);
    }
}

// PIN Submit Event
pinSubmit.addEventListener('click', validatePin);

// Allow Enter key to submit PIN
pinInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        validatePin();
    }
});

// Update profile select in PIN modal
pinProfileSelect.addEventListener('change', () => {
    pinError.style.display = 'none';
    pinInput.value = '';
    pinInput.focus();
});

// Initialize profile
initializeProfile();

// Profile change handler
profileSelect.addEventListener('change', (e) => {
    const newProfile = e.target.value;
    
    // If trying to switch to a different profile, require PIN authentication
    if (newProfile !== currentProfile) {
        // Reset to current profile first
        profileSelect.value = currentProfile;
        
        // Show PIN modal for authentication with the new profile
        showPinModal(newProfile);
        showNotification('🔐 Code requis pour changer de profil', 'info');
    }
});

// Initialize profile on load
function initializeProfile() {
    profileSelect.value = currentProfile;
    
    // Enable profile selector if authenticated
    if (isAuthenticated && authenticatedProfile === currentProfile) {
        profileSelect.disabled = false;
        profileLockIndicator.style.display = 'none';
    } else {
        // Lock profile until authenticated
        profileLockIndicator.style.display = 'inline-block';
        profileSelect.disabled = true;
    }
    
    updateHeaderProfileInfo();
}

// Switch profile
function switchProfile(newProfile) {
    // Save current transactions before switching
    saveTransactions();
    
    // Update current profile
    currentProfile = newProfile;
    localStorage.setItem('currentProfile', newProfile);
    
    // Update authentication
    authenticatedProfile = newProfile;
    sessionStorage.setItem('authenticatedProfile', newProfile);
    
    // Update profile selector
    profileSelect.value = newProfile;
    profileSelect.disabled = false;
    profileLockIndicator.style.display = 'none';
    
    showNotification(`✅ Profil ${newProfile === 'hemank' ? 'Hemank' : 'Jullian'} sélectionné`, 'success');
    
    // Load new profile's transactions and archives
    transactions = JSON.parse(localStorage.getItem(`transactions_${currentProfile}`)) || [];
    archivedMonths = JSON.parse(localStorage.getItem(`archived_${currentProfile}`)) || [];
    customFields = JSON.parse(localStorage.getItem(`customFields_${currentProfile}`)) || [];
    customFieldsData = JSON.parse(localStorage.getItem(`customFieldsData_${currentProfile}`)) || {};
    
    // Update UI
    updateUI();
    updateHeaderProfileInfo();
    updateCustomFieldsDisplay();
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
    
    let categoryValue = expenseCategory.value;
    
    // If custom category is selected, use the custom input value
    if (categoryValue === 'custom') {
        categoryValue = customCategory.value.trim();
        if (!categoryValue) {
            showNotification('⚠️ Veuillez entrer un nom de catégorie', 'warning');
            return;
        }
    }
    
    const transaction = {
        id: Date.now(),
        type: 'expense',
        amount: parseFloat(document.getElementById('expenseAmount').value),
        category: categoryValue,
        description: document.getElementById('expenseDescription').value,
        date: document.getElementById('expenseDate').value
    };
    
    transactions.push(transaction);
    saveTransactions();
    expenseForm.reset();
    document.getElementById('expenseDate').valueAsDate = new Date();
    customCategoryGroup.style.display = 'none';
    customCategory.required = false;
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
    updateCustomFieldsDisplay();
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
            <h2>📊 Dépenses par Catégorie</h2>
            <div style="text-align: center; padding: 40px; color: #7f8c8d;">
                <p style="font-size: 1.2em;">Aucune dépense pour le moment</p>
            </div>
        `;
        return;
    }
    
    // Couleurs pour le graphique en camembert
    const colors = [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF',
        '#FF9F40',
        '#E74C3C',
        '#3498DB',
        '#2ECC71',
        '#F39C12',
        '#8E44AD',
        '#1ABC9C'
    ];
    
    // Créer le graphique en camembert (pie chart) avec CSS
    let chartHTML = '<h2>📊 Dépenses par Catégorie</h2>';
    chartHTML += '<div style="display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 40px; padding: 20px;">';
    
    // Créer le cercle du graphique
    chartHTML += '<div style="position: relative; width: 300px; height: 300px;">';
    
    // Créer les segments du pie chart avec du CSS
    let currentAngle = 0;
    const pieSegments = categories.map((category, index) => {
        const amount = expensesByCategory[category];
        const percentage = (amount / totalExpenses) * 100;
        const angle = (percentage / 100) * 360;
        const color = colors[index % colors.length];
        
        // Calculer les coordonnées pour créer un segment
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        currentAngle = endAngle;
        
        return {
            category,
            amount,
            percentage: percentage.toFixed(1),
            color,
            startAngle,
            endAngle
        };
    });
    
    // Créer le graphique en utilisant des divs avec border-radius et clip-path
    pieSegments.forEach((segment, index) => {
        const rotation = segment.startAngle;
        const segmentAngle = segment.endAngle - segment.startAngle;
        
        // Pour des angles <= 180 degrés
        if (segmentAngle <= 180) {
            chartHTML += `
                <div style="
                    position: absolute;
                    width: 150px;
                    height: 150px;
                    top: 0;
                    left: 150px;
                    transform-origin: 0% 100%;
                    transform: rotate(${rotation}deg) skewY(${90 - segmentAngle}deg);
                    background: ${segment.color};
                    border-radius: 0 100% 0 0;
                "></div>
            `;
        } else {
            // Pour des angles > 180 degrés, diviser en deux segments
            chartHTML += `
                <div style="
                    position: absolute;
                    width: 150px;
                    height: 150px;
                    top: 0;
                    left: 150px;
                    transform-origin: 0% 100%;
                    transform: rotate(${rotation}deg);
                    background: ${segment.color};
                    border-radius: 0 100% 0 0;
                "></div>
                <div style="
                    position: absolute;
                    width: 150px;
                    height: 150px;
                    top: 0;
                    left: 150px;
                    transform-origin: 0% 100%;
                    transform: rotate(${rotation + 180}deg) skewY(${270 - segmentAngle}deg);
                    background: ${segment.color};
                    border-radius: 0 100% 0 0;
                "></div>
            `;
        }
    });
    
    // Ajouter un cercle blanc au centre pour faire un donut chart
    chartHTML += `
        <div style="
            position: absolute;
            width: 120px;
            height: 120px;
            top: 90px;
            left: 90px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        ">
            <div style="font-size: 0.9em; color: #7f8c8d; margin-bottom: 5px;">Total</div>
            <div style="font-size: 1.3em; font-weight: bold; color: #2c3e50;">${formatCurrency(totalExpenses)}</div>
        </div>
    `;
    
    chartHTML += '</div>';
    
    // Ajouter la légende
    chartHTML += '<div style="flex: 1; min-width: 200px;">';
    pieSegments.forEach(segment => {
        chartHTML += `
            <div style="display: flex; align-items: center; margin-bottom: 12px; padding: 8px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div style="width: 20px; height: 20px; background: ${segment.color}; border-radius: 4px; margin-right: 12px; flex-shrink: 0;"></div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: #2c3e50; margin-bottom: 2px;">${segment.category}</div>
                    <div style="font-size: 0.9em; color: #7f8c8d;">${formatCurrency(segment.amount)} (${segment.percentage}%)</div>
                </div>
            </div>
        `;
    });
    chartHTML += '</div>';
    
    chartHTML += '</div>';
    
    // Add button to view details
    chartHTML += `
        <div style="text-align: center; margin-top: 20px;">
            <button class="btn btn-chart-details" onclick="showChartDetails()" style="padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-size: 1em; cursor: pointer; transition: all 0.3s ease;">
                🔍 Voir les Détails Complets
            </button>
        </div>
    `;
    
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

// Custom Fields Elements
const customizeFieldsBtn = document.getElementById('customizeFields');
const customFieldsModal = document.getElementById('customFieldsModal');
const closeCustomFieldsModal = document.getElementById('closeCustomFieldsModal');
const addCustomFieldBtn = document.getElementById('addCustomField');
const customFieldsDisplay = document.getElementById('customFieldsDisplay');

// Chart Details Elements
const chartDetailsModal = document.getElementById('chartDetailsModal');
const closeChartDetailsModal = document.getElementById('closeChartDetailsModal');

// Constants
const MAX_PREVIEW_TRANSACTIONS = 5;

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
    if (event.target === customFieldsModal) {
        customFieldsModal.style.display = 'none';
    }
    if (event.target === chartDetailsModal) {
        chartDetailsModal.style.display = 'none';
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
            .slice(0, MAX_PREVIEW_TRANSACTIONS)
            .map(t => `
                <div class="archive-transaction ${t.type}">
                    <span>${t.category} - ${t.description}</span>
                    <span>${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}</span>
                </div>
            `).join('');
        
        const moreCount = archive.transactions.length - MAX_PREVIEW_TRANSACTIONS;
        
        return `
            <div class="archive-item">
                <h3>📅 ${archive.month} ${archive.year}</h3>
                <p style="color: #7f8c8d; font-size: 0.9em; margin-bottom: 10px;">
                    Archivé le ${new Date(archive.archivedDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
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

// ============================================
// CUSTOM FIELDS FUNCTIONALITY
// ============================================

// Open custom fields modal
customizeFieldsBtn.addEventListener('click', () => {
    displayCustomFieldsModal();
    customFieldsModal.style.display = 'block';
});

// Close custom fields modal
closeCustomFieldsModal.addEventListener('click', () => {
    customFieldsModal.style.display = 'none';
});

// Add custom field
addCustomFieldBtn.addEventListener('click', () => {
    const name = document.getElementById('newFieldName').value.trim();
    const type = document.getElementById('newFieldType').value;
    
    if (!name) {
        showNotification('⚠️ Veuillez entrer un nom de champ', 'warning');
        return;
    }
    
    const field = {
        id: Date.now(),
        name: name,
        type: type
    };
    
    customFields.push(field);
    localStorage.setItem(`customFields_${currentProfile}`, JSON.stringify(customFields));
    
    // Initialize data for this field if it doesn't exist
    if (!customFieldsData[field.id]) {
        customFieldsData[field.id] = '';
        localStorage.setItem(`customFieldsData_${currentProfile}`, JSON.stringify(customFieldsData));
    }
    
    document.getElementById('newFieldName').value = '';
    document.getElementById('newFieldType').value = 'text';
    
    displayCustomFieldsModal();
    updateCustomFieldsDisplay();
    showNotification('✅ Champ personnalisé ajouté', 'success');
});

// Display custom fields in modal
function displayCustomFieldsModal() {
    const customFieldsList = document.getElementById('customFieldsList');
    
    if (customFields.length === 0) {
        customFieldsList.innerHTML = `
            <div class="empty-state" style="padding: 20px;">
                <p>Aucun champ personnalisé. Ajoutez-en un ci-dessous !</p>
            </div>
        `;
        return;
    }
    
    customFieldsList.innerHTML = `
        <div class="existing-fields">
            <h3>📋 Champs personnalisés existants</h3>
            ${customFields.map(field => `
                <div class="custom-field-item">
                    <div>
                        <strong>${field.name}</strong>
                        <span style="color: #7f8c8d; font-size: 0.9em; margin-left: 10px;">
                            (${field.type === 'currency' ? 'Montant' : field.type === 'number' ? 'Nombre' : field.type === 'textarea' ? 'Texte long' : 'Texte'})
                        </span>
                    </div>
                    <button class="btn-delete-field" onclick="deleteCustomField(${field.id})">🗑️</button>
                </div>
            `).join('')}
        </div>
    `;
}

// Delete custom field
function deleteCustomField(fieldId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce champ personnalisé ?')) {
        customFields = customFields.filter(f => f.id !== fieldId);
        delete customFieldsData[fieldId];
        
        localStorage.setItem(`customFields_${currentProfile}`, JSON.stringify(customFields));
        localStorage.setItem(`customFieldsData_${currentProfile}`, JSON.stringify(customFieldsData));
        
        displayCustomFieldsModal();
        updateCustomFieldsDisplay();
        showNotification('Champ personnalisé supprimé', 'info');
    }
}

// Update custom fields display in main page
function updateCustomFieldsDisplay() {
    if (customFields.length === 0) {
        customFieldsDisplay.innerHTML = '';
        return;
    }
    
    let html = '<div class="custom-fields-container"><h3>📝 Informations Personnalisées</h3>';
    
    customFields.forEach(field => {
        const value = customFieldsData[field.id] || '';
        html += `
            <div class="custom-field-input-group">
                <label>${field.name}</label>
                ${field.type === 'textarea' 
                    ? `<textarea id="customField_${field.id}" onchange="saveCustomFieldData(${field.id}, this.value)">${value}</textarea>`
                    : `<input type="${field.type === 'currency' || field.type === 'number' ? 'number' : 'text'}" 
                             id="customField_${field.id}" 
                             value="${value}"
                             ${field.type === 'currency' ? 'step="0.01"' : ''}
                             onchange="saveCustomFieldData(${field.id}, this.value)"
                             placeholder="${field.type === 'currency' ? '0.00 €' : ''}">`
                }
            </div>
        `;
    });
    
    html += '</div>';
    customFieldsDisplay.innerHTML = html;
}

// Save custom field data
function saveCustomFieldData(fieldId, value) {
    customFieldsData[fieldId] = value;
    localStorage.setItem(`customFieldsData_${currentProfile}`, JSON.stringify(customFieldsData));
    showNotification('💾 Données sauvegardées', 'success');
}

// ============================================
// CHART DETAILS FUNCTIONALITY
// ============================================

// Show chart details modal
function showChartDetails() {
    const expensesByCategory = {};
    const transactionsByCategory = {};
    
    transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            if (expensesByCategory[t.category]) {
                expensesByCategory[t.category] += t.amount;
                transactionsByCategory[t.category].push(t);
            } else {
                expensesByCategory[t.category] = t.amount;
                transactionsByCategory[t.category] = [t];
            }
        });
    
    const categories = Object.keys(expensesByCategory).sort((a, b) => expensesByCategory[b] - expensesByCategory[a]);
    const totalExpenses = Object.values(expensesByCategory).reduce((a, b) => a + b, 0);
    const expenseTransactionCount = transactions.filter(t => t.type === 'expense').length;
    
    if (categories.length === 0) {
        showNotification('ℹ️ Aucune dépense à analyser', 'info');
        return;
    }
    
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
        '#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#8E44AD', '#1ABC9C'
    ];
    
    const avgExpensePerTransaction = expenseTransactionCount > 0 ? totalExpenses / expenseTransactionCount : 0;
    
    let detailsHTML = `
        <div class="chart-details-summary">
            <div class="detail-stat-card">
                <div class="detail-stat-label">Total des Dépenses</div>
                <div class="detail-stat-value">${formatCurrency(totalExpenses)}</div>
            </div>
            <div class="detail-stat-card">
                <div class="detail-stat-label">Nombre de Catégories</div>
                <div class="detail-stat-value">${categories.length}</div>
            </div>
            <div class="detail-stat-card">
                <div class="detail-stat-label">Dépense Moyenne</div>
                <div class="detail-stat-value">${formatCurrency(avgExpensePerTransaction)}</div>
            </div>
        </div>
        
        <h3 style="margin: 30px 0 20px 0; color: #2c3e50;">📊 Répartition par Catégorie</h3>
    `;
    
    categories.forEach((category, index) => {
        const amount = expensesByCategory[category];
        const percentage = ((amount / totalExpenses) * 100).toFixed(1);
        const categoryTransactions = transactionsByCategory[category];
        const color = colors[index % colors.length];
        const avgAmount = amount / categoryTransactions.length;
        
        detailsHTML += `
            <div class="category-detail-card" style="border-left: 5px solid ${color};">
                <div class="category-detail-header">
                    <div>
                        <h4 style="color: #2c3e50; margin-bottom: 5px;">${category}</h4>
                        <div style="display: flex; gap: 20px; margin-top: 10px;">
                            <div>
                                <span style="color: #7f8c8d; font-size: 0.9em;">Total:</span>
                                <strong style="color: ${color}; font-size: 1.2em; margin-left: 5px;">${formatCurrency(amount)}</strong>
                            </div>
                            <div>
                                <span style="color: #7f8c8d; font-size: 0.9em;">% du total:</span>
                                <strong style="margin-left: 5px;">${percentage}%</strong>
                            </div>
                            <div>
                                <span style="color: #7f8c8d; font-size: 0.9em;">Transactions:</span>
                                <strong style="margin-left: 5px;">${categoryTransactions.length}</strong>
                            </div>
                            <div>
                                <span style="color: #7f8c8d; font-size: 0.9em;">Moyenne:</span>
                                <strong style="margin-left: 5px;">${formatCurrency(avgAmount)}</strong>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="category-transactions-list">
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${percentage}%; background: ${color};"></div>
                    </div>
                    <details>
                        <summary style="cursor: pointer; padding: 10px; background: #f8f9fa; border-radius: 6px; margin-top: 10px;">
                            🔍 Voir les ${categoryTransactions.length} transaction${categoryTransactions.length > 1 ? 's' : ''}
                        </summary>
                        <div style="margin-top: 10px;">
                            ${categoryTransactions.sort((a, b) => new Date(b.date) - new Date(a.date)).map(t => `
                                <div class="detail-transaction-item">
                                    <div>
                                        <div style="font-weight: 600; color: #2c3e50;">${t.description}</div>
                                        <div style="font-size: 0.85em; color: #7f8c8d;">${formatDate(t.date)}</div>
                                    </div>
                                    <div style="font-weight: bold; color: ${color};">${formatCurrency(t.amount)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </details>
                </div>
            </div>
        `;
    });
    
    // Add insights section
    const topCategory = categories[0];
    const topAmount = expensesByCategory[topCategory];
    const topPercentage = ((topAmount / totalExpenses) * 100).toFixed(1);
    
    detailsHTML += `
        <div class="insights-section">
            <h3 style="color: #2c3e50; margin-bottom: 15px;">💡 Insights & Recommandations</h3>
            <div class="insight-card">
                <div class="insight-icon">📌</div>
                <div>
                    <strong>Catégorie principale:</strong> ${topCategory} représente ${topPercentage}% de vos dépenses totales (${formatCurrency(topAmount)})
                </div>
            </div>
            ${topPercentage > 40 ? `
                <div class="insight-card warning">
                    <div class="insight-icon">⚠️</div>
                    <div>
                        <strong>Attention:</strong> Une seule catégorie représente plus de 40% de vos dépenses. Envisagez de diversifier ou de réduire ces dépenses.
                    </div>
                </div>
            ` : ''}
            <div class="insight-card">
                <div class="insight-icon">📈</div>
                <div>
                    <strong>Dépense moyenne par transaction:</strong> ${formatCurrency(avgExpensePerTransaction)}
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('chartDetailsContent').innerHTML = detailsHTML;
    chartDetailsModal.style.display = 'block';
}

// Close chart details modal
closeChartDetailsModal.addEventListener('click', () => {
    chartDetailsModal.style.display = 'none';
});
