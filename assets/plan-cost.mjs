export function compareAnnualCost(monthly) {
  // Integer cents keep a customer's decimal input exact through the comparison.
  const cents = Math.round(Number(monthly) * 100);
  if (String(monthly).trim() === '' || !Number.isFinite(cents) || cents < 0 || cents > 100000000) return null;
  const annual = cents * 12;
  return { annual, plans: [
    { name: 'Launch', total: 9900, difference: annual - 9900 },
    { name: 'Grow monthly', total: 34800, difference: annual - 34800 },
    { name: 'Grow yearly', total: 29000, difference: annual - 29000 },
  ] };
}

if (typeof document !== 'undefined') {
  const form = document.getElementById('cost-form');
  const input = document.getElementById('current-cost');
  const output = document.getElementById('cost-result');
  const money = cents => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  // Hide a previous answer as soon as the input changes, so it cannot represent a stale value.
  input.addEventListener('input', () => { output.hidden = true; });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const result = compareAnnualCost(input.value);
    if (!result || !input.checkValidity()) { input.reportValidity(); return; }
    const heading = document.createElement('p');
    heading.textContent = `Your current cost: ${money(result.annual)} over 12 months.`;
    const list = document.createElement('ul');
    for (const plan of result.plans) {
      const item = document.createElement('li');
      const comparison = plan.difference === 0 ? 'the same cost' : `${money(Math.abs(plan.difference))} ${plan.difference > 0 ? 'less' : 'more'}`;
      item.textContent = `${plan.name}: ${money(plan.total)} per year, ${comparison} than your current cost.`;
      list.append(item);
    }
    output.replaceChildren(heading, list);
    output.hidden = false;
  });
}
