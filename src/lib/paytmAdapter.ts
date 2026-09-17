// ───────────────────────────────────────────────────────── Convex ──
// Vyapar-Mind — Paytm API adapter layer (spec §14)
//
// Clean abstraction so mock methods can later be swapped for real Paytm
// sandbox/API integrations. The prototype does NOT claim any connection to
// private Paytm infrastructure — everything here is simulated.
// ─────────────────────────────────────────────────────────────────────────────

export interface PaytmMerchantAdapter {
  /** List transactions, newest first. */
  getTransactions(limit?: number): Promise<AdapterTxn[]>;
  getCustomers(limit?: number): Promise<AdapterCustomer[]>;
  getInventory(): Promise<AdapterProduct[]>;
  getMerchantProfile(): Promise<AdapterProfile>;
  getLoanOffers(): Promise<AdapterLoanOffer[]>;
  /** Create a win-back campaign (simulated delivery). */
  createCampaign(input: { offer: string; customerNames: string[] }): Promise<{ campaignId: string }>;
  /** Announce a payment event through the soundbox simulator. */
  recordPayment(input: { amount: number; customerReference: string }): Promise<{ paymentId: string }>;
}

export interface AdapterTxn {
  id: string;
  amount: number;
  category: string;
  method: string;
  at: number;
}
export interface AdapterCustomer {
  id: string;
  name: string;
  phone: string;
  totalSpent: number;
  visits: number;
  lastPurchaseAt: number;
}
export interface AdapterProduct {
  id: string;
  name: string;
  quantity: number;
  reorderLevel: number;
  price: number;
}
export interface AdapterProfile {
  merchantCode: string;
  businessName: string;
  ownerName: string;
  city: string;
  language: string;
}
export interface AdapterLoanOffer {
  amount: number;
  status: string;
  reason: string;
  activityScore: number;
}

interface MockApi {
  getTransactions: (limit?: number) => Promise<AdapterTxn[]>;
  getCustomers: (limit?: number) => Promise<AdapterCustomer[]>;
  getInventory: () => Promise<AdapterProduct[]>;
  getMerchantProfile: () => Promise<AdapterProfile>;
  getLoanOffers: () => Promise<AdapterLoanOffer[]>;
  createCampaign: (input: { offer: string; customerNames: string[] }) => Promise<{ campaignId: string }>;
  recordPayment: (input: { amount: number; customerReference: string }) => Promise<{ paymentId: string }>;
}

/**
 * Mock implementation backed by the Convex demo database. Behaves like an
 * external service — the rest of the app only depends on the interface.
 */
export class MockPaytmMerchantAdapter implements PaytmMerchantAdapter {
  private readonly api: MockApi;

  constructor(api: MockApi) {
    this.api = api;
  }

  async getTransactions(limit = 20) {
    return this.api.getTransactions(limit);
  }
  getCustomers(limit = 50) {
    return this.api.getCustomers(limit);
  }
  getInventory() {
    return this.api.getInventory();
  }
  getMerchantProfile() {
    return this.api.getMerchantProfile();
  }
  getLoanOffers() {
    return this.api.getLoanOffers();
  }
  createCampaign(input: { offer: string; customerNames: string[] }) {
    return this.api.createCampaign(input);
  }
  recordPayment(input: { amount: number; customerReference: string }) {
    return this.api.recordPayment(input);
  }
}
