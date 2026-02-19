// PIN Codes for profiles
// NOTE: These PINs are stored client-side for convenience/privacy protection only.
// They are visible in the source code and should not be considered secure.
// For true security, a server-side authentication system would be required.
const PIN_CODES = {
    'hemank': '1994',
    'jullian': '1991'
};

// Constants
const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                     'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const BAR_CHART_HEIGHT_PERCENTAGE = 85; // Reserve 15% for category labels below bars

// Performance Utilities
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.innerHTML = '<span class="btn-spinner">⏳</span> Traitement...';
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || button.textContent;
    }
}

// Firebase initialization
let useFirebase = false;
let db = null;

function initializeFirebase() {
    try {
        if (typeof firebase !== 'undefined' && typeof firebaseConfig !== 'undefined' && firebaseConfig.apiKey !== 'VOTRE_API_KEY') {
            firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            useFirebase = true;
            console.log('✅ Firebase initialisé avec succès');
            updateSyncStatus('synced');
        } else {
            console.warn('⚠️ Firebase non configuré, utilisation de localStorage');
            updateSyncStatus('local');
        }
    } catch (error) {
        console.error('❌ Erreur Firebase:', error);
        useFirebase = false;
        updateSyncStatus('local');
    }
}

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

// Safe localStorage data loading with error handling
function safeLoadFromStorage(key, defaultValue = []) {
    try {
        const data = localStorage.getItem(key);
        if (!data) return defaultValue;
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error loading data from localStorage key "${key}":`, error);
        showNotification(`⚠️ Erreur lors du chargement des données. Utilisation des valeurs par défaut.`, 'warning');
        return defaultValue;
    }
}

// Données
let transactions = safeLoadFromStorage(`transactions_${currentProfile}`, []);
let archivedMonths = safeLoadFromStorage(`archived_${currentProfile}`, []);
let categoryBudgets = safeLoadFromStorage(`categoryBudgets_${currentProfile}`, {});

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
async function switchProfile(newProfile) {
    // Save current transactions before switching
    await saveTransactions();
    
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
    
    // Load new profile's data from Firebase or localStorage (in parallel for better performance)
    await Promise.all([
        loadTransactions(),
        loadArchives(),
        loadCustomFields(),
        loadCategoryBudgets()
    ]);
    
    // Run migration after data is loaded
    await migrateAssuranceVieCategory();
    
    // Update UI
    updateUI();
    updateHeaderProfileInfo();
    displayCustomFieldsValues();
}

// Update header to show current profile info
function updateHeaderProfileInfo() {
    const profileName = currentProfile === 'hemank' ? 'Hemank (Individuel)' : 'Jullian (Partagé)';
    document.querySelector('header p').textContent = `Gérez vos finances personnelles facilement - ${profileName}`;
}

// Ajouter un revenu
incomeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const amount = parseFloat(document.getElementById('incomeAmount').value);
    const category = document.getElementById('incomeCategory').value;
    const description = document.getElementById('incomeDescription').value.trim();
    const date = document.getElementById('incomeDate').value;
    
    // Input validation
    if (isNaN(amount) || amount <= 0) {
        showNotification('⚠️ Veuillez entrer un montant valide (supérieur à 0)', 'warning');
        return;
    }
    
    if (amount > 999999999) {
        showNotification('⚠️ Le montant est trop élevé', 'warning');
        return;
    }
    
    if (!category) {
        showNotification('⚠️ Veuillez sélectionner une catégorie', 'warning');
        return;
    }
    
    if (!description) {
        showNotification('⚠️ Veuillez entrer une description', 'warning');
        return;
    }
    
    if (description.length > 200) {
        showNotification('⚠️ La description est trop longue (maximum 200 caractères)', 'warning');
        return;
    }
    
    if (!date) {
        showNotification('⚠️ Veuillez sélectionner une date', 'warning');
        return;
    }
    
    // All validation passed, show loading state
    const submitBtn = incomeForm.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);
    
    try {
        const transaction = {
            id: Date.now(),
            type: 'income',
            amount: amount,
            category: category,
            description: description,
            date: date
        };
        
        transactions.push(transaction);
        await saveTransactions();
        incomeForm.reset();
        document.getElementById('incomeDate').valueAsDate = new Date();
        updateUI();
        showNotification('✅ Revenu ajouté avec succès !', 'success');
    } finally {
        setButtonLoading(submitBtn, false);
    }
});

// Ajouter une dépense
expenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    let categoryValue = expenseCategory.value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const description = document.getElementById('expenseDescription').value.trim();
    const date = document.getElementById('expenseDate').value;
    
    // Input validation
    if (isNaN(amount) || amount <= 0) {
        showNotification('⚠️ Veuillez entrer un montant valide (supérieur à 0)', 'warning');
        return;
    }
    
    if (amount > 999999999) {
        showNotification('⚠️ Le montant est trop élevé', 'warning');
        return;
    }
    
    // If custom category is selected, use the custom input value
    if (categoryValue === 'custom') {
        categoryValue = customCategory.value.trim();
        if (!categoryValue) {
            showNotification('⚠️ Veuillez entrer un nom de catégorie', 'warning');
            return;
        }
        if (categoryValue.length > 50) {
            showNotification('⚠️ Le nom de catégorie est trop long (maximum 50 caractères)', 'warning');
            return;
        }
    }
    
    if (!categoryValue) {
        showNotification('⚠️ Veuillez sélectionner une catégorie', 'warning');
        return;
    }
    
    if (!description) {
        showNotification('⚠️ Veuillez entrer une description', 'warning');
        return;
    }
    
    if (description.length > 200) {
        showNotification('⚠️ La description est trop longue (maximum 200 caractères)', 'warning');
        return;
    }
    
    if (!date) {
        showNotification('⚠️ Veuillez sélectionner une date', 'warning');
        return;
    }
    
    // All validation passed, show loading state
    const submitBtn = expenseForm.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);
    
    try {
        const transaction = {
            id: Date.now(),
            type: 'expense',
            amount: amount,
            category: categoryValue,
            description: description,
            date: date
        };
        
        transactions.push(transaction);
        await saveTransactions();
        expenseForm.reset();
        document.getElementById('expenseDate').valueAsDate = new Date();
        customCategoryGroup.style.display = 'none';
        customCategory.required = false;
        updateUI();
        showNotification('✅ Dépense ajoutée avec succès !', 'success');
    } finally {
        setButtonLoading(submitBtn, false);
    }
});

// Sauvegarder dans localStorage et Firestore (hybride)
async function saveTransactions() {
    // Sauvegarder en localStorage (backup)
    localStorage.setItem(`transactions_${currentProfile}`, JSON.stringify(transactions));
    
    // Sauvegarder dans Firestore si disponible
    if (useFirebase && db) {
        try {
            updateSyncStatus('syncing');
            const batch = db.batch();
            
            // Supprimer les anciennes transactions et les remplacer par les nouvelles
            // Note: Cette approche simple garantit la synchronisation complète mais pourrait être optimisée
            // en ne mettant à jour que les documents modifiés dans une future version
            const oldTransactions = await db.collection('profiles')
                .doc(currentProfile)
                .collection('transactions')
                .get();
            
            oldTransactions.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            // Ajouter les nouvelles transactions
            // Utilisation de transaction.id comme document ID pour faciliter les mises à jour futures
            transactions.forEach(transaction => {
                const docRef = db.collection('profiles')
                    .doc(currentProfile)
                    .collection('transactions')
                    .doc(transaction.id.toString());
                batch.set(docRef, transaction);
            });
            
            await batch.commit();
            console.log('✅ Transactions synchronisées avec Firebase');
            updateSyncStatus('synced');
        } catch (error) {
            console.error('❌ Erreur de synchronisation Firebase:', error);
            showNotification('⚠️ Erreur de synchronisation cloud', 'warning');
            updateSyncStatus('local');
        }
    }
}

// Charger les transactions depuis Firestore ou localStorage (hybride)
async function loadTransactions() {
    if (useFirebase && db) {
        try {
            updateSyncStatus('syncing');
            const snapshot = await db.collection('profiles')
                .doc(currentProfile)
                .collection('transactions')
                .get();
            
            if (!snapshot.empty) {
                transactions = snapshot.docs.map(doc => doc.data());
                // Sauvegarder en localStorage comme backup
                localStorage.setItem(`transactions_${currentProfile}`, JSON.stringify(transactions));
                console.log('✅ Transactions chargées depuis Firebase');
                updateSyncStatus('synced');
                return transactions;
            }
        } catch (error) {
            console.error('❌ Erreur de chargement Firebase:', error);
            updateSyncStatus('local');
        }
    }
    
    // Fallback vers localStorage
    transactions = safeLoadFromStorage(`transactions_${currentProfile}`, []);
    return transactions;
}

// Sauvegarder les budgets de catégories
async function saveCategoryBudgets() {
    // Sauvegarder en localStorage
    localStorage.setItem(`categoryBudgets_${currentProfile}`, JSON.stringify(categoryBudgets));
    
    // Sauvegarder dans Firestore si disponible
    if (useFirebase && db) {
        try {
            await db.collection('profiles')
                .doc(currentProfile)
                .collection('settings')
                .doc('categoryBudgets')
                .set({ budgets: categoryBudgets });
            console.log('✅ Budgets de catégories synchronisés avec Firebase');
        } catch (error) {
            console.error('❌ Erreur de synchronisation des budgets:', error);
        }
    }
}

// Charger les budgets de catégories
async function loadCategoryBudgets() {
    if (useFirebase && db) {
        try {
            const doc = await db.collection('profiles')
                .doc(currentProfile)
                .collection('settings')
                .doc('categoryBudgets')
                .get();
            
            if (doc.exists) {
                categoryBudgets = doc.data().budgets || {};
                localStorage.setItem(`categoryBudgets_${currentProfile}`, JSON.stringify(categoryBudgets));
                console.log('✅ Budgets de catégories chargés depuis Firebase');
                return categoryBudgets;
            }
        } catch (error) {
            console.error('❌ Erreur de chargement des budgets:', error);
        }
    }
    
    // Fallback vers localStorage
    categoryBudgets = safeLoadFromStorage(`categoryBudgets_${currentProfile}`, {});
    return categoryBudgets;
}

// Mettre à jour l'interface
function updateUI() {
    updateSummary();
    displayTransactions();
    updateCategoryFilter();
    updateExpenseChart();
    updateMonthInfo();
    updateBudgetSummaryDisplay();
    // updateCustomFieldsDisplay(); // Function not implemented yet
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
    
    // Clear existing transactions
    transactionsList.innerHTML = '';
    
    // Create transaction elements using DOM manipulation to prevent XSS
    filtered.forEach(transaction => {
        const transactionDiv = document.createElement('div');
        transactionDiv.className = `transaction-item ${transaction.type}`;
        
        // Transaction info
        const infoDiv = document.createElement('div');
        infoDiv.className = 'transaction-info';
        
        const categoryH4 = document.createElement('h4');
        categoryH4.textContent = transaction.category;
        infoDiv.appendChild(categoryH4);
        
        const descriptionP = document.createElement('p');
        descriptionP.textContent = transaction.description;
        infoDiv.appendChild(descriptionP);
        
        const dateP = document.createElement('p');
        dateP.style.fontSize = '0.85em';
        dateP.style.color = '#999';
        dateP.textContent = formatDate(transaction.date);
        infoDiv.appendChild(dateP);
        
        // Transaction amount
        const amountDiv = document.createElement('div');
        amountDiv.className = 'transaction-amount';
        amountDiv.textContent = `${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}`;
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '🗑️';
        deleteBtn.addEventListener('click', () => deleteTransaction(transaction.id));
        
        // Assemble transaction item
        transactionDiv.appendChild(infoDiv);
        transactionDiv.appendChild(amountDiv);
        transactionDiv.appendChild(deleteBtn);
        
        transactionsList.appendChild(transactionDiv);
    });
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
    
    // Clear and rebuild options using DOM manipulation
    filterCategory.innerHTML = '';
    
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'Toutes les catégories';
    filterCategory.appendChild(allOption);
    
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        filterCategory.appendChild(option);
    });
}

// Filtres - with debouncing for better performance
const debouncedDisplayTransactions = debounce(displayTransactions, 300);
filterType.addEventListener('change', debouncedDisplayTransactions);
filterCategory.addEventListener('change', debouncedDisplayTransactions);

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
    
    // Créer le graphique des dépenses par catégorie
    let chartHTML = '<h2>📊 Dépenses par Catégorie</h2>';
    
    // Préparer les segments pour le graphique
    const pieSegments = categories.map((category, index) => {
        const amount = expensesByCategory[category];
        const percentage = (amount / totalExpenses) * 100;
        const color = colors[index % colors.length];
        
        return {
            category,
            amount,
            percentage: percentage.toFixed(1),
            color
        };
    });
    
    // Add vertical bar chart
    chartHTML += '<h2 style="text-align: center; color: #2c3e50; margin-bottom: 30px; margin-top: 20px;">📊 Graphique Vertical des Dépenses</h2>';
    
    // Find the maximum amount for scaling
    const maxAmount = Math.max(...Object.values(expensesByCategory));
    
    // Constants for bar chart styling
    const MIN_BAR_HEIGHT = 60; // Minimum height in pixels to ensure labels are readable
    
    // Create vertical bar chart with mobile-friendly container
    chartHTML += '<div class="bar-chart-container">';
    
    // Note: segment.color comes from a predefined colors array (lines 421-434), ensuring safety
    pieSegments.forEach((segment, index) => {
        const barHeight = (segment.amount / maxAmount) * 100;
        const hasBudget = categoryBudgets[segment.category];
        const budget = hasBudget ? categoryBudgets[segment.category] : 0;
        const budgetHeight = hasBudget ? (budget / maxAmount) * 100 : 0;
        const isOverBudget = hasBudget && segment.amount > budget;
        
        chartHTML += `
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; min-width: 80px; max-width: 120px;">
                <div style="width: 100%; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: ${BAR_CHART_HEIGHT_PERCENTAGE}%;">
                    ${hasBudget ? `
                        <div style="
                            position: absolute;
                            bottom: ${budgetHeight}%;
                            width: 110%;
                            height: 2px;
                            background: ${isOverBudget ? '#e74c3c' : '#27ae60'};
                            border-top: 2px dashed ${isOverBudget ? '#e74c3c' : '#27ae60'};
                            z-index: 10;
                        "></div>
                        <div style="
                            position: absolute;
                            bottom: calc(${budgetHeight}% + 5px);
                            font-size: 0.7em;
                            color: ${isOverBudget ? '#e74c3c' : '#27ae60'};
                            font-weight: bold;
                            white-space: nowrap;
                        ">Budget: ${formatCurrency(budget)}</div>
                    ` : ''}
                    <div class="vertical-bar" style="
                        position: absolute;
                        bottom: 0;
                        width: 100%;
                        text-align: center;
                        font-weight: bold;
                        color: white;
                        padding: 10px 5px;
                        font-size: 0.9em;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: flex-end;
                        background: linear-gradient(to top, ${isOverBudget ? '#e74c3c' : segment.color}, ${isOverBudget ? '#c0392b' : segment.color}dd);
                        border-radius: 8px 8px 0 0;
                        transition: all 0.3s ease;
                        cursor: pointer;
                        height: ${barHeight}%;
                        min-height: ${MIN_BAR_HEIGHT}px;
                        ${isOverBudget ? 'box-shadow: 0 0 10px rgba(231, 76, 60, 0.5);' : ''}
                    ">
                        <div style="margin-top: auto; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">${formatCurrency(segment.amount)}</div>
                        <div style="font-size: 0.8em; margin-top: 5px; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">${segment.percentage}%</div>
                    </div>
                </div>
                <div style="margin-top: 10px; font-weight: 600; color: ${isOverBudget ? '#e74c3c' : '#2c3e50'}; text-align: center; font-size: 0.85em; word-wrap: break-word; width: 100%;">
                    ${segment.category}
                    ${isOverBudget ? '<br/><span style="font-size: 0.8em; color: #e74c3c;">⚠️ Budget dépassé</span>' : ''}
                </div>
            </div>
        `;
    });
    
    chartHTML += '</div>';
    
    // Add scroll hint for mobile if there are many categories
    if (categories.length > 4) {
        chartHTML += '<p style="text-align: center; color: #7f8c8d; font-size: 0.9em; margin-top: 10px;">💡 Faites défiler horizontalement pour voir toutes les catégories</p>';
    }
    
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

// Mettre à jour l'indicateur de statut de synchronisation
function updateSyncStatus(status) {
    const syncIndicator = document.getElementById('syncIndicator');
    if (syncIndicator) {
        if (status === 'synced') {
            syncIndicator.innerHTML = '☁️ Synchronisé';
            syncIndicator.style.color = '#27ae60';
            syncIndicator.style.background = 'rgba(39, 174, 96, 0.1)';
        } else if (status === 'syncing') {
            syncIndicator.innerHTML = '🔄 Synchronisation...';
            syncIndicator.style.color = '#f39c12';
            syncIndicator.style.background = 'rgba(243, 156, 18, 0.1)';
        } else {
            syncIndicator.innerHTML = '📱 Local uniquement';
            syncIndicator.style.color = '#95a5a6';
            syncIndicator.style.background = '#ecf0f1';
        }
    }
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

// Custom fields data
let customFields = safeLoadFromStorage(`customFields_${currentProfile}`, []);
let customFieldValues = safeLoadFromStorage(`customFieldValues_${currentProfile}`, {});

// Get current month and year
function getCurrentMonthYear() {
    const now = new Date();
    return {
        month: MONTH_NAMES[now.getMonth()],
        year: now.getFullYear(),
        key: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    };
}

// Get month and year from date input or current date
function getMonthYearFromInput(dateValue) {
    let date;
    if (dateValue) {
        // dateValue is in format "YYYY-MM"
        const [year, month] = dateValue.split('-');
        date = new Date(parseInt(year), parseInt(month) - 1, 1);
    } else {
        date = new Date();
    }
    
    return {
        month: MONTH_NAMES[date.getMonth()],
        year: date.getFullYear(),
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    };
}

// Create archive object from current transactions
function createArchiveFromCurrentTransactions(selectedMonth = null) {
    const { month, year, key } = selectedMonth ? getMonthYearFromInput(selectedMonth) : getCurrentMonthYear();
    
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    return {
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
}

// Save archive to localStorage
// Sauvegarder une archive (hybride localStorage + Firestore)
async function saveArchive(archive) {
    // Remove existing archive for this month if any
    archivedMonths = archivedMonths.filter(a => a.key !== archive.key);
    archivedMonths.unshift(archive);
    
    // localStorage backup
    localStorage.setItem(`archived_${currentProfile}`, JSON.stringify(archivedMonths));
    
    // Firestore sync
    if (useFirebase && db) {
        try {
            updateSyncStatus('syncing');
            await db.collection('profiles')
                .doc(currentProfile)
                .collection('archived')
                .doc(archive.key)
                .set(archive);
            console.log('✅ Archive synchronisée avec Firebase');
            updateSyncStatus('synced');
        } catch (error) {
            console.error('❌ Erreur synchronisation archive:', error);
            updateSyncStatus('local');
        }
    }
}

// Charger les archives depuis Firestore ou localStorage (hybride)
async function loadArchives() {
    if (useFirebase && db) {
        try {
            updateSyncStatus('syncing');
            const snapshot = await db.collection('profiles')
                .doc(currentProfile)
                .collection('archived')
                .get();
            
            if (!snapshot.empty) {
                archivedMonths = snapshot.docs.map(doc => doc.data());
                // Tri par date (plus récent en premier)
                archivedMonths.sort((a, b) => {
                    const dateA = new Date(a.year, a.month);
                    const dateB = new Date(b.year, b.month);
                    return dateB - dateA;
                });
                // Sauvegarder en localStorage comme backup
                localStorage.setItem(`archived_${currentProfile}`, JSON.stringify(archivedMonths));
                console.log('✅ Archives chargées depuis Firebase');
                updateSyncStatus('synced');
                return archivedMonths;
            }
        } catch (error) {
            console.error('❌ Erreur de chargement des archives Firebase:', error);
            updateSyncStatus('local');
        }
    }
    
    // Fallback vers localStorage
    archivedMonths = safeLoadFromStorage(`archived_${currentProfile}`, []);
    return archivedMonths;
}

// Delete archive from localStorage and Firestore
async function deleteArchive(key) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette archive ?\n\n⚠️ Cette action est irréversible.')) {
        archivedMonths = archivedMonths.filter(a => a.key !== key);
        localStorage.setItem(`archived_${currentProfile}`, JSON.stringify(archivedMonths));
        
        // Supprimer de Firestore si disponible
        if (useFirebase && db) {
            try {
                updateSyncStatus('syncing');
                await db.collection('profiles')
                    .doc(currentProfile)
                    .collection('archived')
                    .doc(key)
                    .delete();
                console.log('✅ Archive supprimée de Firebase');
                updateSyncStatus('synced');
            } catch (error) {
                console.error('❌ Erreur suppression archive Firebase:', error);
                updateSyncStatus('local');
            }
        }
        
        displayArchives();
        showNotification('✅ Archive supprimée avec succès', 'success');
    }
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
    
    // Get selected month from input
    const archiveMonthInput = document.getElementById('archiveMonthSelect');
    const selectedMonth = archiveMonthInput.value;
    
    const { month, year, key } = selectedMonth ? getMonthYearFromInput(selectedMonth) : getCurrentMonthYear();
    const monthLabel = selectedMonth ? `${month} ${year}` : 'le mois en cours';
    
    if (confirm(`💾 Sauvegarder ${monthLabel} dans les archives?\nLes transactions actuelles resteront visibles.`)) {
        // Check if this month is already archived
        const existingArchive = archivedMonths.find(a => a.key === key);
        if (existingArchive) {
            if (!confirm('⚠️ Ce mois a déjà été archivé. Voulez-vous le mettre à jour?')) {
                return;
            }
        }
        
        const archive = createArchiveFromCurrentTransactions(selectedMonth);
        saveArchive(archive);
        
        showNotification(`✅ Mois de ${month} ${year} sauvegardé avec succès!`, 'success');
        
        // Clear the month selector after successful save
        archiveMonthInput.value = '';
    }
});

// Start new month
startNewMonthBtn.addEventListener('click', () => {
    if (transactions.length === 0) {
        showNotification('ℹ️ Aucune transaction à archiver. Vous pouvez commencer un nouveau mois directement.', 'info');
        return;
    }
    
    if (confirm('🆕 Démarrer un nouveau mois?\n\n⚠️ Cette action va:\n1. Sauvegarder le mois actuel dans les archives\n2. Effacer toutes les transactions actuelles\n3. Vous permettre de démarrer sur une base vierge\n\nContinuer?')) {
        const { month, year } = getCurrentMonthYear();
        
        // Create and save archive
        const archive = createArchiveFromCurrentTransactions();
        saveArchive(archive);
        
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
    
    // Clear existing content
    archivesList.innerHTML = '';
    
    archivedMonths.forEach(archive => {
        const archiveItem = document.createElement('div');
        archiveItem.className = 'archive-item';
        
        // Header with delete button
        const headerDiv = document.createElement('div');
        headerDiv.className = 'archive-header';
        
        const h3 = document.createElement('h3');
        h3.textContent = `📅 ${archive.month} ${archive.year}`;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '🗑️';
        deleteBtn.title = 'Supprimer cette archive';
        deleteBtn.addEventListener('click', () => deleteArchive(archive.key));
        
        headerDiv.appendChild(h3);
        headerDiv.appendChild(deleteBtn);
        archiveItem.appendChild(headerDiv);
        
        // Archive date
        const dateP = document.createElement('p');
        dateP.style.color = '#7f8c8d';
        dateP.style.fontSize = '0.9em';
        dateP.style.marginBottom = '10px';
        dateP.textContent = `Archivé le ${new Date(archive.archivedDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}`;
        archiveItem.appendChild(dateP);
        
        // Stats
        const statsDiv = document.createElement('div');
        statsDiv.className = 'archive-stats';
        
        // Income stat
        const incomeStat = document.createElement('div');
        incomeStat.className = 'archive-stat income';
        const incomeLabel = document.createElement('div');
        incomeLabel.className = 'label';
        incomeLabel.textContent = 'Revenus';
        const incomeValue = document.createElement('div');
        incomeValue.className = 'value';
        incomeValue.textContent = formatCurrency(archive.summary.income);
        incomeStat.appendChild(incomeLabel);
        incomeStat.appendChild(incomeValue);
        statsDiv.appendChild(incomeStat);
        
        // Expense stat
        const expenseStat = document.createElement('div');
        expenseStat.className = 'archive-stat expense';
        const expenseLabel = document.createElement('div');
        expenseLabel.className = 'label';
        expenseLabel.textContent = 'Dépenses';
        const expenseValue = document.createElement('div');
        expenseValue.className = 'value';
        expenseValue.textContent = formatCurrency(archive.summary.expense);
        expenseStat.appendChild(expenseLabel);
        expenseStat.appendChild(expenseValue);
        statsDiv.appendChild(expenseStat);
        
        // Balance stat
        const balanceStat = document.createElement('div');
        balanceStat.className = 'archive-stat balance';
        const balanceLabel = document.createElement('div');
        balanceLabel.className = 'label';
        balanceLabel.textContent = 'Solde';
        const balanceValue = document.createElement('div');
        balanceValue.className = 'value';
        balanceValue.textContent = formatCurrency(archive.summary.balance);
        balanceStat.appendChild(balanceLabel);
        balanceStat.appendChild(balanceValue);
        statsDiv.appendChild(balanceStat);
        
        // Transaction count stat
        const countStat = document.createElement('div');
        countStat.className = 'archive-stat';
        const countLabel = document.createElement('div');
        countLabel.className = 'label';
        countLabel.textContent = 'Transactions';
        const countValue = document.createElement('div');
        countValue.className = 'value';
        countValue.textContent = archive.summary.transactionCount.toString();
        countStat.appendChild(countLabel);
        countStat.appendChild(countValue);
        statsDiv.appendChild(countStat);
        
        archiveItem.appendChild(statsDiv);
        
        // Transactions preview
        const transactionsDiv = document.createElement('div');
        transactionsDiv.className = 'archive-transactions';
        
        const transH4 = document.createElement('h4');
        transH4.textContent = '🔍 Aperçu des transactions:';
        transactionsDiv.appendChild(transH4);
        
        // Add transaction previews
        archive.transactions
            .slice(0, MAX_PREVIEW_TRANSACTIONS)
            .forEach(t => {
                const transDiv = document.createElement('div');
                transDiv.className = `archive-transaction ${t.type}`;
                
                const descSpan = document.createElement('span');
                descSpan.textContent = `${t.category} - ${t.description}`;
                transDiv.appendChild(descSpan);
                
                const amountSpan = document.createElement('span');
                amountSpan.textContent = `${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}`;
                transDiv.appendChild(amountSpan);
                
                transactionsDiv.appendChild(transDiv);
            });
        
        // More count if needed
        const moreCount = archive.transactions.length - MAX_PREVIEW_TRANSACTIONS;
        if (moreCount > 0) {
            const moreP = document.createElement('p');
            moreP.style.textAlign = 'center';
            moreP.style.color = '#7f8c8d';
            moreP.style.marginTop = '10px';
            moreP.textContent = `... et ${moreCount} autre${moreCount > 1 ? 's' : ''} transaction${moreCount > 1 ? 's' : ''}`;
            transactionsDiv.appendChild(moreP);
        }
        
        archiveItem.appendChild(transactionsDiv);
        
        // Add export button for this archive
        const exportBtn = document.createElement('button');
        exportBtn.className = 'btn-export-archive';
        exportBtn.textContent = '📊 Exporter en Excel';
        exportBtn.addEventListener('click', () => exportArchiveToExcel(archive));
        archiveItem.appendChild(exportBtn);
        
        archivesList.appendChild(archiveItem);
    });
}

// Custom Fields Management
customizeFieldsBtn.addEventListener('click', () => {
    displayCustomFieldsModal();
    customFieldsModal.style.display = 'block';
});

closeCustomFieldsModal.addEventListener('click', () => {
    customFieldsModal.style.display = 'none';
});

function displayCustomFieldsModal() {
    const customFieldsList = document.getElementById('customFieldsList');
    customFieldsList.innerHTML = '';
    
    if (customFields.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-state';
        const emptyP = document.createElement('p');
        emptyP.textContent = 'Aucun champ personnalisé défini. Ajoutez-en un ci-dessous.';
        emptyDiv.appendChild(emptyP);
        customFieldsList.appendChild(emptyDiv);
        return;
    }
    
    customFields.forEach((field, index) => {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'custom-field-item';
        fieldDiv.style.cssText = 'padding: 15px; margin-bottom: 10px; background: #f8f9fa; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;';
        
        const infoDiv = document.createElement('div');
        
        const fieldName = document.createElement('strong');
        fieldName.textContent = field.name;
        fieldName.style.display = 'block';
        infoDiv.appendChild(fieldName);
        
        const fieldType = document.createElement('small');
        fieldType.textContent = `Type: ${field.type}`;
        fieldType.style.color = '#7f8c8d';
        infoDiv.appendChild(fieldType);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '🗑️ Supprimer';
        deleteBtn.className = 'btn';
        deleteBtn.style.cssText = 'background: #e74c3c; color: white; padding: 5px 10px; font-size: 0.9em;';
        deleteBtn.addEventListener('click', () => removeCustomField(index));
        
        fieldDiv.appendChild(infoDiv);
        fieldDiv.appendChild(deleteBtn);
        customFieldsList.appendChild(fieldDiv);
    });
}

function removeCustomField(index) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce champ personnalisé?')) {
        const fieldName = customFields[index].name;
        customFields.splice(index, 1);
        delete customFieldValues[fieldName];
        saveCustomFields();
        displayCustomFieldsModal();
        displayCustomFieldsValues();
        showNotification('Champ supprimé avec succès', 'success');
    }
}

addCustomFieldBtn.addEventListener('click', () => {
    const fieldName = document.getElementById('newFieldName').value.trim();
    const fieldType = document.getElementById('newFieldType').value;
    
    if (!fieldName) {
        showNotification('⚠️ Veuillez entrer un nom de champ', 'warning');
        return;
    }
    
    if (fieldName.length > 50) {
        showNotification('⚠️ Le nom du champ est trop long (maximum 50 caractères)', 'warning');
        return;
    }
    
    // Check if field already exists
    if (customFields.some(f => f.name === fieldName)) {
        showNotification('⚠️ Un champ avec ce nom existe déjà', 'warning');
        return;
    }
    
    customFields.push({ name: fieldName, type: fieldType });
    customFieldValues[fieldName] = '';
    saveCustomFields();
    
    // Clear inputs
    document.getElementById('newFieldName').value = '';
    document.getElementById('newFieldType').value = 'text';
    
    displayCustomFieldsModal();
    displayCustomFieldsValues();
    showNotification('Champ ajouté avec succès', 'success');
});

// Sauvegarder les champs personnalisés (hybride localStorage + Firestore)
async function saveCustomFields() {
    // localStorage backup
    localStorage.setItem(`customFields_${currentProfile}`, JSON.stringify(customFields));
    localStorage.setItem(`customFieldValues_${currentProfile}`, JSON.stringify(customFieldValues));
    
    // Firestore sync
    if (useFirebase && db) {
        try {
            updateSyncStatus('syncing');
            await db.collection('profiles')
                .doc(currentProfile)
                .collection('customFields')
                .doc('fields')
                .set({
                    fields: customFields,
                    values: customFieldValues
                });
            console.log('✅ Champs personnalisés synchronisés');
            updateSyncStatus('synced');
        } catch (error) {
            console.error('❌ Erreur synchronisation champs:', error);
            updateSyncStatus('local');
        }
    }
}

// Charger les champs personnalisés depuis Firestore ou localStorage (hybride)
async function loadCustomFields() {
    if (useFirebase && db) {
        try {
            updateSyncStatus('syncing');
            const doc = await db.collection('profiles')
                .doc(currentProfile)
                .collection('customFields')
                .doc('fields')
                .get();
            
            if (doc.exists) {
                const data = doc.data();
                customFields = data.fields || [];
                customFieldValues = data.values || {};
                // Sauvegarder en localStorage comme backup
                localStorage.setItem(`customFields_${currentProfile}`, JSON.stringify(customFields));
                localStorage.setItem(`customFieldValues_${currentProfile}`, JSON.stringify(customFieldValues));
                console.log('✅ Champs personnalisés chargés depuis Firebase');
                updateSyncStatus('synced');
                return;
            }
        } catch (error) {
            console.error('❌ Erreur de chargement des champs Firebase:', error);
            updateSyncStatus('local');
        }
    }
    
    // Fallback vers localStorage
    customFields = safeLoadFromStorage(`customFields_${currentProfile}`, []);
    customFieldValues = safeLoadFromStorage(`customFieldValues_${currentProfile}`, {});
}

function displayCustomFieldsValues() {
    if (customFields.length === 0) {
        customFieldsDisplay.innerHTML = '';
        return;
    }
    
    customFieldsDisplay.innerHTML = '';
    
    const container = document.createElement('div');
    container.style.cssText = 'margin-top: 20px; padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);';
    
    const title = document.createElement('h3');
    title.textContent = '📝 Champs Personnalisés';
    container.appendChild(title);
    
    customFields.forEach(field => {
        const fieldGroup = document.createElement('div');
        fieldGroup.style.cssText = 'margin: 15px 0;';
        
        const label = document.createElement('label');
        label.textContent = field.name;
        label.style.cssText = 'display: block; font-weight: bold; margin-bottom: 5px;';
        fieldGroup.appendChild(label);
        
        let input;
        if (field.type === 'textarea') {
            input = document.createElement('textarea');
            input.rows = 3;
        } else {
            input = document.createElement('input');
            input.type = field.type === 'currency' ? 'number' : field.type;
            if (field.type === 'currency') {
                input.step = '0.01';
                input.min = '0';
            }
        }
        
        input.value = customFieldValues[field.name] || '';
        input.style.cssText = 'width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 1em;';
        input.addEventListener('change', (e) => {
            customFieldValues[field.name] = e.target.value;
            saveCustomFields();
        });
        
        fieldGroup.appendChild(input);
        container.appendChild(fieldGroup);
    });
    
    customFieldsDisplay.appendChild(container);
}

// Chart Details Modal Implementation
closeChartDetailsModal.addEventListener('click', () => {
    chartDetailsModal.style.display = 'none';
});

function showChartDetails() {
    const chartDetailsContent = document.getElementById('chartDetailsContent');
    chartDetailsContent.innerHTML = '';
    
    const expenses = transactions.filter(t => t.type === 'expense');
    
    if (expenses.length === 0) {
        chartDetailsContent.innerHTML = '<p>Aucune dépense à afficher</p>';
        chartDetailsModal.style.display = 'block';
        return;
    }
    
    // Group by category
    const expensesByCategory = {};
    expenses.forEach(t => {
        if (!expensesByCategory[t.category]) {
            expensesByCategory[t.category] = [];
        }
        expensesByCategory[t.category].push(t);
    });
    
    // Calculate totals
    const total = expenses.reduce((sum, t) => sum + t.amount, 0);
    
    // Sort categories by amount
    const sortedCategories = Object.entries(expensesByCategory)
        .map(([category, transactions]) => ({
            category,
            transactions,
            total: transactions.reduce((sum, t) => sum + t.amount, 0)
        }))
        .sort((a, b) => b.total - a.total);
    
    // Create detailed view
    sortedCategories.forEach(({ category, transactions, total: categoryTotal }) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.style.cssText = 'margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;';
        
        const categoryHeader = document.createElement('div');
        categoryHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;';
        
        const categoryName = document.createElement('h3');
        categoryName.textContent = category;
        categoryName.style.margin = '0';
        
        const categoryStats = document.createElement('div');
        categoryStats.style.textAlign = 'right';
        
        const categoryAmount = document.createElement('div');
        categoryAmount.textContent = formatCurrency(categoryTotal);
        categoryAmount.style.cssText = 'font-size: 1.5em; font-weight: bold; color: #e74c3c;';
        
        const categoryPercentage = document.createElement('div');
        categoryPercentage.textContent = `${((categoryTotal / total) * 100).toFixed(1)}% du total`;
        categoryPercentage.style.color = '#7f8c8d';
        
        categoryStats.appendChild(categoryAmount);
        categoryStats.appendChild(categoryPercentage);
        
        categoryHeader.appendChild(categoryName);
        categoryHeader.appendChild(categoryStats);
        categoryDiv.appendChild(categoryHeader);
        
        // List transactions
        const transactionsList = document.createElement('div');
        transactions.forEach(t => {
            const transDiv = document.createElement('div');
            transDiv.style.cssText = 'display: flex; justify-content: space-between; padding: 10px; margin: 5px 0; background: white; border-radius: 5px;';
            
            const descDiv = document.createElement('div');
            const descSpan = document.createElement('span');
            descSpan.textContent = t.description;
            descSpan.style.fontWeight = 'bold';
            descDiv.appendChild(descSpan);
            
            const dateSpan = document.createElement('span');
            dateSpan.textContent = ` - ${formatDate(t.date)}`;
            dateSpan.style.cssText = 'color: #7f8c8d; font-size: 0.9em;';
            descDiv.appendChild(dateSpan);
            
            const amountDiv = document.createElement('div');
            amountDiv.textContent = formatCurrency(t.amount);
            amountDiv.style.cssText = 'font-weight: bold; color: #e74c3c;';
            
            transDiv.appendChild(descDiv);
            transDiv.appendChild(amountDiv);
            transactionsList.appendChild(transDiv);
        });
        
        categoryDiv.appendChild(transactionsList);
        chartDetailsContent.appendChild(categoryDiv);
    });
    
    chartDetailsModal.style.display = 'block';
}

// Excel Export Functions (using CSV format compatible with Excel)
// Helper function to escape CSV field values
function escapeCSVField(field) {
    if (field === null || field === undefined) {
        return '';
    }
    const value = String(field);
    // If field contains comma, quote, newline, or carriage return, wrap it in quotes and escape internal quotes
    if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
        return '"' + value.replace(/"/g, '""') + '"';
    }
    return value;
}

// Helper function to sanitize filename components
function sanitizeFilename(value, defaultValue = 'Unknown') {
    return String(value || defaultValue).replace(/[^a-zA-Z0-9_]/g, '_');
}

function exportArchiveToExcel(archive) {
    try {
        // Create CSV content
        let csvContent = '';
        
        // Add summary section
        csvContent += 'Résumé du Mois\n';
        csvContent += `Mois,${escapeCSVField(archive.month)}\n`;
        csvContent += `Année,${archive.year}\n`;
        csvContent += `Date d'archivage,${new Date(archive.archivedDate).toLocaleDateString('fr-FR')}\n`;
        csvContent += '\n';
        csvContent += 'Résumé Financier\n';
        csvContent += `Revenus,${archive.summary.income} €\n`;
        csvContent += `Dépenses,${archive.summary.expense} €\n`;
        csvContent += `Solde,${archive.summary.balance} €\n`;
        csvContent += `Nombre de transactions,${archive.summary.transactionCount}\n`;
        csvContent += '\n\n';
        
        // Add transactions section
        if (archive.transactions && archive.transactions.length > 0) {
            csvContent += 'Transactions\n';
            csvContent += 'Date,Type,Catégorie,Description,Montant (€)\n';
            
            archive.transactions.forEach(t => {
                csvContent += `${escapeCSVField(formatDate(t.date))},${escapeCSVField(t.type === 'income' ? 'Revenu' : 'Dépense')},${escapeCSVField(t.category)},${escapeCSVField(t.description)},${t.amount}\n`;
            });
        }
        
        // Create blob and download
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // UTF-8 BOM for Excel
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        // Sanitize filename components (no hyphens to avoid command-line flag issues)
        const safeMonth = sanitizeFilename(archive.month);
        const safeYear = sanitizeFilename(archive.year);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `Budget_${safeMonth}_${safeYear}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification(`✅ Archive exportée: Budget_${archive.month}_${archive.year}.csv`, 'success');
    } catch (error) {
        console.error('Error exporting archive:', error);
        showNotification('❌ Erreur lors de l\'exportation', 'error');
    }
}

function exportAllArchivesToExcel() {
    if (archivedMonths.length === 0) {
        showNotification('⚠️ Aucune archive à exporter', 'warning');
        return;
    }
    
    try {
        // Create CSV content
        let csvContent = '';
        
        // Add summary of all archives
        csvContent += 'Résumé de Toutes les Archives\n';
        csvContent += 'Mois,Année,Revenus (€),Dépenses (€),Solde (€),Transactions\n';
        
        archivedMonths.forEach(archive => {
            csvContent += `${escapeCSVField(archive.month)},${archive.year},${archive.summary.income},${archive.summary.expense},${archive.summary.balance},${archive.summary.transactionCount}\n`;
        });
        
        csvContent += '\n\n';
        
        // Add transactions for each archive
        archivedMonths.forEach(archive => {
            csvContent += `\nArchive: ${escapeCSVField(archive.month)} ${archive.year}\n`;
            csvContent += `Date d'archivage: ${new Date(archive.archivedDate).toLocaleDateString('fr-FR')}\n`;
            csvContent += '\n';
            
            if (archive.transactions && archive.transactions.length > 0) {
                csvContent += 'Date,Type,Catégorie,Description,Montant (€)\n';
                
                archive.transactions.forEach(t => {
                    csvContent += `${escapeCSVField(formatDate(t.date))},${escapeCSVField(t.type === 'income' ? 'Revenu' : 'Dépense')},${escapeCSVField(t.category)},${escapeCSVField(t.description)},${t.amount}\n`;
                });
                
                csvContent += '\n';
            }
        });
        
        // Create blob and download
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // UTF-8 BOM for Excel
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        // Sanitize profile name for filename (no hyphens to avoid command-line flag issues)
        const safeProfile = sanitizeFilename(currentProfile, 'default');
        
        link.setAttribute('href', url);
        link.setAttribute('download', `Budget_Toutes_Archives_${safeProfile}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification(`✅ Toutes les archives exportées: Budget_Toutes_Archives_${currentProfile}.csv`, 'success');
    } catch (error) {
        console.error('Error exporting all archives:', error);
        showNotification('❌ Erreur lors de l\'exportation de toutes les archives', 'error');
    }
}

// Add event listener for export all button
const exportAllArchivesBtn = document.getElementById('exportAllArchives');
if (exportAllArchivesBtn) {
    exportAllArchivesBtn.addEventListener('click', exportAllArchivesToExcel);
}

// Export/Import Profile Data Functions
function exportProfileData() {
    try {
        // Collect all data for the current profile
        const profileData = {
            profile: currentProfile,
            exportDate: new Date().toISOString(),
            transactions: transactions,
            archivedMonths: archivedMonths,
            customFields: customFields,
            customFieldValues: customFieldValues,
            categoryBudgets: categoryBudgets
        };
        
        // Convert to JSON string
        const dataStr = JSON.stringify(profileData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // Create download link
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `budget-tracker-${currentProfile}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showNotification('✅ Données exportées avec succès !', 'success');
    } catch (error) {
        console.error('Error exporting data:', error);
        showNotification('❌ Erreur lors de l\'exportation des données', 'error');
    }
}

