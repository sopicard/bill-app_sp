export function sortBills(bills) {
    return bills.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  