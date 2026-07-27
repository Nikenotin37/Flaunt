// Payment Security Utilities

export const maskCreditCard = (cardNumber: string): string => {
  const cleanNumber = cardNumber.replace(/[^0-9]/g, '');
  if (cleanNumber.length < 4) return cleanNumber;
  const last4 = cleanNumber.substring(cleanNumber.length - 4);
  return `**** **** **** ${last4}`;
};

export const clearPaymentState = (stateSetter: (val: any) => void) => {
  // Always clear sensitive payment data from state immediately after use
  stateSetter(null);
};

// Simulated backend PayU call wrapper to enforce that we don't process it locally
export const processPaymentSecurely = async (paymentDetails: any) => {
  // In a real app, send paymentDetails to your backend (e.g., Supabase Edge Function)
  // which will then construct the PayU order and hash.
  // NEVER construct the PayU hash or order directly in the React Native frontend.
  
  if (__DEV__) {
    // We do NOT use console.log here in production to prevent leakage
    // console.log("Sending to secure backend:", maskCreditCard(paymentDetails.cardNumber));
  }
  
  return { status: 'success', message: 'Processed securely via backend.' };
};