// ============= BUDGET MANAGEMENT =============

// DOM Elements for Budget Management
const manageBudgetsBtn = document.getElementById('manageBudgets');
const viewBudgetSummaryBtn = document.getElementById('viewBudgetSummary');
const budgetManagementModal = document.getElementById('budgetManagementModal');
const closeBudgetModal = document.getElementById('closeBudgetModal');
const budgetForm = document.getElementById('budgetForm');
const budgetCategory = document.getElementById('budgetCategory');
const budgetAmount = document.getElementById('budgetAmount');
const budgetList = document.getElementById('budgetList');
const budgetSummaryDisplay = document.getElementById('budgetSummaryDisplay');

// Open Budget Management Modal
if (manageBudgetsBtn) {
    manageBudgetsBtn.addEventListener('click', () => {
        populateBudgetCategoryDropdown();
        displayBudgetList();
        budgetManagementModal.style.display = 'block';
    });
}

// Populate budget category dropdown with all available categories
function populateBudgetCategoryDropdown() {
    if (!budgetCategory) return;
    
    // Get all unique expense categories from transactions
    const expenseCategories = getExpenseCategories();
    
    // Clear current options except the first one
    while (budgetCategory.options.length > 1) {
        budgetCategory.remove(1);
    }
    
    // Add default categories first
    const defaultCategories = [
        'Courses', 'Appartement', 'Shopping', 'Transport', 'Loisirs', 
        'Santé', 'Restaurant', 'Éducation', 'Épargne', 'Assurance Vie', 
        'Frais Bancaire', 'Autre'
    ];
    
    // Combine default and custom categories, remove duplicates
    const allCategories = [...new Set([...defaultCategories, ...expenseCategories])].sort();
    
    allCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        budgetCategory.appendChild(option);
    });
}

