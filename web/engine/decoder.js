const log = document.getElementById('log');
const unlockBtn = document.getElementById('unlock');

function write(line) {
  log.textContent += `${line}\n`;
}

write('A5 → key detected. Caesar(+3 on vowels) active.');
unlockBtn?.addEventListener('click', () => {
  write('B5b unlocked → Echo route primed.');
  document.body.dataset.route = 'B5b';
});
