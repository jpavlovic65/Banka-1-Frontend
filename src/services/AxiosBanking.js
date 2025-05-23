import axios from "axios";
import { jwtDecode } from "jwt-decode";

const apiBanking = axios.create({
  baseURL: `${process.env.REACT_APP_BANKING_API_URL}`,
  headers: {
    "Content-Type": "application/json",
  },
});

apiBanking.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;

        // For debugging - remove in production
        console.log(
            `${config.method.toUpperCase()} ${
                config.url
            } - Token: ${token.substring(0, 20)}...`
        );
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
);

export const getUserIdFromToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    return decoded.id;
  } catch (error) {
    console.error("Invalid token", error);
    return null;
  }
};

export const createAccount = async (accountData) => {
  console.log(accountData);
  try {
    const response = await apiBanking.post("/accounts/", accountData);
    console.log(response);

    return response.data;
  } catch (error) {
    console.error("Error creating account:", error);
    throw error;
  }
};

export const fetchAccounts = async () => {
  try {
    const response = await apiBanking.get("/accounts/");
    console.log(response);
    // if (!response.data) {
    //     return [];
    // }

    const accounts = response.data.data.accounts;

    if (!Array.isArray(accounts)) {
      console.error("Accounts is not an array, type:", typeof accounts);
      return [];
    }

    return accounts;
  } catch (error) {
    console.error("Error fetching accounts:", error);
    throw error;
  }
};

export const fetchAccountsForUser = async () => {
  const userId = getUserIdFromToken();
  try {
    console.log("Running GET /accounts/user/" + userId);
    const response = await apiBanking.get(`/accounts/user/${userId}`);
    let accounts = response.data.data.accounts;
    accounts = accounts.filter(a => a.accountNumber !== "111000100000000330")

    console.log(accounts);
    return accounts;
  } catch (error) {
    console.error("Error fetching recipients:", error);
    throw error;
  }
};

export const fetchAccountsId = async (id) => {
  try {
    const response = await apiBanking.get(`/accounts/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    return response.data.map((account) => ({
      id: account.id,
      name: account.name,
      number: account.number,
      balance: account.balance,
    }));
  } catch (error) {
    console.error(`Error fetching account with ID ${id}:`, error);
    return null;
  }
};

export const fetchRecipients = async (accountId) => {
  try {
    const response = await apiBanking.get(`/receiver/${accountId}`);
    console.log("rec:" + response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching recipients:", error);
    throw error;
  }
};

export const updateRecipient = async (recipientId, recipientData) => {
  try {
    const requestBody = {
      fullName: `${recipientData.firstName} ${recipientData.lastName}`.trim(),
      address: recipientData.address || "",
      accountNumber: recipientData.accountNumber,
      ownerAccountId: recipientData.ownerAccountId // OBAVEZNO ako backend to očekuje
    };

    console.log("Sending update request to /receiver/" + recipientId, requestBody);

    const response = await apiBanking.put(`/receiver/${recipientId}`, requestBody);
    return response.data;
  } catch (error) {
    console.error(`Error updating recipient [${recipientId}]:`, error.response?.data || error.message);
    throw error;
  }
};


export const createRecipient = async (recipientData) => {
  try {
    const response = await apiBanking.post("/receiver", {
      customerId: Number(recipientData.ownerAccountId),
      accountNumber: recipientData.accountNumber,
      fullName: recipientData.fullName,
      address: recipientData.address || "",
    });
    return response.data;
  } catch (error) {
    console.error("Error creating recipient:", error);
    throw error;
  }
};


// Fetch cards linked to an account
export const fetchUserCards = async (accountId) => {
  try {
    console.log("Account id: " + accountId);
    const response = await apiBanking.get(`/cards/${accountId}`);
    console.log(response);
    return response.data;
  } catch (error) {
    console.error(`Error fetching cards for account ${accountId}:`, error);
    throw error;
  }
};

//Create a card
export const createCard = async (
    accountId,
    cardType,
    cardBrand = "VISA",
    authorizedPerson = null,
    company = null
) => {
  try {
    const requestBody = {
      accountID: accountId,
      cardType: cardType,
      cardBrand: cardBrand,
    };
    requestBody.authorizedPerson = authorizedPerson;
    requestBody.company = company;
    console.log("card info == ",requestBody)
    const response = await apiBanking.post("/cards/", requestBody);
    return response.data;
  } catch (error) {
    // if(error.response.data.error === "Privatni racun moze biti povezan sa najvise dve kartice!"){
    //   return alert("Privatni račun može biti povezan sa najviše dve kartice. \nMolimo Vas da deaktivirate jednu od postojećih kartica pre pokušaja dodavanja nove.")
    // }else if (error.response.data.error === "Poslovni racun moze biti povezan sa najvise pet kartica!"){
    //   return alert("Poslovni racun moze biti povezan sa najvise pet kartica!")
    // }else if (error.response.data.error === "Ovaj korisnik vec ima pristup kartici ove firme!"){
    //   return alert("Ovaj korisnik vec ima pristup kartici ove firme!")
    // }

    console.error("Error creating a new card:", error);
    throw error;
  }
};

// Change card name
export const changeCardName = async (cardId, newName) => {
  try {
    const response = await apiBanking.post(`/cards/${cardId}/name`, {
      name: newName,
    });
    return response.data;
  } catch (error) {
    console.error(`Error changing name for card ${cardId}:`, error);
    throw error;
  }
};

// Change card limit
export const changeCardLimit = async (cardId, newLimit) => {
  try {
    const response = await apiBanking.post(`/cards/${cardId}/limit`, {
      newLimit: newLimit,
    });
    return response.data;
  } catch (error) {
    console.error(`Error changing limit for card ${cardId}:`, error);
    throw error;
  }
};

// Block or unblock a card
export const updateCardStatus = async (cardId, status) => {
  try {
    const response = await apiBanking.post(
        `/cards/${cardId}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
    );

    return response.data;
  } catch (error) {
    console.error(`Error updating status for card ${cardId}:`, error);
    throw error;
  }
};

