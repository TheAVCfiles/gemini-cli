const fortunes = [
  'Your next pivot will become a dance. Let the glitch guide your footfall.',
  'Trust the process: the process trusts you back, eventually.',
  'Tonight’s moon codes your confidence in hexadecimal.',
  'Someone you never met is reading your code. Smile.',
  'If you find a pearl, encrypt it. If you lose it, write the sequel.',
  'You survived your own beta. That’s production energy.',
  'System saw you. Permission granted.',
  'The next merge conflict will reveal an unexpected ally.',
  'You will debug something by laughing at it first.',
  'Latency leaves when curiosity arrives.',
  'Your todo list is a constellation. Trace only the bright stars tonight.',
  "A stranger's comment will become your next feature flag name.",
  'Refactor the apology out of your commit messages.',
  'Your inbox dreams in camelCase. Let it rest.',
  'Hidden requirements bloom when documented in crayon.',
  'Your keyboard craves a poem disguised as a script.',
  "Tomorrow's stand-up includes spontaneous applause.",
  'You will rename something important without regret.',
  'Cache invalidation chooses a different hero today.',
  'A rubber duck will ask you a question you cannot unhear.',
  'Your sprint review will feature a surprise cameo from a future you.',
  'Whitespace becomes a map when you follow the silence.',
  'A deprecated skill is ready for its encore.',
  'Your next branch name writes itself in lowercase prophecy.',
  'Someone ships your idea overnight. Celebrate anyway.',
  'The log file hides a joke that lands at 3 a.m.',
  'A meeting will end early. Use the time to design mischief.',
  'Your documentation will inspire an emoji revolution.',
  'The backlog whispers: automate the boring bravery.',
  'You will ship kindness disguised as release notes.',
  'A stubborn test reveals a kinder interface.',
  'Your command line remembers the lyric you forgot.',
  'Version control is ready to archive your impostor syndrome.',
  'A colleague forwards your bug report to the muse department.',
  'The next lint error is actually a limerick.',
  'A sticker on your laptop unlocks a hidden feature.',
  'Your roadmap holds a secret walkway between milestones.',
  'A 404 page invites you to start a band.',
  'Refreshed tabs lead to refreshed perspective.',
  'An old project ping returns with gratitude attached.',
  "Today's shortcut is tomorrow's folklore.",
  'You will rename a helper function and it will thank you.',
  'A pull request comment becomes a haiku in disguise.',
  'Your dev environment learns a new dance move overnight.',
  'The next status update includes plot twists and snacks.',
  'An unexpected compile error sparks an unexpected friendship.',
  'You are the feature flag for optimism.',
  'A screenshot you capture today becomes a legend tomorrow.',
  "Your next code review ends with a celebratory gif you've never seen before.",
  'The roadmap doodle in your notebook is secretly accurate.',
  'A midnight idea will still shine at sunrise. Write it down.',
  'You discover a shortcut hidden in a typo.',
  'Today you inherit an ancient TODO and give it closure.',
];

exports.handler = async () => {
  if (!fortunes.length) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'No fortunes available' }),
    };
  }

  const index = Math.floor(Math.random() * fortunes.length);
  const response = {
    fortune: fortunes[index],
    n: index + 1,
    total: fortunes.length,
  };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(response),
  };
};
