import type { TransactionInput, ValidationResult } from './types';

/** Validates a TransactionInput, returning errors if any */
export function validateTransaction(input: TransactionInput): ValidationResult {
  const errors: { field: string; message: string }[] = [];

  // Amount validation
  if (input.amount === undefined || input.amount === null) {
    errors.push({ field: 'amount', message: 'Le montant est requis.' });
  } else if (typeof input.amount !== 'number' || isNaN(input.amount)) {
    errors.push({ field: 'amount', message: 'Le montant doit être un nombre.' });
  } else if (input.amount <= 0) {
    errors.push({ field: 'amount', message: 'Le montant doit être supérieur à 0.' });
  } else if (input.amount > 999_999_999) {
    errors.push({ field: 'amount', message: 'Le montant ne peut pas dépasser 999 999 999 €.' });
  }

  // Type validation
  const validTypes = ['income', 'expense', 'savings'];
  if (!input.type || !validTypes.includes(input.type)) {
    errors.push({ field: 'type', message: 'Le type de transaction est invalide.' });
  }

  // Category validation
  if (!input.category || input.category.trim().length === 0) {
    errors.push({ field: 'category', message: 'La catégorie est requise.' });
  } else if (input.category.length > 100) {
    errors.push({ field: 'category', message: 'La catégorie ne peut pas dépasser 100 caractères.' });
  }

  // Description validation
  if (!input.description || input.description.trim().length === 0) {
    errors.push({ field: 'description', message: 'La description est requise.' });
  } else if (input.description.length > 200) {
    errors.push({ field: 'description', message: 'La description ne peut pas dépasser 200 caractères.' });
  }

  // Date validation
  if (!input.date || input.date.trim().length === 0) {
    errors.push({ field: 'date', message: 'La date est requise.' });
  } else {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(input.date)) {
      errors.push({ field: 'date', message: 'La date doit être au format YYYY-MM-DD.' });
    } else {
      const parsed = new Date(input.date);
      if (isNaN(parsed.getTime())) {
        errors.push({ field: 'date', message: 'La date est invalide.' });
      } else {
        const year = parsed.getFullYear();
        if (year < 2000 || year > 2100) {
          errors.push({ field: 'date', message: 'La date doit être entre 2000 et 2100.' });
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