//Admins only - see users cards and update status
export const fetchAdminUserCards = async (accountId) => {
  try {
    const response = await apiBanking.get(`/cards/admin/${accountId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching cards for account ${accountId}:`, error);
    throw error;
  }
};

export const updateCardStatusAdmin = async (accountId, cardId, status) => {
  try {
    const response = await apiBanking.post(
        `/cards/admin/${accountId}?card_id=${cardId}`,
        { status }
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating card status for card ${cardId}:`, error);
    throw error;
  }
};

export const fetchAccountsTransactions = async (accountId) => {
  try {
    const response = await apiBanking.get(
        `/accounts/${accountId}/transactions`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching accounts:", error);
    throw error;
  }
};

export const fetchCardsByAccountId = async (accountId) => {
  try {
    const response = await apiBanking.get(`/cards/admin/${accountId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching cards:", error);
    throw error;
  }
};

export const updateAccount = async (accountId, ownerId, account) => {
  try {
    const response = await apiBanking.put(
        `/accounts/user/${ownerId}/${accountId}`,
        account
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createInternalTransfer = async (transferData) => {
  try {
    const response = await apiBanking.post("/internal-transfer", transferData);
    return response.data; // trebalo bi da sadrzi id transakcije : transferId
  } catch (error) {
    console.error("API Error during internal transfer: ", error);
    throw error;
  }
};
export const createExchangeTransfer = async (transferData) => {
  try {
    const response = await apiBanking.post("/exchange-transfer", transferData);
    return response.data;
  } catch (error) {
    console.error("API Error during exchange transfer: ", error);
    throw error;
  }
};

export const deleteRecipient = async (id) => {
  try {
    const response = await apiBanking.delete(`/receiver/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching recipients:", error);
    throw error;
  }
};

export const createNewMoneyTransfer = async (transferData) => {
  console.log(transferData)
  try {
    const response = await apiBanking.post("/money-transfer", transferData);
    return response.data;
  } catch (error) {
    console.error("API Error during new payment transfer: ", error);
    throw error;
  }
};

export const verifyOTP = async (otpData) => {
  console.log(otpData);
  return await apiBanking.post("/otp/verification", otpData);
};

export const fetchAccountsId1 = async (id) => {
  try {
    const response = await apiBanking.get(`/accounts/user/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    // Pristupanje pravom nizu
    const accounts = response.data.data.accounts;

    if (!Array.isArray(accounts)) {
      console.error("Invalid response format:", response.data);
      return [];
    }

    //ostavio sam ovako da bi imali sve parametre za details
    return accounts;
    // return accounts.map((account) => ({
    //     id: account.id,
    //     name: account.ownerID,
    //     number: account.accountNumber,
    //     balance: account.balance,
    //     subtype: account.subtype,

    // }));
  } catch (error) {
    console.error(`Error fetching account with ID ${id}:`, error);
    return null;
  }
};

export const fetchRecipientsForFast = async (customerId) => {
  try {
    console.log("Fetching fast recipients for customerId = " + customerId);
    const response = await apiBanking.get(`/receiver/${customerId}`);

    console.log("Response data:", response.data);

    const receivers = response.data?.data?.receivers;

    if (Array.isArray(receivers)) {
      return receivers.slice(0, 3); // Vraćamo samo top 3
    } else {
      console.error("Response data is not an array:", response.data);
      return [];
    }
  } catch (error) {
    console.error("Error fetching recipients:", error);
    throw error;
  }
};


export const fetchUserLoans = async () => {
  try {
    console.log("Fetching loans for the authenticated user");
    const response = await apiBanking.get("/loans/");
    return response.data;
  } catch (error) {
    console.error("Error fetching loans:", error);
    throw error;
  }
};

export const fetchLoanDetails = async (loan_id) => {
  try {
    console.log(`Fetching details for loan ID: ${loan_id}`);
    const response = await apiBanking.get(`/loans/${loan_id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching loan details for ID ${loan_id}:`, error);
    throw error;
  }
};
export const createRecipientt = async (recipientData) => {
  try {
    const requestBody = {
      customerId: Number(recipientData.customerId),  // promenjeno u customer
      accountNumber: recipientData.accountNumber,
      fullName: recipientData.fullName,
      address: recipientData.address || "",
    };

    console.log("Sending recipient data:", requestBody);

    const response = await apiBanking.post(`/receiver`, requestBody);
    console.log("Recipient added successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error creating recipient:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const updateRecipientt = async (recipientId, recipientData) => {
  try {
    const requestBody = {
      fullName: recipientData.fullName,
      address: recipientData.address || "",
      accountNumber: recipientData.accountNumber,
      ownerAccountId: recipientData.ownerAccountId 
    };

    console.log(`Updating recipient ${recipientId}:`, requestBody);

    const response = await apiBanking.put(
      `/receiver/${recipientId}`,
      requestBody
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating recipient [${recipientId}]:`, error.response?.data || error.message);
    throw error;
  }
};


export const fetchAllLoansForEmployees = async () => {
  try {
    const response = await apiBanking.get("/loans/admin");
    return response.data;
  } catch (error) {
    console.error("Error fetching loans:", error);
    throw error;
  }
};

export const fetchRemainingInstallments = async (loanId) => {
  try {
    const response = await apiBanking.get(
        `/loans/${loanId}/remaining_installments`
    );
    return response.data;
  } catch (error) {
    console.error(
        `Error fetching remaining installments for loan ${loanId}:`,
        error
    );
    throw error;
  }
};

export const fetchAllPendingLoans = async () => {
  try {
    const response = await apiBanking.get("/loans/pending");
    return response.data.data.loans;
  } catch (error) {
    console.error("Error fetching loans:", error);
    throw error;
  }
};

export const approveLoan = async (loan_id, approvedLoan) => {
  try {
    const response = await apiBanking.put(
        `/loans/admin/${loan_id}/approve`,
        approvedLoan
    );
    return response;
  } catch (error) {
    console.error("Error fetching loans:", error);
    throw error;
  }
};

export const denyLoan = async (loan_id, deniedLoan) => {
  try {
    const response = await apiBanking.put(
        `/loans/admin/${loan_id}/approve`,
        deniedLoan
    );
    return response;
  } catch (error) {
    console.error("Error fetching loans:", error);
    throw error;
  }
};

// Exchange Rate Functions
export const fetchExchangeRates = async () => {
  try {
    const response = await apiBanking.get('/currency/exchange-rates');

    // Transform the rates array into an object format expected by convertCurrency
    const ratesObject = {};

    // First, find the base rates for RSD
    const rsdRates = response.data.data.rates.filter(rate => rate.baseCurrency === 'RSD');

    // Map the rates with RSD as base
    rsdRates.forEach(rate => {
      if (rate.targetCurrency === 'RSD') {
        ratesObject[rate.targetCurrency] = 1;
      } else {
        // Invert the rate to show how many RSD are needed for 1 unit of foreign currency
        ratesObject[rate.targetCurrency] = 1 / rate.exchangeRate;
      }
    });

    return {
      data: {
        base: 'RSD',
        rates: ratesObject,
        date: response.data.data.rates[0].date
      }
    };
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    throw error;
  }
};


// Submit loan request - podnosenje zahteva za kredit
export const submitLoanRequest = async (loanData) => {
  try {
    console.log("Submitting loan request:", loanData);
    const response = await apiBanking.post("/loans/", {
      loanPurpose: loanData.loanPurpose,
      loanType: loanData.loanType,
      numberOfInstallments: loanData.numberOfInstallments,
      interestType: loanData.interestType,
      loanAmount: loanData.loanAmount,
      salaryAmount: loanData.salaryAmount,
      employmentStatus: loanData.employmentStatus,
      employmentDuration: loanData.employmentDuration,
      phoneNumber: loanData.phoneNumber,
      currencyType: loanData.currencyType,
      accountId: loanData.accountId,
    });
    return response.data;
  } catch (error) {
    console.error("Error submitting loan request:", error);
    throw error;
  }
};

export const getPaymentCodes = async () => {
  try {
    const response = await apiBanking.get("/metadata/payment-codes");
    // console.log("aaaa" + response);

    const codes = response.data;
    return codes;
  } catch (error) {
    console.error("Error fetching codes:", error);
    throw error;
  }
};

// Block card
export const blockCard = async (cardId, status) => {
  try {
    const response = await apiBanking.post(`/cards/${cardId}`, {
      status: status,
    });
    return response.data;
  } catch (error) {
    console.error(`Error blocking/unblocking card ${cardId}:`, error);
    throw error;
  }
};

// Deactive card
export const deactivateCard = async (cardId, status) => {
  try {
    const response = await apiBanking.post(`/cards/admin/${cardId}`, {
      status: status,
    });
    return response.data;
  } catch (error) {
    console.error(`Error deactivating/activating card ${cardId}:`, error);
    throw error;
  }
};

export const changingAccountStatus = async (accountId, status) => {
  try {
    const response = await apiBanking.put(`/accounts/${accountId}`, {
      status: status,
    });
    return response.data;
  } catch (error) {
    console.error(`Error changing status for account ${accountId}:`, error);
    throw error;
  }
};

export const createCompany = async (companyData) => {
  try {
    const response = await apiBanking.post("/companies/", companyData);
    return response.data;
  } catch (error) {
    console.error("Error creating company:", error);
    throw error;
  }
};

export const fetchExchangeRatesForCurrency = async (currency) => {
  try {
    const response = await apiBanking.get(
        `/currency/exchange-rates/${currency}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    throw error;
  }
};

export const getCompanies = async () => {
  try {
    const response = await apiBanking.get("/companies/");
    return response.data;
  } catch (error) {
    console.error("Error fetching companies:", error);
    throw error;
  }
};

export const fetchCompaniesFromUser = async (userID) => {
  try {
    const response = await apiBanking.get(`/companies/${userID}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching companies:", error);
    throw error;
  }
};

export const fetchCompany = async (companyID) => {
  try {
    const response = await apiBanking.get(`/companies/${companyID}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching companies:", error);
    throw error;
  }
};

export const previewExchangeTransfer = async (fromCurrency, toCurrency, amount) => {
  try {
    const response = await apiBanking.post('/exchange-transfer/preview', {
      fromCurrency,
      toCurrency,
      amount
    });
    return response.data;
  } catch (error) {
    console.error('Error previewing exchange transfer:', error);
    throw error;
  }
};

export const previewForeignExchangeTransfer = async (fromCurrency, toCurrency, amount) => {
  try {
    const response = await apiBanking.post('/exchange-transfer/preview', {
      fromCurrency,
      toCurrency,
      amount
    });
    return response.data;
  } catch (error) {
    console.error('Error previewing foreign exchange transfer:', error);
    throw error;
  }
};

// export const getCompanies = async () => {
//   try {
//     const response = await apiBanking.get("/companies");
//     return response.data;
//   } catch (error) {
//     console.error("Error fetching companies:", error);
//     throw error;
//   }
// };
export const fetchAllRecipientsForUser = async (customerId) => {
  try {
    const response = await apiBanking.get(`/receiver/${customerId}`);
    return response.data?.data?.receivers || [];
  } catch (error) {
    console.error("Error fetching recipients for customer:", error);
    throw error;
  }
};




export const fetchAllData = async (setCards, setLoading, setError) => {
  setLoading(true);
  setError(null);
  try {
    const userId = getUserIdFromToken();
    if (!userId) {
      setError("User ID not found.");
      setLoading(false);
      return;
    }

    const accounts = await fetchAccountsForUser(userId);
    if (!Array.isArray(accounts) || accounts.length === 0) {
      setLoading(false);
      return;
    }

    const cardPromises = accounts.map(async (account) => {
      try {
        const res = await fetchUserCards(account.id);
        const cards = res.data?.cards || [];
        return cards.filter(card => card.active).map(card => ({ ...card, account }));
      } catch {
        return [];
      }
    });

    const result = await Promise.all(cardPromises);
    console.log("Sve kartice = ", result);
    setCards(result.flat());
  } catch (err) {
    console.error(err);
    setError("Failed to load cards");
  } finally {
    setLoading(false);
  }
};


export default apiBanking;