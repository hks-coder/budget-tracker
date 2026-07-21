import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/theme';
import { validateTransaction } from '../core/validation';
import { todayISO } from '../core/formatters';
import { getCategoriesForType, normalizeTransactionType } from '../core/types';
import { getSetting, setSetting } from '../data/transactionRepository';
import { SETTINGS_KEYS } from '../constants/theme';
import type { Transaction, TransactionInput, TransactionType } from '../core/types';

interface AddTransactionScreenProps {
  transaction?: Transaction; // if provided, we are editing
  onSave: (input: TransactionInput) => Promise<void>;
  onCancel: () => void;
}

const TYPE_OPTIONS: { label: string; value: TransactionType; emoji: string }[] = [
  { label: 'Dépense', value: 'expense', emoji: '↓' },
  { label: 'Revenu', value: 'income', emoji: '↑' },
  { label: 'Épargne', value: 'savings', emoji: '🏦' },
];

function getTypeColor(type: TransactionType): string {
  switch (type) {
    case 'income': return Colors.income;
    case 'expense': return Colors.expense;
    case 'savings': return Colors.savings;
  }
}

export function AddTransactionScreen({
  transaction,
  onSave,
  onCancel,
}: AddTransactionScreenProps) {
  const isEditing = !!transaction;

  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'expense');
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '');
  const [category, setCategory] = useState(transaction?.category ?? '');
  const [description, setDescription] = useState(transaction?.description ?? '');
  const [date, setDate] = useState(transaction?.date ?? todayISO());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load last-used category/type from settings
  useEffect(() => {
    if (isEditing) return;
    (async () => {
      const storedLastType = await getSetting(SETTINGS_KEYS.LAST_TYPE);
      const lastType = normalizeTransactionType(storedLastType);
      if (lastType) setType(lastType);

      let lastCatKey = SETTINGS_KEYS.LAST_EXPENSE_CATEGORY;
      if (lastType === 'income') {
        lastCatKey = SETTINGS_KEYS.LAST_INCOME_CATEGORY;
      } else if (lastType === 'savings') {
        lastCatKey = SETTINGS_KEYS.LAST_SAVINGS_CATEGORY;
      }
      const lastCat = await getSetting(lastCatKey);
      if (lastCat) setCategory(lastCat);
    })();
  }, [isEditing]);

  // When type changes, reset category if it doesn't belong to new type
  useEffect(() => {
    const cats = getCategoriesForType(type);
    if (!cats.includes(category as never)) {
      setCategory('');
    }
  }, [type]); // intentionally omit category to avoid infinite loop

  const handleTypeChange = useCallback((newType: TransactionType) => {
    setType(newType);
  }, []);

  const handleSave = useCallback(async () => {
    const parsedAmount = parseFloat(amount.replace(',', '.'));

    const input: TransactionInput = {
      type,
      amount: parsedAmount,
      category,
      description: description.trim(),
      date,
    };

    const result = validateTransaction(input);
    if (!result.valid) {
      const errorMap: Record<string, string> = {};
      result.errors.forEach((e) => { errorMap[e.field] = e.message; });
      setErrors(errorMap);
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      // Save last used type/category
      await setSetting(SETTINGS_KEYS.LAST_TYPE, type);
      const catKey = type === 'income'
        ? SETTINGS_KEYS.LAST_INCOME_CATEGORY
        : type === 'expense'
        ? SETTINGS_KEYS.LAST_EXPENSE_CATEGORY
        : SETTINGS_KEYS.LAST_SAVINGS_CATEGORY;
      await setSetting(catKey, category);

      await onSave(input);
    } catch {
      Alert.alert('Erreur', "Impossible de sauvegarder la transaction. Veuillez réessayer.");
    } finally {
      setSaving(false);
    }
  }, [type, amount, category, description, date, onSave]);

  const categories = getCategoriesForType(type);
  const typeColor = getTypeColor(type);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn} accessibilityRole="button">
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Modifier' : 'Nouvelle transaction'}
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveBtn, { backgroundColor: typeColor }]}
            disabled={saving}
            accessibilityRole="button"
          >
            <Text style={styles.saveBtnText}>{saving ? '...' : 'Enregistrer'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Type selector */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Type</Text>
            <View style={styles.typeRow}>
              {TYPE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.typeBtn,
                    type === opt.value && { backgroundColor: getTypeColor(opt.value), borderColor: getTypeColor(opt.value) },
                  ]}
                  onPress={() => handleTypeChange(opt.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: type === opt.value }}
                >
                  <Text style={[styles.typeBtnText, type === opt.value && styles.typeBtnTextActive]}>
                    {opt.emoji} {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Amount */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Montant (€) *</Text>
            <TextInput
              style={[styles.input, errors.amount ? styles.inputError : null]}
              placeholder="0,00"
              placeholderTextColor={Colors.textLight}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              returnKeyType="done"
              accessibilityLabel="Montant"
            />
            {errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Catégorie *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    category === cat && { backgroundColor: typeColor, borderColor: typeColor },
                  ]}
                  onPress={() => setCategory(cat)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: category === cat }}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      category === cat && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Description *</Text>
            <TextInput
              style={[styles.input, errors.description ? styles.inputError : null]}
              placeholder={`Ex: ${type === 'expense' ? 'Courses Carrefour' : type === 'income' ? 'Salaire janvier' : 'Virement Livret A'}`}
              placeholderTextColor={Colors.textLight}
              value={description}
              onChangeText={setDescription}
              maxLength={200}
              returnKeyType="done"
              accessibilityLabel="Description"
            />
            {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
          </View>

          {/* Advanced options toggle */}
          <TouchableOpacity
            style={styles.advancedToggle}
            onPress={() => setShowAdvanced(!showAdvanced)}
            accessibilityRole="button"
          >
            <Text style={styles.advancedToggleText}>
              {showAdvanced ? '▲ Moins d\'options' : '▼ Plus d\'options'}
            </Text>
          </TouchableOpacity>

          {/* Advanced options */}
          {showAdvanced && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Date *</Text>
              <TextInput
                style={[styles.input, errors.date ? styles.inputError : null]}
                placeholder="AAAA-MM-JJ"
                placeholderTextColor={Colors.textLight}
                value={date}
                onChangeText={setDate}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                accessibilityLabel="Date au format AAAA-MM-JJ"
              />
              {errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}
              <Text style={styles.hintText}>Format: AAAA-MM-JJ (ex: {todayISO()})</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  keyboardAvoid: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  cancelBtn: { padding: Spacing.xs },
  cancelText: { color: Colors.secondary, fontSize: FontSize.md },
  saveBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.round,
  },
  saveBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  scroll: { flex: 1 },
  section: {
    backgroundColor: Colors.card,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  typeBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  typeBtnTextActive: {
    color: Colors.white,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    color: Colors.danger,
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  categoryChipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  categoryChipTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  advancedToggle: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  advancedToggleText: {
    color: Colors.secondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  hintText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
