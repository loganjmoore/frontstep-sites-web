(() => {
  const root = document.getElementById('plumber-profile-check');
  if (!root) return;
  const boxes = Array.from(root.querySelectorAll('input[type="checkbox"]'));
  const fields = document.getElementById('profile-check-fields');
  const count = document.getElementById('profile-check-count');
  const result = document.getElementById('profile-check-result');
  const storageNote = document.getElementById('profile-check-storage');
  const reset = document.getElementById('profile-check-reset');
  const key = 'frontstep_plumber_profile_check_v1';
  if (boxes.length !== 6 || !fields || !count || !result || !storageNote || !reset) return;
  let saved = true;
  let raw = null;
  try { raw = localStorage.getItem(key); } catch { saved = false; }
  try {
    const state = JSON.parse(raw);
    if (state?.version === 1 && Array.isArray(state.checked) && state.checked.length === 6 && state.checked.every(value => typeof value === 'boolean')) {
      boxes.forEach((box, i) => { box.checked = state.checked[i]; });
    }
  } catch { /* Ignore malformed saved data; new changes can replace it. */ }
  function render() {
    const complete = boxes.filter(box => box.checked).length;
    count.textContent = `${complete} of 6 public checks complete`;
    result.textContent = complete === 6 ? 'You marked every check complete. Recheck the public listing whenever details change.' : 'Use the setup table above to carry out each check, then mark your progress here.';
    storageNote.textContent = saved ? 'Only these six checkmarks are saved on this device; no listing details are collected or sent.' : 'Changes apply only while this page is open. Saved progress may return after reload because device storage is unavailable.';
  }
  boxes.forEach(box => box.addEventListener('change', () => {
    try { localStorage.setItem(key, JSON.stringify({ version: 1, checked: boxes.map(box => box.checked) })); saved = true; }
    catch { saved = false; }
    render();
  }));
  reset.addEventListener('click', () => {
    boxes.forEach(box => { box.checked = false; });
    try { localStorage.removeItem(key); saved = true; }
    catch { saved = false; }
    render();
  });
  fields.disabled = false;
  reset.disabled = false;
  render();
})();