// Close Budget Modal
if (closeBudgetModal) {
    closeBudgetModal.addEventListener('click', () => {
        budgetManagementModal.style.display = 'none';
    });
}

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === budgetManagementModal) {
        budgetManagementModal.style.display = 'none';
    }
});

// Handle Budget Form Submission
if (budgetForm) {
    budgetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const category = budgetCategory.value;
        const amount = parseFloat(budgetAmount.value);
        
        if (!category || isNaN(amount) || amount <= 0) {
            showNotification('⚠️ Veuillez remplir tous les champs correctement', 'warning');
            return;
        }
        
        // Save or update budget
        categoryBudgets[category] = amount;
        await saveCategoryBudgets();
        
        // Reset form
        budgetForm.reset();
        
        // Update displays
        displayBudgetList();
        updateBudgetSummaryDisplay();
        updateUI();
        
        showNotification(`✅ Budget de ${formatCurrency(amount)} défini pour ${category}`, 'success');
    });
}

// Display Budget List in Modal
function displayBudgetList() {
    if (!budgetList) return;
    
    budgetList.innerHTML = '';
    
    const categories = Object.keys(categoryBudgets).sort();
    
    if (categories.length === 0) {
        budgetList.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">Aucun budget défini. Ajoutez-en un ci-dessus.</p>';
        return;
    }
    
    categories.forEach(category => {
        const budget = categoryBudgets[category];
        const spent = calculateCategorySpent(category);
        const remaining = budget - spent;
        const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;
        
        const budgetItem = document.createElement('div');
        budgetItem.className = 'budget-item';
        budgetItem.style.cssText = 'padding: 15px; margin-bottom: 10px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid ' + getBudgetColor(percentUsed);
        
        budgetItem.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h4 style="margin: 0; font-size: 1.1em;">${category}</h4>
                <button class="btn-delete-budget" data-category="${category}" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">🗑️ Supprimer</button>
            </div>
            <div style="margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; font-size: 0.9em; color: #7f8c8d; margin-bottom: 5px;">
                    <span>Budget: ${formatCurrency(budget)}</span>
                    <span>Dépensé: ${formatCurrency(spent)}</span>
                </div>
                <div style="background: #e0e0e0; height: 10px; border-radius: 5px; overflow: hidden;">
                    <div style="width: ${Math.min(percentUsed, 100)}%; height: 100%; background: ${getBudgetColor(percentUsed)}; transition: width 0.3s;"></div>
                </div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.95em;">
                <span style="color: ${remaining >= 0 ? '#27ae60' : '#e74c3c'}; font-weight: bold;">
                    ${remaining >= 0 ? 'Reste' : 'Dépassement'}: ${formatCurrency(Math.abs(remaining))}
                </span>
                <span style="color: #7f8c8d;">${percentUsed.toFixed(1)}% utilisé</span>
            </div>
        `;
        
        budgetList.appendChild(budgetItem);
    });
    
    // Add delete event listeners
    document.querySelectorAll('.btn-delete-budget').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const category = e.target.dataset.category;
            if (confirm(`Êtes-vous sûr de vouloir supprimer le budget pour "${category}" ?`)) {
                delete categoryBudgets[category];
                await saveCategoryBudgets();
                displayBudgetList();
                updateBudgetSummaryDisplay();
                updateUI();
                showNotification(`✅ Budget supprimé pour ${category}`, 'success');
            }
        });
    });
}

// Calculate amount spent in a category
function calculateCategorySpent(category) {
    return transactions
        .filter(t => t.type === 'expense' && t.category === category)
        .reduce((sum, t) => sum + t.amount, 0);
}

// Get color based on budget usage percentage
function getBudgetColor(percentUsed) {
    if (percentUsed >= 100) return '#e74c3c'; // Red - exceeded
    if (percentUsed >= 80) return '#e67e22'; // Orange - warning
    if (percentUsed >= 60) return '#f39c12'; // Yellow - caution
    return '#27ae60'; // Green - safe
}

// Get all unique expense categories from transactions
function getExpenseCategories() {
    return [...new Set(transactions
        .filter(t => t.type === 'expense')
        .map(t => t.category))];
}

// Update Budget Summary Display
function updateBudgetSummaryDisplay() {
    if (!budgetSummaryDisplay) return;
    
    const categories = Object.keys(categoryBudgets).sort();
    
    if (categories.length === 0) {
        budgetSummaryDisplay.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">Aucun budget défini. Cliquez sur "Gérer les Budgets" pour en ajouter.</p>';
        return;
    }
    
    let totalBudget = 0;
    let totalSpent = 0;
    let html = '<div class="budget-summary-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; margin-top: 15px;">';
    
    categories.forEach(category => {
        const budget = categoryBudgets[category];
        const spent = calculateCategorySpent(category);
        const remaining = budget - spent;
        const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;
        
        totalBudget += budget;
        totalSpent += spent;
        
        html += `
            <div class="budget-summary-card" style="padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid ${getBudgetColor(percentUsed)};">
                <h4 style="margin: 0 0 10px 0; font-size: 1em;">${category}</h4>
                <div style="margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.85em; color: #7f8c8d; margin-bottom: 5px;">
                        <span>${formatCurrency(spent)}</span>
                        <span>${formatCurrency(budget)}</span>
                    </div>
                    <div style="background: #e0e0e0; height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${Math.min(percentUsed, 100)}%; height: 100%; background: ${getBudgetColor(percentUsed)};"></div>
                    </div>
                </div>
                <div style="font-size: 0.9em; color: ${remaining >= 0 ? '#27ae60' : '#e74c3c'}; font-weight: bold;">
                    ${remaining >= 0 ? 'Reste' : 'Dépassement'}: ${formatCurrency(Math.abs(remaining))}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    // Add total summary
    const totalRemaining = totalBudget - totalSpent;
    const totalPercentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    
    html = `
        <div class="budget-total-summary" style="padding: 20px; background: #ecf0f1; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0;">📊 Résumé Global</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                <div>
                    <div style="font-size: 0.9em; color: #7f8c8d;">Budget Total</div>
                    <div style="font-size: 1.5em; font-weight: bold; color: #3498db;">${formatCurrency(totalBudget)}</div>
                </div>
                <div>
                    <div style="font-size: 0.9em; color: #7f8c8d;">Total Dépensé</div>
                    <div style="font-size: 1.5em; font-weight: bold; color: #e74c3c;">${formatCurrency(totalSpent)}</div>
                </div>
                <div>
                    <div style="font-size: 0.9em; color: #7f8c8d;">${totalRemaining >= 0 ? 'Total Restant' : 'Dépassement Total'}</div>
                    <div style="font-size: 1.5em; font-weight: bold; color: ${totalRemaining >= 0 ? '#27ae60' : '#e74c3c'};">${formatCurrency(Math.abs(totalRemaining))}</div>
                </div>
                <div>
                    <div style="font-size: 0.9em; color: #7f8c8d;">Pourcentage Utilisé</div>
                    <div style="font-size: 1.5em; font-weight: bold; color: ${getBudgetColor(totalPercentUsed)};">${totalPercentUsed.toFixed(1)}%</div>
                </div>
            </div>
        </div>
    ` + html;
    
    budgetSummaryDisplay.innerHTML = html;
}

// View Budget Summary
if (viewBudgetSummaryBtn) {
    viewBudgetSummaryBtn.addEventListener('click', () => {
        updateBudgetSummaryDisplay();
        budgetSummaryDisplay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
}

function importProfileData() {
    try {
        // Create file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        
        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const importedData = JSON.parse(text);
                
                // Validate the imported data structure
                if (!importedData.profile || 
                    !Array.isArray(importedData.transactions) || 
                    !Array.isArray(importedData.archivedMonths)) {
                    throw new Error('Format de fichier invalide');
                }
                
                // Confirm before importing
                const confirmMsg = `Voulez-vous importer les données du profil "${importedData.profile}"?\n\n` +
                    `Cela remplacera toutes les données actuelles du profil "${currentProfile}".\n` +
                    `Date d'exportation: ${new Date(importedData.exportDate).toLocaleString('fr-FR')}`;
                
                if (!confirm(confirmMsg)) {
                    return;
                }
                
                // Import the data with proper defaults
                transactions = importedData.transactions;
                archivedMonths = importedData.archivedMonths;
                customFields = Array.isArray(importedData.customFields) ? importedData.customFields : [];
                customFieldValues = (importedData.customFieldValues && 
                                    typeof importedData.customFieldValues === 'object' && 
                                    !Array.isArray(importedData.customFieldValues)) ? 
                                    importedData.customFieldValues : {};
                categoryBudgets = (importedData.categoryBudgets && 
                                  typeof importedData.categoryBudgets === 'object' && 
                                  !Array.isArray(importedData.categoryBudgets)) ? 
                                  importedData.categoryBudgets : {};
                
                // Save to localStorage
                saveTransactions();
                saveArchive();
                saveCustomFields();
                saveCategoryBudgets();
                
                // Update UI
                updateUI();
                displayCustomFieldsValues();
                updateBudgetSummaryDisplay();
                
                showNotification('✅ Données importées avec succès !', 'success');
            } catch (error) {
                console.error('Error importing data:', error);
                showNotification('❌ Erreur lors de l\'importation: ' + error.message, 'error');
            }
        };
        
        fileInput.click();
    } catch (error) {
        console.error('Error in import function:', error);
        showNotification('❌ Erreur lors de l\'importation des données', 'error');
    }
}

// Add event listeners for export/import buttons
const exportProfileBtn = document.getElementById('exportProfile');
const importProfileBtn = document.getElementById('importProfile');

if (exportProfileBtn) {
    exportProfileBtn.addEventListener('click', exportProfileData);
}

if (importProfileBtn) {
    importProfileBtn.addEventListener('click', importProfileData);
}

// One-time migration: Update old "Assurance Vie" category to "Épargne - Assurance Vie"
async function migrateAssuranceVieCategory() {
    const migrationKey = `migrated_assurance_vie_${currentProfile}`;
    const alreadyMigrated = localStorage.getItem(migrationKey);
    
    if (alreadyMigrated) {
        return; // Migration already done
    }
    
    let transactionsMigrated = false;
    let archivesMigrated = false;
    
    // Migrate transactions
    transactions.forEach(transaction => {
        if (transaction.category === 'Assurance Vie') {
            transaction.category = 'Épargne - Assurance Vie';
            transactionsMigrated = true;
        }
    });
    
    // Migrate archived transactions
    archivedMonths.forEach(archive => {
        if (archive.transactions) {
            archive.transactions.forEach(transaction => {
                if (transaction.category === 'Assurance Vie') {
                    transaction.category = 'Épargne - Assurance Vie';
                    archivesMigrated = true;
                }
            });
        }
    });
    
    // Save only if changes were made
    if (transactionsMigrated) {
        await saveTransactions();
    }
    if (archivesMigrated) {
        // Save all archived months
        localStorage.setItem(`archived_${currentProfile}`, JSON.stringify(archivedMonths));
        // Sync to Firebase if enabled
        if (useFirebase && db) {
            try {
                for (const archive of archivedMonths) {
                    await db.collection('profiles')
                        .doc(currentProfile)
                        .collection('archived')
                        .doc(archive.key)
                        .set(archive);
                }
            } catch (error) {
                console.error('❌ Error syncing migrated archives:', error);
            }
        }
    }
    
    if (transactionsMigrated || archivesMigrated) {
        console.log('✅ Migration completed: Updated "Assurance Vie" to "Épargne - Assurance Vie"');
    }
    
    // Mark migration as complete
    localStorage.setItem(migrationKey, 'true');
}

// Initialize app
(async function initializeApp() {
    // Run migration after data is loaded from localStorage (lines 68-69)
    await migrateAssuranceVieCategory();
    
    // Initialize UI
    updateUI();
    updateMonthInfo();
    displayCustomFieldsValues();
})();
